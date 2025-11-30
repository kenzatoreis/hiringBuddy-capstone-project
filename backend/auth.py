from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from db import get_db
from models import User, Role, Profile, Resume, ResumeChunk, Complaint
from jose import jwt, JWTError
from datetime import datetime, timedelta
import bcrypt
from fastapi import BackgroundTasks
import os, smtplib
from email.message import EmailMessage
router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-only")
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
class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str
class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


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
RESET_TOKEN_EXPIRE_MINUTES = 30
FRONTEND_RESET_URL = "http://localhost:5173/reset-password" 

def create_reset_token(email: str) -> str:
    """
    Create a short-lived JWT only for password reset.
    """
    to_encode = {
        "sub": email,
        "scope": "password_reset",
        "exp": datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def send_reset_email(to_email: str, reset_link: str):
    """
    Sends a real reset email via SMTP (Mailtrap or another provider).
    Falls back to print if SMTP is not configured.
    """
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    pwd = os.getenv("SMTP_PASS")
    from_email = os.getenv("FROM_EMAIL", "no-reply@hiringbuddy.local")

    subject = "HiringBuddy – Reset your password"
    html_body = f"""
    <p>Hello,</p>
    <p>You requested to reset your password for your HiringBuddy account.</p>
    <p>Click the link below to choose a new password (valid for 30 minutes):</p>
    <p><a href="{reset_link}">{reset_link}</a></p>
    <p>If you did not request this, you can safely ignore this email.</p>
    """

    # If SMTP not configured → just log it (dev safe)
    if not host or not user or not pwd:
        print("⚠️ SMTP not configured, printing reset email instead:")
        print("TO:", to_email)
        print("SUBJECT:", subject)
        print("BODY:", html_body)
        return

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(html_body, subtype="html")

    with smtplib.SMTP(host, port) as server:
        server.starttls()
        server.login(user, pwd)
        server.send_message(msg)


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
    user = get_user_from_token(request, db)

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    data = await request.json()

    for key, value in data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return {"message": "Profile updated", "profile_id": profile.id}

###change pass
@router.put("/change-password")
def change_password(
    body: ChangePasswordIn,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_user_from_token(request, db)

    # verify current password
    if not bcrypt.checkpw(body.current_password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # hash and save new password
    new_hashed = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    user.hashed_password = new_hashed
    db.add(user)
    db.commit()

    return {"message": "Password changed successfully"}
##delete
@router.delete("/delete-account", status_code=204)
def delete_account(
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_user_from_token(request, db)

    # 1) delete resume chunks → resumes
    resume_ids = [r.id for r in db.query(Resume.id).filter(Resume.user_id == user.id).all()]
    if resume_ids:
        db.query(ResumeChunk).filter(ResumeChunk.resume_id.in_(resume_ids)).delete(
            synchronize_session=False
        )
        db.query(Resume).filter(Resume.id.in_(resume_ids)).delete(
            synchronize_session=False
        )

    # 2) delete complaints linked to this user (if you want to remove them too)
    db.query(Complaint).filter(Complaint.user_id == user.id).delete(
        synchronize_session=False
    )

    # 3) delete profile
    db.query(Profile).filter(Profile.user_id == user.id).delete(
        synchronize_session=False
    )

    db.delete(user)
    db.commit()
    return
@router.post("/forgot-password")
def forgot_password(
    body: ForgotPasswordIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Step 1 (not logged in):
    - User sends email.
    - If account exists, generate a reset token + link.
    - Send email (dev: log + return link).
    """

    user = db.query(User).filter(User.email == body.email).first()

    #  Security: no reveal if user exists
    if not user:
        return {
            "message": "If an account exists for this email, a reset link has been sent."
        }

    # token
    token = create_reset_token(user.email)
    reset_link = f"{FRONTEND_RESET_URL}?token={token}"
    background_tasks.add_task(send_reset_email, user.email, reset_link)
    return {
        "message": "If an account exists for this email, a reset link has been sent.",
        "dev_reset_link": reset_link,
    }
@router.post("/reset-password")
def reset_password(body: ResetPasswordIn, db: Session = Depends(get_db)):
    """
    Step 2:
    - Frontend sends { token, new_password }.
    - We verify token (scope + expiry), find user, and update hashed_password.
    """
    try:
        payload = jwt.decode(body.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("scope") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid reset token payload")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_hashed = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    user.hashed_password = new_hashed
    db.commit()

    return {"message": "Password has been reset successfully"}


