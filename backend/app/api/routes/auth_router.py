"""
Authentication Router
=====================
Handles all auth-related HTTP endpoints.

Endpoints
---------
POST /api/v1/auth/register        — create a new account
POST /api/v1/auth/login           — authenticate and receive JWT tokens
POST /api/v1/auth/refresh         — rotate tokens using a refresh token
POST /api/v1/auth/logout          — invalidate the current refresh token
POST /api/v1/auth/change-password — change password (authenticated)

All endpoints are documented for Swagger UI (/docs).
"""
from fastapi import APIRouter, Depends, status

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ChangePasswordRequest,
)
from app.schemas.common import SuccessResponse
from app.api.auth.dependencies import get_current_user
from app.dependencies import get_auth_service
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description=(
        "Create a new user account. "
        "**Public** users are immediately active and verified. "
        "All other roles (Police Officer, Investigation Officer, Lawyer) "
        "require admin approval before they can access protected endpoints. "
        "Admin accounts **cannot** be self-registered."
    ),
    responses={
        201: {"description": "Account created successfully"},
        409: {"description": "Email address is already registered"},
        422: {"description": "Validation error — check password strength rules"},
    },
)
async def register(
    data: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    user = await service.register(data)
    msg = (
        "Registration successful. Your account is pending admin verification."
        if not data.role.value == "public"
        else "Registration successful. You can now log in."
    )
    return SuccessResponse(message=msg, data={"user_id": str(user.id)})


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and receive JWT tokens",
    description=(
        "Validate credentials and return a short-lived **access token** "
        "(default 30 min) and a long-lived **refresh token** (default 7 days). "
        "Use the access token as `Authorization: Bearer <token>` on all "
        "protected endpoints."
    ),
    responses={
        200: {"description": "Login successful — tokens returned"},
        401: {"description": "Invalid email or password"},
    },
)
async def login(
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.login(data)


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate tokens using a refresh token",
    description=(
        "Exchange a valid refresh token for a new access + refresh token pair. "
        "The old refresh token is immediately invalidated (token rotation). "
        "Call this endpoint before the access token expires to maintain a session."
    ),
    responses={
        200: {"description": "New token pair issued"},
        401: {"description": "Refresh token is invalid, expired, or already revoked"},
    },
)
async def refresh_token(
    data: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.refresh_token(data.refresh_token)


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout and invalidate refresh token",
    description=(
        "Null the stored refresh token so it can no longer be used to obtain "
        "new access tokens. The current access token remains valid until it "
        "expires naturally (short-lived by design). "
        "Requires a valid Bearer access token."
    ),
    responses={
        200: {"description": "Logged out successfully"},
        401: {"description": "Missing or invalid access token"},
    },
)
async def logout(
    current_user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.logout(current_user["_id"])
    return SuccessResponse(message="Logged out successfully")


# ── Change password ───────────────────────────────────────────────────────────

@router.post(
    "/change-password",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Change the current user's password",
    description=(
        "Verify the current password then replace it with the new one. "
        "All active sessions are invalidated after a successful password change "
        "(refresh token is cleared). "
        "Requires a valid Bearer access token."
    ),
    responses={
        200: {"description": "Password changed — all sessions invalidated"},
        400: {"description": "Current password is incorrect"},
        401: {"description": "Missing or invalid access token"},
        422: {"description": "New password does not meet strength requirements"},
    },
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.change_password(
        current_user["_id"], data.current_password, data.new_password
    )
    return SuccessResponse(message="Password changed successfully. Please log in again.")
