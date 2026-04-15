# CP3: Проектирование, модель данных и MVP

| Дата среза | Статус |
|-----------|--------|
| 2026-04-15 | Завершён |

## Артефакты контрольной точки

| № | Артефакт | Документ | Статус |
|---|----------|----------|--------|
| 1 | Event Storming (карта событий, команды/политики, агрегаты) | [DOC-DES-001](../04-design/project_documentation.docx) (тема 4) | Done |
| 2 | BPMN-схема процесса | [DOC-DES-002](../04-design/bpmn_diagram.svg) | Done |
| 3 | Техническое задание | [DOC-DES-001](../04-design/project_documentation.docx) (раздел 5.3) | Done |
| 4 | ER-диаграмма (4 таблицы) | [DOC-DES-003](../04-design/erd_diagram.svg) | Done |
| 5 | Нормализация до 3НФ | [DOC-DES-001](../04-design/project_documentation.docx) (раздел 6.3) | Done |
| 6 | Описание структуры БД | [DOC-DES-005](../04-design/project_documentation.docx) (раздел 6.4) | Done |
| 7 | Диаграмма статусов заявки | [DOC-DES-004](../04-design/status_diagram.svg) | Done |
| 8 | Техническая документация (ГОСТ) | [DOC-TEC-001](../05-technical/gost_documentation.docx) | Done |
| 9 | Backend MVP (FastAPI + PostgreSQL) | backend/ | Done |
| 10 | Frontend MVP (React + TypeScript) | frontend/ | Done |
| 11 | Тестовые данные (162 заявки на программах МИРЭА) | POST /seed/generate | Done |
| 12 | Swagger-документация | http://127.0.0.1:8000/docs | Done |

## Что проверялось

- Event Storming: доменные события, команды, политики, агрегаты, Bounded Context
- BPMN-схема с 3 дорожками (абитуриент, комиссия, система) и 3 шлюзами
- ER-диаграмма с 4 таблицами и связями 1:N, нормализация до 3НФ
- Рабочий MVP: бэкенд отдаёт данные, фронтенд отображает дашборд
- Все GET/POST/PATCH/DELETE запросы сформулированы и задокументированы в Swagger
