from langchain_community.document_loaders import PyMuPDFLoader
from app.utils.logger import logger

def load_document(file_path: str):
    """
    Load pages of a PDF document from disk using PyMuPDF.
    Returns:
        List[Document]: List of LangChain Document objects, each representing a page.
    """
    try:
        logger.info(f"Loading document via PyMuPDFLoader: {file_path}")
        loader = PyMuPDFLoader(file_path)
        documents = loader.load()
        logger.info(f"Successfully loaded {len(documents)} pages from {file_path}")
        return documents
    except Exception as e:
        logger.error(f"Error loading document {file_path}: {str(e)}")
        raise e
