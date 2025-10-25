from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from hbapp.db.base import Base

class Documents(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # 'cv' | 'jd'
    filename = Column(String)
    mime = Column(String)
    size = Column(Integer)
    storage_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    text = relationship("DocText", back_populates="document", uselist=False, cascade="all,delete")
    structured = relationship("DocStructured", back_populates="document", uselist=False, cascade="all,delete")
    __table_args__ = (CheckConstraint("type in ('cv','jd')", name="documents_type_chk"),)

class DocText(Base):
    __tablename__ = "doc_text"
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    plain_text = Column(Text, nullable=False)
    language = Column(String)
    parsed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    parser_version = Column(String, default="v1")
    document = relationship("Document", back_populates="text")

class DocStructured(Base):
    __tablename__ = "doc_structured"
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    fields = Column(JSON)
    document = relationship("Document", back_populates="structured")

class Comparison(Base):
    __tablename__ = "comparisons"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    cv_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    jd_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer)
    summary = Column(Text)
    details_json = Column(JSON)  # {highlights[], missing[], evidence[]}
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
