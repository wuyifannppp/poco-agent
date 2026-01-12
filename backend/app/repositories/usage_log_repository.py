import uuid

from sqlalchemy.orm import Session

from app.models.usage_log import UsageLog


class UsageLogRepository:
    """Data access layer for usage logs."""

    @staticmethod
    def create(
        session_db: Session,
        session_id: uuid.UUID,
        total_cost_usd: float | None = None,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
        duration_ms: int | None = None,
    ) -> UsageLog:
        """Creates a new usage log."""
        usage_log = UsageLog(
            session_id=session_id,
            total_cost_usd=total_cost_usd,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            duration_ms=duration_ms,
        )
        session_db.add(usage_log)
        return usage_log

    @staticmethod
    def get_by_id(session_db: Session, log_id: uuid.UUID) -> UsageLog | None:
        """Gets a usage log by ID."""
        return session_db.query(UsageLog).filter(UsageLog.id == log_id).first()

    @staticmethod
    def list_by_session(
        session_db: Session, session_id: uuid.UUID, limit: int = 100, offset: int = 0
    ) -> list[UsageLog]:
        """Lists usage logs for a session."""
        return (
            session_db.query(UsageLog)
            .filter(UsageLog.session_id == session_id)
            .order_by(UsageLog.created_at.asc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    @staticmethod
    def get_total_usage_by_session(
        session_db: Session, session_id: uuid.UUID
    ) -> UsageLog | None:
        """Gets total usage (cost, input/output tokens, duration) for a session."""
        return (
            session_db.query(UsageLog).filter(UsageLog.session_id == session_id).first()
        )
