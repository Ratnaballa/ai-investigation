"""
Integration tests for Authentication endpoints
===============================================
Uses FastAPI's TestClient with MongoDB mocked via unittest.mock so no real
database is required.

Run with:
    cd backend
    venv\\Scripts\\pytest tests/integration/test_auth_endpoints.py -v
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import hash_password, create_access_token

client = TestClient(app, raise_server_exceptions=False)

# ── Fixtures ──────────────────────────────────────────────────────────────────

MOCK_USER_ID = "507f1f77bcf86cd799439011"

def _make_user_doc(role: str = "public", is_active: bool = True) -> dict:
    from bson import ObjectId
    return {
        "_id": ObjectId(MOCK_USER_ID),
        "full_name": "Test User",
        "email": "test@example.com",
        "hashed_password": hash_password("Secure@123"),
        "role": role,
        "is_active": is_active,
        "is_verified": True,
        "preferred_language": "en",
        "refresh_token": None,
        "badge_number": None,
        "department": None,
        "phone": None,
    }


# ── Register ──────────────────────────────────────────────────────────────────

class TestRegister:
    PAYLOAD = {
        "full_name": "Test User",
        "email": "newuser@example.com",
        "password": "Secure@123",
        "role": "public",
    }

    def test_register_success(self):
        with patch("app.repositories.user_repository.UserRepository.find_by_email",
                   new_callable=AsyncMock, return_value=None), \
             patch("app.repositories.base_repository.BaseRepository.insert_one",
                   new_callable=AsyncMock) as mock_insert:
            from bson import ObjectId
            from datetime import datetime, timezone
            mock_insert.return_value = {
                **self.PAYLOAD,
                "_id": ObjectId(MOCK_USER_ID),
                "hashed_password": "hashed",
                "is_active": True,
                "is_verified": True,
                "refresh_token": None,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            resp = client.post("/api/v1/auth/register", json=self.PAYLOAD)
        assert resp.status_code == 201
        assert resp.json()["success"] is True

    def test_register_duplicate_email(self):
        with patch("app.repositories.user_repository.UserRepository.find_by_email",
                   new_callable=AsyncMock, return_value=_make_user_doc()):
            resp = client.post("/api/v1/auth/register", json=self.PAYLOAD)
        assert resp.status_code == 409

    def test_register_admin_role_rejected(self):
        resp = client.post("/api/v1/auth/register",
                           json={**self.PAYLOAD, "role": "admin"})
        assert resp.status_code == 422

    def test_register_weak_password(self):
        resp = client.post("/api/v1/auth/register",
                           json={**self.PAYLOAD, "password": "weak"})
        assert resp.status_code == 422

    def test_register_invalid_email(self):
        resp = client.post("/api/v1/auth/register",
                           json={**self.PAYLOAD, "email": "not-an-email"})
        assert resp.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

class TestLogin:
    PAYLOAD = {"email": "test@example.com", "password": "Secure@123"}

    def test_login_success(self):
        user_doc = _make_user_doc()
        with patch("app.repositories.user_repository.UserRepository.find_by_email",
                   new_callable=AsyncMock, return_value=user_doc), \
             patch("app.repositories.user_repository.UserRepository.set_refresh_token",
                   new_callable=AsyncMock):
            resp = client.post("/api/v1/auth/login", json=self.PAYLOAD)
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password(self):
        user_doc = _make_user_doc()
        with patch("app.repositories.user_repository.UserRepository.find_by_email",
                   new_callable=AsyncMock, return_value=user_doc):
            resp = client.post("/api/v1/auth/login",
                               json={**self.PAYLOAD, "password": "Wrong@999"})
        assert resp.status_code == 401

    def test_login_unknown_email(self):
        with patch("app.repositories.user_repository.UserRepository.find_by_email",
                   new_callable=AsyncMock, return_value=None):
            resp = client.post("/api/v1/auth/login", json=self.PAYLOAD)
        assert resp.status_code == 401

    def test_login_deactivated_account(self):
        user_doc = _make_user_doc(is_active=False)
        with patch("app.repositories.user_repository.UserRepository.find_by_email",
                   new_callable=AsyncMock, return_value=user_doc):
            resp = client.post("/api/v1/auth/login", json=self.PAYLOAD)
        assert resp.status_code == 401


# ── Get /users/me ─────────────────────────────────────────────────────────────

class TestGetMe:
    def _auth_header(self, role: str = "public") -> dict:
        token = create_access_token(
            {"sub": MOCK_USER_ID, "role": role, "email": "test@example.com"}
        )
        return {"Authorization": f"Bearer {token}"}

    def test_get_me_success(self):
        from bson import ObjectId
        from datetime import datetime, timezone
        user_doc = {
            **_make_user_doc(),
            "_id": MOCK_USER_ID,  # already stringified
        }
        user_doc["created_at"] = datetime.now(timezone.utc)

        with patch("app.api.auth.dependencies.get_database") as mock_db:
            mock_collection = AsyncMock()
            mock_collection.find_one = AsyncMock(return_value={
                **_make_user_doc(),
                "_id": ObjectId(MOCK_USER_ID),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })
            mock_db.return_value = MagicMock(users=mock_collection)
            resp = client.get("/api/v1/users/me", headers=self._auth_header())

        assert resp.status_code == 200
        body = resp.json()
        assert "email" in body
        assert "hashed_password" not in body
        assert "refresh_token" not in body

    def test_get_me_no_token(self):
        resp = client.get("/api/v1/users/me")
        assert resp.status_code == 403  # HTTPBearer returns 403 when header missing

    def test_get_me_invalid_token(self):
        resp = client.get("/api/v1/users/me",
                          headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401
