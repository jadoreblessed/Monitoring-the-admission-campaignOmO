from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Applicant, Application, Program, StatusLog
from app.schemas import ApplicationCreate, ApplicationRead
from app.auth import decode_token

router = APIRouter(prefix="/cabinet", tags=["Личный кабинет абитуриента"])

# получаем абитуриента из токена
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

# мои заявки
@router.get("/my-applications", response_model=List[ApplicationRead])
def my_applications(
    applicant: Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db)
):
    return db.query(Application).filter(Application.applicant_id == applicant.id).all()

# подать заявку
@router.post("/apply", response_model=ApplicationRead)
def apply(
    data: ApplicationCreate,
    applicant: Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db)
):
    # проверяем что программа существует
    program = db.query(Program).filter(Program.id == data.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Программа не найдена")

    # проверяем что заявка на эту программу ещё не подана
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

    # записываем в журнал
    log = StatusLog(application_id=application.id, old_status=None, new_status="new")
    db.add(log)
    db.commit()

    return application

# статус конкретной заявки с историей
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

# профиль абитуриента
@router.get("/profile")
def profile(applicant: Applicant = Depends(get_current_applicant)):
    return {
        "id": applicant.id,
        "full_name": applicant.full_name,
        "email": applicant.email,
        "phone": applicant.phone,
        "region": applicant.region
    }