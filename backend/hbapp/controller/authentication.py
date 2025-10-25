# hbapp/controller/authentication.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from hbapp.db import get_db                 # <— use unified get_db
from ..schema import RegisterIn, LoginIn, TokenOut, MeOut, Msg, TokenResponse
from ..service import auth_service
from ..security import decode_token

router = APIRouter(prefix="/auth", tags=["auth"])
DB = Annotated[Session, Depends(get_db)]
bearer = HTTPBearer()

@router.post("/register", response_model=Msg)
def register(body: RegisterIn, db: DB):
    auth_service.register(db, body)
    return Msg(detail="User created")

@router.post("/login", response_model=TokenResponse)
def login(body: LoginIn, db: DB):
    token = auth_service.login(db, body)   # expects body.username & body.password
    return TokenResponse(detail="Logged in", result=TokenOut(access_token=token))

@router.get("/me", response_model=MeOut)
def me(db: DB, credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    payload = decode_token(credentials.credentials)
    uid = payload.get("id")
    if not uid:
        raise HTTPException(401, "Invalid token")
    return auth_service.me(db, uid)

# <<< add this — dependency other routers can reuse >>>
def get_current_user(db: DB, credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    payload = decode_token(credentials.credentials)
    uid = payload.get("id")
    if not uid:
        raise HTTPException(401, "Invalid token")
    # return a minimal user object (id) or the full row—your choice
    return auth_service.me(db, uid)  # returns MeOut; if you prefer ORM row, fetch it here
