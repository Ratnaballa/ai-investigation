"""
User Repository
===============
All MongoDB queries for the 'users' collection live here.
Services never call the database directly — they go through this class.
"""
from typing import Optional, List
from .base_repository import BaseRepository


class UserRepository(BaseRepository):
    """Data-access layer for the ``users`` collection."""

    collection_name = "users"

    # ── Lookups ───────────────────────────────────────────────────────────────

    async def find_by_email(self, email: str) -> Optional[dict]:
        """Return the user document matching *email*, or ``None``."""
        return await self.find_one({"email": email.lower().strip()})

    async def find_active_by_id(self, user_id: str) -> Optional[dict]:
        """
        Return the user document for *user_id* only if the account is active.
        Returns ``None`` for deactivated accounts or unknown IDs.
        """
        doc = await self.find_by_id(user_id)
        if doc and not doc.get("is_active", True):
            return None
        return doc

    async def email_exists(self, email: str) -> bool:
        """Return True if any document has this email (case-insensitive)."""
        return await self.find_by_email(email) is not None

    # ── Token management ──────────────────────────────────────────────────────

    async def set_refresh_token(self, user_id: str, token: Optional[str]) -> None:
        """Store or clear the refresh token for *user_id*."""
        await self.update_by_id(user_id, {"refresh_token": token})

    async def find_by_refresh_token(self, token: str) -> Optional[dict]:
        """Return the user whose stored refresh token matches *token*."""
        return await self.find_one({"refresh_token": token})

    # ── Admin list / stats ────────────────────────────────────────────────────

    async def list_with_filters(
        self,
        page: int,
        page_size: int,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[dict], int]:
        """
        Return a paginated list of users and the total count.

        Parameters
        ----------
        page:       1-based page number
        page_size:  records per page
        role:       filter by UserRole value string (optional)
        is_active:  filter by active flag (optional)
        """
        query: dict = {}
        if role:
            query["role"] = role
        if is_active is not None:
            query["is_active"] = is_active

        skip = (page - 1) * page_size
        docs = await self.find_many(query, skip=skip, limit=page_size)
        total = await self.count(query)
        return docs, total

    async def get_role_stats(self) -> dict:
        """Return aggregate counts grouped by role plus total / active counts."""
        pipeline = [{"$group": {"_id": "$role", "count": {"$sum": 1}}}]
        role_counts = await self.aggregate(pipeline)
        total = await self.count({})
        active = await self.count({"is_active": True})
        return {
            "total_users": total,
            "active_users": active,
            "by_role": {r["_id"]: r["count"] for r in role_counts},
        }
