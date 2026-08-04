"""Tests for the vector store module."""

from app.rag.vectorstore import create_vector_store


def test_create_vector_store_returns_dict():
    store = create_vector_store()
    assert isinstance(store, dict)
