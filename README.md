# 🎓 Monitoring the Admission Campaign

> [!NOTE]
>
> Проект структурирован по этапам разработки (аналог контрольных точек), а документы организованы по типам артефактов.
>
> При первом знакомстве рекомендуется изучить:
>
> * `docs/` — основная документация проекта:
>
>   * цели, метрики и описание системы
>   * user stories и сценарии
>   * архитектура и модель данных
>   * API-контракты и демо-сценарий
> * ключевые файлы:
>
>   * `docs/project_card.docx` — цели проекта и метрики
>   * `docs/user_stories.md` — пользовательские сценарии
>   * `docs/api-contract.md` — описание API
>   * `docs/demo-scenario.md` — сценарий демонстрации
>
> После этого можно переходить к изучению backend и frontend частей.

---

| Версия | Статус | Дата создания | Дата обновления |
| ------ | ------ | ------------- | --------------- |
| v0.1   | Draft  | 2026-04-01    | 2026-04-01      |

---

## О документе

Корневой README описывает проект, структуру репозитория, состав решения и правила навигации по документации.

## Для кого

* команда проекта
* преподаватель / проверяющий
* любой участник, впервые открывающий репозиторий

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

## Что это за проект

`Monitoring the Admission Campaign` — система мониторинга приёмной кампании университета.

Цель проекта — предоставить инструмент для:

* отслеживания заявок
* анализа зачислений
* расчёта конверсии
* формирования отчётов

---

## О чем проект

Система позволяет:

* работать с заявками абитуриентов
* отслеживать статусы поступления
* анализировать эффективность приёмной кампании
* визуализировать ключевые метрики

Ключевые показатели:

* общее количество заявок
* количество зачисленных
* конверсия

---

## Быстрые ссылки

Документация проекта:

* `docs/project_card.docx` — цели и метрики
* `docs/user_stories.md` — пользовательские сценарии
* `docs/status_diagram.svg` — диаграмма статусов
* `docs/erd_diagram.svg` — схема БД

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


## Как читать репозиторий

* `docs/` — вся аналитика и проектная документация
* `backend/` — серверная логика (API, БД)
* `frontend/` — пользовательский интерфейс
* `data/` — тестовые данные

Рекомендуемый порядок:

1. Изучить документацию (`docs/`)
2. Посмотреть API (`backend/routers/`)
3. Перейти к UI (`frontend/`)

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

## Что уже реализовано

* структура базы данных
* REST API
* фильтрация данных
* дашборд с метриками
* экспорт в CSV
* генерация тестовых данных

---

## План развития проекта

| Этап           | Фокус                       |
| -------------- | --------------------------- |
| Исследование   | предметная область, метрики |
| Проектирование | архитектура, API, БД        |
| Реализация     | backend + frontend          |
| Завершение     | тестирование, демо          |

---

## Календарь проекта

* Старт: `2026-04-01`
* Демонстрация: `TBD`

---

## Как запустить проект

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Swagger: http://localhost:8000/docs

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Swagger: http://localhost:5173/docs
---

## Работа с Git

```
main — стабильная версия  
dev — разработка  
feature/* — новые фичи  
fix/* — баги  
```

---

## Правила ведения документации

* документы хранятся в `docs/`
* каждый документ описывает отдельный артефакт
* изменения фиксируются последовательно
* структура проекта сохраняется по типам артефактов

---

## Ближайшие шаги

1. Завершить демо-сценарий
2. Проверить корректность метрик
3. Добавить роль Абитуриента

---

## 👨‍💻 Автор

jadoreblessed

---




---



---



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
master          — стабильная версия (только через PR)
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


## 🛠️ Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy |
| Database | PostgreSQL 16 |
| Validation | Pydantic v2 |
| Frontend | React, TypeScript |
| Charts | Recharts |
| VCS | Git, GitVerse |
