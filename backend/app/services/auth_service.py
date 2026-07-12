"""
Auth Service
============
Business logic for all authentication operations.

Responsibilities
----------------
- User registration with role validation
- Login with constant-time password comparison
- JWT access + refresh token issuance
- Refresh-token rotation (old token invalidated on every refresh)
- Logout (refresh token nulled in DB)
- Password change with current-password verification

This service never touches the HTTP layer — it raises domain exceptions
(UnauthorizedException, ConflictException, etc.) that the router or the
global exception handler converts to HTTP responses.
"""
from loguru import logger

from app.repositories.user_repository import UserRepository
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.exceptions import (
    UnauthorizedException,
    ConflictException,
    NotFoundException,
    BadRequestException,
)
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.config.settings import settings


class AuthService:
    """Handles all authentication and token-management operations."""

    def __init__(self) -> None:
        self._repo = UserRepository()

    # ── Registration ──────────────────────────────────────────────────────────

    async def register(self, data: RegisterRequest) -> User:
        """
        Create a new user account.

        - Emails are stored lower-cased for case-insensitive uniqueness.
        - Public users are auto-verified; all other roles require admin approval.
        - Admin role cannot be self-registered (enforced in schema validator too).

        Raises
        ------
        ConflictException   if the email is already registered.
        """
        normalised_email = data.email.lower().strip()

        if await self._repo.email_exists(normalised_email):
            raise ConflictException("An account with this email address already exists")

        is_verified = data.role == UserRole.PUBLIC  # public users skip approval

        user_doc = {
            "full_name": data.full_name.strip(),
            "email": normalised_email,
            "hashed_password": hash_password(data.password),
            "role": data.role,
            "badge_number": data.badge_number,
            "department": data.department,
            "phone": data.phone,
            "is_active": True,
            "is_verified": is_verified,
            "preferred_language": data.preferred_language,
            "refresh_token": None,
        }

        doc = await self._repo.insert_one(user_doc)
        logger.info(
            f"[AUTH] New user registered | email={normalised_email} | role={data.role}"
        )
        return User(**doc)

    # ── Login ─────────────────────────────────────────────────────────────────

    async def login(self, data: LoginRequest) -> TokenResponse:
        """
        Authenticate a user and issue JWT tokens.

        Uses a single generic error message for both "user not found" and
        "wrong password" to prevent user-enumeration attacks.

        Raises
        ------
        UnauthorizedException   on invalid credentials or deactivated account.
        """
        normalised_email = data.email.lower().strip()
        user_doc = await self._repo.find_by_email(normalised_email)

        # Constant-time: always call verify_password even when user not found
        # to prevent timing-based user enumeration.
        dummy_hash = "$2b$12$KB5g14l3N7V306P/2R5vI.o9Hh8aZ27.gN0mYf7gR6e6d5c4b3a2a"
        stored_hash = user_doc["hashed_password"] if user_doc else dummy_hash

        password_ok = verify_password(data.password, stored_hash)

        if not user_doc or not password_ok:
            raise UnauthorizedException("Invalid email address or password")

        if not user_doc.get("is_active", True):
            raise UnauthorizedException(
                "Your account has been deactivated — please contact an administrator"
            )

        tokens = self._issue_tokens(user_doc)
        await self._repo.set_refresh_token(str(user_doc["_id"]), tokens["refresh_token"])

        logger.info(
            f"[AUTH] Login successful | email={normalised_email} | role={user_doc['role']}"
        )
        return TokenResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_role=user_doc["role"],
        )

    # ── Token refresh ─────────────────────────────────────────────────────────

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """
        Rotate tokens: validate the supplied refresh token, issue a new pair,
        and invalidate the old refresh token in the database.

        Raises
        ------
        UnauthorizedException   if the token is invalid, expired, or revoked.
        """
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Refresh token is invalid or has expired")

        # Verify the token is still stored (not already revoked via logout)
        user_doc = await self._repo.find_by_refresh_token(refresh_token)
        if not user_doc:
            raise UnauthorizedException(
                "Refresh token has been revoked — please log in again"
            )

        tokens = self._issue_tokens(user_doc)
        await self._repo.set_refresh_token(str(user_doc["_id"]), tokens["refresh_token"])

        logger.info(f"[AUTH] Tokens rotated | user_id={user_doc['_id']}")
        return TokenResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_role=user_doc["role"],
        )

    # ── Logout ────────────────────────────────────────────────────────────────

    async def logout(self, user_id: str) -> None:
        """
        Invalidate the user's refresh token.

        After this call the user's access token remains valid until it expires
        (short-lived by design). The refresh token is immediately unusable.
        """
        await self._repo.set_refresh_token(user_id, None)
        logger.info(f"[AUTH] User logged out | user_id={user_id}")

    # ── Password change ───────────────────────────────────────────────────────

    async def change_password(
        self, user_id: str, current_password: str, new_password: str
    ) -> None:
        """
        Change a user's password after verifying the current one.

        Raises
        ------
        NotFoundException       if the user_id doesn't exist.
        BadRequestException     if current_password is wrong.
        """
        user_doc = await self._repo.find_by_id(user_id)
        if not user_doc:
            raise NotFoundException("User")

        if not verify_password(current_password, user_doc["hashed_password"]):
            raise BadRequestException("Current password is incorrect")

        await self._repo.update_by_id(
            user_id, {"hashed_password": hash_password(new_password)}
        )
        # Invalidate all sessions after a password change
        await self._repo.set_refresh_token(user_id, None)
        logger.info(f"[AUTH] Password changed | user_id={user_id}")

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _issue_tokens(user_doc: dict) -> dict:
        """Build the token payload and return both tokens as a dict."""
        token_data = {
            "sub": str(user_doc["_id"]),
            "role": user_doc["role"],
            "email": user_doc["email"],
        }
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
        }
