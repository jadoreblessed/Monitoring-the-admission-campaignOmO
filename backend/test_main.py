"""
Тесты для /dashboard/ и /applications/.
Используют SQLite in-memory — рабочую БД не трогают.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.models import Applicant, Program, Application, StatusLog
from main import app

engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    yield db
    db.close()


# ===== Хелперы =====

def make_applicant(db, name="Иванов Иван", email="ivan@test.ru"):
    a = Applicant(full_name=name, email=email, hashed_password="fakehash")
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def make_program(db, name="Программная инженерия", faculty="ИИТ"):
    p = Program(name=name, faculty=faculty, budget_seats=30, paid_seats=10)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def make_application(db, applicant_id, program_id,
                     status="new", source="site", wave=1, score=240.0):
    a = Application(
        applicant_id=applicant_id,
        program_id=program_id,
        status=status,
        source=source,
        wave=wave,
        score=score,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


# ============================================================
# DASHBOARD
# ============================================================

class TestDashboard:

    def test_empty_returns_zeros(self, client):
        r = client.get("/dashboard/")
        assert r.status_code == 200
        d = r.json()
        assert d["total_applications"] == 0
        assert d["enrolled"] == 0
        assert d["conversion_rate"] == 0

    def test_counts_all_statuses(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        make_application(db, a.id, p.id, status="new")
        make_application(db, a.id, p.id, status="review")
        make_application(db, a.id, p.id, status="enrolled")
        make_application(db, a.id, p.id, status="rejected")

        d = client.get("/dashboard/").json()
        assert d["total_applications"] == 4
        assert d["new"] == 1
        assert d["in_review"] == 1
        assert d["enrolled"] == 1
        assert d["rejected"] == 1

    def test_conversion_rate(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        make_application(db, a.id, p.id, status="enrolled")
        make_application(db, a.id, p.id, status="enrolled")
        make_application(db, a.id, p.id, status="new")
        make_application(db, a.id, p.id, status="rejected")

        d = client.get("/dashboard/").json()
        assert d["conversion_rate"] == 50.0

    def test_filter_by_wave(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        make_application(db, a.id, p.id, wave=1)
        make_application(db, a.id, p.id, wave=1)
        make_application(db, a.id, p.id, wave=2)

        assert client.get("/dashboard/?wave=1").json()["total_applications"] == 2
        assert client.get("/dashboard/?wave=2").json()["total_applications"] == 1

    def test_filter_by_source(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        make_application(db, a.id, p.id, source="site")
        make_application(db, a.id, p.id, source="site")
        make_application(db, a.id, p.id, source="olymp")

        assert client.get("/dashboard/?source=site").json()["total_applications"] == 2
        assert client.get("/dashboard/?source=olymp").json()["total_applications"] == 1

    def test_by_program_empty(self, client):
        r = client.get("/dashboard/by-program")
        assert r.status_code == 200
        assert r.json() == []

    def test_by_program_conversion(self, client, db):
        a = make_applicant(db)
        p1 = make_program(db, name="Прог. инженерия", faculty="ИИТ")
        p2 = make_program(db, name="Кибербез", faculty="ИКБ")

        make_application(db, a.id, p1.id, status="enrolled")
        make_application(db, a.id, p1.id, status="new")
        make_application(db, a.id, p2.id, status="rejected")

        r = client.get("/dashboard/by-program")
        assert r.status_code == 200
        data = {item["program_id"]: item for item in r.json()}

        assert data[p1.id]["total"] == 2
        assert data[p1.id]["enrolled"] == 1
        assert data[p1.id]["conversion_rate"] == 50.0
        assert data[p2.id]["conversion_rate"] == 0.0

    def test_by_source(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        make_application(db, a.id, p.id, source="site")
        make_application(db, a.id, p.id, source="olymp")

        r = client.get("/dashboard/by-source")
        assert r.status_code == 200
        data = {item["source"]: item["count"] for item in r.json()}
        assert data["site"] == 1
        assert data["olymp"] == 1
        assert data["aggregator"] == 0


# ============================================================
# APPLICATIONS
# ============================================================

class TestApplications:

    def test_empty_list(self, client):
        r = client.get("/applications/")
        assert r.status_code == 200
        assert r.json() == []

    def test_create_ok(self, client, db):
        a = make_applicant(db)
        p = make_program(db)

        r = client.post("/applications/", json={
            "applicant_id": a.id,
            "program_id": p.id,
            "source": "site",
            "wave": 1,
            "score": 255.0,
            "status": "new"
        })
        assert r.status_code == 200
        d = r.json()
        assert d["applicant_id"] == a.id
        assert d["program_id"] == p.id
        assert d["score"] == 255.0
        assert d["status"] == "new"

    def test_create_invalid_applicant(self, client, db):
        p = make_program(db)
        r = client.post("/applications/", json={
            "applicant_id": 9999, "program_id": p.id,
            "source": "site", "wave": 1, "score": 200.0, "status": "new"
        })
        assert r.status_code == 404

    def test_create_invalid_program(self, client, db):
        a = make_applicant(db)
        r = client.post("/applications/", json={
            "applicant_id": a.id, "program_id": 9999,
            "source": "site", "wave": 1, "score": 200.0, "status": "new"
        })
        assert r.status_code == 404

    def test_create_invalid_source(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        r = client.post("/applications/", json={
            "applicant_id": a.id, "program_id": p.id,
            "source": "instagram", "wave": 1, "score": 200.0, "status": "new"
        })
        assert r.status_code == 400

    def test_get_by_id(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        app_ = make_application(db, a.id, p.id)

        r = client.get(f"/applications/{app_.id}")
        assert r.status_code == 200
        assert r.json()["id"] == app_.id

    def test_get_not_found(self, client):
        assert client.get("/applications/9999").status_code == 404

    def test_filter_by_status(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        make_application(db, a.id, p.id, status="new")
        make_application(db, a.id, p.id, status="new")
        make_application(db, a.id, p.id, status="enrolled")

        assert len(client.get("/applications/?status=new").json()) == 2
        assert len(client.get("/applications/?status=enrolled").json()) == 1

    def test_update_status_ok(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        app_ = make_application(db, a.id, p.id, status="new")

        r = client.patch(f"/applications/{app_.id}/status",
                         json={"new_status": "review"})
        assert r.status_code == 200
        assert r.json()["status"] == "review"

    def test_update_status_same(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        app_ = make_application(db, a.id, p.id, status="new")

        r = client.patch(f"/applications/{app_.id}/status",
                         json={"new_status": "new"})
        assert r.status_code == 400

    def test_update_status_invalid(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        app_ = make_application(db, a.id, p.id, status="new")

        r = client.patch(f"/applications/{app_.id}/status",
                         json={"new_status": "wrong"})
        assert r.status_code == 400

    def test_delete_ok(self, client, db):
        a = make_applicant(db)
        p = make_program(db)
        app_ = make_application(db, a.id, p.id)

        assert client.delete(f"/applications/{app_.id}").status_code == 200
        assert client.get(f"/applications/{app_.id}").status_code == 404

    def test_delete_not_found(self, client):
        assert client.delete("/applications/9999").status_code == 404
