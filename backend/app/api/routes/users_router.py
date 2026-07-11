"""
Users Router
============
Handles all user-management HTTP endpoints.

Endpoints
---------
GET  /api/v1/users/me             — get own profile (any authenticated user)
PUT  /api/v1/users/me             — update own profile (any authenticated user)
GET  /api/v1/users                — list all users with filters (Admin only)
GET  /api/v1/users/{user_id}      — get any user by ID (Admin only)
PUT  /api/v1/users/{user_id}      — update any user (Admin only)
DELETE /api/v1/users/{user_id}    — delete a user (Admin only)

Role enforcement is applied via FastAPI dependencies — no role checks inside
handler functions.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.schemas.user import (
    UserResponse,
    UserUpdateRequest,
    AdminUserUpdateRequest,
    UserListResponse,
)
from app.schemas.common import SuccessResponse
from app.api.auth.dependencies import get_current_user, require_admin
from app.dependencies import get_user_service
from app.services.user_service import UserService
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _user_to_response(user: User) -> UserResponse:
    """Map a User model to the public-safe UserResponse schema."""
    return UserResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        badge_number=user.badge_number,
        department=user.department,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        preferred_language=user.preferred_language,
        created_at=user.created_at,
    )


def _dict_to_response(user: dict) -> UserResponse:
    """Map a raw MongoDB user dict to the public-safe UserResponse schema."""
    return UserResponse(
        id=user.get("_id") or user.get("id"),
        full_name=user["full_name"],
        email=user["email"],
        role=user["role"],
        badge_number=user.get("badge_number"),
        department=user.get("department"),
        phone=user.get("phone"),
        is_active=user["is_active"],
        is_verified=user.get("is_verified", False),
        preferred_language=user.get("preferred_language", "en"),
        created_at=user["created_at"],
    )


# ── Self-service endpoints (any authenticated user) ───────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get my profile",
    description=(
        "Return the profile of the currently authenticated user. "
        "Sensitive fields (hashed_password, refresh_token) are never included."
    ),
    responses={
        200: {"description": "Profile returned successfully"},
        401: {"description": "Missing or invalid access token"},
    },
)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
):
    return _dict_to_response(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update my profile",
    description=(
        "Update the currently authenticated user's own profile. "
        "Only `full_name`, `phone`, `department`, `badge_number`, and "
        "`preferred_language` can be changed here. "
        "To change role, is_active, or is_verified — use the Admin endpoint."
    ),
    responses={
        200: {"description": "Profile updated successfully"},
        401: {"description": "Missing or invalid access token"},
        422: {"description": "Validation error in request body"},
    },
)
async def update_my_profile(
    data: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    updated = await service.update(current_user["_id"], data)
    return _user_to_response(updated)


# ── Admin-only endpoints ──────────────────────────────────────────────────────

@router.get(
    "",
    response_model=UserListResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
    summary="List all users (Admin only)",
    description=(
        "Return a paginated list of all user accounts. "
        "Supports optional filtering by `role` and `is_active`. "
        "**Requires Admin role.**"
    ),
    responses={
        200: {"description": "Paginated user list"},
        401: {"description": "Missing or invalid access token"},
        403: {"description": "Insufficient permissions — Admin role required"},
    },
)
async def list_users(
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Records per page"),
    role: Optional[str] = Query(
        default=None,
        description="Filter by role: admin | police_officer | investigation_officer | lawyer | public",
    ),
    is_active: Optional[bool] = Query(
        default=None,
        description="Filter by active status",
    ),
    service: UserService = Depends(get_user_service),
):
    users, total = await service.list_users(page, page_size, role, is_active)
    return UserListResponse(
        users=[_user_to_response(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
    summary="Get any user by ID (Admin only)",
    description="Return the full profile of any user by their MongoDB ObjectId. **Requires Admin role.**",
    responses={
        200: {"description": "User profile returned"},
        401: {"description": "Missing or invalid access token"},
        403: {"description": "Insufficient permissions — Admin role required"},
        404: {"description": "User not found"},
    },
)
async def get_user(
    user_id: str,
    service: UserService = Depends(get_user_service),
):
    return _user_to_response(await service.get_by_id(user_id))


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
    summary="Update any user (Admin only)",
    description=(
        "Update any field on any user account including `role`, `is_active`, "
        "and `is_verified`. **Requires Admin role.**"
    ),
    responses={
        200: {"description": "User updated successfully"},
        401: {"description": "Missing or invalid access token"},
        403: {"description": "Insufficient permissions — Admin role required"},
        404: {"description": "User not found"},
        422: {"description": "Validation error in request body"},
    },
)
async def admin_update_user(
    user_id: str,
    data: AdminUserUpdateRequest,
    service: UserService = Depends(get_user_service),
):
    return _user_to_response(await service.admin_update(user_id, data))


@router.delete(
    "/{user_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
    summary="Delete a user (Admin only)",
    description=(
        "Permanently delete a user account. This action is irreversible. "
        "**Requires Admin role.**"
    ),
    responses={
        200: {"description": "User deleted successfully"},
        401: {"description": "Missing or invalid access token"},
        403: {"description": "Insufficient permissions — Admin role required"},
        404: {"description": "User not found"},
    },
)
async def delete_user(
    user_id: str,
    service: UserService = Depends(get_user_service),
):
    await service.delete(user_id)
    return SuccessResponse(message="User account deleted successfully")
