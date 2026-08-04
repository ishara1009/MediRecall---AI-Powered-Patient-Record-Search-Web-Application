"""Tests for the embedding module."""

from app.rag.embeddings import get_embedding


def test_get_embedding_returns_vector():
    embedding = get_embedding("hello")
    assert isinstance(embedding, list)
    assert len(embedding) == 3
