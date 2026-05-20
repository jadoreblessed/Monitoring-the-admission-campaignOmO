# Мониторинг приёмной кампании 

| Версия | Статус | Дата создания | Дата обновления |
|--------|--------|---------------|-----------------|
| v1.2   | Beta   | 2026-03-13    | 2026-05-06      |

## Демонстрационный стенд

Проект развёрнут на сервере и доступен онлайн:

- **Дашборд:** http://admission-campaign.mooo.com
- **Swagger API:** http://111.88.250.70:8000/docs

Для входа в личный кабинет абитуриента используйте email любого абитуриента из базы и пароль `password123`.

---

О документе: корневой README описывает проект, структуру репозитория, этапы развития решения и правила работы с документацией.

Для кого: для команды проекта, преподавателя и любого участника, который впервые открывает репозиторий.

Основано на: кейс №1 «Дашборд мониторинга приёмной кампании (университет)», дисциплина «Основы проектной деятельности».

## Быстрые ссылки

Индексы контрольных точек (хакатонов):

- [CP1: карточка проекта, команда, WBS, риски](docs/90-checkpoints/CP1-deliverables.md)
- [CP2: user stories, MoSCoW, персонажи, User Story Map](docs/90-checkpoints/CP2-deliverables.md)
- [CP3: Event Storming, BPMN, модель данных, ERD](docs/90-checkpoints/CP3-deliverables.md)

Карта документации: [docs/README.md](docs/README.md)

## О чём проект

Приёмная комиссия РТУ МИРЭА работает с Excel-таблицами вручную. Нет оперативной аналитики — конверсию считают в конце кампании, когда уже поздно реагировать на провалы набора. Формирование одного отчёта занимает 2-3 часа.

Проект решает эту проблему: веб-дашборд показывает конверсию в реальном времени, позволяет фильтровать заявки по статусу, волне и источнику, экспортировать отчёты в xlsx одной кнопкой. Абитуриенты могут зарегистрироваться, подать заявку и отслеживать её статус через личный кабинет.

Ключевая метрика: **конверсия = enrolled / total × 100%**. Целевое значение: 30%+. Время формирования отчёта: менее 1 секунды.

## Команда проекта

| ФИО | Роль | Логин GitVerse | Зона ответственности |
|-----|------|----------------|---------------------|
| Зырянов Владислав Александрович | Team Lead | jadoreblessed | Архитектура, координация, деплой, code review, документация |
| Груздев Владислав Евгеньевич | Backend Dev #1 | — | Модели БД, CRUD заявок/абитуриентов/программ, REST API |
| Коба Тимофей Сергеевич | Backend Dev #2 | Eriz | Pydantic-валидации, дашборд-метрики, экспорт xlsx, тесты |
| Комаров Никита Кириллович | Frontend Dev #1 | fastt | Дашборд с графиками, фильтры, подключение к API |
| Саженин Михаил Антонович | Frontend Dev #2 | dyakhan_797 | Таблица заявок, карточка заявки, лог статусов |

## Что реализовано

- полноценное веб-приложение развёрнуто на Yandex Cloud, доступно по домену `admission-campaign.mooo.com`;
- процессы управляются через pm2 — автоматический перезапуск при сбоях и после перезагрузки сервера;
- nginx как reverse proxy — сайт открывается без порта в адресе;
- две роли: приёмная комиссия (дашборд) и абитуриент (личный кабинет);
- авторизация через JWT-токены (24 часа), пароли хранятся в bcrypt-хеше;
- секретный ключ и конфигурация вынесены в `.env`, не хранятся в коде;
- CORS настроен на конкретный домен фронтенда;
- 15 реальных программ РТУ МИРЭА, 100 синтетических абитуриентов, 156 заявок;
- REST API с CRUD, дашбордом, экспортом и Swagger-документацией (22 эндпоинта);
- экспорт данных в `.xlsx` — открывается в Excel без проблем с кодировкой;
- журнал смен статуса заявки (`status_logs`) — полная история изменений;
- 21 автоматический тест (pytest) для эндпоинтов dashboard и applications;
- устав, карточка проекта, персонажи, user stories, MoSCoW, WBS, риски, RACI, Roadmap;
- Event Storming, BPMN-схема, ER-диаграмма, техническая документация по ГОСТ.

## Технологический стек

| Слой | Технологии |
|------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Pydantic v2, PostgreSQL 16 |
| Frontend | React 18, TypeScript, Vite, Axios |
| Авторизация | JWT (python-jose), bcrypt (passlib) |
| Тестирование | pytest, httpx, SQLite (in-memory) |
| Инфраструктура | Yandex Cloud, Ubuntu 22.04, nginx, pm2 |
| Инструменты | Git, Gitverse, VS Code, Swagger, pgAdmin |

## API эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /auth/register | Регистрация абитуриента |
| POST | /auth/login | Вход абитуриента (JWT) |
| GET | /cabinet/my-applications | Мои заявки (требует токен) |
| POST | /cabinet/apply | Подать заявку (требует токен) |
| GET | /cabinet/application/{id} | Статус заявки с историей |
| GET | /cabinet/profile | Профиль абитуриента |
| POST | /applicants/ | Создать абитуриента |
| GET | /applicants/ | Список абитуриентов |
| GET | /applicants/{id} | Получить абитуриента |
| DELETE | /applicants/{id} | Удалить абитуриента |
| POST | /programs/ | Создать программу |
| GET | /programs/ | Список программ |
| POST | /applications/ | Создать заявку |
| GET | /applications/ | Список заявок (фильтры: status, source, wave, program_id) |
| PATCH | /applications/{id}/status | Сменить статус заявки |
| DELETE | /applications/{id} | Удалить заявку |
| GET | /dashboard/ | Метрики: total, enrolled, conversion_rate |
| GET | /dashboard/by-program | Конверсия по программам |
| GET | /dashboard/by-source | Статистика по источникам |
| GET | /export/raw | Выгрузка всех заявок (.xlsx) |
| GET | /export/report | Агрегированный отчёт по программам (.xlsx) |
| POST | /seed/generate | Генерация синтетических данных |

## Структура репозитория

```
├── backend/
│   ├── main.py                    # Точка входа FastAPI, CORS, роутеры
│   ├── test_main.py               # 21 pytest-тест для dashboard и applications
│   ├── .env                       # Конфигурация (не в репо)
│   ├── app/
│   │   ├── database.py            # Подключение к PostgreSQL
│   │   ├── models.py              # 4 таблицы: applicants, programs, applications, status_logs
│   │   ├── schemas.py             # Pydantic-схемы и валидации
│   │   ├── auth.py                # JWT-токены, хеширование паролей
│   │   └── routers/
│   │       ├── applicants.py      # CRUD абитуриентов
│   │       ├── programs.py        # CRUD программ
│   │       ├── applications.py    # CRUD заявок + смена статуса
│   │       ├── dashboard.py       # Метрики в 3 срезах
│   │       ├── export.py          # Экспорт в xlsx
│   │       ├── seed.py            # Генерация синтетических данных
│   │       └── cabinet.py         # Регистрация, вход, личный кабинет
├── frontend/
│   ├── .env                       # VITE_API_URL (не в репо)
│   └── src/
│       ├── App.tsx                # Дашборд комиссии
│       ├── Cabinet.tsx            # Личный кабинет абитуриента
│       ├── api.ts                 # Запросы к API
│       └── App.css                # Стили
├── docs/                          # Документация проекта
│   ├── README.md                  # Карта документации
│   ├── 00-governance/             # Устав, карточка, RACI
│   ├── 01-discovery/              # Персонажи
│   ├── 02-requirements/           # User Stories, MoSCoW, User Story Map
│   ├── 03-planning/               # WBS, Roadmap, риски, фич-лист
│   ├── 04-design/                 # Event Storming, BPMN, ERD
│   ├── 05-technical/              # Документация по ГОСТ
│   └── 90-checkpoints/            # Индексы хакатонов CP1-CP3
├── ecosystem.config.js            # Конфигурация pm2
├── TASKS.md                       # Задачи для команды
├── FEATURE_LIST.md                # Фич-лист по спринтам
└── README.md                      # Этот файл
```

## План развития проекта

| Этап | Период | Фокус |
|------|--------|-------|
| Исследование и рамки | нед. 1-4 | Проблема, пользователи, требования, состав MVP |
| Проектирование | нед. 5-8 | Event Storming, BPMN, ERD, модель данных |
| Разработка MVP | нед. 9-12 | Backend (FastAPI + PostgreSQL), Frontend (React + TS) |
| Доработка и деплой | нед. 13-15 | Авторизация, ЛК абитуриента, хостинг, домен, тесты |
| Финальная подготовка | нед. 16 | Рефакторинг, документация, презентация |

## Календарный ориентир

- Старт проекта: `2026-03-13`
- Контрольная точка 1 (CP1): `2026-03-18`
- Контрольная точка 2 (CP2): `2026-03-25`
- Контрольная точка 3 (CP3): `2026-04-15`
- Деплой на Yandex Cloud: `2026-04-18`
- Домен + nginx + pm2: `2026-05-06`
- Защита проекта: `2026-06` (ориентировочно)

## Локальный запуск (для разработки)

```bash
# 1. Клонировать репозиторий
git clone https://gitverse.ru/jadoreblessed/Monitoring-the-admission-campaignOmO.git
cd Monitoring-the-admission-campaignOmO

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate          # Linux/Mac
venv\Scripts\activate             # Windows
pip install fastapi uvicorn sqlalchemy psycopg2-binary "pydantic[email]" \
    python-dotenv passlib bcrypt==4.0.1 python-jose openpyxl pytest httpx

# Создать backend/.env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/admission_db
# SECRET_KEY=your-secret-key
# FRONTEND_URL=http://localhost:5173

uvicorn main:app --reload         # http://127.0.0.1:8000/docs

# 3. Frontend (в отдельном терминале)
cd frontend
npm install

# Создать frontend/.env:
# VITE_API_URL=http://127.0.0.1:8000

npm run dev                       # http://127.0.0.1:5173

# 4. Запуск тестов
cd backend
source venv/bin/activate
pytest test_main.py -v
```

## Правила ведения документации

- Каждый документ начинается с шапки: версия, статус, дата
- Документы организованы по типам артефактов, не по этапам
- Индексы контрольных точек хранят ссылки на артефакты
- Коммиты: `feat:`, `docs:`, `fix:`, `chore:`, `test:`
- Ветки от `dev`, именуются `feature/название-задачи`
- Pull Request в `dev`, ревью — Team Lead
