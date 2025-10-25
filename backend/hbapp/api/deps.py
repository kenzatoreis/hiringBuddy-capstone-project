from hbapp.db.session import SessionLocal
from fastapi import Depends
from typing import Generator

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Reuse your real auth dep when you move it.
def get_current_user():
    # TEMP: import your existing get_current_user
    from hbapp.controller.authentication import get_current_user as real_dep
    return real_dep()
