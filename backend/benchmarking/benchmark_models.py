"""
Benchmark: Claude (plain) vs Claude+Titan (improved) vs Nova Micro (no Titan)
-----------------------------------------------------------------------------
- Claude_plain: Full CV + JD directly to Claude.
- Claude_Titan: Global CV skill inventory (from full CV) + Titan top-k snippets as evidence.
- Nova_Micro: Full CV + JD to Nova (messages-v1); no Titan.

Output: backend/benchmarking/benchmark_final.csv
"""

import os, json, re, math, time, csv
from pathlib import Path
from statistics import mean
from docx import Document

from ..bedrock_client import (
    invoke_chat, embed_text, _client,
    DEFAULT_AWS_REGION, DEFAULT_CLAUDE
)

# ---------------- Paths & Ground Truth ----------------
BASE_DIR = Path(__file__).resolve().parent
CV_PATH = BASE_DIR / "CV_Fatima_Zahra_Zhiri.docx"
JD_PATH = BASE_DIR / "JD_Java_Developer.txt"

TRUE_REQUIRED = [
    "java","spring boot","hibernate","rest apis","grpc","graphql",
    "angular","react","vue","javascript","typescript","html5","css3",
    "oracle","sql server","postgresql","mysql","mongodb","cassandra",
    "jenkins","git","docker","kubernetes","aws","azure","gcp",
    "agile","scrum","tdd","ibm odm"
]

# Optional—in case your IAM requires a profile ARN for Nova
BEDROCK_RUNTIME_PROFILE_ARN = os.getenv("BEDROCK_RUNTIME_PROFILE_ARN", "")

# ---------------- Helpers ----------------
def clean_text(t: str) -> str:
    t = re.sub(r"http\S+|www\.\S+|\S+@\S+", "", t)
    return re.sub(r"\s+", " ", t).strip()

def load_text(p: Path) -> str:
    p = Path(p)
    if str(p).lower().endswith(".docx"):
        return "\n".join(par.text for par in Document(p).paragraphs)
    return p.read_text(encoding="utf-8", errors="ignore")

def token_aware_chunks(text: str, max_tokens: int = 700, overlap: int = 80):
    # same as ai.py
    text = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks, cur, cur_tokens = [], [], 0
    est = lambda s: max(1, int(len(s.split()) / 0.75))
    i = 0
    while i < len(sentences):
        s = sentences[i]; t = est(s)
        if cur_tokens + t <= max_tokens or not cur:
            cur.append(s); cur_tokens += t; i += 1
        else:
            chunks.append(" ".join(cur))
            prefix, tok = [], 0
            for s_back in reversed(cur):
                tok += est(s_back); prefix.append(s_back)
                if tok >= overlap: break
            cur = list(reversed(prefix))
            cur_tokens = sum(est(x) for x in cur)
    if cur: chunks.append(" ".join(cur))
    return chunks

def cos(a, b):
    dot = sum(x*y for x,y in zip(a,b))
    return dot/(math.sqrt(sum(x*x for x in a))*math.sqrt(sum(y*y for y in b)) or 1)

def f1_metrics(true, pred):
    true_set = set(x.lower() for x in true)
    pred_set = set(x.lower() for x in pred)
    tp = len(true_set & pred_set)
    fp = len(pred_set - true_set)
    fn = len(true_set - pred_set)
    p = tp/(tp+fp) if (tp+fp) else 0
    r = tp/(tp+fn) if (tp+fn) else 0
    f1 = 2*p*r/(p+r) if (p+r) else 0
    return round(p,2), round(r,2), round(f1,2), tp, fp, fn

def build_prompt(jd_text: str, context_text: str, label: str):
    return f"""
You are an AI hiring assistant.
Identify missing skills strictly from the job description compared to the candidate context below.
Return ONLY valid JSON:
{{"relevance_score":0-100,"missing_skills":[string],"summary":"1-2 sentences"}}

JOB DESCRIPTION:
{jd_text}

CANDIDATE CONTEXT ({label}):
{context_text}
"""

def json_safely(s: str):
    s = s.strip().strip("`").replace("json", "", 1).strip()
    try:
        return json.loads(s)
    except Exception:
        m = re.search(r"\{.*\}", s, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        raise


CANON = {
    "rest apis": {"rest", "rest api", "restful"},
    "javascript": {"javascript", "js"},
    "typescript": {"typescript", "ts"},
    "react": {"react", "react.js", "reactjs"},
    "vue": {"vue", "vue.js", "vuejs"},
    "html5": {"html", "html5"},
    "css3": {"css", "css3"},
    "aws": {"aws", "amazon web services"},
    "gcp": {"gcp", "google cloud"},
    "azure": {"azure", "microsoft azure"},
    "postgresql": {"postgres", "postgresql", "postgre sql"},
    "tdd": {"tdd", "test-driven development", "test driven development"},
}

def canonize_tokens(text: str):
    t = text.lower()
    found = set()
    for base, alts in CANON.items():
        for a in {base, *alts}:
            if re.search(rf"\b{re.escape(a)}\b", t):
                found.add(base)
                break
    return found

def cv_skill_inventory(cv_text: str):
    inv = set()
    cv_norm = canonize_tokens(cv_text)
    for need in TRUE_REQUIRED:
        if re.search(rf"\b{re.escape(need)}\b", cv_text.lower()):
            inv.add(need)
    inv |= cv_norm
    return sorted(inv)

# ---------------- Load data ----------------
cv_text = clean_text(load_text(CV_PATH))
jd_text = clean_text(load_text(JD_PATH))
print(f"Loaded CV ({len(cv_text)} chars) and JD ({len(jd_text)} chars)\n")

results = []

# ---------------- Claude (plain) ----------------
print("--- Running Claude_plain ---")
prompt_plain = build_prompt(jd_text, cv_text, "full CV")
t0 = time.time()
raw = invoke_chat(
    messages=[{"role":"user","content":[{"text":prompt_plain}]}],
    system=[{"text":"Return ONLY valid JSON. No prose."}],
    model_id=DEFAULT_CLAUDE,
    aws_region=DEFAULT_AWS_REGION,
    max_tokens=800, temperature=0.2
)
t = time.time() - t0
data = json_safely(raw)
pred = [s.lower().strip() for s in data.get("missing_skills", [])]
p, r, f1, tp, fp, fn = f1_metrics(TRUE_REQUIRED, pred)
row = {
    "model": "Claude_plain",
    "score": data.get("relevance_score", "?"),
    "precision": p, "recall": r, "f1": f1,
    "tp": tp, "fp": fp, "fn": fn,
    "time": round(t,2),
    "summary": data.get("summary", ""),
    "predicted": pred
}
print(json.dumps(row, indent=2)); print()
results.append(row)

# ---------------- Claude + Titan (IMPROVED) ----------------
print("Computing Titan retrieval (ai.py style)…")
cv_chunks = token_aware_chunks(cv_text)  # same defaults as ai.py
jd_emb = embed_text(jd_text, aws_region=DEFAULT_AWS_REGION)
scored = [(cos(jd_emb, embed_text(c, aws_region=DEFAULT_AWS_REGION)), c) for c in cv_chunks]
scored.sort(reverse=True, key=lambda t: t[0])

TOP_K = 5  # larger k for short CVs -> keeps recall
top_snips = [t[1] for t in scored[:TOP_K]]
semantic_context = "\n".join(top_snips)
avg_sim = round(mean(s for s,_ in scored[:TOP_K]), 3) if scored[:TOP_K] else 0.0
print(f"Top-{TOP_K} Titan chunk avg sim = {avg_sim}")

cv_inventory = cv_skill_inventory(cv_text)
print(f"CV skill inventory (len={len(cv_inventory)}): {cv_inventory[:10]}{'...' if len(cv_inventory)>10 else ''}\n")

prompt_titan = f"""
You are an AI hiring assistant.
Use BOTH inputs:
1) CV_SKILLS (global inventory from full CV)
2) EVIDENCE (Titan-retrieved snippets from the CV)

Goal: list JD-required skills that are MISSING from the candidate.
Important:
- If a skill or its common synonym appears in CV_SKILLS, DO NOT mark it missing.
- Use EVIDENCE only as supporting text (short snippets), not as the entire CV.
- Return ONLY valid JSON.

Return:
{{"relevance_score":0-100, "missing_skills":[string], "summary":"1-2 sentences"}}

JOB DESCRIPTION:
{jd_text}

CV_SKILLS (canonicalized global inventory):
{json.dumps(cv_inventory, ensure_ascii=False)}

EVIDENCE (Titan snippets):
{semantic_context}
"""

t0 = time.time()
raw = invoke_chat(
    messages=[{"role":"user","content":[{"text":prompt_titan}]}],
    system=[{"text":"Return ONLY valid JSON. No prose."}],
    model_id=DEFAULT_CLAUDE,
    aws_region=DEFAULT_AWS_REGION,
    max_tokens=800, temperature=0.2
)
t = time.time() - t0
data = json_safely(raw)
pred = [s.lower().strip() for s in data.get("missing_skills", [])]
p, r, f1, tp, fp, fn = f1_metrics(TRUE_REQUIRED, pred)
row = {
    "model": "Claude_Titan",
    "score": data.get("relevance_score", "?"),
    "precision": p, "recall": r, "f1": f1,
    "tp": tp, "fp": fp, "fn": fn,
    "time": round(t,2),
    "summary": data.get("summary", ""),
    "predicted": pred
}
print(json.dumps(row, indent=2)); print()
results.append(row)

# ---------------- Nova Micro (no Titan) ----------------
try:
    print("--- Running Nova_Micro (no Titan) ---")
    client = _client(DEFAULT_AWS_REGION)
    prompt_nova = build_prompt(jd_text, cv_text, "full CV")

    body = {
        "schemaVersion": "messages-v1",
        "messages": [
            {"role": "user", "content": [{"text": prompt_nova + "\nReturn ONLY JSON."}]}
        ],
        "inferenceConfig": {"maxTokens": 600, "temperature": 0.3}
    }
    if BEDROCK_RUNTIME_PROFILE_ARN:
        body["bedrockRuntimeProfileArn"] = BEDROCK_RUNTIME_PROFILE_ARN

    t0 = time.time()
    resp = client.invoke_model(
        modelId="us.amazon.nova-micro-v1:0",
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json"
    )
    t = time.time() - t0

    raw_bytes = resp["body"].read()
    if not raw_bytes:
        raise RuntimeError("Empty response body from Nova.")
    text = raw_bytes.decode("utf-8", errors="ignore")

    
    try:
        body_out = json.loads(text)
    except Exception:
        print("Nova raw body (non-JSON):\n", text[:2000])
        raise

    
    raw = ""
    try:
        raw = "".join(cb.get("text", "") for cb in body_out["output"][0]["content"])
    except Exception:
        raw = body_out.get("outputText", "") or body_out.get("results", [{}])[0].get("outputText", "")

    if not raw:
        print("Nova structured body:\n", json.dumps(body_out, indent=2)[:2000])
        raise RuntimeError("Nova returned empty content.")

    data = json_safely(raw)
    pred = [s.lower().strip() for s in data.get("missing_skills", [])]
    p, r, f1, tp, fp, fn = f1_metrics(TRUE_REQUIRED, pred)
    row = {
        "model": "Nova_Micro",
        "score": data.get("relevance_score", "?"),
        "precision": p, "recall": r, "f1": f1,
        "tp": tp, "fp": fp, "fn": fn,
        "time": round(t,2),
        "summary": data.get("summary", ""),
        "predicted": pred
    }
    print(json.dumps(row, indent=2)); print()
    results.append(row)

except Exception as e:
    print("[WARN] Nova Micro failed:", e)

# ---------------- Summary + CSV ----------------
print("===== Summary =====")
for r in results:
    print(f"{r['model']:<15}| Score:{r['score']:<4}| P:{r['precision']} R:{r['recall']} F1:{r['f1']} "
          f"| TP:{r['tp']} FP:{r['fp']} FN:{r['fn']} | {r['time']} s")

if results:
    out_path = BASE_DIR / "benchmark_final.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        writer.writeheader(); writer.writerows(results)
    print(f"\n Saved {out_path.name}\n")
