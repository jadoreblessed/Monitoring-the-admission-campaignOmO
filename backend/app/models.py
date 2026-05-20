from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# таблица абитуриентов
class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(Integer, primary_key=True, index=True)  # уникальный номер
    full_name = Column(String, nullable=False)  # ФИО
    email = Column(String, unique=True, nullable=False)  # почта
    phone = Column(String)  # телефон
    region = Column(String)  # регион откуда абитуриент   
    hashed_password = Column(String, nullable=True)  # пароль (хеш)
    created_at = Column(DateTime, default=datetime.utcnow)  # дата создания

    applications = relationship("Application", back_populates="applicant")  # связь с заявками


# таблица программ обучения
class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # название программы
    faculty = Column(String, nullable=False)  # факультет
    budget_seats = Column(Integer, default=0)  # бюджетных мест
    paid_seats = Column(Integer, default=0)  # платных мест

    applications = relationship("Application", back_populates="program")


# таблица заявок — главная таблица
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    status = Column(String, default="new")
    source = Column(String, default="site")
    wave = Column(Integer, default=1)
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    status_changed_at = Column(DateTime, default=datetime.utcnow)
    has_original = Column(Integer, default=0)  # 1 = подал оригинал, 0 = нет

    applicant = relationship("Applicant", back_populates="applications")
    program = relationship("Program", back_populates="applications")
    status_logs = relationship("StatusLog", back_populates="application")


# журнал смен статуса — каждое изменение записывается сюда
class StatusLog(Base):
    __tablename__ = "status_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    old_status = Column(String)  # был статус
    new_status = Column(String, nullable=False)  # стал статус
    changed_at = Column(DateTime, default=datetime.utcnow)  # когда изменился

    application = relationship("Application", back_populates="status_logs")