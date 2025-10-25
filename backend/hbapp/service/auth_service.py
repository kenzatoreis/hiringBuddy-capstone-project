# app/service/auth_service.py
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..schema import RegisterIn, LoginIn, MeOut
from ..repository import users as users_repo
from ..security import hash_password, verify_password, create_access_token

def _norm(e: str) -> str:
    return (e or "").strip().lower()

def register(db: Session, body: RegisterIn) -> None:
    email = _norm(body.email)
    if users_repo.get_by_email(db, email):
        raise HTTPException(400, "Email already registered")
    role = body.role if body.role in {"user","admin"} else "user"
    users_repo.create_user(db, email=email, hashed_password=hash_password(body.password), name=body.name, role=role)

def login(db: Session, body: LoginIn) -> str:
    email = _norm(body.username)
    user = users_repo.get_by_email(db, email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return create_access_token(sub=user.email, user_id=user.id, role=user.role)

def me(db: Session, uid: int) -> MeOut:
    from models import Users
    user = db.query(Users).filter(Users.id == uid).first()
    if not user:
        raise HTTPException(404, "User not found")
    return MeOut(id=user.id, email=user.email, name=user.name, role=user.role)
