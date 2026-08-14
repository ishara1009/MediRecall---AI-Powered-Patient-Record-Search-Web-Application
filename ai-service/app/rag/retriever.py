from typing import List
from langchain_core.documents import Document
from app.rag.vectorstore import get_vector_store
from app.utils.logger import logger
from app.rag.bm25 import get_bm25_index
from langchain_core.documents import Document as LC_Document

def retrieve_relevant_contexts(query: str, k: int = 5, patient_id: str = None, document_id: str = None) -> List[Document]:
    """
    Query ChromaDB for relevant research paper chunks based on user question.
    """
    try:
        logger.info(f"Retrieving top {k} relevant context chunks for query: '{query}'")
        vector_store = get_vector_store()
        
        # First: vector search
        if not patient_id:
            raise ValueError("A patient scope is required for clinical retrieval.")
        # The API verifies that an explicitly selected document belongs to the
        # patient. A document-only filter also supports trusted legacy indexes
        # created before patient_id was stored in chunk metadata.
        search_filter = {"document_id": document_id} if document_id else {"patient_id": patient_id}
        vector_results = vector_store.similarity_search(query, k=k, filter=search_filter)

        # Second: BM25 search
        bm25_results = []
        try:
            bm25_index = get_bm25_index()
            bm25_hits = bm25_index.query(query, top_k=k, document_id=document_id, patient_id=None if document_id else patient_id)
            for hit in bm25_hits:
                # Convert BM25 hit dicts into LangChain Document objects
                doc = LC_Document(page_content=hit.get('text', ''), metadata=hit.get('metadata', {}))
                bm25_results.append(doc)
        except Exception as be:
            logger.error(f"BM25 search failed: {str(be)}")

        # Merge results: prefer vector results first, append BM25 items not already included
        merged = []
        seen = set()

        def _doc_key(d: Document):
            # Use filename and page to deduplicate when possible
            fn = d.metadata.get('filename') if isinstance(d.metadata, dict) else None
            page = d.metadata.get('page') if isinstance(d.metadata, dict) else None
            doc_id = d.metadata.get('document_id') if isinstance(d.metadata, dict) else None
            return (doc_id, fn, page, getattr(d, 'page_content', None))

        for d in vector_results:
            key = _doc_key(d)
            if key not in seen:
                merged.append(d)
                seen.add(key)
            if len(merged) >= k:
                break

        if len(merged) < k:
            for d in bm25_results:
                key = _doc_key(d)
                if key not in seen:
                    merged.append(d)
                    seen.add(key)
                if len(merged) >= k:
                    break

        logger.info(f"Retrieved {len(merged)} merged chunks (vector: {len(vector_results)}, bm25: {len(bm25_results)})")
        return merged
    except Exception as e:
        logger.error(f"Error retrieving contexts: {str(e)}")
        raise e
