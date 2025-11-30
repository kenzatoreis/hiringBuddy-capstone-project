from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer 
from sqlalchemy.orm import Session
from db import get_db
from models import User, Role, Profile
from auth import get_user_from_token
bearer = HTTPBearer() 
admin = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(bearer)])

def require_admin(
    request: Request,
    db: Session = Depends(get_db),   
):
    me = get_user_from_token(request, db)
    role_name = me.role_rel.name if getattr(me, "role_rel", None) else "user"
    if role_name != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return me

@admin.get("/users")
def list_users(
    _: User = Depends(require_admin),           # dependency
    db: Session = Depends(get_db),              
):
    rows = (
        db.query(User, Profile, Role)
        .outerjoin(Profile, Profile.user_id == User.id)
        .outerjoin(Role, Role.id == User.role_id)
        .all()
    )
    out = []
    for u, p, r in rows:
        out.append({
            "id": u.id,
            "email": u.email,
            "role": (r.name if r else "user"),
            "profile": {
                "username": getattr(p, "username", None),
                "major": getattr(p, "major", None),
                "minor": getattr(p, "minor", None),
                "specialization": getattr(p, "specialization", None),
            },
        })
    return {"users": out}

@admin.patch("/users/{user_id}/role")
def set_user_role(
    user_id: int,
    role: str,
    _: User = Depends(require_admin),           
    db: Session = Depends(get_db),              
):
    role_obj = db.query(Role).filter_by(name=role).first()
    if not role_obj:
        role_obj = Role(name=role)
        db.add(role_obj); db.commit(); db.refresh(role_obj)

    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")

    u.role_id = role_obj.id
    db.commit()
    return {"ok": True, "user_id": u.id, "new_role": role}

@admin.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    _: User = Depends(require_admin),          
    db: Session = Depends(get_db),              
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    db.delete(u); db.commit()
    return {"ok": True, "deleted_user_id": user_id}
