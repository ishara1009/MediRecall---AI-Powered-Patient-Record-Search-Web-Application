import os
import json
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
from app.config import settings


class BM25Index:
    """Simple BM25 index wrapper that persists a small JSON index for retrieval.

    Index format (JSON): list of objects with keys: `id`, `text`, `metadata`.
    """

    def __init__(self, index_filename: str = None):
        data_dir = os.path.join(str(settings.root_dir), "data")
        os.makedirs(data_dir, exist_ok=True)
        self.index_path = index_filename or os.path.join(data_dir, "bm25_index.json")
        self.docs: List[Dict[str, Any]] = []
        self.bm25 = None
        if os.path.exists(self.index_path):
            try:
                self.load()
            except Exception:
                self.docs = []

    def build(self, docs: List[Dict[str, Any]]):
        """Build an in-memory BM25 index from docs.

        Each doc should be a dict: {"id": str, "text": str, "metadata": {...}}
        """
        self.docs = docs or []
        tokenized = [self._tokenize(d.get("text", "")) for d in self.docs]
        if tokenized:
            self.bm25 = BM25Okapi(tokenized)
        else:
            self.bm25 = None

    def add_docs(self, docs: List[Dict[str, Any]]):
        """Append docs to index and rebuild the BM25 model."""
        self.docs.extend(docs)
        self.build(self.docs)
        self.save()

    def save(self):
        with open(self.index_path, "w", encoding="utf-8") as f:
            json.dump(self.docs, f, ensure_ascii=False)

    def load(self):
        with open(self.index_path, "r", encoding="utf-8") as f:
            self.docs = json.load(f)
        tokenized = [self._tokenize(d.get("text", "")) for d in self.docs]
        self.bm25 = BM25Okapi(tokenized) if tokenized else None

    def query(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Return top_k matching docs with BM25 scores."""
        if not self.bm25:
            return []
        tokens = self._tokenize(query)
        scores = self.bm25.get_scores(tokens)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]
        results = []
        for idx, score in ranked:
            doc = self.docs[idx]
            results.append({
                "id": doc.get("id"),
                "score": float(score),
                "text": doc.get("text"),
                "metadata": doc.get("metadata", {}),
            })
        return results

    def _tokenize(self, text: str) -> List[str]:
        # Lightweight tokenizer — split on whitespace. Replace with better tokenizer if needed.
        return text.lower().split()


# Convenience singleton for simple use across the app
_GLOBAL_BM25 = BM25Index()


def get_bm25_index() -> BM25Index:
    return _GLOBAL_BM25


def build_bm25_from_chunks(chunks: List[Dict[str, Any]]):
    """Helper to build and persist BM25 index from a list of chunk dicts."""
    idx = get_bm25_index()
    idx.build(chunks)
    idx.save()
