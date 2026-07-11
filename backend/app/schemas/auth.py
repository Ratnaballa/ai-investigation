"""
Auth Schemas
============
Pydantic request/response models for every authentication endpoint.
All fields carry Field() descriptions so Swagger renders them clearly.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.enums import UserRole


# ── helpers ──────────────────────────────────────────────────────────────────

def _validate_password_strength(v: str) -> str:
    """Shared password-strength rule used by both Register and ChangePassword."""
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in v):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one digit")
    if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in v):
        raise ValueError("Password must contain at least one special character")
    return v


# ── Request schemas ───────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Payload for POST /auth/register"""

    full_name: str = Field(
        ..., min_length=2, max_length=100,
        description="Full legal name of the user",
        examples=["Arjun Sharma"],
    )
    email: EmailStr = Field(
        ...,
        description="Unique email address used for login",
        examples=["arjun.sharma@police.gov.in"],
    )
    password: str = Field(
        ..., min_length=8,
        description=(
            "Password — min 8 chars, must include uppercase, lowercase, "
            "digit and special character"
        ),
        examples=["Secure@123"],
    )
    role: UserRole = Field(
        default=UserRole.PUBLIC,
        description="User role. Admin accounts cannot be self-registered.",
        examples=[UserRole.POLICE_OFFICER],
    )
    badge_number: Optional[str] = Field(
        default=None, max_length=20,
        description="Badge / employee ID (required for Police / Investigation officers)",
        examples=["MH-1234"],
    )
    department: Optional[str] = Field(
        default=None, max_length=100,
        description="Department or unit name",
        examples=["Cyber Crime Division"],
    )
    phone: Optional[str] = Field(
        default=None, max_length=15,
        description="Contact phone number",
        examples=["+919876543210"],
    )
    preferred_language: str = Field(
        default="en", max_length=10,
        description="ISO 639-1 language code for AI responses",
        examples=["en", "hi"],
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password_strength(v)

    @field_validator("role")
    @classmethod
    def prevent_admin_self_register(cls, v: UserRole) -> UserRole:
        if v == UserRole.ADMIN:
            raise ValueError("Admin accounts cannot be self-registered")
        return v


class LoginRequest(BaseModel):
    """Payload for POST /auth/login"""

    email: EmailStr = Field(
        ...,
        description="Registered email address",
        examples=["arjun.sharma@police.gov.in"],
    )
    password: str = Field(
        ...,
        description="Account password",
        examples=["Secure@123"],
    )


class RefreshTokenRequest(BaseModel):
    """Payload for POST /auth/refresh"""

    refresh_token: str = Field(
        ...,
        description="Valid refresh token obtained from /auth/login",
    )


class ChangePasswordRequest(BaseModel):
    """Payload for POST /auth/change-password"""

    current_password: str = Field(..., description="Current account password")
    new_password: str = Field(
        ..., min_length=8,
        description="New password — same strength rules as registration",
    )

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _validate_password_strength(v)


# ── Response schemas ──────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """Returned by /auth/login and /auth/refresh"""

    access_token: str = Field(..., description="Short-lived JWT access token (Bearer)")
    refresh_token: str = Field(..., description="Long-lived refresh token")
    token_type: str = Field(default="bearer", description="Always 'bearer'")
    expires_in: int = Field(..., description="Access token lifetime in seconds")
    user_role: UserRole = Field(..., description="Role of the authenticated user")

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "user_role": "police_officer",
            }
        }
    }
