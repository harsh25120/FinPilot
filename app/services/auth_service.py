from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.token import TokenResponse
from app.schemas.user import UserCreate
from app.services.category_service import create_default_categories
from app.utils.exceptions import ConflictException, NotFoundException, UnauthorizedException
from app.utils.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)


def register_user(db: Session, user_in: UserCreate) -> User:
    email = user_in.email.lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ConflictException("A user with this email already exists")

    user = User(
        email=email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        monthly_income=user_in.monthly_income,
        preferred_currency=user_in.preferred_currency,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_default_categories(db, user.id)

    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedException("Incorrect email or password")
    if not user.is_active:
        raise UnauthorizedException("This account has been deactivated")
    return user


def _create_refresh_token_record(db: Session, user_id: int) -> str:
    raw_token = generate_refresh_token()
    token_hash = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    record = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    db.add(record)
    db.commit()
    return raw_token


def issue_tokens(db: Session, user: User) -> TokenResponse:
    access_token = create_access_token(subject=str(user.id))
    refresh_token = _create_refresh_token_record(db, user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def _is_expired(expires_at: datetime) -> bool:
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at < datetime.now(timezone.utc)


def refresh_access_token(db: Session, raw_refresh_token: str) -> TokenResponse:
    token_hash = hash_token(raw_refresh_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if record is None or record.revoked or _is_expired(record.expires_at):
        raise UnauthorizedException("Invalid or expired refresh token")

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None or not user.is_active:
        raise UnauthorizedException("Invalid or expired refresh token")

    # Rotate: revoke the used token so it cannot be replayed.
    record.revoked = True
    db.add(record)
    db.commit()

    return issue_tokens(db, user)


def revoke_refresh_token(db: Session, user_id: int, raw_refresh_token: str) -> None:
    token_hash = hash_token(raw_refresh_token)
    record = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash, RefreshToken.user_id == user_id)
        .first()
    )
    if record is None:
        raise NotFoundException("Refresh token not found")
    record.revoked = True
    db.add(record)
    db.commit()
