from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import Optional
import csv
import io
from app.database import get_db
from app.models import Application, Program

router = APIRouter(prefix="/export", tags=["Экспорт"])

# экспорт сырых данных — каждая заявка отдельной строкой
@router.get("/raw")
def export_raw(
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    wave: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Application).options(
        joinedload(Application.applicant),
        joinedload(Application.program)
    )

    if status:
        query = query.filter(Application.status == status)
    if source:
        query = query.filter(Application.source == source)
    if wave:
        query = query.filter(Application.wave == wave)

    applications = query.all()

    # BOM + точка с запятой — Excel корректно открывает кириллицу
    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";")

    writer.writerow([
        "ID заявки", "ФИО абитуриента", "Email", "Регион",
        "Программа", "Факультет", "Статус", "Источник",
        "Волна", "Баллы ЕГЭ", "Дата подачи", "Дата смены статуса"
    ])

    status_labels = {
        "new": "Новая", "review": "На рассмотрении",
        "enrolled": "Зачислен", "rejected": "Отклонён"
    }
    source_labels = {
        "site": "Сайт", "olymp": "Олимпиада",
        "aggregator": "Агрегатор", "other": "Другое"
    }

    for app in applications:
        applicant = app.applicant
        program = app.program

        writer.writerow([
            app.id,
            applicant.full_name if applicant else "",
            applicant.email if applicant else "",
            applicant.region if applicant else "",
            program.name if program else "",
            program.faculty if program else "",
            status_labels.get(app.status, app.status),
            source_labels.get(app.source, app.source),
            app.wave,
            app.score if app.score is not None else "",
            app.created_at.strftime("%d.%m.%Y %H:%M"),
            app.status_changed_at.strftime("%d.%m.%Y %H:%M"),
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": "attachment; filename=applications_raw.csv"}
    )

# экспорт агрегированного отчёта — конверсия по программам
@router.get("/report")
def export_report(db: Session = Depends(get_db)):
    programs = db.query(Program).all()

    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";")

    writer.writerow([
        "Программа", "Факультет", "Всего заявок",
        "Зачислено", "Отклонено", "На рассмотрении", "Конверсия %"
    ])

    for program in programs:
        apps = db.query(Application).filter(Application.program_id == program.id).all()
        total = len(apps)
        enrolled = sum(1 for a in apps if a.status == "enrolled")
        rejected = sum(1 for a in apps if a.status == "rejected")
        in_review = sum(1 for a in apps if a.status == "review")
        conversion = round((enrolled / total * 100), 2) if total > 0 else 0

        writer.writerow([
            program.name, program.faculty, total,
            enrolled, rejected, in_review, conversion
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": "attachment; filename=report.csv"}
    )
