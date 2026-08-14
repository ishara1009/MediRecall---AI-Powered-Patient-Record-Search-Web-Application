from app.rag.retriever import retrieve_relevant_contexts
from app.rag.chain import get_rag_chain
from app.utils.logger import logger

def query_rag_pipeline(question: str, patient_id: str, document_id: str = None) -> dict:
    """
    Search related chunks inside ChromaDB vector store, execute RAG Chain, 
    and output structured citations and answers.
    """
    try:
        logger.info(f"RAG query triggered for: '{question}'")
        
        # 1. Retrieve matching contexts
        # Retrieve top 5 matching blocks
        retrieved_docs = retrieve_relevant_contexts(question, k=5, patient_id=patient_id, document_id=document_id)
        
        if not retrieved_docs:
            logger.info("No documents found in vectorstore. Custom fallback triggered.")
            return {
                "question": question,
                "answer": "I could not find enough information in the selected patient records.",
                "confidence_score": 0.0,
                "sources": [],
                "context_references": []
            }

        # 2. Extract context text blocks and unique source pages
        context_blocks = []
        sources_list = []
        seen_citations = set()
        
        for doc in retrieved_docs:
            context_blocks.append(doc.page_content)
            # Extract metadata details
            filename = doc.metadata.get("filename", "Unknown")
            page_num = doc.metadata.get("page", 1)
            
            citation_key = f"{filename}-p{page_num}"
            if citation_key not in seen_citations:
                seen_citations.add(citation_key)
                sources_list.append({
                    "document_id": doc.metadata.get("document_id"),
                    "filename": filename,
                    "page": page_num
                })

        # Format context segments with clear labels
        formatted_context = "\n\n".join([
            f"--- Reference from {doc.metadata.get('filename', 'Unknown')} (Page {doc.metadata.get('page', 1)}) ---\n{doc.page_content}"
            for doc in retrieved_docs
        ])

        # 3. Call structured RAG prompt chain
        chain = get_rag_chain()
        chain_response = chain.invoke({
            "context": formatted_context,
            "question": question
        })

        logger.info(f"RAG LLM output: Answer generated (Confidence: {chain_response.confidence_score}%)")

        answer_text = chain_response.answer
        confidence_val = chain_response.confidence_score
        evidence_coverage = "Strong" if confidence_val >= 75 else "Moderate" if confidence_val >= 40 else "Limited"

        # Check if fallback triggered by prompt instructions
        if "I could not find enough information" in answer_text:
            # Override sources & confidence if fallback answer matches
            sources_list = []
            confidence_val = 0.0
            evidence_coverage = "Insufficient"

        return {
            "question": question,
            "answer": answer_text,
            "confidence_score": confidence_val,
            "evidence_coverage": evidence_coverage,
            "retrieved_sources": len(retrieved_docs),
            "documents_used": len({doc.metadata.get('document_id') for doc in retrieved_docs}),
            "sources": sources_list,
            "context_references": context_blocks if document_id else []
        }

    except Exception as e:
        logger.error(f"Error querying RAG pipeline: {str(e)}")
        raise e
