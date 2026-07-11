"""
Auth Dependencies
=================
FastAPI dependency functions for authentication and role-based access control.

Usage in routers
----------------
    # Require any authenticated user
    current_user: dict = Depends(get_current_user)

    # Require a specific role tier
    dependencies=[Depends(require_admin)]
    dependencies=[Depends(require_law_enforcement)]
    dependencies=[Depends(require_legal_professional)]

    # Custom role combination
    dependencies=[Depends(require_roles(UserRole.LAWYER, UserRole.ADMIN))]

Token flow
----------
1. Client sends ``Authorization: Bearer <access_token>`` header.
2. ``get_current_user`` decodes the JWT, validates claims, then fetches the
   live user document from MongoDB so revoked/deactivated accounts are caught
   on every request — not just at login time.
3. Role guards wrap ``get_current_user`` and raise 403 if the role doesn't match.
"""
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.database.mongodb import get_database
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.enums import UserRole

# HTTPBearer extracts the token from the Authorization header and returns 403
# automatically when the header is missing (auto_error=True is the default).
_http_bearer = HTTPBearer(
    scheme_name="BearerAuth",
    description="Paste your JWT access token here (without the 'Bearer ' prefix).",
)


# ── Core dependency ───────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_http_bearer),
) -> dict:
    """
    Decode the Bearer token, validate all claims, and return the live user
    document from MongoDB.

    Raises
    ------
    UnauthorizedException
        - Token is missing, expired, or tampered.
        - ``type`` claim is not ``"access"``.
        - ``sub`` claim is missing or not a valid ObjectId.
        - User no longer exists in the database.
        - User account has been deactivated.
    """
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise UnauthorizedException("Token is invalid or has expired")

    if payload.get("type") != "access":
        raise UnauthorizedException(
            "A refresh token was supplied — please use your access token"
        )

    user_id: str = payload.get("sub", "")
    if not user_id:
        raise UnauthorizedException("Token is missing the 'sub' claim")

    # Validate ObjectId format before hitting the database
    if not ObjectId.is_valid(user_id):
        raise UnauthorizedException("Token contains an invalid user identifier")

    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise UnauthorizedException("The account associated with this token no longer exists")

    if not user.get("is_active", True):
        raise UnauthorizedException(
            "Your account has been deactivated — please contact an administrator"
        )

    # Normalise _id to a plain string so downstream code never touches ObjectId
    user["_id"] = str(user["_id"])
    return user


# ── RBAC factory ──────────────────────────────────────────────────────────────

def require_roles(*roles: UserRole):
    """
    Return a FastAPI dependency that passes only when the authenticated user
    holds one of the supplied *roles*.

    Example
    -------
        router.get("/secret", dependencies=[Depends(require_roles(UserRole.ADMIN))])
    """
    allowed = frozenset(r.value for r in roles)
    role_names = ", ".join(r.value for r in roles)

    async def _role_guard(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed:
            raise ForbiddenException(
                f"Access denied. This endpoint requires one of: [{role_names}]. "
                f"Your role is '{current_user.get('role')}'."
            )
        return current_user

    # Give the inner function a unique __name__ so FastAPI generates distinct
    # OpenAPI operationIds when the same guard is reused across multiple routes.
    _role_guard.__name__ = f"require_{'_or_'.join(r.value for r in roles)}"
    return _role_guard


# ── Named role guards ─────────────────────────────────────────────────────────
# Use these directly:  dependencies=[Depends(require_admin)]
# Do NOT call them:    dependencies=[Depends(require_admin())]   ← wrong

require_admin = require_roles(UserRole.ADMIN)
"""Only Admins."""

require_law_enforcement = require_roles(
    UserRole.ADMIN,
    UserRole.POLICE_OFFICER,
    UserRole.INVESTIGATION_OFFICER,
)
"""Admins, Police Officers, and Investigation Officers."""

require_legal_professional = require_roles(
    UserRole.ADMIN,
    UserRole.POLICE_OFFICER,
    UserRole.INVESTIGATION_OFFICER,
    UserRole.LAWYER,
)
"""All professional roles (excludes Public users)."""

require_any_authenticated = get_current_user
"""Any authenticated user regardless of role."""
