from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import applications, programs, applicants, dashboard, export, seed

Base.metadata.create_all(bind=engine) #Создаем все таблицы в базе данных
#создаем приложение
app = FastAPI( 
    title = "Мониторинг приемной комании",
    description = "API для отслеживания заявок, зачислений и конверсии",
    version = "1.0.0"
)

#разрешаем запросы с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applicants.router)
app.include_router(programs.router)
app.include_router(applications.router)
app.include_router(dashboard.router)
app.include_router(export.router)
app.include_router(seed.router)

#Главная страница
@app.get("/", tags=["Главная"])
def root():
    return {"message": "API мониторинга приемной кампании работает"}