from typing import Generator

from sqlalchemy.orm import Session

from app.core.database import SessionLocal

DEFAULT_USER_ID = "default"


def get_current_user_id() -> str:
    """FastAPI dependency for the current user id (single-user mode)."""
    return DEFAULT_USER_ID


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
