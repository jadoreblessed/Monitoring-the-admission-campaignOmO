
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import applicants, programs, applications, dashboard, export, seed, auth, cabinet

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Мониторинг приемной кампании",
    description="API для отслеживания заявок, зачислений и конверсии",
    version="1.0.0"
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applicants.router)
app.include_router(programs.router)
app.include_router(applications.router)
app.include_router(dashboard.router)
app.include_router(export.router)
app.include_router(seed.router)
#app.include_router(auth.router)
app.include_router(cabinet.router)

#Главная страница
@app.get("/", tags=["Главная"])
def root():
    return {"message": "API мониторинга приемной кампании работает"}