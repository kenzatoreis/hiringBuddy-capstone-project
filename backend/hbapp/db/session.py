from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .base import Base          # ← use relative import
import os

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}
engine = create_engine(DB_URL, connect_args=connect_args, future=True, echo=False)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
