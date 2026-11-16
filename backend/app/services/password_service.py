from typing import Optional, Tuple
from app.core.security import get_password_hash, validate_password_strength, verify_password


class PasswordService:
    """Business logic for password policy validation, hashing, and verification."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a plaintext password using Argon2id."""
        return get_password_hash(password)

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        """Safely verify a password using Argon2id."""
        return verify_password(plain_password, hashed_password)

    @staticmethod
    def validate_strength(password: str) -> Tuple[bool, Optional[str]]:
        """Validate password against security policy."""
        return validate_password_strength(password)

