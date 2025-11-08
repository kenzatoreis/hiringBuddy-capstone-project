# ai.py
# -----------------------------------------------
# HiringBuddy AI Core — same logic, now persistent
# -----------------------------------------------

import io, json, re, time
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Body, Depends, Request
from docx import Document
from PyPDF2 import PdfReader
from botocore.exceptions import ClientError
from sqlalchemy.orm import Session

from bedrock_client import invoke_chat, embed_text, DEFAULT_AWS_REGION, DEFAULT_CLAUDE
from db import get_db
from models import Resume, ResumeChunk
from auth import get_user_from_token

router = APIRouter(prefix="/ai", tags=["ai"])
def token_aware_chunks(text: str, max_tokens: int = 700, overlap: int = 80):
    import re, math
    text = re.sub(r'\s+', ' ', text).strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, cur, cur_tokens = [], [], 0

    def est_tokens(s: str) -> int:
        return max(1, int(len(s.split()) / 0.75))

    i = 0
    while i < len(sentences):
        s = sentences[i]
        t = est_tokens(s)
        if cur_tokens + t <= max_tokens or not cur:
            cur.append(s); cur_tokens += t; i += 1
        else:
            chunk = ' '.join(cur).strip()
            if chunk:
                chunks.append(chunk)
            prefix, tok = [], 0
            for s_back in reversed(cur):
                tok += est_tokens(s_back)
                prefix.append(s_back)
                if tok >= overlap:
                    break
            cur = list(reversed(prefix))
            cur_tokens = sum(est_tokens(x) for x in cur)
    last = ' '.join(cur).strip()
    if last:
        chunks.append(last)
    return chunks


# ---------------- Safe Claude Wrapper ----------------
def safe_invoke_chat(*args, retries=2, delay=4, **kwargs):
    for attempt in range(1, retries + 1):
        try:
            return invoke_chat(*args, **kwargs)
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            if code in ("ThrottlingException", "ServiceUnavailableException"):
                time.sleep(delay * attempt)
                continue
            raise
        except Exception as e:
            if "ReadTimeoutError" in str(e) or "timed out" in str(e).lower():
                raise HTTPException(504, "Claude timeout. Try again later.")
            raise
    raise HTTPException(504, "Claude overloaded, retry later.")

# ---------------- File Text Extraction ----------------
def _extract_text_from_docx_bytes(b: bytes) -> str:
    with io.BytesIO(b) as buf:
        doc = Document(buf)
        return "\n".join(p.text for p in doc.paragraphs)

def _extract_text_from_pdf_bytes(b: bytes) -> str:
    reader = PdfReader(io.BytesIO(b))
    return "\n".join((p.extract_text() or "") for p in reader.pages)

def _extract_text(file: UploadFile, raw: bytes) -> str:
    name = (file.filename or "").lower()
    if name.endswith(".docx"):
        return _extract_text_from_docx_bytes(raw)
    if name.endswith(".pdf"):
        return _extract_text_from_pdf_bytes(raw)
    if name.endswith(".txt"):
        return raw.decode("utf-8", errors="ignore")
    raise HTTPException(400, "Unsupported file type (.docx, .pdf, .txt only)")

# ---------------- Cosine Similarity ----------------
def cos_sim(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    import math
    dot = sum(x*y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x*x for x in a))
    norm_b = math.sqrt(sum(x*x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

# ---------------- /peek_doc ----------------
@router.post("/peek_doc")
async def peek_doc(file: UploadFile = File(...), limit: int = 1200):
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file.")
    text = _extract_text(file, raw)
    if not text.strip():
        raise HTTPException(400, "No readable text.")
    return {"chars": len(text), "head": text[:max(100, min(limit, 4000))]}

# ---------------- /index_resume_mem ----------------
@router.post("/index_resume_mem")
async def index_resume_mem(
    request: Request,
    file: UploadFile = File(...),
    candidate_name: str = Form("Unknown"),
    db: Session = Depends(get_db),
):
    user = get_user_from_token(request, db)
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file.")
    text = _extract_text(file, raw)
    if not text.strip():
        raise HTTPException(400, "No readable text.")

    # Save resume record
    resume = Resume(user_id=user.id, name=file.filename, text=text)
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Split and embed each paragraph
    paragraphs = token_aware_chunks(text, max_tokens=700, overlap=80)
    if len(paragraphs) <= 1:
        words = text.split()
        paragraphs = [" ".join(words[i:i+800]) for i in range(0, len(words), 700)]

    if not paragraphs:
        paragraphs = [text]

    for p in paragraphs:
        try:
            emb = embed_text(p, aws_region=DEFAULT_AWS_REGION)
            # Titan sometimes returns an empty list or dict — check for that
            if not emb or not isinstance(emb, list):
                raise ValueError("Empty embedding response")
        except Exception as e:
            print(f"[WARN] Embedding failed for chunk: {p[:60]!r} ({e})")
            # Fallback vector — same length as Titan v2 (256 dims)
            emb = [0.0] * 256

        db.add(ResumeChunk(resume_id=resume.id, text=p, embedding=emb))

    db.commit()
    print(f"[OK] Indexed resume #{resume.id} with {len(paragraphs)} chunks")
    return {"ok": True, "resume_id": resume.id}


# ---------------- Helper: Retrieve top snippets ----------------
def best_snippets_from_db(requirement: str, db, user, region=DEFAULT_AWS_REGION,
                          top_k_resumes=2, top_k_snippets=1):
    qv = embed_text(requirement, aws_region=region)
    keywords = [w for w in re.findall(r"\w+", requirement.lower()) if len(w) > 2]
    scored = []

    for resume in (
    db.query(Resume)
      .filter(Resume.user_id == user.id)
      .order_by(Resume.created_at.desc())
      .limit(1)
      .all()
):
        chunk_scores = []
        for ch in resume.chunks:
            # Convert JSON from DB to floats
            vec = []
            for x in (ch.embedding or []):
                try:
                    vec.append(float(x))
                except Exception:
                    continue

            sem = cos_sim(qv, vec)
            kw_hits = sum(1 for w in keywords if w in ch.text.lower())
            score = 0.85 * sem + 0.15 * (min(kw_hits, 5) / 5.0)
            chunk_scores.append((score, ch.text))

        if not chunk_scores:
            continue
        chunk_scores.sort(reverse=True, key=lambda t: t[0])
        best = chunk_scores[0][0]
        top = [t[1] for t in chunk_scores[:top_k_snippets]]
        print(f"[{resume.name}] best semantic score = {best:.3f}")
        scored.append((best, resume, top))

    scored.sort(reverse=True, key=lambda t: t[0])
    return scored[:top_k_resumes]


# ---------------- /match_mem ----------------
@router.post("/match_mem")
def match_mem(
    request: Request,
    requirement: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    user = get_user_from_token(request, db)
    if not requirement.strip():
        raise HTTPException(400, "Empty requirement.")

    scored = best_snippets_from_db(requirement, db, user)
    results = []

    for best, resume, snippets in scored:
        prompt = f"""You are a hiring assistant. Return ONLY JSON: {{
  "score": 0-100,
  "highlights": [string],
  "missing": [string]
}}
Requirement:
---
{requirement}
---
Top evidence excerpts (from the candidate):
---
{chr(10).join(snippets)}
---"""

        out = safe_invoke_chat(
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            system=[{"text": "Return ONLY valid JSON. No prose."}],
            model_id=DEFAULT_CLAUDE,
            aws_region=DEFAULT_AWS_REGION,
            max_tokens=380,
            temperature=0.0,
        )
        cleaned = out.strip().strip("`").replace("json", "", 1).strip()
        # 🧾 DEBUG: print what Claude actually returned
        print("\n================ CLAUDE RAW OUTPUT ================")
        print(cleaned)
        print("===================================================\n")
        results.append({
            "resume_id": resume.id,
            "candidate": resume.name,
            "retrieval_semantic_best": best,
            "llm_json": cleaned
        })
        time.sleep(1.5)
    return {"results": results}

# ---------------- /draft_cv_with_headers ----------------
@router.post("/draft_cv_with_headers")
def draft_cv_with_headers(
    resume_text: str = Body(...),
    job_description: str = Body(...),
    missing: List[str] = Body(default=[]),
    headers: List[dict] = Body(default=[
        {"title": "Profile", "context": "(keep it brief)"},
        {"title": "Professional Experience", "context": ""},
        {"title": "Education", "context": ""},
        {"title": "Projects", "context": ""},
        {"title": "Certificates", "context": ""},
        {"title": "Skills", "context": ""},
        {"title": "Languages", "context": ""},
    ]),
):
    if not resume_text or not job_description:
        raise HTTPException(400, "resume_text and job_description are required.")

    header_text = "\n".join([f"### {h['title']}: {h.get('context','')}" for h in headers])

    prompt = f"""
You are an expert career assistant and resume writer.

Use the following inputs to draft a tailored resume:

RESUME:
{resume_text[:12000]}

JOB DESCRIPTION:
{job_description[:12000]}

MISSING SKILLS:
{', '.join(missing) if missing else 'none'}

USER HEADERS & CONTEXT:
{header_text}

Return ONLY valid JSON:
{{
  "sections": [
    {{"title":"Profile","content":"..."}},
    {{"title":"Professional Experience","content":"..."}}
  ]
}}
"""
    out = safe_invoke_chat(
        messages=[{"role":"user","content":[{"text":prompt}]}],
        system=[{"text":"Return ONLY valid JSON. No prose. No backticks."}],
        model_id=DEFAULT_CLAUDE,
        aws_region=DEFAULT_AWS_REGION,
        max_tokens=800,
        temperature=0.4,
    )

    cleaned = out.strip().strip("`").replace("json", "", 1).strip()
    try:
        data = json.loads(cleaned)
    except Exception:
        data = {"raw": cleaned}

    if "sections" not in data and isinstance(data, dict):
        try:
            data = {"sections": [{"title": k, "content": v} for k,v in data.items() if isinstance(v,str)]}
        except Exception:
            pass
    return {"ok": True, "draft": data}

# ---------------- Maintenance ----------------
@router.post("/memory_clear")
def memory_clear(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    db.query(ResumeChunk).filter(ResumeChunk.resume.has(user_id=user.id)).delete()
    db.query(Resume).filter(Resume.user_id == user.id).delete()
    db.commit()
    return {"ok": True}

@router.get("/memory_list")
def memory_list(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return {"resumes": [{"id": r.id, "filename": r.name, "chars": len(r.text or "")} for r in resumes]}
