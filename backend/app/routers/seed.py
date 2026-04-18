from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Applicant, Program, Application, StatusLog
from app.auth import hash_password
 
router = APIRouter(prefix="/seed", tags=["Тестовые данные"])
 
@router.post("/generate")
def generate_data(db: Session = Depends(get_db)):
    db.query(StatusLog).delete()
    db.query(Application).delete()
    db.query(Applicant).delete()
    db.query(Program).delete()
    db.commit()
 
    # === Реальные программы РТУ МИРЭА 2026/2027 ===
    programs_data = [
        ("09.03.04 Программная инженерия", "ИИТ (Институт информационных технологий)", 50, 180, 268),
        ("09.03.01 Информатика и вычислительная техника", "ИИТ (Институт информационных технологий)", 45, 150, 255),
        ("09.03.02 Информационные системы и технологии", "ИИТ (Институт информационных технологий)", 40, 130, 248),
        ("01.03.02 Прикладная математика и информатика", "ИИИ (Институт искусственного интеллекта)", 30, 120, 262),
        ("02.03.02 Фундаментальная информатика и ИТ", "ИКБ (Институт кибербезопасности и цифровых технологий)", 25, 80, 258),
        ("10.03.01 Информационная безопасность", "ИКБ (Институт кибербезопасности и цифровых технологий)", 35, 90, 265),
        ("10.05.03 Информационная безопасность АС", "ИКБ (Институт кибербезопасности и цифровых технологий)", 20, 60, 270),
        ("15.03.04 Автоматизация технологических процессов", "ИПТИП (Институт перспективных технологий)", 40, 100, 246),
        ("15.03.06 Мехатроника и робототехника", "ИПТИП (Институт перспективных технологий)", 15, 45, 240),
        ("54.03.01 Дизайн сред смешанной реальности", "ИПТИП (Институт перспективных технологий)", 4, 30, 280),
        ("38.03.05 Бизнес-информатика", "ИТУ (Институт технологий управления)", 8, 55, 275),
        ("27.03.05 Инноватика", "ИТУ (Институт технологий управления)", 25, 70, 252),
        ("11.03.01 Радиотехника", "ИРИ (Институт радиоэлектроники и информатики)", 30, 50, 230),
        ("11.03.02 Инфокоммуникационные технологии", "ИРИ (Институт радиоэлектроники и информатики)", 20, 40, 235),
        ("03.03.02 Физика", "ИРИ (Институт радиоэлектроники и информатики)", 15, 25, 220),
    ]
 
    programs = []
    for name, faculty, budget, paid, min_score in programs_data:
        program = Program(name=name, faculty=faculty, budget_seats=budget, paid_seats=paid)
        db.add(program)
        programs.append((program, min_score))
    db.commit()
 
    # === Реалистичные абитуриенты ===
    first_m = ["Александр", "Дмитрий", "Максим", "Артём", "Иван", "Кирилл",
               "Никита", "Егор", "Даниил", "Михаил", "Андрей", "Тимофей",
               "Сергей", "Павел", "Матвей", "Роман", "Владислав", "Алексей"]
    first_f = ["Анна", "Мария", "София", "Дарья", "Полина", "Алиса",
               "Виктория", "Екатерина", "Валерия", "Ксения", "Елизавета", "Анастасия"]
    last_m = ["Иванов", "Смирнов", "Кузнецов", "Попов", "Васильев", "Петров",
              "Соколов", "Михайлов", "Новиков", "Фёдоров", "Морозов", "Волков",
              "Алексеев", "Лебедев", "Семёнов", "Егоров", "Козлов", "Степанов",
              "Николаев", "Орлов", "Андреев", "Макаров", "Захаров", "Зайцев"]
    last_f = ["Иванова", "Смирнова", "Кузнецова", "Попова", "Васильева", "Петрова",
              "Соколова", "Михайлова", "Новикова", "Фёдорова", "Морозова", "Волкова",
              "Алексеева", "Лебедева", "Семёнова", "Егорова", "Козлова", "Степанова"]
    patr_m = ["Александрович", "Дмитриевич", "Сергеевич", "Андреевич",
              "Игоревич", "Олегович", "Владимирович", "Николаевич",
              "Михайлович", "Евгеньевич", "Юрьевич", "Алексеевич"]
    patr_f = ["Александровна", "Дмитриевна", "Сергеевна", "Андреевна",
              "Игоревна", "Олеговна", "Владимировна", "Николаевна",
              "Михайловна", "Евгеньевна", "Юрьевна", "Алексеевна"]
 
    regions = [
        "Москва", "Москва", "Москва",  # москвичей больше
        "Московская область", "Московская область",
        "Санкт-Петербург", "Новосибирск", "Екатеринбург",
        "Казань", "Краснодар", "Самара", "Воронеж",
        "Ростов-на-Дону", "Нижний Новгород", "Уфа",
        "Пермь", "Тула", "Калуга", "Рязань", "Тверь",
        "Белгород", "Брянск", "Владимир", "Курск",
        "Челябинск", "Красноярск", "Омск", "Томск"
    ]
 
    mail_domains = ["mail.ru", "gmail.com", "yandex.ru", "inbox.ru", "bk.ru"]
 
    applicants = []
    used_emails = set()
 
    for i in range(100):
        is_male = random.random() > 0.35
        if is_male:
            first = random.choice(first_m)
            last = random.choice(last_m)
            patr = random.choice(patr_m)
        else:
            first = random.choice(first_f)
            last = random.choice(last_f)
            patr = random.choice(patr_f)
 
        # уникальный email
        base_email = f"{first.lower()}.{last.lower()}{random.randint(1,999)}@{random.choice(mail_domains)}"
        while base_email in used_emails:
            base_email = f"{first.lower()}.{last.lower()}{random.randint(1,9999)}@{random.choice(mail_domains)}"
        used_emails.add(base_email)
 
        applicant = Applicant(
            full_name=f"{last} {first} {patr}",
            email=base_email,
            phone=f"+7{random.choice(['903','905','910','915','916','917','925','926','929','930','950','951','960','965','977','985','999'])}{random.randint(1000000,9999999)}",
            region=random.choice(regions),
            hashed_password=hash_password("password123")
        )
        db.add(applicant)
        applicants.append(applicant)
    db.commit()
 
    # === Заявки с реалистичным распределением ===
    app_count = 0
    for applicant in applicants:
        num_apps = random.choices([1, 2, 3], weights=[40, 45, 15])[0]
        chosen = random.sample(programs, min(num_apps, len(programs)))
 
        for program, min_score in chosen:
            # баллы ЕГЭ: нормальное распределение вокруг проходного балла программы
            score = round(random.gauss(min_score - 10, 30), 1)
            score = max(120, min(300, score))  # ограничиваем 120-300
 
            # статус зависит от баллов
            if score >= min_score + 15:
                status_weights = {"enrolled": 70, "review": 20, "new": 5, "rejected": 5}
            elif score >= min_score:
                status_weights = {"enrolled": 30, "review": 35, "new": 15, "rejected": 20}
            elif score >= min_score - 20:
                status_weights = {"enrolled": 5, "review": 25, "new": 20, "rejected": 50}
            else:
                status_weights = {"enrolled": 0, "review": 10, "new": 15, "rejected": 75}
 
            status = random.choices(
                list(status_weights.keys()),
                weights=list(status_weights.values())
            )[0]
 
            # источник: сайт чаще, олимпиады — для высоких баллов
            if score >= 280:
                source = random.choices(
                    ["site", "olymp", "aggregator", "other"],
                    weights=[30, 40, 20, 10]
                )[0]
            else:
                source = random.choices(
                    ["site", "olymp", "aggregator", "other"],
                    weights=[50, 10, 30, 10]
                )[0]
 
            # даты приёмной кампании 2025
            start = datetime(2025, 6, 20)
            created = start + timedelta(days=random.randint(0, 55))
            wave = 1 if created < datetime(2025, 8, 1) else 2
 
            application = Application(
                applicant_id=applicant.id,
                program_id=program.id,
                status=status,
                source=source,
                wave=wave,
                score=score,
                created_at=created,
                status_changed_at=created + timedelta(days=random.randint(1, 21))
            )
            db.add(application)
            db.commit()
            db.refresh(application)
 
            # журнал статусов (реалистичная цепочка)
            if status == "new":
                logs = [("new", created)]
            elif status == "review":
                logs = [("new", created), ("review", created + timedelta(days=random.randint(3, 10)))]
            elif status == "enrolled":
                review_date = created + timedelta(days=random.randint(3, 10))
                logs = [("new", created), ("review", review_date), ("enrolled", review_date + timedelta(days=random.randint(5, 15)))]
            else:  # rejected
                review_date = created + timedelta(days=random.randint(3, 10))
                logs = [("new", created), ("review", review_date), ("rejected", review_date + timedelta(days=random.randint(5, 15)))]
 
            prev = None
            for new_st, changed_at in logs:
                log = StatusLog(
                    application_id=application.id,
                    old_status=prev,
                    new_status=new_st,
                    changed_at=changed_at
                )
                db.add(log)
                prev = new_st
 
            app_count += 1
 
    db.commit()
 
    # статистика
    total_enrolled = db.query(Application).filter(Application.status == "enrolled").count()
    total = db.query(Application).count()
    conversion = round((total_enrolled / total * 100), 2) if total > 0 else 0
 
    return {
        "detail": "Данные приёмной кампании РТУ МИРЭА 2025 сгенерированы",
        "applicants": len(applicants),
        "programs": len(programs),
        "applications": app_count,
        "enrolled": total_enrolled,
        "conversion_rate": f"{conversion}%",
        "note": "Все абитуриенты имеют пароль 'password123' для тестирования личного кабинета"
    }