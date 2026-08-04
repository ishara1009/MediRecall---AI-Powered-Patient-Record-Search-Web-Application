from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import health, upload, chat, documents
from app.utils.logger import logger

def create_app() -> FastAPI:
    """
    Establish FastAPI app configuring routing and CORS middleware.
    """
    logger.info(f"Initializing {settings.app_name} Application...")
    
    app = FastAPI(
        title=settings.app_name,
        description="FastAPI LangChain ChromaDB RAG backend for scientific literature",
        version="1.0.0"
    )

    # Allow CORS communication
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Permits cross-port communication from Express and React
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Routers
    app.include_router(health.router, tags=["Health Operations"])
    app.include_router(upload.router, tags=["Ingestion Operations"])
    app.include_router(chat.router, tags=["RAG QA Operations"])
    # Mount documents router
    app.include_router(documents.router, tags=["Document Metadata Operations"])

    logger.info("FastAPI Application setup finished successfully.")
    return app

app = create_app()
