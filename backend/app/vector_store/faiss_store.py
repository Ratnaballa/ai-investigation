import os
import pickle
from pathlib import Path
from typing import List, Tuple, Optional
import numpy as np
from loguru import logger
from app.config.settings import settings


class FAISSVectorStore:
    def __init__(self):
        self._index = None
        self._metadata: List[dict] = []
        self._embedder = None
        self._index_path = Path(settings.FAISS_INDEX_PATH)
        self._index_path.mkdir(parents=True, exist_ok=True)
        self._index_file = self._index_path / f"{settings.FAISS_INDEX_NAME}.index"
        self._meta_file = self._index_path / f"{settings.FAISS_INDEX_NAME}.meta"

    def _get_embedder(self):
        if self._embedder is None:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            self._embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
        return self._embedder

    def _get_index(self, dimension: int = 384):
        if self._index is None:
            import faiss
            if self._index_file.exists():
                import faiss
                self._index = faiss.read_index(str(self._index_file))
                if self._meta_file.exists():
                    with open(self._meta_file, "rb") as f:
                        self._metadata = pickle.load(f)
                logger.info(f"Loaded FAISS index with {self._index.ntotal} vectors")
            else:
                import faiss
                self._index = faiss.IndexFlatIP(dimension)
                logger.info("Created new FAISS index")
        return self._index

    def _save(self):
        import faiss
        faiss.write_index(self._index, str(self._index_file))
        with open(self._meta_file, "wb") as f:
            pickle.dump(self._metadata, f)

    def add_documents(self, chunks: List[dict]) -> int:
        if not chunks:
            return 0

        embedder = self._get_embedder()
        texts = [c["content"] for c in chunks]
        embeddings = embedder.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        embeddings = np.array(embeddings, dtype=np.float32)

        index = self._get_index(dimension=embeddings.shape[1])
        start_id = len(self._metadata)
        index.add(embeddings)
        self._metadata.extend(chunks)
        self._save()

        logger.info(f"Added {len(chunks)} chunks to FAISS index. Total: {index.ntotal}")
        return len(chunks)

    def search(self, query: str, top_k: int = 5, filter_source: Optional[str] = None) -> List[dict]:
        if self._index is None or self._get_index().ntotal == 0:
            return []

        embedder = self._get_embedder()
        query_embedding = embedder.encode([query], normalize_embeddings=True, show_progress_bar=False)
        query_embedding = np.array(query_embedding, dtype=np.float32)

        search_k = min(top_k * 3, self._get_index().ntotal)
        scores, indices = self._get_index().search(query_embedding, search_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            meta = self._metadata[idx].copy()
            meta["score"] = float(score)
            if filter_source and meta.get("source") != filter_source:
                continue
            results.append(meta)
            if len(results) >= top_k:
                break

        return results

    def delete_by_source(self, source: str) -> int:
        original_count = len(self._metadata)
        indices_to_keep = [i for i, m in enumerate(self._metadata) if m.get("source") != source]

        if len(indices_to_keep) == original_count:
            return 0

        import faiss
        embedder = self._get_embedder()
        kept_metadata = [self._metadata[i] for i in indices_to_keep]
        texts = [m["content"] for m in kept_metadata]

        dimension = 384
        self._index = faiss.IndexFlatIP(dimension)
        self._metadata = []

        if texts:
            embeddings = embedder.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            embeddings = np.array(embeddings, dtype=np.float32)
            self._index.add(embeddings)
            self._metadata = kept_metadata

        self._save()
        removed = original_count - len(kept_metadata)
        logger.info(f"Removed {removed} chunks for source: {source}")
        return removed

    @property
    def total_vectors(self) -> int:
        if self._index is None:
            self._get_index()
        return self._index.ntotal if self._index else 0


_vector_store: Optional[FAISSVectorStore] = None


def get_vector_store() -> FAISSVectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = FAISSVectorStore()
    return _vector_store
