"""Tests for the chunker module."""

from app.rag.ingestion.chunker import chunk_text


def test_chunk_text_splits_text():
    text = "abcde"
    chunks = chunk_text(text, chunk_size=2)
    assert chunks == ["ab", "cd", "e"]
