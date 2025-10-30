# ai.py
# Routes for: peek_doc, index_resume_mem, extract_skills(_from_file|_from_mem), match_mem, memory_list/clear
import io
import json
import re

from typing import List
from botocore.exceptions import ClientError

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Body
from docx import Document
from PyPDF2 import PdfReader

from bedrock_client import invoke_chat, DEFAULT_AWS_REGION, DEFAULT_CLAUDE
from in_memory_store import add_resume, list_resumes, clear_resumes, MEM, best_snippets_for_requirement

router = APIRouter(tags=["ai"])
import time
from botocore.exceptions import ClientError

def safe_invoke_chat(*args, retries=2, delay=4, **kwargs):
    from botocore.exceptions import ClientError
    import time

    for attempt in range(1, retries + 1):
        try:
            print(f"[Claude] attempt {attempt}/{retries}")
            return invoke_chat(*args, **kwargs)
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            if code in ("ThrottlingException", "ServiceUnavailableException"):
                wait = delay * attempt
                print(f"[WARN] Bedrock throttled ({code}) — waiting {wait}s")
                time.sleep(wait)
                continue
            raise
        except Exception as e:
            if "ReadTimeoutError" in str(e) or "timed out" in str(e).lower():
                print("[WARN] Claude read timeout — skipping this resume.")
                raise HTTPException(504, "Claude timeout: try again later.")
            raise
    raise HTTPException(504, "Claude overloaded, retry later.")


# ---------- file text extraction ----------
#doc
def _extract_text_from_docx_bytes(file_bytes: bytes) -> str:
    with io.BytesIO(file_bytes) as buf:
        doc = Document(buf)
        return "\n".join(p.text for p in doc.paragraphs)
#pdf
def _extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    return "\n".join((p.extract_text() or "") for p in reader.pages)

def _extract_text(file: UploadFile, raw: bytes) -> str:
    name = (file.filename or "").lower()
    if name.endswith(".docx"):
        return _extract_text_from_docx_bytes(raw)
    if name.endswith(".txt"):
        try:
            return raw.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(400, f"TXT decode error: {e}")
    if name.endswith(".pdf"):
        return _extract_text_from_pdf_bytes(raw)
    raise HTTPException(400, "Unsupported file type. Please upload .docx, .txt, or .pdf")

# ---------- headings scraper & rule based scrapper for more accuracy ----------
UPPER_HEADINGS = {
    "PROGRAMMING LANGUAGES": "programming_languages",
    "SOFTWARE DEVELOPMENT FRAMESWORKS": "frameworks",
    "SOFTWARE DEVELOPMENT FRAMEWORKS": "frameworks",
    "DATABASE": "databases",
    "DATABASES": "databases",
    "SOFTWARE ENGINEERING": "software_engineering",
    "LANGUAGES": "human_languages",
    "CERTIFICATES": "certificates",
    "CERTIFICATIONS": "certificates",
    "TOOLS": "tools",
    "FRAMEWORKS": "frameworks",
    "SKILLS": "skills",
}

def _normalize_token(s: str) -> str:
    s = s.strip("•-—–,;:()[] ").lower()
    s = s.replace("nodejs", "node.js").replace("nextjs", "next.js")
    s = s.replace("spring framework ecosystem", "spring")
    return s

def _extract_skills_from_headings(cv_text: str) -> List[str]:
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in cv_text.splitlines()]
    skills: List[str] = []

    def is_heading(ln: str) -> bool:
        s = ln.strip()
        if len(s) < 3:
            return False
        letters = re.sub(r"[^A-Za-z]", "", s)
        return (letters.isupper() and len(letters) >= 3) or (s.upper() in UPPER_HEADINGS)

    current, bucket = None, []
    for ln in lines:
        if is_heading(ln):
            if current and bucket:
                text = " ".join(bucket)
                for p in re.split(r"[,\|/·•;]| and ", text, flags=re.IGNORECASE):
                    tok = _normalize_token(p)
                    if tok and len(tok) <= 50:
                        skills.append(tok)
            current, bucket = ln.upper(), []
        else:
            if current:
                bucket.append(ln)

    if current and bucket:
        text = " ".join(bucket)
        for p in re.split(r"[,\|/·•;]| and ", text, flags=re.IGNORECASE):
            tok = _normalize_token(p)
            if tok and len(tok) <= 50:
                skills.append(tok)

    # split if a whole sentence contained multiple languages
    extra = []
    for tok in list(skills):
        if re.search(r"\b(java|python|javascript|typescript|c\#?|sql)\b", tok):
            extra.extend(re.findall(r"\b(java|python|javascript|typescript|c\#?|sql)\b", tok))
    skills.extend([s.lower() for s in extra])

    skills = [s for s in skills if s not in {"profile", "education", "hobbies", "clubs", "link", "links"}]
    return sorted(set(skills))

# ---------- LLM skill extraction using claude ----------
_SKILLS_PROMPT = """Extract SKILLS ONLY from the CV text.
Return ONLY this JSON:
{{
  "skills": []
}}
Rules:
- Lowercase every item; keep acronyms as-is (aws, cpa, rn, iso 27001).
- Use concise tokens (e.g., "excel", "sap s/4hana", "customer service", "python", "french").
- Deduplicate.

Examples:
CV: "Programming Languages: Java, Python. Tools: Git, Docker."
Return: {{"skills": ["java","python","git","docker"]}}

CV: "Frameworks: Spring, React; Databases: Oracle, MySQL."
Return: {{"skills": ["spring","react","oracle","mysql"]}}

CV text:
---
{cv_text}
---
"""

def _extract_skills_llm_flat(cv_text: str) -> List[str]:
    msg = _SKILLS_PROMPT.format(cv_text=cv_text[:14000])
    out = safe_invoke_chat(
        messages=[{"role": "user", "content": [{"text": msg}]}],
        system=[{"text": "Return ONLY valid JSON. No prose. No backticks."}],
        model_id=DEFAULT_CLAUDE,
        aws_region=DEFAULT_AWS_REGION,
        max_tokens=380,
        temperature=0.0,
    )
    try:
        data = json.loads(out)
    except Exception:
        data = json.loads(out.strip().strip("`"))
    skills = [s.strip().lower() for s in data.get("skills", []) if isinstance(s, str)]
    return sorted(set(skills))

def _merge_flat(*lists: List[str]) -> List[str]:
    s = set()
    for lst in lists:
        s |= {x.strip().lower() for x in lst if isinstance(x, str)}
    return sorted(s)

# ---------- routes ----------
@router.post("/peek_doc")
async def peek_doc(file: UploadFile = File(...), limit: int = 1200):
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file.")
    text = _extract_text(file, raw)
    if not text.strip():
        raise HTTPException(400, "No readable text.")
    return {"chars": len(text), "head": text[:max(100, min(limit, 4000))]}

@router.post("/index_resume_mem")
async def index_resume_mem(file: UploadFile = File(...), candidate_name: str = Form("Unknown")):
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file.")
    text = _extract_text(file, raw)
    if not text.strip():
        raise HTTPException(400, "No readable text.")
    resume_id = add_resume(candidate_name, text, region=DEFAULT_AWS_REGION)
    return {"ok": True, "resume_id": resume_id}

@router.post("/extract_skills_from_file")
async def extract_skills_from_file(file: UploadFile = File(...)):
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file.")
    text = _extract_text(file, raw)
    if not text.strip():
        raise HTTPException(400, "Could not read text.")

    from_headings = _extract_skills_from_headings(text)
    llm = _extract_skills_llm_flat(text)
    merged = _merge_flat(from_headings, llm)
    return {"ok": True, "source": "headings+llm(claude)", "skills": merged,
            "debug": {"headings": from_headings, "llm": llm}}

@router.get("/extract_skills_from_mem")
def extract_skills_from_mem(resume_id: int):
    resume = next((r for r in MEM["resumes"] if r["id"] == resume_id), None)
    if not resume:
        raise HTTPException(404, f"resume_id {resume_id} not found")
    text = "\n\n".join(ch["text"] for ch in resume["chunks"][:6])[:16000]
    from_headings = _extract_skills_from_headings(text)
    llm = _extract_skills_llm_flat(text)
    merged = _merge_flat(from_headings, llm)
    return {"ok": True, "resume_id": resume_id, "source": "headings+llm(claude)", "skills": merged,
            "debug": {"headings": from_headings, "llm": llm}}

@router.post("/match_mem")
def match_mem(requirement: str = Body(..., embed=True)):
    if not requirement.strip():
        raise HTTPException(400, "Empty requirement.")
    scored = best_snippets_for_requirement(requirement, region=DEFAULT_AWS_REGION,
                                           top_k_resumes=2, top_k_snippets=1)
    results = []
    for best, r, snippets in scored:
        prompt = """You are a hiring assistant. Return ONLY JSON: {{
  "score": 0-100,
  "highlights": [string],
  "missing": [string]
}}
Requirement:
---
{req}
---
Top evidence excerpts (from the candidate):
---
{evidence}
""".format(req=requirement, evidence="\n---\n".join(snippets))
        out = safe_invoke_chat(
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            system=[{"text": "Return ONLY valid JSON. No prose."}],
            model_id=DEFAULT_CLAUDE,
            aws_region=DEFAULT_AWS_REGION,
            max_tokens=380,
            temperature=0.0,
            
        ) 
        time.sleep(1.5)
        results.append({
            "resume_id": r["id"],
            "candidate": r["name"],
            "retrieval_semantic_best": best,
            # "llm_json": out.
            "llm_json": out.strip().strip("`").replace("json", "", 1).strip()
        })
    return {"results": results}
# ---------- CV Draft Agent with Headers ----------

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

    header_text = "\n".join([f"### {h['title']}: {h.get('context','')}" for h in headers if 'title' in h])

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
    try:
        out = safe_invoke_chat(
            messages=[{"role":"user","content":[{"text":prompt}]}],
            system=[{"text":"Return ONLY valid JSON. No prose. No backticks."}],
            model_id=DEFAULT_CLAUDE,
            aws_region=DEFAULT_AWS_REGION,
            max_tokens=800,
            temperature=0.4,
        )
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "ThrottlingException":
            # return a proper 429 instead of a 500
            raise HTTPException(429, "Model is throttling; please try again in a few seconds.")
        raise

    cleaned = out.strip().strip("`").replace("json", "", 1).strip()
    try:
        data = json.loads(cleaned)
    except Exception:
        data = {"raw": cleaned}

    # normalize to sections[]
    if "sections" not in data and isinstance(data, dict):
        try:
            data = {
                "sections": [
                    {"title": k, "content": v}
                    for k, v in data.items() if isinstance(v, str)
                ]
            }
        except Exception:
            pass

    return {"ok": True, "draft": data}


@router.post("/memory_clear")
def memory_clear():
    clear_resumes()
    return {"ok": True}

@router.get("/memory_list")
def memory_list():
    return {"resumes": list_resumes()}
