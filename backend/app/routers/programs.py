from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Program
from app.schemas import ProgramCreate, ProgramRead

router = APIRouter(prefix="/programs", tags=["Программы обучения"])

# CREATE — добавить программу
@router.post("/", response_model=ProgramRead)
def create_program(data: ProgramCreate, db: Session = Depends(get_db)):
    program = Program(**data.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program

# READ — получить все программы
@router.get("/", response_model=List[ProgramRead])
def get_programs(db: Session = Depends(get_db)):
    return db.query(Program).all()

# READ — получить одну программу по id
@router.get("/{program_id}", response_model=ProgramRead)
def get_program(program_id: int, db: Session = Depends(get_db)):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Программа не найдена")
    return program

# DELETE — удалить программу
@router.delete("/{program_id}")
def delete_program(program_id: int, db: Session = Depends(get_db)):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Программа не найдена")
    db.delete(program)
    db.commit()
    return {"detail": "Программа удалена"}