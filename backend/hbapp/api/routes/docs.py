# hbapp/api/routes/docs.py
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Literal
import os

from hbapp.controller.authentication import get_current_user  # your existing dep
from hbapp.db.session import SessionLocal
from hbapp.db import get_db
from hbapp.db.models.documents import DocText, Documents # your models

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def list_docs(type: Literal["cv","jd"], db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Documents).filter(Documents.user_id == user.id, Documents.type == type).order_by(Documents.id.desc())
    return [{"id": d.id, "type": d.type, "filename": d.filename} for d in q.all()]

@router.post("/upload")
async def upload_doc(
    type: Literal["cv","jd"] = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    try:
        os.makedirs("uploads", exist_ok=True)
        save_path = os.path.join("uploads", file.filename)
        with open(save_path, "wb") as f:
            f.write(await file.read())

        # naive text extraction (good enough to unblock UI)
        text = ""
        name = (file.filename or "").lower()
        if name.endswith(".pdf"):
            from PyPDF2 import PdfReader
            r = PdfReader(save_path)
            text = "\n".join(p.extract_text() or "" for p in r.pages)
        elif name.endswith(".docx"):
            from docx import Document
            doc = Document(save_path)
            text = "\n".join(p.text for p in doc.paragraphs)
        else:
            with open(save_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        doc = Documents(
            user_id=user.id, type=type, filename=file.filename,
            mime=file.content_type, size=None, storage_path=save_path
        )
        db.add(doc); db.flush()
        db.add(DocText(document_id=doc.id, plain_text=text or ""))
        db.commit()
        return {"id": doc.id, "type": type, "filename": file.filename}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload_text")
def upload_text(payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        type_ = payload.get("type")
        text = payload.get("text") or ""
        if type_ not in ("cv", "jd"):
            raise HTTPException(status_code=422, detail="type must be 'cv' or 'jd'")

        doc = Documents(user_id=user.id, type=type_, filename=None, mime="text/plain", size=len(text), storage_path=None)
        db.add(doc); db.flush()
        db.add(DocText(document_id=doc.id, plain_text=text))
        db.commit()
        return {"id": doc.id, "type": type_, "filename": None}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
