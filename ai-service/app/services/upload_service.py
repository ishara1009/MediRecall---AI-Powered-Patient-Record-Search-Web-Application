import os
from fastapi import UploadFile
from app.config import settings
from app.rag.ingestion.loader import load_document
from app.rag.ingestion.chunker import chunk_documents
from app.rag.ingestion.metadata import enrich_chunk_metadata
from app.rag.vectorstore import add_documents_to_store
from app.utils.logger import logger
from app.rag.bm25 import get_bm25_index

async def handle_upload(file: UploadFile, document_id: str, patient_id: str, document_type: str = "OTHER", record_date: str = "") -> dict:
    """
    Saves, parses, chunks, and indexes an uploaded PDF document.
    Returns:
        Dict: File statistics like filename, total_pages, file_size, and details.
    """
    filename = file.filename
    clean_filename = filename.replace(" ", "_")
    file_path = os.path.join(settings.upload_dir, f"{document_id}_{clean_filename}")

    try:
        logger.info(f"Saving upload stream to disk at: {file_path}")
        
        # 1. Save uploaded file to disk
        file_size = 0
        with open(file_path, "wb") as f:
            while content := await file.read(1024 * 1024):  # Read in 1MB chunks
                f.write(content)
                file_size += len(content)

        logger.info(f"File saved. Size: {file_size} bytes. Initializing parsing...")

        # 2. Load PDF using PyMuPDF
        pages = load_document(file_path)
        total_pages = len(pages)

        # 3. Chunk text pages
        chunks = chunk_documents(pages, chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap)

        # 4. Enrich chunk metadata with document_id and pagination
        enriched_chunks = enrich_chunk_metadata(chunks, document_id, filename, patient_id, document_type, record_date)

        # 4b. Prepare and persist BM25 index entries (text + metadata)
        try:
            bm25_docs = []
            for idx, chunk in enumerate(enriched_chunks):
                # Create a unique id for each chunk
                chunk_id = f"{document_id}_chunk_{idx}"
                bm25_docs.append({
                    "id": chunk_id,
                    "text": getattr(chunk, 'page_content', '') or getattr(chunk, 'content', ''),
                    "metadata": chunk.metadata
                })

            if bm25_docs:
                bm25_index = get_bm25_index()
                bm25_index.add_docs(bm25_docs)
                logger.info(f"BM25 index updated with {len(bm25_docs)} chunks for {document_id}")
        except Exception as e:
            logger.error(f"Failed to update BM25 index for {document_id}: {str(e)}")

        # 5. Store embeddings into ChromaDB
        add_documents_to_store(enriched_chunks)

        logger.info(f"Ingested document {filename} (Pages: {total_pages}) under ID: {document_id}")

        return {
            "document_id": document_id,
            "filename": filename,
            "total_pages": total_pages,
            "file_size": file_size,
            "status": "success",
            "extraction_method": "TEXT"
        }
        
    except Exception as e:
        logger.error(f"Failed handling upload for {filename}: {str(e)}")
        # Clean up file on disk if ingestion failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e
