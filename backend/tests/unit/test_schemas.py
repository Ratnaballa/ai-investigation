"""
Unit tests for auth and user Pydantic schemas
=============================================
Tests run without a database or network connection.
"""
import pytest
from pydantic import ValidationError

from app.schemas.auth import RegisterRequest, ChangePasswordRequest, LoginRequest
from app.schemas.user import UserUpdateRequest, AdminUserUpdateRequest
from app.models.enums import UserRole


# ── RegisterRequest ───────────────────────────────────────────────────────────

class TestRegisterRequest:
    BASE = {
        "full_name": "Arjun Sharma",
        "email": "arjun@police.gov.in",
        "password": "Secure@123",
        "role": "police_officer",
    }

    def test_valid_payload_passes(self):
        req = RegisterRequest(**self.BASE)
        assert req.email == "arjun@police.gov.in"
        assert req.role == UserRole.POLICE_OFFICER

    def test_password_too_short(self):
        with pytest.raises(ValidationError, match="8 characters"):
            RegisterRequest(**{**self.BASE, "password": "Ab@1"})

    def test_password_no_uppercase(self):
        with pytest.raises(ValidationError, match="uppercase"):
            RegisterRequest(**{**self.BASE, "password": "secure@123"})

    def test_password_no_lowercase(self):
        with pytest.raises(ValidationError, match="lowercase"):
            RegisterRequest(**{**self.BASE, "password": "SECURE@123"})

    def test_password_no_digit(self):
        with pytest.raises(ValidationError, match="digit"):
            RegisterRequest(**{**self.BASE, "password": "Secure@abc"})

    def test_password_no_special_char(self):
        with pytest.raises(ValidationError, match="special character"):
            RegisterRequest(**{**self.BASE, "password": "Secure1234"})

    def test_admin_role_rejected(self):
        with pytest.raises(ValidationError, match="cannot be self-registered"):
            RegisterRequest(**{**self.BASE, "role": "admin"})

    def test_invalid_email_rejected(self):
        with pytest.raises(ValidationError):
            RegisterRequest(**{**self.BASE, "email": "not-an-email"})

    def test_default_role_is_public(self):
        req = RegisterRequest(
            full_name="Jane Doe",
            email="jane@example.com",
            password="Secure@123",
        )
        assert req.role == UserRole.PUBLIC


# ── ChangePasswordRequest ─────────────────────────────────────────────────────

class TestChangePasswordRequest:
    def test_valid(self):
        req = ChangePasswordRequest(
            current_password="OldPass@1",
            new_password="NewPass@2",
        )
        assert req.new_password == "NewPass@2"

    def test_weak_new_password_rejected(self):
        with pytest.raises(ValidationError):
            ChangePasswordRequest(
                current_password="OldPass@1",
                new_password="weak",
            )


# ── UserUpdateRequest ─────────────────────────────────────────────────────────

class TestUserUpdateRequest:
    def test_all_fields_optional(self):
        req = UserUpdateRequest()
        assert req.full_name is None
        assert req.phone is None

    def test_partial_update(self):
        req = UserUpdateRequest(full_name="New Name")
        assert req.full_name == "New Name"
        assert req.phone is None


# ── AdminUserUpdateRequest ────────────────────────────────────────────────────

class TestAdminUserUpdateRequest:
    def test_can_set_role(self):
        req = AdminUserUpdateRequest(role=UserRole.LAWYER)
        assert req.role == UserRole.LAWYER

    def test_can_deactivate(self):
        req = AdminUserUpdateRequest(is_active=False)
        assert req.is_active is False
