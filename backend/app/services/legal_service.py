import json
from loguru import logger
from app.rag.grok_client import get_grok_client
from app.rag.pipeline import get_rag_pipeline
from app.schemas.legal import (
    LegalRecommendationRequest, LegalRecommendationResponse,
    LegalSection, InvestigationStep, RAGSearchRequest, RAGSearchResponse, RAGSearchResult,
)
from app.core.exceptions import ServiceUnavailableException


class LegalService:
    def __init__(self):
        self.grok = get_grok_client()
        self.rag = get_rag_pipeline()

    async def recommend_legal_sections(self, request: LegalRecommendationRequest) -> LegalRecommendationResponse:
        context_chunks = self.rag.search_documents(request.case_description, top_k=8)
        context_text = "\n\n".join(c["content"] for c in context_chunks) if context_chunks else ""

        prompt_with_context = request.case_description
        if context_text:
            prompt_with_context = f"Relevant legal context:\n{context_text}\n\nCase description:\n{request.case_description}"

        raw_response = await self.grok.generate_legal_recommendation(prompt_with_context, request.language)

        try:
            json_start = raw_response.find("{")
            json_end = raw_response.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = raw_response[json_start:json_end]
                data = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")

            sections = [
                LegalSection(
                    section_number=s.get("section_number", "Unknown"),
                    act_name=s.get("act_name", "Unknown"),
                    title=s.get("title", ""),
                    description=s.get("description", ""),
                    relevance_score=float(s.get("relevance_score", 0.5)),
                    punishment=s.get("punishment"),
                )
                for s in data.get("recommended_sections", [])
            ]

            steps = [
                InvestigationStep(
                    step_number=s.get("step_number", i + 1),
                    action=s.get("action", ""),
                    description=s.get("description", ""),
                    responsible_authority=s.get("responsible_authority", ""),
                    time_frame=s.get("time_frame"),
                )
                for i, s in enumerate(data.get("investigation_procedure", []))
            ]

            return LegalRecommendationResponse(
                case_description=request.case_description,
                recommended_sections=sections,
                reasoning=data.get("reasoning", ""),
                investigation_procedure=steps,
                applicable_courts=data.get("applicable_courts", []),
                bail_eligibility=data.get("bail_eligibility"),
                language=request.language,
            )

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse legal recommendation JSON: {e}")
            return LegalRecommendationResponse(
                case_description=request.case_description,
                recommended_sections=[],
                reasoning=raw_response,
                investigation_procedure=[],
                applicable_courts=[],
                bail_eligibility=None,
                language=request.language,
            )

    async def rag_search(self, request: RAGSearchRequest) -> RAGSearchResponse:
        results = self.rag.search_documents(query=request.query, top_k=request.top_k)
        return RAGSearchResponse(
            query=request.query,
            results=[
                RAGSearchResult(
                    content=r["content"],
                    source=r.get("source", "Unknown"),
                    score=r.get("score", 0.0),
                    metadata={k: v for k, v in r.items() if k not in ("content", "source", "score")},
                )
                for r in results
            ],
            total_found=len(results),
        )
