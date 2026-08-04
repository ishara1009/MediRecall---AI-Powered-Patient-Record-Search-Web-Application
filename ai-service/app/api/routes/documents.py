import os
import glob
from fastapi import APIRouter, HTTPException, status
from app.config import settings
from app.rag.ingestion.loader import load_document
from app.rag.ingestion.chunker import chunk_documents
from app.rag.ingestion.metadata import enrich_chunk_metadata
from app.rag.vectorstore import delete_document_from_store, add_documents_to_store, clear_all_vectors
from app.utils.logger import logger

router = APIRouter()

@router.get("/documents")
def list_documents():
    """
    List all PDF files physically stored in upload directory and parsed under IDs.
    """
    docs = []
    try:
        for fname in os.listdir(settings.upload_dir):
            if fname.endswith(".pdf") and "_" in fname:
                parts = fname.split("_", 1)
                docs.append({
                    "document_id": parts[0],
                    "filename": parts[1]
                })
        return {"documents": docs}
    except Exception as e:
        logger.error(f"Failed listing files in uploads directory: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve files: " + str(e)
        )

@router.delete("/documents/{document_id}")
def delete_document(document_id: str):
    """
    Delete document embeddings from Chroma and wipe the physical PDF from disk.
    """
    logger.info(f"Targeting delete actions on ID: {document_id}")
    
    # 1. Clean Chroma vectors
    try:
        delete_document_from_store(document_id)
    except Exception as store_err:
        logger.warn(f"Failed deleting vectors from Chroma for {document_id}: {str(store_err)}")
        # Continue to attempt file deletion

    # 2. Clean local PDF file from disk
    file_pattern = os.path.join(settings.upload_dir, f"{document_id}_*.pdf")
    matched_files = glob.glob(file_pattern)
    
    deleted_files = []
    for filepath in matched_files:
        try:
            os.remove(filepath)
            deleted_files.append(os.path.basename(filepath))
            logger.info(f"Deleted PDF file: {filepath}")
        except Exception as e:
            logger.error(f"Failed to remove file {filepath}: {str(e)}")
            
    if not deleted_files and not matched_files:
        logger.warn(f"No physical files matched search pattern for ID: {document_id}")

    return {
        "status": "success",
        "message": f"Cleaned embeddings and deleted {len(deleted_files)} file(s) for ID {document_id}",
        "deleted_files": deleted_files
    }

@router.post("/documents/{document_id}/rebuild")
def rebuild_document(document_id: str):
    """
    Rebuild embeddings for a single selected document.
    """
    file_pattern = os.path.join(settings.upload_dir, f"{document_id}_*.pdf")
    matched_files = glob.glob(file_pattern)
    
    if not matched_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No PDF file found for document ID {document_id}"
        )
        
    file_path = matched_files[0]
    filename = os.path.basename(file_path).split("_", 1)[1]
    
    try:
        logger.info(f"Rebuilding embeddings for document {document_id} ({filename})")
        # 1. Delete existing vectors
        delete_document_from_store(document_id)
        
        # 2. Reload documentation text
        docs = load_document(file_path)
        
        # 3. Re-chunk
        chunks = chunk_documents(docs, chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap)
        
        # 4. Enrich metadata
        enriched_chunks = enrich_chunk_metadata(chunks, document_id, filename)
        
        # 5. Save back to ChromaDB
        add_documents_to_store(enriched_chunks)
        
        return {"status": "success", "message": f"Embeddings rebuilt successfully for {filename}"}
    except Exception as e:
        logger.error(f"Embedding single rebuild failed for {document_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rebuild failed: {str(e)}"
        )

@router.post("/documents/rebuild-all")
def rebuild_all_documents():
    """
    Rebuild embeddings for all uploaded documents.
    """
    logger.info("Rebuilding embeddings for all available upload files...")
    try:
        # 1. Reset vectorstore collection
        clear_all_vectors()
        
        rebuild_indices = 0
        for filename in os.listdir(settings.upload_dir):
            if filename.endswith(".pdf") and "_" in filename:
                parts = filename.split("_", 1)
                doc_id = parts[0]
                original_name = parts[1]
                file_path = os.path.join(settings.upload_dir, filename)
                
                logger.info(f"Processing re-load for: {file_path}")
                docs = load_document(file_path)
                chunks = chunk_documents(docs, chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap)
                enriched_chunks = enrich_chunk_metadata(chunks, doc_id, original_name)
                add_documents_to_store(enriched_chunks)
                rebuild_indices += 1
                
        return {
            "status": "success", 
            "message": f"Flushed vector store and rebuilt indices for {rebuild_indices} document(s)."
        }
    except Exception as e:
        logger.error(f"Global index rebuild failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Global rebuild failed: {str(e)}"
        )
