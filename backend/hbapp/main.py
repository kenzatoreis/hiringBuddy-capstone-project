# hbapp/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from hbapp.db import Base, engine             # <— unified import

# Import models BEFORE create_all
from models import Users as _Users            # backend/models.py (your Users)
from hbapp.db.models import documents as _documents  # your Doc/Comparison models

Base.metadata.create_all(bind=engine)

from hbapp.controller.authentication import router as auth_router
from hbapp.api.routes import docs as docs_router
from hbapp.api.routes import compare as compare_router
import os

app = FastAPI(title="HiringBuddy", docs_url="/api-docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(docs_router.router,    prefix="/documents", tags=["documents"])  # <- not /docs
app.include_router(compare_router.router, prefix="/compare",   tags=["compare"])

if os.getenv("ENABLE_AI_ROUTES", "0") == "1":
    try:
        from ai.agents_misc import router as ai_router
        app.include_router(ai_router)
    except Exception:
        pass

@app.get("/health")
def health():
    return {"ok": True}
