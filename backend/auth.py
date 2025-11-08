# from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel, EmailStr
# from sqlalchemy.orm import Session
# from db import get_db
# from models import User, Role, Profile
# from jose import jwt
# from datetime import datetime, timedelta
# import bcrypt
# from datetime import datetime, date
# from fastapi import Request
# from jose import JWTError
# router = APIRouter(prefix="/auth", tags=["auth"])

# SECRET_KEY = "supersecret"
# ALGORITHM = "HS256"

# # -------------------- Schemas --------------------
# class RegisterIn(BaseModel):
#     email: EmailStr
#     password: str
#     username: str | None = None
#     dob: str | None = None  # "YYYY-MM-DD"
#     major: str | None = None
#     minor: str | None = None
#     specialization: str | None = None

# class LoginIn(BaseModel):
#     email: EmailStr
#     password: str

# # -------------------- Utils --------------------
# def create_token(data: dict):
#     to_encode = data.copy()
#     to_encode["exp"] = datetime.utcnow() + timedelta(hours=2)
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# # -------------------- Routes --------------------
# @router.post("/register")
# def register(body: RegisterIn, db: Session = Depends(get_db)):
#     if db.query(User).filter(User.email == body.email).first():
#         raise HTTPException(status_code=400, detail="Email already registered")

#     hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

#     # ensure role exists
#     role = db.query(Role).filter_by(name="user").first()
#     if not role:
#         role = Role(name="user")
#         db.add(role)
#         db.commit()
#         db.refresh(role)

#     user = User(email=body.email, hashed_password=hashed, role_id=role.id)
#     db.add(user)
#     db.commit()
#     db.refresh(user)

#     # ✅ convert DOB string -> date
#     dob_value = None
#     if body.dob:
#         try:
#             dob_value = datetime.strptime(body.dob, "%Y-%m-%d").date()
#         except ValueError:
#             raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

#     profile = Profile(
#         user_id=user.id,
#         username=body.username,
#         dob=dob_value,
#         major=body.major,
#         minor=body.minor,
#         specialization=body.specialization,
#     )
#     db.add(profile)
#     db.commit()

#     return {"message": "User created successfully", "user_id": user.id}


# @router.post("/login")
# def login(body: LoginIn, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.email == body.email).first()
#     if not user or not bcrypt.checkpw(body.password.encode(), user.hashed_password.encode()):
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     token = create_token({
#         "sub": user.email,
#         "role": user.role_rel.name if user.role_rel else "user",
#     })
#     return {"access_token": token, "token_type": "bearer"}
# @router.get("/me")
# def get_me(request: Request, db: Session = Depends(get_db)):
#     token = request.headers.get("authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     token = token.split(" ")[1]
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         email = payload.get("sub")
#         if not email:
#             raise HTTPException(status_code=401, detail="Invalid token")
#     except Exception:
#         raise HTTPException(status_code=401, detail="Token verification failed")

#     user = db.query(User).filter(User.email == email).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     profile = db.query(Profile).filter(Profile.user_id == user.id).first()
#     if not profile:
#         raise HTTPException(status_code=404, detail="Profile not found")

#     # ✅ Combine User + Profile info
#     return {
#         "email": user.email,
#         "username": profile.username,
#         "dob": profile.dob.isoformat() if profile.dob else None,
#         "major": profile.major,
#         "minor": profile.minor,
#         "specialization": profile.specialization,
#         "role": user.role_rel.name if user.role_rel else "user"
#     }
# @router.put("/update")
# def update_profile(request: Request, db: Session = Depends(get_db)):
#     token = request.headers.get("authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
#     token = token.split(" ")[1]

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         email = payload.get("sub")
#         if not email:
#             raise HTTPException(status_code=401, detail="Invalid token")
#     except Exception:
#         raise HTTPException(status_code=401, detail="Token verification failed")

#     user = db.query(User).filter(User.email == email).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     profile = db.query(Profile).filter(Profile.user_id == user.id).first()
#     if not profile:
#         raise HTTPException(status_code=404, detail="Profile not found")

#     data = request.json()
#     for key, value in data.items():
#         if hasattr(profile, key):
#             setattr(profile, key, value)

#     db.commit()
#     db.refresh(profile)

#     return {"message": "Profile updated", "profile": profile.id}
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from db import get_db
from models import User, Role, Profile
from jose import jwt, JWTError
from datetime import datetime, timedelta
import bcrypt

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "supersecret"
ALGORITHM = "HS256"

# -------------------- Schemas --------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    username: str | None = None
    dob: str | None = None  # "YYYY-MM-DD"
    major: str | None = None
    minor: str | None = None
    specialization: str | None = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

# -----------------------
def create_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(hours=2)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user_from_token(request: Request, db: Session):
    """Helper to extract the user from Authorization header"""
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token verification failed")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# -------------------- Routes --------------------
@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

    # ensure role exists
    role = db.query(Role).filter_by(name="user").first()
    if not role:
        role = Role(name="user")
        db.add(role)
        db.commit()
        db.refresh(role)

    user = User(email=body.email, hashed_password=hashed, role_id=role.id)
    db.add(user)
    db.commit()
    db.refresh(user)

    dob_value = None
    if body.dob:
        try:
            dob_value = datetime.strptime(body.dob, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    profile = Profile(
        user_id=user.id,
        username=body.username,
        dob=dob_value,
        major=body.major,
        minor=body.minor,
        specialization=body.specialization,
    )
    db.add(profile)
    db.commit()

    return {"message": "User created successfully", "user_id": user.id}


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not bcrypt.checkpw(body.password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({
        "sub": user.email,
        "role": user.role_rel.name if user.role_rel else "user",
    })
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "email": user.email,
        "username": profile.username,
        "dob": profile.dob.isoformat() if profile.dob else None,
        "major": profile.major,
        "minor": profile.minor,
        "specialization": profile.specialization,
        "role": user.role_rel.name if user.role_rel else "user"
    }


@router.put("/update")
async def update_profile(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = token.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Token verification failed")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # ✅ FIX: await the JSON body
    data = await request.json()

    for key, value in data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return {"message": "Profile updated", "profile_id": profile.id}
# in auth.py (anywhere after router is defined)
@router.post("/seed_admin")
def seed_admin(email: EmailStr, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")
    role = db.query(Role).filter_by(name="admin").first()
    if not role:
        role = Role(name="admin")
        db.add(role); db.commit(); db.refresh(role)
    user.role_id = role.id
    db.commit()
    return {"ok": True, "email": email, "role": "admin"}
