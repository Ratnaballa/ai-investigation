from typing import List, Tuple
from loguru import logger
from app.vector_store.faiss_store import get_vector_store
from app.rag.grok_client import get_grok_client

LEGAL_ASSISTANT_SYSTEM_PROMPT = """You are an AI-powered legal investigation assistant for law enforcement and legal professionals.

Your capabilities:
- Answer questions about Indian law, IPC, CrPC, Evidence Act, and other legislation
- Explain investigation procedures and legal processes
- Help analyze cases and recommend applicable legal sections
- Assist police officers, investigation officers, lawyers, and the public

Guidelines:
- Always base answers on the provided legal context
- Be precise, professional, and factual
- Cite specific sections and acts when relevant
- If information is not in the context, clearly state that
- Never provide advice that could harm ongoing investigations
- Maintain confidentiality and professional ethics"""


class RAGPipeline:
    def __init__(self):
        self.vector_store = get_vector_store()
        self.grok = get_grok_client()

    async def query(
        self,
        user_message: str,
        top_k: int = 5,
        language: str = "en",
        document_type_filter: str = None,
    ) -> Tuple[str, List[dict], List[str]]:
        context_chunks = self.vector_store.search(
            query=user_message,
            top_k=top_k,
            filter_source=document_type_filter,
        )

        if not context_chunks:
            logger.warning("No RAG context found, using direct LLM response")
            messages = [
                {"role": "system", "content": LEGAL_ASSISTANT_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ]
            response = await self.grok.chat(messages)
            return response, [], []

        response, sources = await self.grok.chat_with_rag(
            user_message=user_message,
            context_chunks=context_chunks,
            system_prompt=LEGAL_ASSISTANT_SYSTEM_PROMPT,
            language=language,
        )

        return response, context_chunks, sources

    def search_documents(self, query: str, top_k: int = 5) -> List[dict]:
        return self.vector_store.search(query=query, top_k=top_k)


_rag_pipeline = None


def get_rag_pipeline() -> RAGPipeline:
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline()
    return _rag_pipeline
