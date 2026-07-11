"""
Security
========
All cryptographic operations live here:
  - bcrypt password hashing / verification  (via passlib)
  - JWT access-token creation               (via PyJWT)
  - JWT refresh-token creation              (via PyJWT)
  - JWT decoding with full claim validation (via PyJWT)

Import only from this module — never call jwt / passlib directly elsewhere.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext

from app.config.settings import settings

# ── Password hashing ──────────────────────────────────────────────────────────

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return a bcrypt hash of *password*."""
    return _pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if *plain_password* matches *hashed_password*."""
    return _pwd_context.verify(plain_password, hashed_password)


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _build_token(data: dict, token_type: str, expires_delta: timedelta) -> str:
    """
    Internal helper — stamps exp, iat, and type claims then encodes with HS256.
    """
    now = datetime.now(timezone.utc)
    payload = {
        **data,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a short-lived access token.

    Required claims in *data*: ``sub`` (user_id string), ``role``, ``email``.
    """
    delta = expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    return _build_token(data, token_type="access", expires_delta=delta)


def create_refresh_token(data: dict) -> str:
    """
    Create a long-lived refresh token.

    Required claims in *data*: ``sub`` (user_id string), ``role``, ``email``.
    """
    delta = timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    return _build_token(data, token_type="refresh", expires_delta=delta)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT.

    Returns the payload dict on success, or ``None`` if the token is
    expired, tampered, or missing required claims.

    Required claims: ``exp``, ``sub``, ``type``.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub", "type"]},
        )
        return payload
    except InvalidTokenError:
        return None
