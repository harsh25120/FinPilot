from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import PasswordChange, UserUpdate
from app.utils.exceptions import BadRequestException
from app.utils.security import hash_password, verify_password


def update_profile(db: Session, user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, data: PasswordChange) -> None:
    if not verify_password(data.current_password, user.hashed_password):
        raise BadRequestException("Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    db.add(user)
    db.commit()


def deactivate_account(db: Session, user: User) -> None:
    user.is_active = False
    db.add(user)
    db.commit()
