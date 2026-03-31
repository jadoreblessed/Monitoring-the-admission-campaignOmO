# Задачи команды — Мониторинг приёмной кампании 

> **Team Lead:** Зырянов Владислав  
> **Статус:** MVP готов (бэкенд + фронтенд работают). Задачи ниже — на доработку и улучшение.  
> **Дедлайн:** среда  
> **Репозиторий:** https://gitverse.ru/jadoreblessed/Monitoring-the-admission-campaignOmO

---

## Как начать работу

```bash
git clone https://gitverse.ru/jadoreblessed/Monitoring-the-admission-campaignOmO.git
cd Monitoring-the-admission-campaignOmO
git checkout dev
git checkout -b feature/твоя-задача
```

После выполнения задачи:
```bash
git add .
git commit -m "feat: описание того что сделал"
git push origin feature/твоя-задача
```
Затем создай Pull Request в ветку `dev`.

---

## Backend Dev #1 — Груздев Владислав Евгеньевич

**Зона ответственности:** Модели БД, CRUD заявок/абитуриентов/программ, REST API

### Задача 1: Добавить UPDATE эндпоинт для абитуриентов
**Файл:** `backend/app/routers/applicants.py`  
**Что сделать:** Добавить `PATCH /applicants/{id}` — обновление ФИО, телефона, региона.  
**Ветка:** `feature/applicant-update`

```python
# Пример: добавить в applicants.py
@router.patch("/{applicant_id}", response_model=ApplicantRead)
def update_applicant(applicant_id: int, data: ApplicantUpdate, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Абитуриент не найден")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(applicant, key, value)
    db.commit()
    db.refresh(applicant)
    return applicant
```

Также добавить схему `ApplicantUpdate` в `schemas.py`:
```python
class ApplicantUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, pattern=r"^\+7\d{10}$")
    region: Optional[str] = None
```

### Задача 2: Добавить UPDATE эндпоинт для программ
**Файл:** `backend/app/routers/programs.py`  
**Что сделать:** Добавить `PATCH /programs/{id}` — обновление названия, факультета, количества мест.  
**Ветка:** `feature/program-update`

### Задача 3: Добавить пагинацию в список заявок
**Файл:** `backend/app/routers/applications.py`  
**Что сделать:** В эндпоинте `GET /applications/` уже есть `skip` и `limit`. Добавить в ответ общее количество записей (`total_count`), чтобы фронтенд мог показать пагинацию.  
**Ветка:** `feature/pagination`

```python
# Вернуть не просто список, а объект с total
@router.get("/")
def get_applications(...):
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}
```

---

## Backend Dev #2 — Коба Тимофей Сергеевич

**Зона ответственности:** Pydantic-валидации, дашборд-метрики, экспорт CSV, генерация синтетики

### Задача 1: Добавить валидацию перехода статусов
**Файл:** `backend/app/routers/applications.py`  
**Что сделать:** Сейчас можно поменять статус как угодно (например, из `rejected` обратно в `new`). Нужно добавить проверку допустимых переходов:

```
new → review (допустимо)
review → enrolled (допустимо)
review → rejected (допустимо)
new → rejected (допустимо)
enrolled → * (запрещено, уже зачислен)
rejected → * (запрещено, уже отклонён)
```

**Ветка:** `feature/status-validation`

```python
VALID_TRANSITIONS = {
    "new": ["review", "rejected"],
    "review": ["enrolled", "rejected"],
    "enrolled": [],
    "rejected": [],
}

# В функции update_status добавить:
if data.new_status not in VALID_TRANSITIONS.get(application.status, []):
    raise HTTPException(
        status_code=400, 
        detail=f"Нельзя перейти из '{application.status}' в '{data.new_status}'"
    )
```

### Задача 2: Добавить метрику средних баллов на дашборд
**Файл:** `backend/app/routers/dashboard.py`  
**Что сделать:** В эндпоинт `GET /dashboard/` добавить средний балл ЕГЭ по всем заявкам и средний балл зачисленных.  
**Ветка:** `feature/avg-score`

```python
from sqlalchemy import func

avg_score = db.query(func.avg(Application.score)).scalar() or 0
avg_enrolled_score = db.query(func.avg(Application.score)).filter(
    Application.status == "enrolled"
).scalar() or 0
```

### Задача 3: Добавить фильтр по дате в экспорт CSV
**Файл:** `backend/app/routers/export.py`  
**Что сделать:** Добавить параметры `date_from` и `date_to` в эндпоинт `GET /export/raw`, чтобы можно было выгрузить заявки за конкретный период.  
**Ветка:** `feature/export-date-filter`

---

## Frontend Dev #1 — Комаров Никита Кириллович

**Зона ответственности:** Дашборд с графиками, фильтры, подключение к API

### Задача 1: Добавить столбчатый график конверсии по программам
**Файл:** `frontend/src/App.tsx` (или создать отдельный компонент)  
**Что сделать:** Установить библиотеку `recharts` и добавить график под таблицей конверсии.  
**Ветка:** `feature/charts`

```bash
npm install recharts
```

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// В компоненте, где отображаются программы:
<BarChart width={800} height={300} data={programs}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="program_name" fontSize={11} />
  <YAxis />
  <Tooltip />
  <Bar dataKey="conversion_rate" fill="#3b82f6" name="Конверсия %" />
</BarChart>
```

### Задача 2: Добавить круговую диаграмму источников заявок
**Что сделать:** Использовать эндпоинт `GET /dashboard/by-source` и отобразить PieChart.  
**Ветка:** `feature/pie-chart`

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];
```

### Задача 3: Добавить фильтр по волне и источнику
**Что сделать:** Сейчас есть только фильтр по статусу. Добавить ещё два `<select>`: волна (1/2/все) и источник (site/olymp/aggregator/other/все). При изменении — перезапрашивать данные.  
**Ветка:** `feature/filters`

---

## Frontend Dev #2 — Саженин Михаил Антонович

**Зона ответственности:** Таблица заявок, карточка заявки, лог статусов, кнопка экспорта

### Задача 1: Показывать ФИО и название программы вместо ID
**Файл:** `frontend/src/App.tsx`  
**Что сделать:** Сейчас в таблице заявок отображается `applicant_id` и `program_id` числами. Нужно загрузить списки абитуриентов и программ и показывать имена.  
**Ветка:** `feature/names-in-table`

```tsx
// Добавить в api.ts:
export const fetchApplicants = () => API.get("/applicants/");
export const fetchPrograms = () => API.get("/programs/");

// В App.tsx загрузить и сделать lookup:
const applicantMap = Object.fromEntries(
  applicants.map(a => [a.id, a.full_name])
);
const programMap = Object.fromEntries(
  programs.map(p => [p.id, p.name])
);

// В таблице:
<td>{applicantMap[a.applicant_id] || a.applicant_id}</td>
<td>{programMap[a.program_id] || a.program_id}</td>
```

### Задача 2: Добавить карточку заявки (модальное окно)
**Что сделать:** При клике на строку в таблице — открывать модалку с полной информацией: ФИО, email, телефон, регион, программа, баллы, статус, дата подачи, история смен статуса.  
**Ветка:** `feature/application-card`

### Задача 3: Стилизовать кнопку экспорта и добавить выбор формата
**Что сделать:** Сейчас одна кнопка "Экспорт CSV". Сделать dropdown с двумя вариантами: "Сырые данные" (`/export/raw`) и "Отчёт по программам" (`/export/report`).  
**Ветка:** `feature/export-options`

---

## Общие правила

1. **Ветки:** каждая задача — отдельная ветка от `dev`
2. **Коммиты:** по-русски или по-английски, формат `feat: что сделано`
3. **Pull Request:** создаёте PR в `dev`, пишете что сделали
4. **Не ломать чужой код:** если нужно изменить общий файл — согласуйте с Team Lead
5. **Вопросы:** пишите в общий чат команды
