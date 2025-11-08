# support.py
from fastapi import APIRouter, Depends, HTTPException, Request, Body, Path
from sqlalchemy.orm import Session
from db import get_db
from models import Complaint, User
from auth import get_user_from_token   # you already use this
from admin import require_admin        # your admin guard

support = APIRouter(prefix="/support", tags=["support"])

# User submits a ticket
@support.post("/complaints")
def create_complaint(
    request: Request,
    payload: dict = Body(...),   # { name, email, subject, category, message }
    db: Session = Depends(get_db),
):
    # attach logged-in user if present (your form *also* sends name/email)
    me: User | None = None
    try:
        me = get_user_from_token(request, db)
    except Exception:
        me = None

    for k in ("name", "email", "subject", "message"):
        if not payload.get(k):
            raise HTTPException(status_code=400, detail=f"Missing field: {k}")

    c = Complaint(
        user_id=(me.id if me else None),
        name=payload["name"],
        email=payload["email"],
        subject=payload["subject"],
        category=payload.get("category", "general"),
        message=payload["message"],
    )
    db.add(c); db.commit(); db.refresh(c)
    return {"ok": True, "id": c.id}

# Admin: list all complaints (newest first)
@support.get("/admin/complaints")
def list_complaints(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return {"items": [
        {
            "id": r.id, "user_id": r.user_id,
            "name": r.name, "email": r.email,
            "category": r.category, "subject": r.subject, "message": r.message,
            "status": r.status, "created_at": r.created_at,
        } for r in rows
    ]}

# Admin: update status
@support.patch("/admin/complaints/{cid}/status")
def set_complaint_status(
    cid: int = Path(..., ge=1),
    body: dict = Body(...),  # { "status": "resolved" }
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    c = db.query(Complaint).get(cid)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    c.status = body.get("status", "open")
    db.commit()
    return {"ok": True}
