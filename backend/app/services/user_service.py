"""
User Service
============
Business logic for user profile management.

Responsibilities
----------------
- Fetch a user by ID or email
- Self-service profile update (limited fields)
- Admin profile update (all fields including role / active / verified)
- Paginated user listing with optional filters
- User deletion
- Aggregate statistics for the admin dashboard
"""
from typing import Optional, List

from loguru import logger

from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.schemas.user import UserUpdateRequest, AdminUserUpdateRequest


class UserService:
    """Handles all user-profile management operations."""

    def __init__(self) -> None:
        self._repo = UserRepository()

    # ── Lookups ───────────────────────────────────────────────────────────────

    async def get_by_id(self, user_id: str) -> User:
        """
        Return the User model for *user_id*.

        Raises
        ------
        NotFoundException   if no user exists with that ID.
        """
        doc = await self._repo.find_by_id(user_id)
        if not doc:
            raise NotFoundException("User")
        return User(**doc)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Return the User model for *email*, or ``None`` if not found."""
        doc = await self._repo.find_by_email(email)
        return User(**doc) if doc else None

    # ── Self-service update ───────────────────────────────────────────────────

    async def update(self, user_id: str, data: UserUpdateRequest) -> User:
        """
        Apply a partial update to the user's own profile.

        Only non-None fields in *data* are written to the database.
        Role, is_active, and is_verified cannot be changed here.
        """
        update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if update_fields:
            await self._repo.update_by_id(user_id, update_fields)
        return await self.get_by_id(user_id)

    # ── Admin update ──────────────────────────────────────────────────────────

    async def admin_update(self, user_id: str, data: AdminUserUpdateRequest) -> User:
        """
        Apply a partial update to any user's profile (admin-only).

        Includes role, is_active, and is_verified fields.
        """
        update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if update_fields:
            await self._repo.update_by_id(user_id, update_fields)
        return await self.get_by_id(user_id)

    # ── Listing ───────────────────────────────────────────────────────────────

    async def list_users(
        self,
        page: int = 1,
        page_size: int = 20,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[User], int]:
        """
        Return a paginated list of users and the total matching count.

        Parameters
        ----------
        page:       1-based page number
        page_size:  records per page (max 100)
        role:       optional role filter (UserRole value string)
        is_active:  optional active-flag filter
        """
        docs, total = await self._repo.list_with_filters(page, page_size, role, is_active)
        return [User(**d) for d in docs], total

    # ── Deletion ──────────────────────────────────────────────────────────────

    async def delete(self, user_id: str) -> None:
        """
        Permanently delete a user account.

        Raises
        ------
        NotFoundException   if no user exists with that ID.
        """
        if await self._repo.delete_by_id(user_id) == 0:
            raise NotFoundException("User")
        logger.info(f"[USER] Account deleted | user_id={user_id}")

    # ── Statistics ────────────────────────────────────────────────────────────

    async def get_stats(self) -> dict:
        """Return aggregate user counts for the admin dashboard."""
        return await self._repo.get_role_stats()
