from .session import SessionLocal, engine
from .base import Base

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
