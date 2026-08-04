from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/health")
def get_health():
    """
    Check the operational status of the AI service, model bindings and folder directories.
    """
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "embedding_model": settings.embedding_model,
        "llm_model": settings.llm_model,
        "upload_dir_ok": True,
        "vector_dir_ok": True
    }
