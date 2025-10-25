from pydantic import BaseModel
from typing import List, Optional

class CompareRequest(BaseModel):
    cv_id: int
    jd_id: int

class EvidenceItem(BaseModel):
    snippet: str
    rank: int
    similarity: Optional[float] = None

class CompareResult(BaseModel):
    comparison_id: int
    score: int
    summary: str
    highlights: List[str]
    missing: List[str]
    evidence: List[EvidenceItem]

class CompareDetails(BaseModel):
    id: int
    score: int
    summary: str
    details_json: dict
