from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The user query or question to ask the RAG pipeline.")
    document_id: Optional[str] = Field(None, min_length=1, description="A selected PDF identifier, or null to search all PDFs.")
    patient_id: str = Field(..., min_length=1, description="Trusted patient identifier resolved by the backend.")
