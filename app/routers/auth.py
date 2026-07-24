from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.token import RefreshRequest, TokenResponse
from app.schemas.user import UserCreate
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description=(
        "Create a new user account with a starter set of default categories, "
        "and immediately issue an access/refresh token pair."
    ),
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, user_in)
    return auth_service.issue_tokens(db, user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in with email and password",
    description="OAuth2-compatible password login. Use your email in the `username` field.",
)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    return auth_service.issue_tokens(db, user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Exchange a refresh token for a new token pair",
)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(db, payload.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke a refresh token",
)
def logout(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    auth_service.revoke_refresh_token(db, current_user.id, payload.refresh_token)
    return None
