# app/repository/users.py
from typing import Optional
from sqlalchemy.orm import Session
from models import Users

def get_by_email(db: Session, email: str) -> Optional[Users]:
    return db.query(Users).filter(Users.email == email).first()

def create_user(db: Session, *, email: str, hashed_password: str, name: str | None, role: str) -> Users:
    u = Users(email=email, hashed_password=hashed_password, name=name, role=role)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u
