from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, default="")
    users = relationship("User", back_populates="role_rel")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    profile = relationship("Profile", uselist=False, back_populates="user")
    role_rel = relationship("Role", back_populates="users")


class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    username = Column(String, nullable=True)
    dob = Column(Date, nullable=True)
    major = Column(String, nullable=True)
    minor = Column(String, nullable=True)
    specialization = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")
# ai chuncks


class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # optional if you allow anon later
    name = Column(String(120), nullable=False)        # snapshot from form
    email = Column(String(120), nullable=False)       # snapshot from form
    category = Column(String(50), default="general")
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="open")       # open | in_progress | resolved | rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", lazy="joined")

# whole resume file
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", backref="resumes")
    chunks = relationship("ResumeChunk", cascade="all, delete", back_populates="resume")


# individual text chunks + Titan embeddings
class ResumeChunk(Base):
    __tablename__ = "resume_chunks"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)  # Titan embedding vector
    score = Column(Float, default=0.0)

    resume = relationship("Resume", back_populates="chunks")

class MatchAttempt(Base):
    __tablename__ = "match_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    job_title = Column(String(255), nullable=True)   
    score = Column(Integer, nullable=True)           
    jd_snippet = Column(Text, nullable=True)          
    raw_json = Column(Text, nullable=True)           

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="match_attempts")
    resume = relationship("Resume")

class InterviewAttempt(Base):
    __tablename__ = "interview_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # short JD title / role 
    job_title = Column(String(255), nullable=True)

    # JD snippet for context, like MatchAttempt
    jd_snippet = Column(Text, nullable=True)

    # final 0–100 score from interviewer_evaluate
    final_score = Column(Integer, nullable=True)

    # full evaluation blob: { per_question: [...], final: {...} }
    eval_json = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # SAME LOGIC AS MatchAttempt: backref creates User.interview_attempts
    user = relationship("User", backref="interview_attempts")