from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from app.config import settings
from app.rag.prompts import get_rag_prompt
from app.utils.logger import logger

class LLMAnswer(BaseModel):
    answer: str = Field(
        ..., 
        description="The answer derived strictly from the context. Fallback to exactly: 'I could not find enough information inside the uploaded research papers.' if evidence is not available."
    )
    confidence_score: float = Field(
        ..., 
        description="Confidence score between 0.0 and 100.0 verifying support of context source matching."
    )

def get_rag_chain():
    """
    Construct the RAG execution chain with JSON structured output.
    """
    try:
        logger.info("Initializing ChatOpenAI and binding LLM structured output...")
        llm = ChatOpenAI(
            model=settings.llm_model,
            openai_api_key=settings.openai_api_key,
            temperature=0.0
        )
        
        # Bind the Pydantic response formatter schema to LLM
        structured_llm = llm.with_structured_output(LLMAnswer)
        
        # Link pipeline: prompt template | model
        chain = get_rag_prompt() | structured_llm
        return chain
    except Exception as e:
        logger.error(f"Error configuring RAG chain: {str(e)}")
        raise e
