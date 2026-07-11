"""
User Schemas
============
Pydantic request/response models for user management endpoints.
Sensitive fields (hashed_password, refresh_token) are never included.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole


# ── Response ──────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """
    Public-safe user representation.
    Returned by GET /users/me, GET /users/{id}, and list endpoints.
    """

    id: Optional[str] = Field(default=None, description="MongoDB ObjectId as string")
    full_name: str = Field(..., description="Full legal name")
    email: EmailStr = Field(..., description="Email address")
    role: UserRole = Field(..., description="Assigned role")
    badge_number: Optional[str] = Field(default=None, description="Badge / employee ID")
    department: Optional[str] = Field(default=None, description="Department or unit")
    phone: Optional[str] = Field(default=None, description="Contact phone")
    is_active: bool = Field(..., description="Whether the account is active")
    is_verified: bool = Field(..., description="Whether the account has been verified by admin")
    preferred_language: str = Field(..., description="Preferred language for AI responses")
    created_at: datetime = Field(..., description="Account creation timestamp (UTC)")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "665f1a2b3c4d5e6f7a8b9c0d",
                "full_name": "Arjun Sharma",
                "email": "arjun.sharma@police.gov.in",
                "role": "police_officer",
                "badge_number": "MH-1234",
                "department": "Cyber Crime Division",
                "phone": "+919876543210",
                "is_active": True,
                "is_verified": True,
                "preferred_language": "en",
                "created_at": "2024-01-15T10:30:00Z",
            }
        },
    }


# ── Self-update (any authenticated user) ─────────────────────────────────────

class UserUpdateRequest(BaseModel):
    """
    Fields a user can update on their own profile.
    Role, is_active, and is_verified are intentionally excluded — only admins can change those.
    """

    full_name: Optional[str] = Field(
        default=None, min_length=2, max_length=100,
        description="Updated full name",
    )
    phone: Optional[str] = Field(
        default=None, max_length=15,
        description="Updated phone number",
    )
    department: Optional[str] = Field(
        default=None, max_length=100,
        description="Updated department",
    )
    badge_number: Optional[str] = Field(
        default=None, max_length=20,
        description="Updated badge number",
    )
    preferred_language: Optional[str] = Field(
        default=None, max_length=10,
        description="Updated preferred language (ISO 639-1)",
    )


# ── Admin update ──────────────────────────────────────────────────────────────

class AdminUserUpdateRequest(UserUpdateRequest):
    """
    Extends UserUpdateRequest with admin-only fields.
    Only accessible via PUT /users/{user_id} with Admin role.
    """

    role: Optional[UserRole] = Field(
        default=None,
        description="Change the user's role (Admin only)",
    )
    is_active: Optional[bool] = Field(
        default=None,
        description="Activate or deactivate the account (Admin only)",
    )
    is_verified: Optional[bool] = Field(
        default=None,
        description="Mark account as verified (Admin only)",
    )


# ── List response ─────────────────────────────────────────────────────────────

class UserListResponse(BaseModel):
    """Paginated list of users — returned by GET /users (Admin only)."""

    users: List[UserResponse] = Field(..., description="Page of user records")
    total: int = Field(..., description="Total matching users across all pages")
    page: int = Field(..., description="Current page number (1-based)")
    page_size: int = Field(..., description="Number of records per page")
