from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status
from app.schemas.response import UploadResponse
from app.services.upload_service import handle_upload
from app.utils.logger import logger

router = APIRouter()

@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    file: UploadFile = File(..., description="PDF file to upload"),
    document_id: str = Form(..., description="Unique ID linking file to backend metadata database"),
    patient_id: str = Form(...),
    document_type: str = Form("OTHER"),
    record_date: str = Form("")
):
    """
    POST route to process PDF research files, index chunks, and store vector embeddings.
    """
    logger.info(f"Received upload request. Filename: {file.filename}, Document ID: {document_id}")
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format, file must be a PDF."
        )

    try:
        if not patient_id.strip():
            raise HTTPException(status_code=400, detail="Patient ID is required for secure indexing.")
        result = await handle_upload(file, document_id, patient_id, document_type, record_date)
        return result
    except Exception as e:
        logger.error(f"Upload endpoint failed for ID: {document_id}. Detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest research paper: {str(e)}"
        )
