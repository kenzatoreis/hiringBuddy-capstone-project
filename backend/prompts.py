# SYSTEM_PROMPT = [
#     {"text": (
#         "You are HiringBuddy, a CV analysis assistant. "
#         "Extract key facts ONLY from the provided resume text. "
#         "Never invent skills/experience. "
#         "Return concise, structured insights."
#     )}
# ]

# def build_user_message(cv_text: str):
#     trimmed = cv_text[:20000]
#     prompt = (
#         "Analyze this resume text and return a JSON with keys: "
#         "`summary_bullets` (list<string>), `skills` (list<string>), "
#         "`years_experience` (number or string), `projects` (list<string>), "
#         "`suitability_note` (string). Resume text:\n\n"
#         f"{trimmed}"
#     )
#     return [{"role": "user", "content": [{"text": prompt}]}]
# prompts.py
from typing import List, Dict

# Simple, neutral system prompt for benchmarking
SYSTEM_PROMPT: List[Dict[str, str]] = [
    {"text": (
        "You are a concise CV analyzer. Given raw CV text, summarize:\n"
        "name, emails, phones, top skills (10 max), last education entry, and last role if any.\n"
        "Return ONLY ONE JSON object with keys exactly: "
        "full_name, emails, phones, skills, education_summary, experience_summary.\n"
        "No markdown, no extra text."
    )}
]

def build_user_message(cv_text: str) -> list:
    """
    Builds a single user message for both Nova messages-v1 and Converse.
    """
    prompt = (
        "CV TEXT START\n"
        f"{cv_text[:20000]}\n"
        "CV TEXT END"
    )
    return [{"role": "user", "content": [{"text": prompt}]}]
