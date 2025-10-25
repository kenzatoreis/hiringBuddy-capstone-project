# in_memory_store.py
# ----------------------------------------------------
# In-memory resume index (works with DOCX-extracted text):
# - tokenish chunking with overlap
# - Titan embeddings
# 
# ----------------------------------------------------

import math
import re
from typing import List, Dict, Any

from bedrock_client import embed_text, DEFAULT_AWS_REGION


def cos_sim(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)


def token_aware_chunks(text: str, max_tokens: int = 700, overlap: int = 80) -> List[str]:
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
                if tok >= overlap: break
            cur = list(reversed(prefix))
            cur_tokens = sum(est_tokens(x) for x in cur)
    last = ' '.join(cur).strip()
    if last:
        chunks.append(last)
    return chunks


MEM: Dict[str, Any] = {"resumes": []}
SEQ = 1


def add_resume(name: str, text: str, *, region: str = DEFAULT_AWS_REGION) -> int:
    global SEQ
    chunks = token_aware_chunks(text, max_tokens=700, overlap=80) or [text]
    items = []
    for ch in chunks:
        vec = embed_text(ch, aws_region=region)
        items.append({"text": ch, "vec": vec})
    rid = SEQ; SEQ += 1
    MEM["resumes"].append({"id": rid, "name": name, "chunks": items})
    return rid


def list_resumes() -> List[Dict[str, Any]]:
    return [{"id": r["id"], "name": r["name"], "chunks": len(r["chunks"])} for r in MEM["resumes"]]


def clear_resumes():
    MEM["resumes"].clear()
    global SEQ; SEQ = 1


def best_snippets_for_requirement(requirement: str, *, region: str = DEFAULT_AWS_REGION,
                                  top_k_resumes: int = 5, top_k_snippets: int = 2):
    qv = embed_text(requirement, aws_region=region)
    kw = [w for w in requirement.lower().split() if w]

    scored = []
    for r in MEM["resumes"]:
        chunk_scores = []
        for ch in r["chunks"]:
            sem = cos_sim(qv, ch["vec"])
            kw_hits = sum(1 for w in kw if w in ch["text"].lower())
            score = 0.85 * sem + 0.15 * (min(kw_hits, 5) / 5.0)
            chunk_scores.append((score, ch["text"]))
        if not chunk_scores: continue
        chunk_scores.sort(reverse=True, key=lambda t: t[0])
        best_score = chunk_scores[0][0]
        top_snips = [t[1] for t in chunk_scores[:top_k_snippets]]
        scored.append((best_score, r, top_snips))
    scored.sort(reverse=True, key=lambda t: t[0])
    return scored[:top_k_resumes]
