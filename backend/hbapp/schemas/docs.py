from pydantic import BaseModel, Field
from typing import Optional, Literal

DocType = Literal["cv", "jd"]

class DocumentOut(BaseModel):
    id: int
    type: DocType
    filename: Optional[str] = None
    mime: Optional[str] = None
    size: Optional[int] = None
    created_at: str
    class Config: from_attributes = True

class DocPreviewOut(BaseModel):
    id: int
    type: DocType
    filename: Optional[str] = None
    plain_text_head: str = Field(..., description="First ~1200 chars")

class DocUploadTextIn(BaseModel):
    type: DocType
    text: str
    language: Optional[str] = None
