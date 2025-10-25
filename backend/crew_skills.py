# crew_skills.py
# -------------------------------------------------------
# CrewAI flow:
# 1) Read resume DOCX + JD TXT
# 2) Extract flat {"skills":[...]} from resume (Claude 3.5 via Bedrock)
# 3) Compare to JD => matches/missing (JSON)
# -------------------------------------------------------

import os
import json
from crewai import Agent, Task, Crew, LLM
from docx import Document

AGENT_MODEL = os.getenv("CREW_AGENT_MODEL", "eu.anthropic.claude-3-7-sonnet-20250219-v1:0")

def read_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)

def read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

SKILLS_PROMPT = """Extract SKILLS ONLY from the CV text.
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

COMPARE_PROMPT = """You will be given a flat skill list from a candidate and a job requirement text.
Return ONLY JSON:
{{
  "resume_skills": [],
  "jd_required_skills": [],
  "matches": [],
  "missing": []
}}
Rules:
- Lowercase all tokens; deduplicate.
- Extract jd_required_skills as concise tokens from the JD text.
- matches = intersection(resume_skills, jd_required_skills)
- missing = jd_required_skills - resume_skills
Resume skills:
{resume_skills_json}
JD text:
---
{jd_text}
---
"""

def main(resume_docx: str, jd_txt: str):
    resume_text = read_docx(resume_docx)
    jd_text = read_text(jd_txt)

    llm = LLM(model=AGENT_MODEL, temperature=0.0)

    extractor = Agent(
        role="Skill Extractor",
        goal="Extract a flat, general skill list from resumes in strict JSON.",
        backstory="You only output JSON; no prose.",
        llm=llm,
        verbose=True,
    )

    matcher = Agent(
        role="Matcher",
        goal="Compare resume skills to JD and output matches/missing as JSON.",
        backstory="You only output JSON; no prose.",
        llm=llm,
        verbose=True,
    )

    extract_task = Task(
        description=SKILLS_PROMPT.format(cv_text=resume_text[:14000]),
        expected_output='{"skills":[...]}',
        agent=extractor,
    )

    compare_task = Task(
        description="Compare the following skills JSON with the JD to compute matches and missing.",
        expected_output='{"resume_skills":[],"jd_required_skills":[],"matches":[],"missing":[]}',
        context=[extract_task],
        agent=matcher,
    )

    crew = Crew(agents=[extractor, matcher], tasks=[extract_task, compare_task], llm=llm, verbose=True, debug=True)
    result = crew.kickoff(inputs={"jd_text": jd_text})

    print("\n=== CREW RESULT (raw) ===\n")
    print(result.raw)
    try:
        print("\n=== Parsed JSON ===\n")
        print(json.dumps(json.loads(result.raw), indent=2))
    except Exception:
        pass

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--resume", required=True, help="Path to resume .docx")
    p.add_argument("--jd", required=True, help="Path to JD .txt")
    args = p.parse_args()
    main(args.resume, args.jd)
