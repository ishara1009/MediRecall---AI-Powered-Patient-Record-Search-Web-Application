from pydantic import BaseModel, Field
from typing import List, Optional

class UploadResponse(BaseModel):
    document_id: str = Field(..., description="Unique ID assigned to the document.")
    filename: str = Field(..., description="Original name of the uploaded file.")
    total_pages: int = Field(..., description="Total page count of the processed PDF.")
    file_size: int = Field(..., description="Size of the file in bytes.")
    status: str = Field(..., description="Processing status (e.g. success, failed).")
    extraction_method: Optional[str] = "TEXT"

class SourceDocument(BaseModel):
    document_id: Optional[str] = None
    filename: str = Field(..., description="Name of the source PDF document.")
    page: int = Field(..., description="Page number of the reference citation.")

class ChatResponse(BaseModel):
    question: str = Field(..., description="The original question query.")
    answer: str = Field(..., description="The generated context-supported answer.")
    confidence_score: float = Field(..., description="LLM estimated confidence score (0 to 100).")
    evidence_coverage: str = "Limited"
    retrieved_sources: int = 0
    documents_used: int = 0
    sources: List[SourceDocument] = Field(..., description="List of source file references and their pages.")
    context_references: List[str] = Field(..., description="Segments of retrieved document text context used to answer the question.")
