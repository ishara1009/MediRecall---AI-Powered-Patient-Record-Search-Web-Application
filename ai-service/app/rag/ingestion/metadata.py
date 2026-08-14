from typing import List
from langchain_core.documents import Document
from app.utils.logger import logger

def enrich_chunk_metadata(
    chunks: List[Document], 
    document_id: str, 
    filename: str,
    patient_id: str,
    document_type: str = "OTHER",
    record_date: str = ""
) -> List[Document]:
    """
    Standardizes and enriches the metadata of each chunk.
    Ensures 'page' is 1-based and attaches 'document_id' for CRUD operations.
    """
    logger.info(f"Enriching metadata for {len(chunks)} chunks of document: {filename}")
    for chunk in chunks:
        # PyMuPDF loads page as 0-indexed integer
        page_val = chunk.metadata.get("page", 0)
        # Normalize to 1-indexed
        chunk.metadata["page"] = page_val + 1
        
        # Attach identifier mapping to MongoDB
        chunk.metadata["document_id"] = document_id
        chunk.metadata["filename"] = filename
        chunk.metadata["patient_id"] = patient_id
        chunk.metadata["document_type"] = document_type
        chunk.metadata["record_date"] = record_date
        
        # Clean 'source' metadata to be human-readable filname instead of absolute paths
        chunk.metadata["source"] = filename
        
    return chunks
