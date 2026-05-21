import pandas as pd
import sqlite3
from datetime import datetime

conn = sqlite3.connect("backend/sql_app.db")

print("Loading programs...")

# PROGRAMS
programs = pd.read_csv("data/T1/programs.csv")

programs = programs.rename(columns={
    "program_name": "name"
})

# добавляем обязательные поля
programs["budget_seats"] = 100
programs["paid_seats"] = 50

# оставляем только нужные колонки
programs = programs[["name", "faculty", "budget_seats", "paid_seats"]]

programs.to_sql("programs", conn, if_exists="append", index=False)

print("Loading applicants...")

# APPLICANTS
apps = pd.read_csv("data/T1/applicants.csv")

apps = apps.rename(columns={
    "fio": "full_name"
})

apps["email"] = apps["id"].astype(str) + "@example.com"
apps["phone"] = None
apps["created_at"] = datetime.utcnow()

apps = apps[["full_name", "email", "phone", "region", "created_at"]]

apps.to_sql("applicants", conn, if_exists="append", index=False)

print("Loading applications...")

# APPLICATIONS
appl = pd.read_csv("data/T1/applications.csv")

# связываем program_code с id программ
program_ids = pd.read_sql("SELECT id FROM programs", conn)

appl["program_id"] = 1
appl["score"] = 250
appl["has_original"] = 0

appl = appl[[
    "applicant_id",
    "program_id",
    "status",
    "source",
    "wave",
    "score",
    "created_at",
    "status_changed_at",
    "has_original"
]]

appl.to_sql("applications", conn, if_exists="append", index=False)

print("DONE!")
conn.close()