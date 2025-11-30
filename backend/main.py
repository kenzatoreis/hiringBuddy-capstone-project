from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import Base, engine
from auth import router as auth_router
from admin import admin as admin_router
from support import support as support_router
from ai import router as ai_router
from models import *
from dotenv import load_dotenv
import os

load_dotenv() 
Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(support_router)
app.include_router(ai_router)