# Таблица маппинга данных (ПР-24)

> Проект: Мониторинг приёмной кампании РТУ МИРЭА
> Версия: v1.0 | Дата: 2026-04-15

## Маппинг: Frontend → Backend API

| Поле на UI | API поле | Тип | Эндпоинт | Направление |
|-----------|----------|-----|----------|-------------|
| ФИО абитуриента | full_name | string | POST /applicants/ | Frontend → API |
| Email | email | string (EmailStr) | POST /applicants/ | Frontend → API |
| Телефон | phone | string (regex) | POST /applicants/ | Frontend → API |
| Регион | region | string | POST /applicants/ | Frontend → API |
| Программа обучения | program_id | integer (FK) | POST /applications/ | Frontend → API |
| Баллы ЕГЭ | score | float (0-310) | POST /applications/ | Frontend → API |
| Источник | source | enum (site/olymp/aggregator/other) | POST /applications/ | Frontend → API |
| Волна | wave | integer (1-2) | POST /applications/ | Frontend → API |
| Новый статус | new_status | enum (new/review/enrolled/rejected) | PATCH /applications/{id}/status | Frontend → API |
| Фильтр статус | status | query param | GET /applications/?status=X | Frontend → API |
| Всего заявок | total_applications | integer | GET /dashboard/ | API → Frontend |
| Зачислено | enrolled | integer | GET /dashboard/ | API → Frontend |
| Конверсия | conversion_rate | float (%) | GET /dashboard/ | API → Frontend |

## Маппинг: Backend API → PostgreSQL

| API поле | Таблица | Колонка | Тип в БД | Ограничения |
|----------|---------|---------|----------|-------------|
| full_name | applicants | full_name | VARCHAR(150) | NOT NULL |
| email | applicants | email | VARCHAR(255) | UNIQUE, NOT NULL |
| phone | applicants | phone | VARCHAR(20) | NULL, regex +7XXXXXXXXXX |
| region | applicants | region | VARCHAR(100) | NULL |
| name | programs | name | VARCHAR(200) | NOT NULL |
| faculty | programs | faculty | VARCHAR(200) | NOT NULL |
| budget_seats | programs | budget_seats | INTEGER | DEFAULT 0, >= 0 |
| paid_seats | programs | paid_seats | INTEGER | DEFAULT 0, >= 0 |
| applicant_id | applications | applicant_id | INTEGER | FK → applicants.id, NOT NULL |
| program_id | applications | program_id | INTEGER | FK → programs.id, NOT NULL |
| status | applications | status | VARCHAR(20) | DEFAULT 'new' |
| source | applications | source | VARCHAR(20) | DEFAULT 'site' |
| wave | applications | wave | INTEGER | 1 или 2 |
| score | applications | score | FLOAT | NULL, 0-310 |
| created_at | applications | created_at | TIMESTAMP | DEFAULT NOW() |
| status_changed_at | applications | status_changed_at | TIMESTAMP | DEFAULT NOW() |
| old_status | status_logs | old_status | VARCHAR(20) | NULL |
| new_status | status_logs | new_status | VARCHAR(20) | NOT NULL |
| changed_at | status_logs | changed_at | TIMESTAMP | DEFAULT NOW() |

## Маппинг: Процессы DFD → API эндпоинты

| Процесс DFD | Эндпоинт(ы) | Входные данные | Выходные данные |
|-------------|-------------|----------------|-----------------|
| 1.0 Управление заявками | POST/GET/PATCH/DELETE /applications/ | JSON (заявка) | JSON (заявка + id + timestamps) |
| 1.0 Управление заявками | POST/GET/DELETE /applicants/ | JSON (абитуриент) | JSON (абитуриент + id) |
| 1.0 Управление заявками | POST/GET/DELETE /programs/ | JSON (программа) | JSON (программа + id) |
| 2.0 Расчёт метрик | GET /dashboard/ | Query params (wave, source, program_id) | JSON (total, enrolled, conversion_rate) |
| 2.0 Расчёт метрик | GET /dashboard/by-program | — | JSON array (program_name, total, enrolled, conversion) |
| 2.0 Расчёт метрик | GET /dashboard/by-source | — | JSON array (source, count) |
| 3.0 Экспорт CSV | GET /export/raw | Query params (status, source, wave) | CSV файл (StreamingResponse) |
| 3.0 Экспорт CSV | GET /export/report | — | CSV файл (StreamingResponse) |

## Правила трансформации данных

| Правило | Описание | Где применяется |
|---------|----------|-----------------|
| Валидация email | Проверка формата через EmailStr (Pydantic) | schemas.py → ApplicantCreate |
| Валидация телефона | Regex: ^\+7\d{10}$ | schemas.py → ApplicantCreate |
| Валидация баллов | Float, диапазон 0-310 | schemas.py → ApplicationCreate |
| Валидация статуса | Enum: new, review, enrolled, rejected | schemas.py → VALID_STATUSES |
| Валидация источника | Enum: site, olymp, aggregator, other | schemas.py → VALID_SOURCES |
| Расчёт конверсии | enrolled / total * 100, округление до 2 знаков | dashboard.py → get_metrics |
| Журналирование | При смене статуса создаётся запись StatusLog | applications.py → update_status |
| Уникальность email | Проверка перед INSERT, HTTPException 400 | applicants.py → create_applicant |
