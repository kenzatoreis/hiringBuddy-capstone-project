# backend/tools/jd_tools.py
# Tools: small, focused functions that call Nova via your bedrock_client helper.
# CrewAI agents can call these tools to do work.

from typing import Dict, Any
import re, json
from backend.ai.bedrock_client import invoke_nova_micro

def _only_json(text: str) -> Any:
    """Extract a JSON object from a string (handles ```json fences)."""
    m = re.search(r"\{.*\}", text, re.S)
    return json.loads(m.group(0)) if m else {"raw": text}

def _clean_lines(txt: str) -> str:
    """Trim whitespace and blank lines to keep prompts compact."""
    return "\n".join(line.strip() for line in txt.splitlines() if line.strip())

def jd_keywords_extractor(jd_text: str) -> Dict:
    """
    Extract structured info strictly from a JD.
    Returns JSON with keys:
      - skills, keywords, seniority, must_haves, nice_to_haves
    """
    system = [{"text": (
        "Extract ONLY what appears in the JD. No guessing. "
        "Reply with one JSON object having keys: "
        "skills, keywords, seniority, must_haves, nice_to_haves."
    )}]
    prompt = (
        "From the Job Description (JD) below, extract information.\n"
        "Return ONLY a JSON object with keys exactly: "
        "skills, keywords, seniority, must_haves, nice_to_haves.\n\n"
        f"JD:\n{_clean_lines(jd_text)[:8000]}"
    )
    messages = [{"role": "user", "content": [{"text": prompt}]}]
    out = invoke_nova_micro(messages=messages, system=system, max_tokens=600)
    return _only_json(out)

def cv_vs_jd_matcher(cv_text: str, jd_text: str) -> Dict:
    """
    Compare CV vs JD strictly using provided text.
    Returns JSON with keys:
      - match_score (0-100), missing_keywords (list<string>),
        tailored_bullets (list<string>), risk_notes (list<string>)
    """
    system = [{"text": (
        "Compare the CV to the JD using ONLY provided text. "
        "Do not invent qualifications. Reply with a single JSON object with keys: "
        "match_score, missing_keywords, tailored_bullets, risk_notes."
    )}]
    prompt = (
        "Compare this CV to the JD and produce ONLY the JSON.\n\n"
        f"CV:\n{cv_text[:20000]}\n\nJD:\n{_clean_lines(jd_text)[:8000]}"
    )
    messages = [{"role": "user", "content": [{"text": prompt}]}]
    out = invoke_nova_micro(messages=messages, system=system, max_tokens=700)
    return _only_json(out)
