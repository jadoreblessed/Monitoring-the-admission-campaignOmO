# Frontend — React + TypeScript

Здесь будет фронтенд приложения.

## Задачи для Frontend Dev #1 (дашборд)

- [ ] Настроить проект: `npm create vite@latest . -- --template react-ts`
- [ ] Создать `src/api/index.ts` — функции для запросов к бэкенду
- [ ] Создать `src/types/index.ts` — TypeScript типы (Application, Program, DashboardData)
- [ ] Создать `src/components/Filters/` — фильтры (период, программа, источник, волна)
- [ ] Создать `src/components/Dashboard/` — карточки метрик + графики (Recharts)
- [ ] Страница `/` — главный дашборд

## Задачи для Frontend Dev #2 (таблицы и карточки)

- [ ] Создать `src/components/ApplicationTable/` — таблица заявок с сортировкой
- [ ] Создать `src/components/ApplicationCard/` — карточка заявки + лог статусов
- [ ] Кнопка экспорта CSV (вызов `GET /export/report`)
- [ ] Страница `/applications` — список заявок
- [ ] Страница `/applications/:id` — карточка конкретной заявки

## Запуск

```bash
npm install
cp .env.example .env
npm run dev
```

## Переменные окружения

```
VITE_API_URL=http://localhost:8000
```
