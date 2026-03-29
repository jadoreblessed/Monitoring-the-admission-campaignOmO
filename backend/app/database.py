from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()  # читаем переменные из файла .env

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)  # соединение с БД
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()  # базовый класс для всех таблиц

# эта функция даёт доступ к БД при каждом запросе
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()