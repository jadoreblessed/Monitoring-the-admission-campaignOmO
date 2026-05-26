from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Application, Program

router = APIRouter(prefix="/dashboard", tags=["Дашборд"])


@router.get("/")
def get_metrics(
    wave: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    program_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Application)
    if wave:
        query = query.filter(Application.wave == wave)
    if source:
        query = query.filter(Application.source == source)
    if program_id:
        query = query.filter(Application.program_id == program_id)

    total = query.count()
    enrolled = query.filter(Application.status == "enrolled").count()
    rejected = query.filter(Application.status == "rejected").count()
    in_review = query.filter(Application.status == "review").count()
    new = query.filter(Application.status == "new").count()
    conversion = round((enrolled / total * 100), 2) if total > 0 else 0
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


@router.get("/by-source")
def get_metrics_by_source(db: Session = Depends(get_db)):
    sources = ["site", "olymp", "aggregator", "other"]
    result = []
    for source in sources:
        count = db.query(Application).filter(Application.source == source).count()
        result.append({"source": source, "count": count})
    return result


@router.get("/by-date")
def get_metrics_by_date(
    days: int = Query(30),
    db: Session = Depends(get_db)
):
    result = []
    today = datetime.utcnow().date()
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, 0, 0, 0)
        day_end   = datetime(day.year, day.month, day.day, 23, 59, 59)
        count = db.query(Application).filter(
            Application.created_at >= day_start,
            Application.created_at <= day_end
        ).count()
        result.append({"date": day.strftime("%d.%m"), "count": count})
    return result
