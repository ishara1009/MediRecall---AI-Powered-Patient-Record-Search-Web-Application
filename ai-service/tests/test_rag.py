"""Tests for the RAG chain module."""

from app.rag.chain import build_chain


def test_build_chain_returns_placeholder():
    chain = build_chain()
    assert chain["status"] == "not_configured"
