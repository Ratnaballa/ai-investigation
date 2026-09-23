from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from loguru import logger
from app.repositories.graph_repository import (
    GraphNodeRepository, GraphRelationshipRepository, InvestigationGraphRepository
)
from app.repositories.case_repository import CaseRepository, EvidenceRepository
from app.services.investigation_graph_ai_service import get_investigation_graph_ai_service
from app.models.graph import GraphNode, GraphRelationship, InvestigationGraph
from app.schemas.graph import (
    GraphNodeCreateRequest, GraphNodeUpdateRequest, GraphRelationshipCreateRequest,
    GraphDataResponse, GraphNodeResponse, GraphRelationshipResponse,
    TimelineEventResponse, GraphStatistics, CompletenessScoreBreakdown,
)
from app.core.exceptions import NotFoundException, BadRequestException
from app.utils.file_handler import save_upload_file, validate_file, extract_text_from_file


class GraphService:
    def __init__(self):
        self.node_repo = GraphNodeRepository()
        self.rel_repo = GraphRelationshipRepository()
        self.inv_graph_repo = InvestigationGraphRepository()
        self.case_repo = CaseRepository()
        self.evidence_repo = EvidenceRepository()
        self.ai_service = get_investigation_graph_ai_service()

    async def generate_ai_graph(self, case_id: str, created_by: str) -> GraphDataResponse:
        """
        Reanalyzes case description & evidence using Grok AI, rebuilds nodes, relationships,
        timeline, statistics, and completeness score, and persists to MongoDB.
        """
        case_doc = await self.case_repo.find_by_id(case_id)
        if not case_doc:
            raise NotFoundException("Case")

        evidence_docs = await self.evidence_repo.find_by_case(case_id)

        ai_result = await self.ai_service.extract_graph_from_case(
            case_title=case_doc.get("title", f"Case #{case_doc.get('case_number', case_id)}"),
            case_description=case_doc.get("description", ""),
            evidence_list=evidence_docs,
        )

        # Clear existing individual nodes & relationships for this case
        await self.node_repo.delete_by_case(case_id)
        await self.rel_repo.delete_by_case(case_id)
        await self.inv_graph_repo.delete_by_case(case_id)

        # Insert new nodes
        node_id_mapping = {}
        node_responses = []

        for n in ai_result.get("nodes", []):
            node_data = {
                "case_id": case_id,
                "node_type": n["node_type"],
                "label": n["label"],
                "description": n.get("description", ""),
                "importance": n.get("importance", "Medium"),
                "status": n.get("status", "Active"),
                "evidence_count": n.get("evidence_count", 0),
                "properties": n.get("properties", {}),
                "created_by": created_by,
            }
            inserted = await self.node_repo.insert_one(node_data)
            db_id = str(inserted["_id"])
            node_id_mapping[n["id"]] = db_id

            node_responses.append(
                GraphNodeResponse(
                    id=db_id,
                    case_id=case_id,
                    node_type=n["node_type"],
                    label=n["label"],
                    description=n.get("description", ""),
                    importance=n.get("importance", "Medium"),
                    status=n.get("status", "Active"),
                    evidence_count=n.get("evidence_count", 0),
                    properties=n.get("properties", {}),
                    created_by=created_by,
                    created_at=inserted.get("created_at") or datetime.now(timezone.utc),
                )
            )

        # Insert new relationships
        edge_responses = []

        for e in ai_result.get("edges", []):
            s_db = node_id_mapping.get(e["source"])
            t_db = node_id_mapping.get(e["target"])

            if s_db and t_db:
                rel_data = {
                    "case_id": case_id,
                    "source_id": s_db,
                    "target_id": t_db,
                    "relationship_type": e.get("relationship_type", "linked_to"),
                    "label": e.get("label", "linked to"),
                    "weight": e.get("weight", 1.0),
                    "properties": e.get("properties", {}),
                    "created_by": created_by,
                }
                inserted_rel = await self.rel_repo.insert_one(rel_data)
                edge_responses.append(
                    GraphRelationshipResponse(
                        id=str(inserted_rel["_id"]),
                        case_id=case_id,
                        source_id=s_db,
                        target_id=t_db,
                        relationship_type=e.get("relationship_type", "linked_to"),
                        label=e.get("label", "linked to"),
                        weight=e.get("weight", 1.0),
                        properties=e.get("properties", {}),
                        created_by=created_by,
                        created_at=inserted_rel.get("created_at") or datetime.now(timezone.utc),
                    )
                )

        timeline_responses = [
            TimelineEventResponse(
                id=t.get("id"),
                date=t.get("date", "Today"),
                title=t.get("title", ""),
                description=t.get("description", ""),
                category=t.get("category", "General"),
            )
            for t in ai_result.get("timeline", [])
        ]

        statistics = self._compute_statistics(node_responses, edge_responses)
        score = ai_result.get("investigation_score", 70)
        breakdown = CompletenessScoreBreakdown(**ai_result.get("score_breakdown", {}))

        # Persist full case snapshot
        inv_doc = {
            "case_id": case_id,
            "nodes": [n.model_dump() for n in node_responses],
            "edges": [e.model_dump() for e in edge_responses],
            "timeline": [t.model_dump() for t in timeline_responses],
            "statistics": statistics.model_dump(),
            "investigation_score": score,
            "score_breakdown": breakdown.model_dump(),
            "created_by": created_by,
        }
        await self.inv_graph_repo.insert_one(inv_doc)

        logger.info(f"AI graph generated & persisted for case: {case_id}")
        return GraphDataResponse(
            case_id=case_id,
            nodes=node_responses,
            edges=edge_responses,
            node_count=len(node_responses),
            edge_count=len(edge_responses),
            timeline=timeline_responses,
            statistics=statistics,
            investigation_score=score,
            score_breakdown=breakdown,
        )

    async def get_case_graph(self, case_id: str) -> GraphDataResponse:
        """
        Retrieves the case graph from MongoDB. If no graph exists, auto-generates one.
        """
        snapshot = await self.inv_graph_repo.find_by_case(case_id)
        if snapshot:
            nodes = [
                GraphNodeResponse(
                    id=n.get("id"),
                    case_id=case_id,
                    node_type=n.get("node_type", "evidence"),
                    label=n.get("label", ""),
                    description=n.get("description"),
                    importance=n.get("importance", "Medium"),
                    status=n.get("status", "Active"),
                    evidence_count=n.get("evidence_count", 0),
                    properties=n.get("properties", {}),
                    created_by=n.get("created_by", "system"),
                    created_at=n.get("created_at"),
                )
                for n in snapshot.get("nodes", [])
            ]
            edges = [
                GraphRelationshipResponse(
                    id=e.get("id"),
                    case_id=case_id,
                    source_id=e.get("source_id", ""),
                    target_id=e.get("target_id", ""),
                    relationship_type=e.get("relationship_type", "linked_to"),
                    label=e.get("label"),
                    weight=e.get("weight", 1.0),
                    properties=e.get("properties", {}),
                    created_by=e.get("created_by", "system"),
                    created_at=e.get("created_at"),
                )
                for e in snapshot.get("edges", [])
            ]
            timeline = [
                TimelineEventResponse(**t) for t in snapshot.get("timeline", [])
            ]
            statistics = GraphStatistics(**snapshot.get("statistics", {}))
            score = snapshot.get("investigation_score", 70)
            breakdown = CompletenessScoreBreakdown(**snapshot.get("score_breakdown", {}))

            return GraphDataResponse(
                case_id=case_id,
                nodes=nodes,
                edges=edges,
                node_count=len(nodes),
                edge_count=len(edges),
                timeline=timeline,
                statistics=statistics,
                investigation_score=score,
                score_breakdown=breakdown,
            )

        # Fallback: check individual nodes or trigger AI generation
        nodes_docs = await self.node_repo.find_by_case(case_id)
        if nodes_docs:
            rels_docs = await self.rel_repo.find_by_case(case_id)
            nodes = [
                GraphNodeResponse(
                    id=str(n["_id"]),
                    case_id=n["case_id"],
                    node_type=n.get("node_type", "evidence"),
                    label=n["label"],
                    description=n.get("description"),
                    importance=n.get("importance", "Medium"),
                    status=n.get("status", "Active"),
                    evidence_count=n.get("evidence_count", 0),
                    properties=n.get("properties", {}),
                    created_by=n.get("created_by", "system"),
                    created_at=n.get("created_at"),
                )
                for n in nodes_docs
            ]
            edges = [
                GraphRelationshipResponse(
                    id=str(r["_id"]),
                    case_id=r["case_id"],
                    source_id=r["source_id"],
                    target_id=r["target_id"],
                    relationship_type=r.get("relationship_type", "linked_to"),
                    label=r.get("label"),
                    weight=r.get("weight", 1.0),
                    properties=r.get("properties", {}),
                    created_by=r.get("created_by", "system"),
                    created_at=r.get("created_at"),
                )
                for r in rels_docs
            ]
            statistics = self._compute_statistics(nodes, edges)
            return GraphDataResponse(
                case_id=case_id,
                nodes=nodes,
                edges=edges,
                node_count=len(nodes),
                edge_count=len(edges),
                timeline=[],
                statistics=statistics,
                investigation_score=65,
                score_breakdown=CompletenessScoreBreakdown(
                    evidence_availability=15, witness_statements=10, suspect_identification=15,
                    forensic_reports=10, digital_evidence=10, financial_records=5
                ),
            )

        # Auto-generate for new cases
        return await self.generate_ai_graph(case_id, "system")

    async def process_evidence_upload(
        self, case_id: str, file_content: bytes, filename: str, user_id: str
    ) -> GraphDataResponse:
        """
        Handles file uploads (PDF, DOCX, Image), extracts text & metadata,
        creates an evidence node, links to case/suspect, and updates the graph snapshot in MongoDB.
        """
        validate_file(filename, len(file_content))
        file_path, saved_name = await save_upload_file(file_content, filename, subfolder="evidence_files")

        extracted_text = ""
        try:
            extracted_text = extract_text_from_file(file_path)
        except Exception as e:
            logger.warning(f"Text extraction failed for {filename}: {e}")

        # Add evidence item to Case Evidence Repository
        evidence_doc = await self.evidence_repo.insert_one({
            "case_id": case_id,
            "title": filename,
            "description": f"Uploaded File Evidence ({len(file_content)} bytes). Preview: {extracted_text[:200]}",
            "evidence_type": "digital" if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.docx', '.pdf')) else "physical",
            "file_path": file_path,
            "file_name": saved_name,
            "collected_by": user_id,
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "location_found": "File Upload Portal",
            "chain_of_custody": [{"action": "uploaded", "by": user_id, "at": datetime.now(timezone.utc).isoformat()}],
            "tags": ["uploaded_evidence"],
            "is_verified": True,
        })

        # Regenerate graph with new evidence context included
        return await self.generate_ai_graph(case_id, user_id)

    async def add_node(self, data: GraphNodeCreateRequest, created_by: str) -> GraphNodeResponse:
        doc = await self.node_repo.insert_one({**data.model_dump(), "created_by": created_by})
        logger.info(f"Graph node added: {data.label} ({data.node_type}) for case {data.case_id}")

        res = GraphNodeResponse(
            id=str(doc["_id"]),
            case_id=doc["case_id"],
            node_type=doc["node_type"],
            label=doc["label"],
            description=doc.get("description"),
            importance=doc.get("importance", "Medium"),
            status=doc.get("status", "Active"),
            evidence_count=doc.get("evidence_count", 0),
            properties=doc.get("properties", {}),
            created_by=created_by,
            created_at=doc.get("created_at") or datetime.now(timezone.utc),
        )
        await self._sync_case_snapshot(data.case_id)
        return res

    async def update_node(self, node_id: str, data: GraphNodeUpdateRequest) -> GraphNodeResponse:
        node_doc = await self.node_repo.find_by_id(node_id)
        if not node_doc:
            raise NotFoundException("Graph node")

        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        await self.node_repo.update_by_id(node_id, update_dict)
        updated = await self.node_repo.find_by_id(node_id)

        res = GraphNodeResponse(
            id=str(updated["_id"]),
            case_id=updated["case_id"],
            node_type=updated["node_type"],
            label=updated["label"],
            description=updated.get("description"),
            importance=updated.get("importance", "Medium"),
            status=updated.get("status", "Active"),
            evidence_count=updated.get("evidence_count", 0),
            properties=updated.get("properties", {}),
            created_by=updated.get("created_by", "system"),
            created_at=updated.get("created_at"),
        )
        await self._sync_case_snapshot(updated["case_id"])
        return res

    async def add_relationship(self, data: GraphRelationshipCreateRequest, created_by: str) -> GraphRelationshipResponse:
        doc = await self.rel_repo.insert_one({**data.model_dump(), "created_by": created_by})
        res = GraphRelationshipResponse(
            id=str(doc["_id"]),
            case_id=doc["case_id"],
            source_id=doc["source_id"],
            target_id=doc["target_id"],
            relationship_type=doc["relationship_type"],
            label=doc.get("label"),
            weight=doc.get("weight", 1.0),
            properties=doc.get("properties", {}),
            created_by=created_by,
            created_at=doc.get("created_at") or datetime.now(timezone.utc),
        )
        await self._sync_case_snapshot(data.case_id)
        return res

    async def delete_node(self, node_id: str):
        node = await self.node_repo.find_by_id(node_id)
        if not node:
            raise NotFoundException("Graph node")
        case_id = node["case_id"]
        await self.node_repo.delete_by_id(node_id)
        await self.rel_repo.delete_by_node(node_id)
        await self._sync_case_snapshot(case_id)

    async def delete_relationship(self, rel_id: str):
        rel = await self.rel_repo.find_by_id(rel_id)
        if not rel:
            raise NotFoundException("Graph relationship")
        case_id = rel["case_id"]
        await self.rel_repo.delete_by_id(rel_id)
        await self._sync_case_snapshot(case_id)

    async def _sync_case_snapshot(self, case_id: str):
        """Updates the persistent case graph snapshot in MongoDB after manual edits."""
        nodes_docs = await self.node_repo.find_by_case(case_id)
        rels_docs = await self.rel_repo.find_by_case(case_id)
        snapshot = await self.inv_graph_repo.find_by_case(case_id) or {}

        nodes = [
            GraphNodeResponse(
                id=str(n["_id"]), case_id=case_id, node_type=n.get("node_type", "evidence"),
                label=n["label"], description=n.get("description"),
                importance=n.get("importance", "Medium"), status=n.get("status", "Active"),
                evidence_count=n.get("evidence_count", 0), properties=n.get("properties", {}),
                created_by=n.get("created_by", "system"), created_at=n.get("created_at"),
            ).model_dump()
            for n in nodes_docs
        ]
        edges = [
            GraphRelationshipResponse(
                id=str(r["_id"]), case_id=case_id, source_id=r["source_id"],
                target_id=r["target_id"], relationship_type=r.get("relationship_type", "linked_to"),
                label=r.get("label"), weight=r.get("weight", 1.0),
                properties=r.get("properties", {}), created_by=r.get("created_by", "system"),
                created_at=r.get("created_at"),
            ).model_dump()
            for r in rels_docs
        ]

        stats = self._compute_statistics(
            [GraphNodeResponse(**n) for n in nodes],
            [GraphRelationshipResponse(**e) for e in edges]
        ).model_dump()

        await self.inv_graph_repo.delete_by_case(case_id)
        await self.inv_graph_repo.insert_one({
            "case_id": case_id,
            "nodes": nodes,
            "edges": edges,
            "timeline": snapshot.get("timeline", []),
            "statistics": stats,
            "investigation_score": snapshot.get("investigation_score", 70),
            "score_breakdown": snapshot.get("score_breakdown", {}),
            "created_by": "system",
        })

    def _compute_statistics(self, nodes: List[GraphNodeResponse], edges: List[GraphRelationshipResponse]) -> GraphStatistics:
        return GraphStatistics(
            total_nodes=len(nodes),
            total_relationships=len(edges),
            suspects_identified=sum(1 for n in nodes if str(n.node_type).lower() == "suspect"),
            victims_identified=sum(1 for n in nodes if str(n.node_type).lower() == "victim"),
            evidence_collected=sum(1 for n in nodes if str(n.node_type).lower() == "evidence"),
            witnesses_recorded=sum(1 for n in nodes if str(n.node_type).lower() == "witness"),
            locations_tracked=sum(1 for n in nodes if str(n.node_type).lower() == "location"),
            devices_tracked=sum(1 for n in nodes if str(n.node_type).lower() == "device"),
            transactions_tracked=sum(1 for n in nodes if str(n.node_type).lower() == "transaction"),
        )

