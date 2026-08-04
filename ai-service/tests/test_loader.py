"""Tests for the loader module."""

from app.rag.ingestion.loader import load_document


def test_load_document_returns_mapping():
    result = load_document("demo.pdf")
    assert isinstance(result, dict)
    assert result["path"] == "demo.pdf"
