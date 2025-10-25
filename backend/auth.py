# # auth.py
# from datetime import datetime, timedelta
# from typing import Annotated
# import os
# from fastapi import APIRouter, Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from jose import jwt, JWTError
# from passlib.context import CryptContext
# from pydantic import BaseModel, EmailStr
# from sqlalchemy.orm import Session

# from db import SessionLocal
# from models import Users


# # ---- settings (keep here for simplicity) ----
# # Generate a strong secret with: openssl rand -hex 32
# SECRET_KEY = os.getenv("SECRET_KEY", "dev_only_change_me_" + "0"*64)
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60

# pwd_ctx = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
# oauth2_bearer = OAuth2PasswordBearer(tokenUrl="/auth/token")

# router = APIRouter(prefix="/auth", tags=["auth"])

# # ---- pydantic ----
# class CreateUserRequest(BaseModel):
#     email: EmailStr
#     password: str
#     name: str | None = None
#     role: str | None = None  # allow seeding admin if you want

# class Token(BaseModel):
#     access_token: str
#     token_type: str = "bearer"

# class UserRead(BaseModel):
#     id: int
#     email: EmailStr
#     name: str | None = None
#     role: str

# # ---- db dep (inline to avoid extra files) ----
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# DB = Annotated[Session, Depends(get_db)]

# # ---- helpers ----
# def normalize_email(e: str) -> str:
#     return (e or "").strip().lower()

# def hash_password(plain: str) -> str:
#     return pwd_ctx.hash(plain)

# def verify_password(plain: str, hashed: str) -> bool:
#     return pwd_ctx.verify(plain, hashed)

# def create_access_token(sub: str, user_id: int, role: str) -> str:
#     payload = {
#         "sub": sub,
#         "id": user_id,
#         "role": role,
#         "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
#     }
#     return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]) -> dict:
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         email = payload.get("sub")
#         uid = payload.get("id")
#         role = payload.get("role")
#         if not (email and uid and role):
#             raise HTTPException(status_code=401, detail="Could not validate user")
#         return {"email": email, "id": uid, "role": role}
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Could not validate user")

# def require_role(*allowed: str):
#     def _inner(user: Annotated[dict, Depends(get_current_user)]):
#         if user["role"] not in allowed:
#             raise HTTPException(status_code=403, detail="Forbidden")
#         return user
#     return _inner

# # Handy aliases for deps to avoid default-arg ordering problems
# CurrentUser = Annotated[dict, Depends(get_current_user)]
# AdminOnly = Annotated[dict, Depends(require_role("admin"))]

# # ---- routes ----
# @router.post("/", status_code=status.HTTP_201_CREATED)
# def register(body: CreateUserRequest, db: DB):
#     email = normalize_email(body.email)
#     exists = db.query(Users.id).filter(Users.email == email).first()
#     if exists:
#         raise HTTPException(400, "Email already registered")
#     role = body.role if body.role in {"user", "admin"} else "user"
#     user = Users(
#         email=email,
#         name=body.name,
#         hashed_password=hash_password(body.password),
#         role=role,
#     )
#     db.add(user)
#     db.commit()
#     return {"ok": True}

# @router.post("/token", response_model=Token)
# def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DB):
#     email = normalize_email(form.username)
#     user = db.query(Users).filter(Users.email == email).first()
#     if not user or not verify_password(form.password, user.hashed_password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")
#     user.last_login_at = datetime.utcnow()
#     db.commit()
#     token = create_access_token(sub=user.email, user_id=user.id, role=user.role)
#     return {"access_token": token, "token_type": "bearer"}

# @router.get("/me", response_model=UserRead)
# def me(current: CurrentUser, db: DB):
#     user = db.query(Users).filter(Users.id == current["id"]).first()
#     if not user:
#         raise HTTPException(404, "User not found")
#     return UserRead(id=user.id, email=user.email, name=user.name, role=user.role)

# @router.get("/admin/ping")
# def admin_ping(user: AdminOnly):
#     return {"ok": True, "as": "admin", "user": user}

# @router.get("/secure")
# def secure_example(current: CurrentUser):
#     return {"ok": True, "who": current}
