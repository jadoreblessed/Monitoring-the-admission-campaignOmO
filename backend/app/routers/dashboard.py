from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app.models import Application, Program

router = APIRouter(prefix="/dashboard", tags=["Дашборд"])

# главные метрики — всего заявок, зачислено, конверсия
@router.get("/")
def get_metrics(
    wave: Optional[int] = Query(None),  # фильтр по волне
    source: Optional[str] = Query(None),  # фильтр по источнику
    program_id: Optional[int] = Query(None),  # фильтр по программе
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    # применяем фильтры если они переданы
    if wave:
        query = query.filter(Application.wave == wave)
    if source:
        query = query.filter(Application.source == source)
    if program_id:
        query = query.filter(Application.program_id == program_id)

    total = query.count()  # всего заявок
    enrolled = query.filter(Application.status == "enrolled").count()  # зачислено
    rejected = query.filter(Application.status == "rejected").count()  # отклонено
    in_review = query.filter(Application.status == "review").count()  # на рассмотрении
    new = query.filter(Application.status == "new").count()  # новые

    # конверсия = зачислено / всего * 100
    conversion = round((enrolled / total * 100), 2) if total > 0 else 0
    # расчет среднего балла ЕГЭ
    avg_score = round(db.query(func.avg(Application.score)).scalar() or 0, 2)

    return {
        "total_applications": total,
        "enrolled": enrolled,
        "rejected": rejected,
        "in_review": in_review,
        "new": new,
        "conversion_rate": conversion,
        "avg_score": avg_score
    }

# конверсия в разрезе программ — для графика на дашборде
@router.get("/by-program")
def get_metrics_by_program(db: Session = Depends(get_db)):
    programs = db.query(Program).all()
    result = []

    for program in programs:
        total = db.query(Application).filter(Application.program_id == program.id).count()
        enrolled = db.query(Application).filter(
            Application.program_id == program.id,
            Application.status == "enrolled"
        ).count()
        conversion = round((enrolled / total * 100), 2) if total > 0 else 0

        result.append({
            "program_id": program.id,
            "program_name": program.name,
            "faculty": program.faculty,
            "total": total,
            "enrolled": enrolled,
            "conversion_rate": conversion
        })

    return result

# статистика по источникам — для круговой диаграммы
@router.get("/by-source")
def get_metrics_by_source(db: Session = Depends(get_db)):
    sources = ["site", "olymp", "aggregator", "other"]
    result = []

    for source in sources:
        count = db.query(Application).filter(Application.source == source).count()
        result.append({
            "source": source,
            "count": count
        })

    return result