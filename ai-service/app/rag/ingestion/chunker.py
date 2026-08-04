from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.utils.logger import logger

def chunk_documents(
    documents: List[Document], 
    chunk_size: int = 1000, 
    chunk_overlap: int = 200
) -> List[Document]:
    """
    Split a list of documents (pages) into smaller, overlapping chunks.
    Ensures page numbers and source details are preserved in chunks.
    """
    try:
        logger.info(f"Chunking {len(documents)} document pages (chunk_size: {chunk_size}, overlap: {chunk_overlap})")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            add_start_index=True
        )
        chunks = splitter.split_documents(documents)
        logger.info(f"Successfully generated {len(chunks)} text chunks.")
        return chunks
    except Exception as e:
        logger.error(f"Error chunking documents: {str(e)}")
        raise e
