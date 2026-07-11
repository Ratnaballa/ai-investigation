"""
User Model
==========
Pydantic document model for the 'users' MongoDB collection.
Never returned directly to API consumers — use UserResponse schema instead.
"""
from typing import Optional
from pydantic import EmailStr, Field
from .base import BaseDocument
from .enums import UserRole


class User(BaseDocument):
    """
    Internal representation of a user document stored in MongoDB.

    Sensitive fields (hashed_password, refresh_token) are present here
    for service-layer use only. The API layer always maps to UserResponse.
    """

    full_name: str = Field(..., description="Full legal name")
    email: EmailStr = Field(..., description="Unique email address")
    hashed_password: str = Field(..., description="bcrypt-hashed password — never expose via API")
    role: UserRole = Field(default=UserRole.PUBLIC, description="RBAC role")
    badge_number: Optional[str] = Field(default=None, description="Badge / employee ID")
    department: Optional[str] = Field(default=None, description="Department or unit")
    phone: Optional[str] = Field(default=None, description="Contact phone")
    is_active: bool = Field(default=True, description="Account active flag")
    is_verified: bool = Field(
        default=False,
        description="Admin-verified flag. Public users are auto-verified; others require admin approval.",
    )
    preferred_language: str = Field(default="en", description="ISO 639-1 language code")
    refresh_token: Optional[str] = Field(
        default=None,
        description="Current refresh token — nulled on logout. Never expose via API.",
    )

    class Settings:
        collection = "users"
