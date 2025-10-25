# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai import router as ai_router

app = FastAPI(title="HiringBuddy – AI Only")

# Allow frontend (React dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register only AI routes (no auth, no DB)
app.include_router(ai_router)

@app.get("/")
def health():
    return {"status": "ok", "routes": [r.path for r in app.routes]}
