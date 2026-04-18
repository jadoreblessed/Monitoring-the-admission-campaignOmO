from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Applicant
from app.schemas import ApplicantRegister, ApplicantLogin, TokenResponse
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Авторизация абитуриента"])

# регистрация нового абитуриента
@router.post("/register", response_model=TokenResponse)
def register(data: ApplicantRegister, db: Session = Depends(get_db)):
    # проверяем что email не занят
    exists = db.query(Applicant).filter(Applicant.email == data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    # создаём абитуриента с хешированным паролем
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

    # возвращаем токен
    token = create_access_token({"sub": applicant.email})
    return TokenResponse(
        access_token=token,
        applicant_id=applicant.id,
        full_name=applicant.full_name
    )

# вход по email + пароль
@router.post("/login", response_model=TokenResponse)
def login(data: ApplicantLogin, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.email == data.email).first()
    if not applicant or not applicant.hashed_password:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    if not verify_password(data.password, applicant.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_access_token({"sub": applicant.email})
    return TokenResponse(
        access_token=token,
        applicant_id=applicant.id,
        full_name=applicant.full_name
    )