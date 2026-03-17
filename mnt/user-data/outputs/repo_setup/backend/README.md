# Backend — FastAPI + PostgreSQL

Здесь будет бэкенд приложения.

## Задачи для Backend Dev #1 (models + API)

- [ ] Создать `app/database.py` — подключение к PostgreSQL
- [ ] Создать `app/models.py` — модели: Applicant, Application, Program, StatusLog
- [ ] Создать `app/routers/applicants.py` — CRUD абитуриентов
- [ ] Создать `app/routers/applications.py` — CRUD заявок + PATCH /status
- [ ] Создать `app/routers/programs.py` — CRUD программ

## Задачи для Backend Dev #2 (аналитика + данные)

- [ ] Создать `app/schemas.py` — Pydantic схемы + ≥5 валидаций
- [ ] Создать `app/routers/dashboard.py` — метрики с фильтрами
- [ ] Создать `app/routers/export.py` — экспорт CSV
- [ ] Создать `app/routers/seed.py` — генерация синтетики T1 (≥100 строк)
- [ ] Подготовить `data/T1/*.csv` датасеты

## Запуск

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```
