from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import csv
import io
from app.database import get_db
from app.models import Application, Applicant, Program

router = APIRouter(prefix="/export", tags=["Экспорт"])

# экспорт сырых данных — каждая заявка отдельной строкой
@router.get("/raw")
def export_raw(
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    wave: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if status:
        query = query.filter(Application.status == status)
    if source:
        query = query.filter(Application.source == source)
    if wave:
        query = query.filter(Application.wave == wave)

    applications = query.all()

    # создаём CSV в памяти
    output = io.StringIO()
    writer = csv.writer(output)

    # заголовки таблицы
    writer.writerow([
        "ID заявки", "ФИО абитуриента", "Email", "Регион",
        "Программа", "Факультет", "Статус", "Источник",
        "Волна", "Баллы ЕГЭ", "Дата подачи", "Дата смены статуса"
    ])

    # заполняем строки
    for app in applications:
        applicant = db.query(Applicant).filter(Applicant.id == app.applicant_id).first()
        program = db.query(Program).filter(Program.id == app.program_id).first()

        writer.writerow([
            app.id,
            applicant.full_name if applicant else "",
            applicant.email if applicant else "",
            applicant.region if applicant else "",
            program.name if program else "",
            program.faculty if program else "",
            app.status,
            app.source,
            app.wave,
            app.score,
            app.created_at.strftime("%Y-%m-%d %H:%M"),
            app.status_changed_at.strftime("%Y-%m-%d %H:%M")
        ])

    output.seek(0)  # перематываем в начало файла

    # отдаём как скачиваемый файл
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=applications_raw.csv"}
    )

# экспорт агрегированного отчёта — конверсия по программам
@router.get("/report")
def export_report(db: Session = Depends(get_db)):
    programs = db.query(Program).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Программа", "Факультет", "Всего заявок",
        "Зачислено", "Отклонено", "Конверсия %"
    ])

    for program in programs:
        total = db.query(Application).filter(Application.program_id == program.id).count()
        enrolled = db.query(Application).filter(
            Application.program_id == program.id,
            Application.status == "enrolled"
        ).count()
        rejected = db.query(Application).filter(
            Application.program_id == program.id,
            Application.status == "rejected"
        ).count()
        conversion = round((enrolled / total * 100), 2) if total > 0 else 0

        writer.writerow([
            program.name, program.faculty, total,
            enrolled, rejected, conversion
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=report.csv"}
    )