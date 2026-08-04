import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

class Settings:
    def __init__(self):
        # Resolve folders relative to project root
        self.app_dir = Path(__file__).resolve().parent.parent
        self.root_dir = self.app_dir.parent

        self.app_name = "Advance-RAG-Service"
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        # Absolute paths for directories
        self.upload_dir = str(self.root_dir / "data" / "pdfs")
        self.vector_db_dir = str(self.root_dir / "data" / "chroma_db")
        
        # Models Configuration
        self.embedding_model = "text-embedding-3-small"
        self.llm_model = "gpt-4o-mini"
        
        # Ingestion configurations
        self.chunk_size = 1000
        self.chunk_overlap = 200

        # Create directories if they do not exist
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.vector_db_dir, exist_ok=True)

settings = Settings()
