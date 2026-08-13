from fastapi import APIRouter, HTTPException, status
from app.schemas.request import ChatRequest
from app.schemas.response import ChatResponse
from app.services.chat_service import query_rag_pipeline
from app.utils.logger import logger

router = APIRouter()

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def chat_query(request: ChatRequest):
    """
    Query the RAG pipeline with a user question.
    """
    logger.info(f"Received chat RAG query request: '{request.question}'")
    try:
        response_data = query_rag_pipeline(request.question, request.document_id)
        return response_data
    except Exception as e:
        logger.error(f"Chat pipeline endpoint execution failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query knowledge index: {str(e)}"
        )
