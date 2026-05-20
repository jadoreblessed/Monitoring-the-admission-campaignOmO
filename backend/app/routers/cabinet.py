from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Applicant, Application, Program, StatusLog
from app.schemas import ApplicationCreate, ApplicationRead, ApplicantRegister, ApplicantLogin, TokenResponse
from app.auth import decode_token, hash_password, verify_password, create_access_token

router = APIRouter(prefix="/cabinet", tags=["Личный кабинет абитуриента"])


def get_current_applicant(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Отсутствует заголовок Authorization")
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


@router.post("/auth/register", response_model=TokenResponse)
def register(data: ApplicantRegister, db: Session = Depends(get_db)):
    existing = db.query(Applicant).filter(Applicant.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Абитуриент с таким email уже зарегистрирован")
    
    hashed = hash_password(data.password)
    applicant = Applicant(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        region=data.region,
        hashed_password=hashed
    )
    db.add(applicant)
    db.commit()
    db.refresh(applicant)
    
    access_token = create_access_token({"sub": applicant.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        applicant_id=applicant.id,
        full_name=applicant.full_name
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(data: ApplicantLogin, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.email == data.email).first()
    if not applicant or not applicant.hashed_password:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not verify_password(data.password, applicant.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    access_token = create_access_token({"sub": applicant.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        applicant_id=applicant.id,
        full_name=applicant.full_name
    )


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
    
    if application.status == "enrolled":
        raise HTTPException(status_code=400, detail="Нельзя отменить зачисленную заявку")
    
    old_status = application.status
    application.status = "rejected"
    application.status_changed_at = datetime.utcnow()
    
    log = StatusLog(
        application_id=application.id,
        old_status=old_status,
        new_status="rejected"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Заявка отменена"}


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
    full_name: Optional[str] = None,
    phone: Optional[str] = None,
    region: Optional[str] = None,
    applicant: Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db)
):
    if full_name:
        applicant.full_name = full_name
    if phone:
        applicant.phone = phone
    if region:
        applicant.region = region
    
    db.commit()
    
    return {
        "id": applicant.id,
        "full_name": applicant.full_name,
        "email": applicant.email,
        "phone": applicant.phone,
        "region": applicant.region
    }