# API-контракт — Мониторинг приёмной кампании

> Версия: v1.0 | Дата: 2026-04-15
> Base URL: http://127.0.0.1:8000
> Swagger: http://127.0.0.1:8000/docs

## Абитуриенты

### POST /applicants/
Создать абитуриента.

Запрос:
```json
{
  "full_name": "Иванов Алексей Дмитриевич",
  "email": "ivanov@mail.ru",
  "phone": "+79001234567",
  "region": "Москва"
}
```

Ответ (201):
```json
{
  "id": 1,
  "full_name": "Иванов Алексей Дмитриевич",
  "email": "ivanov@mail.ru",
  "phone": "+79001234567",
  "region": "Москва",
  "created_at": "2026-04-15T10:30:00"
}
```

Ошибки: 400 — email уже существует, 422 — невалидные данные.

### GET /applicants/
Список абитуриентов. Параметры: skip (int), limit (int, default 100).

### GET /applicants/{id}
Получить абитуриента по ID. Ошибки: 404 — не найден.

### DELETE /applicants/{id}
Удалить абитуриента. Ошибки: 404 — не найден.

---

## Программы

### POST /programs/
Создать программу.

Запрос:
```json
{
  "name": "Программная инженерия",
  "faculty": "Институт информационных технологий",
  "budget_seats": 45,
  "paid_seats": 165
}
```

### GET /programs/
Список всех программ.

### GET /programs/{id}
Получить программу по ID.

### DELETE /programs/{id}
Удалить программу.

---

## Заявки

### POST /applications/
Создать заявку.

Запрос:
```json
{
  "applicant_id": 1,
  "program_id": 1,
  "source": "site",
  "wave": 1,
  "score": 256.5
}
```

Валидации: applicant_id и program_id должны существовать, source из [site, olymp, aggregator, other], wave 1 или 2, score 0-310.

### GET /applications/
Список заявок с фильтрами.

Параметры: status, source, wave, program_id, skip, limit.

Пример: `GET /applications/?status=new&wave=1`

### GET /applications/{id}
Получить заявку по ID.

### PATCH /applications/{id}/status
Сменить статус заявки. Создаёт запись в status_logs.

Запрос:
```json
{
  "new_status": "review"
}
```

Ответ — обновлённая заявка с новым статусом и status_changed_at.

### DELETE /applications/{id}
Удалить заявку.

---

## Дашборд

### GET /dashboard/
Основные метрики. Параметры фильтрации: wave, source, program_id.

Ответ:
```json
{
  "total_applications": 162,
  "enrolled": 53,
  "rejected": 48,
  "in_review": 38,
  "new": 23,
  "conversion_rate": 32.72
}
```

### GET /dashboard/by-program
Конверсия по каждой программе.

Ответ:
```json
[
  {
    "program_id": 1,
    "program_name": "Программная инженерия",
    "faculty": "Институт информационных технологий",
    "total": 18,
    "enrolled": 6,
    "conversion_rate": 33.33
  }
]
```

### GET /dashboard/by-source
Статистика по источникам.

Ответ:
```json
[
  {"source": "site", "count": 82},
  {"source": "aggregator", "count": 35},
  {"source": "olymp", "count": 28},
  {"source": "other", "count": 17}
]
```

---

## Экспорт

### GET /export/raw
CSV сырых данных. Параметры: status, source, wave.

Колонки: ID заявки, ФИО, Email, Регион, Программа, Факультет, Статус, Источник, Волна, Баллы ЕГЭ, Дата подачи, Дата смены статуса.

### GET /export/report
CSV агрегированного отчёта по программам.

Колонки: Программа, Факультет, Всего заявок, Зачислено, Отклонено, Конверсия %.

---

## Тестовые данные

### POST /seed/generate
Генерация тестовых данных. Очищает все таблицы и создаёт:
- 80 абитуриентов (реалистичные ФИО, регионы, телефоны)
- 12 программ РТУ МИРЭА (реальные названия и институты)
- 160+ заявок с распределением статусов
