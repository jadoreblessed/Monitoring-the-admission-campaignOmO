from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Applicant, Program, Application, StatusLog

router = APIRouter(prefix="/seed", tags=["Тестовые данные"])

@router.post("/generate")
def generate_data(db: Session = Depends(get_db)):
    # очищаем таблицы перед генерацией
    db.query(StatusLog).delete()
    db.query(Application).delete()
    db.query(Applicant).delete()
    db.query(Program).delete()
    db.commit()

    # === Реальные программы РТУ МИРЭА ===
    programs_data = [
        # (название, институт, бюджет, платное)
        ("Программная инженерия", "Институт информационных технологий", 45, 165),
        ("Прикладная информатика", "Институт информационных технологий", 50, 120),
        ("Прикладная математика и информатика", "Институт искусственного интеллекта", 25, 111),
        ("Информатика и вычислительная техника", "Институт информационных технологий", 40, 100),
        ("Информационная безопасность", "Институт кибербезопасности и цифровых технологий", 30, 80),
        ("Искусственный интеллект и машинное обучение", "Институт кибербезопасности и цифровых технологий", 20, 60),
        ("Автоматизация технологических процессов", "Институт перспективных технологий и индустриального программирования", 40, 90),
        ("Инноватика", "Институт технологий управления", 25, 70),
        ("Бизнес-информатика", "Институт технологий управления", 6, 50),
        ("Электроника и наноэлектроника", "Институт радиоэлектроники и информатики", 35, 60),
        ("Робототехника и мехатроника", "Институт перспективных технологий и индустриального программирования", 12, 40),
        ("Дизайн сред смешанной реальности", "Институт перспективных технологий и индустриального программирования", 4, 30),
    ]

    programs = []
    for name, faculty, budget, paid in programs_data:
        program = Program(name=name, faculty=faculty, budget_seats=budget, paid_seats=paid)
        db.add(program)
        programs.append(program)
    db.commit()

    # === Абитуриенты с реалистичными данными ===
    first_names_m = ["Алексей", "Дмитрий", "Иван", "Сергей", "Андрей",
                     "Павел", "Михаил", "Артём", "Максим", "Никита",
                     "Кирилл", "Егор", "Даниил", "Тимофей", "Матвей"]
    first_names_f = ["Мария", "Анна", "Елена", "Ольга", "Наталья",
                     "Екатерина", "Татьяна", "Юлия", "Виктория", "Дарья",
                     "Полина", "Ксения", "Алиса", "Софья", "Валерия"]

    last_names_m = ["Иванов", "Петров", "Сидоров", "Козлов", "Новиков",
                    "Волков", "Лебедев", "Попов", "Смирнов", "Орлов",
                    "Белов", "Тарасов", "Жуков", "Борисов", "Фёдоров"]
    last_names_f = ["Иванова", "Петрова", "Сидорова", "Козлова", "Новикова",
                    "Волкова", "Лебедева", "Попова", "Смирнова", "Орлова",
                    "Белова", "Тарасова", "Жукова", "Борисова", "Фёдорова"]

    patronymics_m = ["Александрович", "Дмитриевич", "Сергеевич", "Андреевич",
                     "Игоревич", "Олегович", "Владимирович", "Николаевич"]
    patronymics_f = ["Александровна", "Дмитриевна", "Сергеевна", "Андреевна",
                     "Игоревна", "Олеговна", "Владимировна", "Николаевна"]

    regions = ["Москва", "Московская область", "Санкт-Петербург", "Новосибирск",
               "Екатеринбург", "Казань", "Краснодар", "Самара", "Воронеж",
               "Ростов-на-Дону", "Нижний Новгород", "Уфа", "Пермь",
               "Тула", "Калуга", "Рязань", "Тверь", "Белгород"]

    sources = ["site", "olymp", "aggregator", "other"]

    applicants = []
    for i in range(80):  # 80 абитуриентов
        is_male = random.random() > 0.4  # 60% мужчин (технический вуз)
        if is_male:
            first = random.choice(first_names_m)
            last = random.choice(last_names_m)
            patron = random.choice(patronymics_m)
        else:
            first = random.choice(first_names_f)
            last = random.choice(last_names_f)
            patron = random.choice(patronymics_f)

        applicant = Applicant(
            full_name=f"{last} {first} {patron}",
            email=f"{first.lower()}.{last.lower()}{i}@mail.ru",
            phone=f"+7{random.randint(9000000000, 9999999999)}",
            region=random.choice(regions)
        )
        db.add(applicant)
        applicants.append(applicant)
    db.commit()

    # === Заявки с реалистичным распределением статусов ===
    app_count = 0
    for applicant in applicants:
        num_apps = random.randint(1, 3)
        chosen_programs = random.sample(programs, min(num_apps, len(programs)))

        for program in chosen_programs:
            # реалистичное распределение статусов
            roll = random.random()
            if roll < 0.15:
                status = "new"       # 15% ещё не рассмотрены
            elif roll < 0.40:
                status = "review"    # 25% на рассмотрении
            elif roll < 0.70:
                status = "enrolled"  # 30% зачислены
            else:
                status = "rejected"  # 30% отклонены

            # реалистичные баллы ЕГЭ (3 предмета, 40-100 каждый)
            score = round(random.uniform(120, 300), 1)

            # даты в рамках приёмной кампании (июнь-август)
            start_date = datetime(2025, 6, 20)
            created = start_date + timedelta(days=random.randint(0, 60))

            # источник: сайт чаще всего
            source_roll = random.random()
            if source_roll < 0.50:
                source = "site"
            elif source_roll < 0.70:
                source = "aggregator"
            elif source_roll < 0.85:
                source = "olymp"
            else:
                source = "other"

            application = Application(
                applicant_id=applicant.id,
                program_id=program.id,
                status=status,
                source=source,
                wave=1 if created.month < 8 else 2,
                score=score,
                created_at=created,
                status_changed_at=created + timedelta(days=random.randint(1, 21))
            )
            db.add(application)
            db.commit()
            db.refresh(application)

            log = StatusLog(
                application_id=application.id,
                old_status=None,
                new_status=status,
                changed_at=application.status_changed_at
            )
            db.add(log)
            app_count += 1

    db.commit()

    return {
        "detail": "Тестовые данные РТУ МИРЭА сгенерированы",
        "applicants": len(applicants),
        "programs": len(programs),
        "applications": app_count
    }