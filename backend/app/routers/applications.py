from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Application, Applicant, Program, StatusLog
from app.schemas import ApplicationCreate, ApplicationRead, StatusUpdate, VALID_STATUSES, VALID_SOURCES

router = APIRouter(prefix="/applications", tags=["Заявки"])

# CREATE — подать заявку
@router.post("/", response_model=ApplicationRead)
def create_application(data: ApplicationCreate, db: Session = Depends(get_db)):
    # проверяем что абитуриент существует
    applicant = db.query(Applicant).filter(Applicant.id == data.applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Абитуриент не найден")

    # проверяем что программа существует
    program = db.query(Program).filter(Program.id == data.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Программа не найдена")

    # проверяем что источник допустимый
    if data.source not in VALID_SOURCES:
        raise HTTPException(status_code=400, detail=f"Источник должен быть один из: {VALID_SOURCES}")

    application = Application(**data.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)

    # записываем первый статус в журнал
    log = StatusLog(application_id=application.id, old_status=None, new_status="new")
    db.add(log)
    db.commit()

    return application

# READ — получить все заявки с фильтрами
@router.get("/", response_model=List[ApplicationRead])
def get_applications(
    status: Optional[str] = Query(None),  # фильтр по статусу
    source: Optional[str] = Query(None),  # фильтр по источнику
    wave: Optional[int] = Query(None),  # фильтр по волне
    program_id: Optional[int] = Query(None),  # фильтр по программе
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if status:
        query = query.filter(Application.status == status)
    if source:
        query = query.filter(Application.source == source)
    if wave:
        query = query.filter(Application.wave == wave)
    if program_id:
        query = query.filter(Application.program_id == program_id)

    return query.offset(skip).limit(limit).all()

# READ — получить одну заявку
@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return application

# UPDATE — сменить статус заявки
@router.patch("/{application_id}/status", response_model=ApplicationRead)
def update_status(application_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    # проверяем что новый статус допустимый
    if data.new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Статус должен быть один из: {VALID_STATUSES}")

# проверяем что статус реально меняется
    if application.status == data.new_status:
        raise HTTPException(status_code=400, detail="Заявка уже в этом статусе")

    # ЗАДАЧА: Валидация переходов
    # Нельзя менять статус из "rejected" вообще ни на что
    if application.status == "rejected":
        raise HTTPException(status_code=400, detail="Нельзя изменить статус отклоненной заявки")

    # Нельзя менять статус из "enrolled" вообще ни на что
    if application.status == "enrolled":
        raise HTTPException(status_code=400, detail="Заявка уже зачислена, менять статус нельзя")

    # записываем смену в журнал
    log = StatusLog(
        application_id=application.id,
        old_status=application.status,
        new_status=data.new_status
    )
    db.add(log)

    # обновляем статус заявки
    application.status = data.new_status
    print(f"📧 Уведомление: заявка #{application.id} — статус изменён на '{data.new_status}' (абитуриент ID: {application.applicant_id})")
    application.status_changed_at = datetime.utcnow()
    db.commit()
    db.refresh(application)
    return application

# DELETE — удалить заявку
@router.delete("/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    db.delete(application)
    db.commit()
    return {"detail": "Заявка удалена"}