from typing import List
from langchain_core.documents import Document
from langchain_chroma import Chroma
from app.rag.embeddings import get_embeddings
from app.config import settings
from app.utils.logger import logger

def get_vector_store() -> Chroma:
    """
    Initialize and return the Chroma vector store.
    """
    return Chroma(
        collection_name="advance_rag_collection",
        embedding_function=get_embeddings(),
        persist_directory=settings.vector_db_dir
    )

def add_documents_to_store(chunks: List[Document]):
    """
    Ingest a list of document chunks into ChromaDB.
    """
    try:
        if not chunks:
            logger.info("No chunks provided to insert in ChromaDB.")
            return
        
        vector_store = get_vector_store()
        logger.info(f"Ingesting {len(chunks)} chunks into ChromaDB...")
        vector_store.add_documents(chunks)
        logger.info("ChromaDB ingestion completed successfully.")
    except Exception as e:
        logger.error(f"Error adding documents to ChromaDB: {str(e)}")
        raise e

def delete_document_from_store(document_id: str):
    """
    Delete all chunks matching a specific document_id.
    """
    try:
        logger.info(f"Deleting embeddings for document_id: {document_id}")
        vector_store = get_vector_store()
        
        # delete by where filter
        # LangChain Chroma wrapper supports delete using where dict
        vector_store.delete(where={"document_id": document_id})
        logger.info(f"Successfully deleted ChromaDB entries for {document_id}")
    except Exception as e:
        logger.error(f"Error deleting document from ChromaDB: {str(e)}")
        raise e

def clear_all_vectors():
    """
    Reset and delete the entire collection.
    """
    try:
        logger.info("Reseting ChromaDB collection...")
        vector_store = get_vector_store()
        vector_store.reset_collection()
        logger.info("ChromaDB collection reset completed.")
    except Exception as e:
        logger.error(f"Error resetting ChromaDB collection: {str(e)}")
        raise e
