from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from hbapp.api.deps import get_db, get_current_user
from hbapp.db.models.documents import Documents, DocText, Comparison
from hbapp.schemas.compare import CompareRequest, CompareResult, CompareDetails

from ai.in_memory_store import add_resume, best_snippets_for_requirement, clear_resumes
from ai.bedrock_client import invoke_chat

import json

router = APIRouter()

COMPARE_SYS = (
    "You are an ATS assistant. Given evidence snippets from a resume and a job description, "
    "return strict JSON with fields: score (0-100), highlights [strings], missing [strings], summary (<=60 words)."
)

@router.post("/", response_model=CompareResult)
async def post_compare(body: CompareRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    cv = db.query(Documents).filter(Documents.user_id == current_user.id, Documents.id == body.cv_id).first()
    jd = db.query(Documents).filter(Documents.user_id == current_user.id, Documents.id == body.jd_id).first()
    if not cv or not jd:
        raise HTTPException(status_code=400, detail="CV or JD not found")
    cv_text = db.query(DocText).filter(DocText.document_id == cv.id).first()
    jd_text = db.query(DocText).filter(DocText.document_id == jd.id).first()
    if not cv_text or not jd_text:
        raise HTTPException(status_code=400, detail="Missing plain text for CV or JD")

    # isolate memory to this CV
    clear_resumes()
    resume_id = add_resume(cv_text.plain_text)

    # retrieve evidence
    best_score, _resume, top_snips = best_snippets_for_requirement(resume_id, jd_text.plain_text, k=6)

    user_msg = (
        "JD:\n" + jd_text.plain_text[:5000] + "\n\n" +
        "EVIDENCE_SNIPPETS:\n" + "\n---\n".join(top_snips)
    )
    out = await invoke_chat(system=COMPARE_SYS, messages=[{"role": "user", "content": user_msg}], response_format="json")

    try:
        llm = out if isinstance(out, dict) else json.loads(str(out).strip().strip("`"))
    except Exception:
        llm = {"score": 0, "highlights": [], "missing": [], "summary": ""}

    result = {
        "score": int(llm.get("score", 0)),
        "summary": llm.get("summary", ""),
        "highlights": llm.get("highlights", []) or [],
        "missing": llm.get("missing", []) or [],
        "evidence": [{"snippet": s, "rank": i + 1, "similarity": None} for i, s in enumerate(top_snips)],
    }

    row = Comparison(
        user_id=current_user.id,
        cv_id=body.cv_id,
        jd_id=body.jd_id,
        score=result["score"],
        summary=result["summary"],
        details_json={"highlights": result["highlights"], "missing": result["missing"], "evidence": result["evidence"]},
    )
    db.add(row); db.flush(); db.commit()

    return {"comparison_id": row.id, **result}

@router.get("/{comparison_id}", response_model=CompareDetails)
async def get_compare(comparison_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    row = db.query(Comparison).filter(Comparison.user_id == current_user.id, Comparison.id == comparison_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": row.id, "score": row.score, "summary": row.summary, "details_json": row.details_json}
