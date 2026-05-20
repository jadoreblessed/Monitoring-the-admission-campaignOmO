from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

# === Абитуриент ===

# что нужно отправить чтобы создать абитуриента
class ApplicantCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)  # ФИО от 2 до 150 символов
    email: EmailStr  # проверяет что это настоящий email
    phone: Optional[str] = Field(None, pattern=r"^\+7\d{10}$")  # формат +7XXXXXXXXXX или пусто
    region: Optional[str] = None

# что возвращает API когда показывает абитуриента
class ApplicantRead(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    region: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True  # разрешает читать данные из SQLAlchemy модели


# === Программа ===

class ProgramCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    faculty: str = Field(min_length=2, max_length=200)
    budget_seats: int = Field(ge=0)  # >= 0, не может быть отрицательным
    paid_seats: int = Field(ge=0)

class ProgramRead(BaseModel):
    id: int
    name: str
    faculty: str
    budget_seats: int
    paid_seats: int

    class Config:
        from_attributes = True


# === Заявка ===

VALID_STATUSES = ["new", "review", "enrolled", "rejected"]
VALID_SOURCES = ["site", "olymp", "aggregator", "other"]

class ApplicationCreate(BaseModel):
    applicant_id: int
    program_id: int
    source: str = Field(default="site")
    wave: int = Field(ge=1, le=2)
    score: Optional[float] = Field(None, ge=0, le=310)
    has_original: int = Field(default=0, ge=0, le=1)  # 0 или 1

    @field_validator('score')
    @classmethod
    def validate_ege_score(cls, v):
        if v is None:
            return v
        # Максимум: 3 предмета по 100 баллов + 10 ИД = 310
        if v < 0 or v > 310:
            raise ValueError('Балл ЕГЭ должен быть суммой трёх предметов (0-300) + ИД (0-10), итого от 0 до 310')
        return v

class ApplicationRead(BaseModel):
    id: int
    applicant_id: int
    program_id: int
    status: str
    source: str
    wave: int
    score: Optional[float]
    created_at: datetime
    status_changed_at: datetime
    has_original: int  # 1 = подал оригинал, 0 = не подал

    class Config:
        from_attributes = True

# для смены статуса заявки
class StatusUpdate(BaseModel):
    new_status: str  # новый статус


# === Дашборд ===

class DashboardMetrics(BaseModel):
    total_applications: int  # всего заявок
    total_enrolled: int  # зачислено
    conversion_rate: float  # конверсия в процентах

# === Авторизация абитуриента ===

class ApplicantRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r"^\+7\d{10}$")
    region: Optional[str] = None
    password: str = Field(min_length=6)

class ApplicantLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    applicant_id: int
    full_name: str