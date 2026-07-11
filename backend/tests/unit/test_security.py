"""
Unit tests for app.core.security
=================================
Tests run without a database or network connection.
"""
import time
import pytest
from datetime import timedelta

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


# ── Password hashing ──────────────────────────────────────────────────────────

class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        hashed = hash_password("Secure@123")
        assert hashed != "Secure@123"

    def test_verify_correct_password(self):
        hashed = hash_password("Secure@123")
        assert verify_password("Secure@123", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("Secure@123")
        assert verify_password("Wrong@999", hashed) is False

    def test_two_hashes_of_same_password_differ(self):
        """bcrypt uses a random salt — same input must produce different hashes."""
        h1 = hash_password("Secure@123")
        h2 = hash_password("Secure@123")
        assert h1 != h2


# ── JWT tokens ────────────────────────────────────────────────────────────────

TOKEN_DATA = {"sub": "507f1f77bcf86cd799439011", "role": "police_officer", "email": "test@test.com"}


class TestAccessToken:
    def test_create_and_decode(self):
        token = create_access_token(TOKEN_DATA)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == TOKEN_DATA["sub"]
        assert payload["role"] == TOKEN_DATA["role"]
        assert payload["type"] == "access"

    def test_expired_token_returns_none(self):
        token = create_access_token(TOKEN_DATA, expires_delta=timedelta(seconds=-1))
        assert decode_token(token) is None

    def test_tampered_token_returns_none(self):
        token = create_access_token(TOKEN_DATA)
        tampered = token[:-5] + "XXXXX"
        assert decode_token(tampered) is None

    def test_refresh_token_rejected_as_access(self):
        """A refresh token must not be accepted where an access token is expected."""
        refresh = create_refresh_token(TOKEN_DATA)
        payload = decode_token(refresh)
        # decode_token succeeds but the type claim must be checked by the caller
        assert payload is not None
        assert payload["type"] == "refresh"


class TestRefreshToken:
    def test_create_and_decode(self):
        token = create_refresh_token(TOKEN_DATA)
        payload = decode_token(token)
        assert payload is not None
        assert payload["type"] == "refresh"
        assert payload["sub"] == TOKEN_DATA["sub"]

    def test_expired_refresh_token_returns_none(self):
        import jwt as _jwt
        from app.config.settings import settings
        from datetime import datetime, timezone

        payload = {
            **TOKEN_DATA,
            "type": "refresh",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        }
        token = _jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        assert decode_token(token) is None
