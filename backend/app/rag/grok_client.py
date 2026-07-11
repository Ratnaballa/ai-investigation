
from typing import List, Optional
from groq import AsyncGroq
from loguru import logger
from app.config.settings import settings


class GrokClient:
    def __init__(self):
        self._client: Optional[AsyncGroq] = None

    def _get_client(self) -> AsyncGroq:
        if self._client is None:
            self._client = AsyncGroq(api_key=settings.GROK_API_KEY)
        return self._client

    async def chat(
        self,
        messages: List[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=settings.GROK_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise

    async def chat_with_rag(
        self,
        user_message: str,
        context_chunks: List[dict],
        system_prompt: str,
        language: str = "en",
    ) -> tuple[str, List[str]]:
        context_text = "\n\n---\n\n".join(
            f"Source: {c.get('source', 'Unknown')}\n{c['content']}"
            for c in context_chunks
        )
        sources = list({c.get("source", "Unknown") for c in context_chunks})
        lang_instruction = f"Respond in {language} language." if language != "en" else ""

        messages = [
            {"role": "system", "content": f"{system_prompt}\n\n{lang_instruction}"},
            {
                "role": "user",
                "content": (
                    f"Context from legal documents:\n\n{context_text}\n\n"
                    f"---\n\nQuestion: {user_message}"
                ),
            },
        ]

        response = await self.chat(messages)
        return response, sources

    async def analyze_legal_query(self, query: str, language: str = "en") -> str:
        """
        Send a legal query and return a raw JSON string matching LegalChatResponse schema.
        No markdown fences, no extra text.
        """
        lang_instruction = (
            f"Respond entirely in {language} language."
            if language != "en"
            else "Respond in English."
        )

        system_prompt = (
            "You are a senior legal expert and investigation advisor specialising in "
            "Indian criminal law, including the Bharatiya Nyaya Sanhita (BNS) 2023, "
            "Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Bharatiya Sakshya Adhiniyam "
            "(BSA) 2023, and legacy IPC / CrPC / Evidence Act provisions.\n\n"
            "Your role is to assist police officers, investigation officers, lawyers, "
            "and judicial staff with accurate, professional legal analysis.\n\n"
            "STRICT OUTPUT RULES:\n"
            "1. Respond ONLY with a single valid JSON object — no markdown, no code fences, "
            "no explanatory text before or after the JSON.\n"
            "2. The JSON must have exactly these keys:\n"
            "   - case_summary        : string — concise summary of the legal situation\n"
            "   - recommended_bns_sections : array of objects, each with:\n"
            "       section (string), title (string), description (string), "
            "punishment (string), relevance (string)\n"
            "   - investigation_procedure : array of objects, each with:\n"
            "       step (integer), action (string), responsible (string), time_frame (string)\n"
            "   - required_evidence   : array of strings\n"
            "   - legal_precautions   : array of strings\n"
            "   - sources             : empty array []\n"
            "3. Cite BNS sections first; fall back to IPC only when BNS has no equivalent.\n"
            "4. Be precise, factual, and professional. Do not speculate.\n"
            f"5. {lang_instruction}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ]

        logger.info(f"[GROQ] Sending legal analysis request | query_length={len(query)}")
        return await self.chat(messages, temperature=0.2, max_tokens=3000)

    async def generate_legal_recommendation(
        self, case_description: str, language: str = "en"
    ) -> str:
        """
        Used by LegalService. Returns a raw JSON string with recommended_sections,
        reasoning, investigation_procedure, applicable_courts, bail_eligibility.
        """
        lang_instruction = f"Respond in {language} language." if language != "en" else ""

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert legal AI assistant specializing in Indian law. "
                    "Analyze case descriptions and provide detailed legal section recommendations. "
                    "Respond ONLY with a single valid JSON object — no markdown, no code fences. "
                    f"{lang_instruction}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Analyze this case and provide legal recommendations:\n\n{case_description}\n\n"
                    "Return a JSON object with:\n"
                    "- recommended_sections: array of {section_number, act_name, title, description, relevance_score, punishment}\n"
                    "- reasoning: string explaining why these sections apply\n"
                    "- investigation_procedure: array of {step_number, action, description, responsible_authority, time_frame}\n"
                    "- applicable_courts: array of court names\n"
                    "- bail_eligibility: string (bailable/non-bailable/depends)"
                ),
            },
        ]

        logger.info(f"[GROQ] Sending legal recommendation request | length={len(case_description)}")
        return await self.chat(messages, temperature=0.3, max_tokens=3000)


_grok_client: Optional[GrokClient] = None


def get_grok_client() -> GrokClient:
    global _grok_client
    if _grok_client is None:
        _grok_client = GrokClient()
    return _grok_client
