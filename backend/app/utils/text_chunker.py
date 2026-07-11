from typing import List


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    separators = ["\n\n", "\n", ".", "!", "?", ",", " ", ""]
    chunks: List[str] = []

    def _split(t: str, seps: List[str]) -> List[str]:
        if not seps:
            return [t]
        sep = seps[0]
        parts = t.split(sep) if sep else list(t)
        merged, current = [], ""
        for part in parts:
            candidate = current + (sep if current else "") + part
            if len(candidate) <= chunk_size:
                current = candidate
            else:
                if current:
                    merged.append(current)
                current = part
        if current:
            merged.append(current)
        result = []
        for m in merged:
            if len(m) > chunk_size:
                result.extend(_split(m, seps[1:]))
            else:
                result.append(m)
        return result

    raw = _split(text, separators)

    i = 0
    while i < len(raw):
        chunk = raw[i]
        j = i + 1
        while j < len(raw) and len(chunk) + len(raw[j]) + 1 <= chunk_size:
            chunk += " " + raw[j]
            j += 1
        chunks.append(chunk.strip())
        # move forward but keep overlap
        overlap_len = 0
        i = j
        while i > 0 and overlap_len < chunk_overlap:
            i -= 1
            overlap_len += len(raw[i])
        if i == j:  # no progress guard
            i = j

    return [c for c in chunks if c]


def chunk_text_with_metadata(
    text: str, source: str, chunk_size: int = 1000, chunk_overlap: int = 200
) -> List[dict]:
    chunks = chunk_text(text, chunk_size, chunk_overlap)
    return [
        {"content": chunk, "source": source, "chunk_index": i, "total_chunks": len(chunks)}
        for i, chunk in enumerate(chunks)
    ]
