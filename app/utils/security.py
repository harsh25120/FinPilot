import secrets
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Any, Dict, Optional

import bcrypt
import jwt

from app.config import settings

BCRYPT_MAX_BYTES = 72


def _prepare_password_bytes(password: str) -> bytes:
    """
    Encode a password to UTF-8 and defensively truncate to bcrypt's 72-byte
    limit. The Pydantic schema already enforces a 72-character max length,
    so this only matters for multi-byte characters; the same truncation is
    applied consistently in both hashing and verification.
    """
    return password.encode("utf-8")[:BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(_prepare_password_bytes(password), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_prepare_password_bytes(password), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": subject, "iat": now, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def generate_refresh_token() -> str:
    """Cryptographically secure, high-entropy opaque refresh token."""
    return secrets.token_urlsafe(48)


def hash_token(raw_token: str) -> str:
    """Fast, deterministic hash used to look up refresh tokens by value.

    Refresh tokens are high-entropy random strings (not user-chosen
    secrets), so a fast hash is appropriate here — unlike passwords, they
    do not need bcrypt's deliberately slow, salted hashing.
    """
    return sha256(raw_token.encode("utf-8")).hexdigest()
