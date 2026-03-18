# 🎓 Мониторинг приёмной кампании

Дашборд для отслеживания заявок, зачислений и конверсии приёмной кампании университета.

---

## 📄 Документация проекта

| Документ | Описание |
|----------|----------|
| [project_card.docx](docs/project_card.docx) | Карточка проекта — цели, метрики, глоссарий, команда |
| [user_stories.md](docs/user_stories.md) | User stories по ролям с приоритетами MoSCoW |
| [status_diagram.svg](docs/status_diagram.svg) | Диаграмма статусов заявки |
| [erd_diagram.svg](docs/erd_diagram.svg) | ERD — схема базы данных |
| [api-contract.md](docs/api-contract.md) | JSON-контракт всех API эндпоинтов |
| [demo-scenario.md](docs/demo-scenario.md) | Демо-сценарий для защиты проекта |

---

## 👥 Команда и роли

| Участник | Роль | Зона ответственности |
|----------|------|----------------------|
| jadoreblessed | Team Lead | Архитектура, ревью PR, координация |
| — | Backend Dev | FastAPI, PostgreSQL, REST API |
| — | Backend Dev | Генерация данных, валидации, экспорт CSV |
| — | Frontend Dev | Дашборд, фильтры, графики |
| — | Frontend Dev | Карточка заявки, таблицы, UI-компоненты |

---

## 🏗️ Архитектура проекта

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│          React + TypeScript + Recharts              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │Dashboard │  │ Таблица  │  │ Карточка заявки  │  │
│  │(графики) │  │ заявок   │  │ + лог статусов   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼─────────────┼─────────────────┼─────────────┘
        │   REST API (JSON)              │
┌───────┼─────────────┼─────────────────┼─────────────┐
│       ▼             ▼                 ▼             │
│                  BACKEND                            │
│              FastAPI (Python)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │/dashboard│  │/applic.. │  │  /export/report  │  │
│  │ метрики  │  │  CRUD    │  │     CSV          │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼─────────────┼─────────────────┼─────────────┘
        │   SQLAlchemy ORM               │
┌───────▼─────────────▼─────────────────▼─────────────┐
│                  PostgreSQL                         │
│  applicants │ applications │ programs │ status_logs │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Структура репозитория

```
Monitoring-the-admission-campaignOmO/
│
├── backend/                        # FastAPI приложение
│   ├── app/
│   │   ├── routers/               # Эндпоинты API
│   │   │   ├── applicants.py      # CRUD абитуриентов
│   │   │   ├── applications.py    # CRUD заявок + смена статуса
│   │   │   ├── programs.py        # CRUD программ
│   │   │   ├── dashboard.py       # Метрики и аналитика
│   │   │   ├── export.py          # Экспорт CSV
│   │   │   └── seed.py            # Генерация тестовых данных
│   │   ├── models.py              # SQLAlchemy модели (таблицы БД)
│   │   ├── schemas.py             # Pydantic схемы + валидации
│   │   └── database.py            # Подключение к PostgreSQL
│   ├── main.py                    # Точка входа
│   ├── requirements.txt           # Зависимости Python
│   └── .env.example               # Пример переменных окружения
│
├── frontend/                       # React приложение
│   ├── src/
│   │   ├── components/            # UI-компоненты
│   │   │   ├── Dashboard/         # Дашборд с графиками
│   │   │   ├── ApplicationCard/   # Карточка заявки
│   │   │   ├── ApplicationTable/  # Таблица заявок
│   │   │   └── Filters/           # Панель фильтров
│   │   ├── pages/                 # Страницы приложения
│   │   ├── api/                   # Запросы к бэкенду (fetch/axios)
│   │   ├── types/                 # TypeScript типы
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
│
├── docs/                           # Документация
│   ├── api-contract.md            # JSON-контракт эндпоинтов
│   ├── db-schema.md               # Схема базы данных (ERD)
│   └── demo-scenario.md           # Демо-сценарий для защиты
│
├── data/                           # Синтетические датасеты
│   ├── T1/                        # Тестовый набор (≥100 заявок)
│   │   ├── applicants.csv
│   │   ├── applications.csv
│   │   └── programs.csv
│   └── T2/                        # Расширенный набор
│
└── README.md                       # Этот файл
```

---

## 🗄️ Схема базы данных

```
applicants                    programs
──────────────────            ──────────────────────
id          INT PK            program_code  VARCHAR PK
fio         VARCHAR           program_name  VARCHAR
birth_year  INT               faculty       VARCHAR
region      VARCHAR

applications
──────────────────────────────────────────
id                INT PK
applicant_id      INT FK → applicants.id
program_code      VARCHAR FK → programs.program_code
wave              INT          (1, 2, 3 — волна зачисления)
source            VARCHAR      (site | olymp | aggregator | other)
status            VARCHAR      (new | review | enrolled | rejected)
created_at        TIMESTAMP
status_changed_at TIMESTAMP

status_logs                   (трассируемость — лог всех смен статуса)
──────────────────────────────
id              INT PK
application_id  INT FK
old_status      VARCHAR
new_status      VARCHAR
changed_at      TIMESTAMP
changed_by      VARCHAR
```

---

## 📊 Метрики дашборда

| Метрика | Формула |
|---------|---------|
| `applications` | `COUNT(applications)` |
| `enrolled` | `COUNT(applications WHERE status = 'enrolled')` |
| `conversion` | `enrolled / applications` |

**Срезы:** по программе · по факультету · по источнику · по волне · по периоду

---

## 🔌 API эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/dashboard/` | Все метрики с фильтрами |
| `GET` | `/applications/` | Список заявок |
| `GET` | `/applications/{id}` | Карточка заявки |
| `POST` | `/applications/` | Создать заявку |
| `PATCH` | `/applications/{id}/status` | Сменить статус |
| `GET` | `/applications/{id}/logs` | Лог статусов |
| `GET` | `/export/report` | Скачать CSV-отчёт |
| `GET` | `/programs/` | Список программ |
| `POST` | `/seed/generate` | Сгенерировать тестовые данные |

**Фильтры для `/dashboard/` и `/export/report`:**
```
?date_from=2024-03-01&date_to=2024-08-31&program_code=CS-01&source=site&wave=1
```

---

## 🚀 Быстрый старт

### Шаг 1 — Клонировать репозиторий

```bash
git clone https://gitverse.ru/jadoreblessed/Monitoring-the-admission-campaignOmO.git
cd Monitoring-the-admission-campaignOmO
```

### Шаг 2 — Создать базу данных

Открыть **pgAdmin** (или psql) и выполнить:
```sql
CREATE DATABASE admission_db;
```

### Шаг 3 — Запустить бэкенд

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # заполнить DATABASE_URL
uvicorn main:app --reload
```

Swagger UI: **http://localhost:8000/docs**

### Шаг 4 — Запустить фронтенд

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm run dev
```

Приложение: **http://localhost:5173**

### Шаг 5 — Сгенерировать тестовые данные

```bash
curl -X POST http://localhost:8000/seed/generate
```

или открыть в браузере **http://localhost:8000/docs** → `POST /seed/generate` → Try it out → Execute

---

## 🌿 Ветки и процесс работы

```
main          — стабильная версия (только через PR)
dev           — общая ветка разработки
feature/...   — новая функциональность
fix/...       — исправление багов
```

**Правила:**
1. Никто не пушит напрямую в `main`
2. Каждая задача — отдельная ветка от `dev`
3. Перед мержем — Pull Request + ревью от Team Lead
4. Названия веток: `feature/dashboard-filters`, `fix/csv-export-encoding`

**Пример:**
```bash
git checkout dev
git pull
git checkout -b feature/dashboard-filters
# ... работаешь ...
git push origin feature/dashboard-filters
# создаёшь Pull Request в dev
```

---

## ✅ Критерии приёмки (из задания)

- [ ] ≥ 3 метрики на дашборде (applications, enrolled, conversion)
- [ ] Фильтры: период / направление / источник / волна
- [ ] Экспорт CSV с указанием применённых фильтров
- [ ] Воспроизводимый демо-сценарий
- [ ] Тестовый датасет T1 ≥ 100 заявок
- [ ] ≥ 5 валидаций данных
- [ ] Лог смены статусов (трассируемость)

---

## 🛠️ Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy |
| Database | PostgreSQL 16 |
| Validation | Pydantic v2 |
| Frontend | React, TypeScript |
| Charts | Recharts |
| VCS | Git, GitVerse |
