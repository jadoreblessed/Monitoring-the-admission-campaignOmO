from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models import Applicant, Application, Program, StatusLog
from app.schemas import ApplicationCreate, ApplicationRead
from app.auth import decode_token, hash_password, verify_password, create_access_token
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/cabinet", tags=["Личный кабинет абитуриента"])


# ===== Схемы =====

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    phone: Optional[str] = None
    region: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    region: Optional[str] = None


# ===== Auth =====

@router.post("/auth/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Applicant).filter(Applicant.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 6 символов")

    applicant = Applicant(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        region=data.region,
        hashed_password=hash_password(data.password)
    )
    db.add(applicant)
    db.commit()
    db.refresh(applicant)

    token = create_access_token({"sub": applicant.email})
    return {
        "access_token": token,
        "full_name": applicant.full_name,
        "applicant_id": applicant.id
    }


@router.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.email == data.email).first()
    if not applicant or not applicant.hashed_password:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not verify_password(data.password, applicant.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_access_token({"sub": applicant.email})
    return {
        "access_token": token,
        "full_name": applicant.full_name,
        "applicant_id": applicant.id
    }


# ===== Dependency =====

def get_current_applicant(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Невалидный токен")
    token = authorization.replace("Bearer ", "")
    try:
        email = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Токен истёк или невалиден")
    applicant = db.query(Applicant).filter(Applicant.email == email).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Абитуриент не найден")
    return applicant


# ===== Profile =====

@router.get("/profile")
def profile(applicant: Applicant = Depends(get_current_applicant)):
    return {
        "id": applicant.id,
        "full_name": applicant.full_name,
        "email": applicant.email,
        "phone": applicant.phone,
        "region": applicant.region
    }


@router.put("/profile")
def update_profile(
    data: ProfileUpdate,
    applicant: Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db)
):
    if data.full_name is not None:
        applicant.full_name = data.full_name
    if data.phone is not None:
        applicant.phone = data.phone
    if data.region is not None:
        applicant.region = data.region

    db.commit()
    db.refresh(applicant)
    return {
        "id": applicant.id,
        "full_name": applicant.full_name,
        "email": applicant.email,
        "phone": applicant.phone,
        "region": applicant.region
    }


# ===== Applications =====

@router.get("/my-applications", response_model=List[ApplicationRead])
def my_applications(
    applicant: Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db)
):
    return db.query(Application).filter(Application.applicant_id == applicant.id).all()


@router.post("/apply", response_model=ApplicationRead)
def apply(
    data: ApplicationCreate,
    applicant: Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db)
):
    program = db.query(Program).filter(Program.id == data.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Программа не найдена")

    existing = db.query(Application).filter(
        Application.applicant_id == applicant.id,
        Application.program_id == data.program_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Заявка на эту программу уже подана")

    application = Application(
        applicant_id=applicant.id,
        program_id=data.program_id,
        source=data.source,
        wave=data.wave,
        score=data.score
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    log = StatusLog(application_id=application.id, old_status=None, new_status="new")
    db.add(log)
    db.commit()

    return application


@router.get("/application/{application_id}")
def application_status(
    application_id: int,
    applicant: Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.applicant_id == applicant.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    program = db.query(Program).filter(Program.id == application.program_id).first()
    logs = db.query(StatusLog).filter(
        StatusLog.application_id == application.id
    ).order_by(StatusLog.changed_at).all()

    return {
        "id": application.id,
        "program": program.name if program else "",
        "faculty": program.faculty if program else "",
        "status": application.status,
        "score": application.score,
        "wave": application.wave,
        "source": application.source,
        "created_at": application.created_at,
        "history": [
            {
                "old_status": log.old_status,
                "new_status": log.new_status,
                "changed_at": log.changed_at
            } for log in logs
        ]
    }


@router.delete("/application/{application_id}")
def cancel_application(
    application_id: int,
    applicant: Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.applicant_id == applicant.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if application.status in ("enrolled", "rejected"):
        raise HTTPException(status_code=400, detail="Нельзя отозвать заявку с финальным статусом")

    db.query(StatusLog).filter(StatusLog.application_id == application.id).delete()
    db.delete(application)
    db.commit()
    return {"detail": "Заявка отозвана"}
