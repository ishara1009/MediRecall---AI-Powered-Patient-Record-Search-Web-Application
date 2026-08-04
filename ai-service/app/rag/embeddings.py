from langchain_openai import OpenAIEmbeddings
from app.config import settings

def get_embeddings() -> OpenAIEmbeddings:
    """
    Initialize and return the configured OpenAIEmbeddings class (text-embedding-3-small).
    """
    return OpenAIEmbeddings(
        model=settings.embedding_model,
        openai_api_key=settings.openai_api_key
    )
