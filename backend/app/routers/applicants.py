from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Applicant
from app.schemas import ApplicantCreate, ApplicantRead

router = APIRouter(prefix="/applicants", tags=["Абитуриенты"])

# CREATE - создать аббитуриента
@router.post("/", response_model=ApplicantRead)
def create_applicant(data: ApplicantCreate, db: Session = Depends(get_db)):
    #проверяем что email не занят
    exists = db.query(Applicant).filter(Applicant.email == data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email уже существует")
    applicant = Applicant(**data.model_dump())
    db.add(Applicant)
    db.commit
    db.refresh(Applicant)
    return applicant

# READ - получить всех аббитуриентов
@router.get("/{applicant_id}", response_model=ApplicantRead)
def get_applicant(applicant_id: int, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Абитуриент не найден")
    return applicant

# DELETE — удалить абитуриента
@router.delete("/{applicant_id}")
def delete_applicant(applicant_id: int, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Абитуриент не найден")
    db.delete(applicant)
    db.commit()
    return {"detail": "Абитуриент удалён"}