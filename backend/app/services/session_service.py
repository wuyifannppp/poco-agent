import logging
import uuid

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.agent_session import AgentSession
from app.repositories.project_repository import ProjectRepository
from app.repositories.session_repository import SessionRepository
from app.schemas.session import SessionCreateRequest, SessionUpdateRequest

logger = logging.getLogger(__name__)


class SessionService:
    """Service layer for session management."""

    def create_session(
        self, db: Session, user_id: str, request: SessionCreateRequest
    ) -> AgentSession:
        """Creates a new session."""
        config_dict = request.config.model_dump() if request.config else None
        project_id = request.project_id
        if project_id is not None:
            project = ProjectRepository.get_by_id(db, project_id)
            if not project or project.user_id != user_id:
                raise AppException(
                    error_code=ErrorCode.PROJECT_NOT_FOUND,
                    message=f"Project not found: {project_id}",
                )

        db_session = SessionRepository.create(
            session_db=db,
            user_id=user_id,
            config=config_dict,
            project_id=project_id,
        )

        db.commit()
        db.refresh(db_session)

        logger.info(f"Created session {db_session.id} for user {user_id}")
        return db_session

    def get_session(self, db: Session, session_id: uuid.UUID) -> AgentSession:
        """Gets a session by ID.

        Raises:
            AppException: If session not found.
        """
        db_session = SessionRepository.get_by_id(db, session_id)
        if not db_session:
            raise AppException(
                error_code=ErrorCode.NOT_FOUND,
                message=f"Session not found: {session_id}",
            )
        return db_session

    def update_session(
        self, db: Session, session_id: uuid.UUID, request: SessionUpdateRequest
    ) -> AgentSession:
        """Updates session fields."""
        db_session = self.get_session(db, session_id)
        if "project_id" in request.model_fields_set:
            project_id = request.project_id
            if project_id is None:
                db_session.project_id = None
            else:
                project = ProjectRepository.get_by_id(db, project_id)
                if not project or project.user_id != db_session.user_id:
                    raise AppException(
                        error_code=ErrorCode.PROJECT_NOT_FOUND,
                        message=f"Project not found: {project_id}",
                    )
                db_session.project_id = project_id

        if request.status is not None:
            db_session.status = request.status
        if request.sdk_session_id is not None:
            db_session.sdk_session_id = request.sdk_session_id
        if request.workspace_archive_url is not None:
            db_session.workspace_archive_url = request.workspace_archive_url
        if request.state_patch is not None:
            db_session.state_patch = request.state_patch
        if request.workspace_files_prefix is not None:
            db_session.workspace_files_prefix = request.workspace_files_prefix
        if request.workspace_manifest_key is not None:
            db_session.workspace_manifest_key = request.workspace_manifest_key
        if request.workspace_archive_key is not None:
            db_session.workspace_archive_key = request.workspace_archive_key
        if request.workspace_export_status is not None:
            db_session.workspace_export_status = request.workspace_export_status

        db.commit()
        db.refresh(db_session)

        logger.info(f"Updated session {session_id}")
        return db_session

    def delete_session(self, db: Session, session_id: uuid.UUID) -> AgentSession:
        """Soft deletes a session."""
        db_session = self.get_session(db, session_id)
        db_session.is_deleted = True

        db.commit()
        db.refresh(db_session)

        logger.info(f"Soft deleted session {session_id}")
        return db_session

    def list_sessions(
        self,
        db: Session,
        user_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
        project_id: uuid.UUID | None = None,
    ) -> list[AgentSession]:
        """Lists sessions, optionally filtered by user."""
        if user_id:
            return SessionRepository.list_by_user(
                db, user_id, limit, offset, project_id
            )
        return SessionRepository.list_all(db, limit, offset, project_id)

    def find_session_by_sdk_id_or_uuid(
        self, db: Session, session_id: str
    ) -> AgentSession | None:
        """Finds session by SDK session ID or UUID."""
        db_session = SessionRepository.get_by_sdk_session_id(db, session_id)

        if not db_session:
            try:
                session_uuid = uuid.UUID(session_id)
                db_session = SessionRepository.get_by_id(db, session_uuid)
            except ValueError:
                pass

        return db_session

    @staticmethod
    def _extract_title_from_session(session: AgentSession) -> str | None:
        """Extracts title from the first user message in a session.

        @deprecated: Temporary method for frontend development.
        """
        if not session.messages:
            return None

        # Find the first user message
        for msg in session.messages:
            if msg.role == "user":
                # Try text_preview first, then extract from content
                if msg.text_preview:
                    return msg.text_preview
                if msg.content:
                    if "text" in msg.content:
                        text = msg.content["text"]
                        if isinstance(text, str):
                            return text
                    if "prompt" in msg.content:
                        prompt = msg.content["prompt"]
                        if isinstance(prompt, str):
                            return prompt
                break

        return None

    def list_sessions_with_titles(
        self,
        db: Session,
        user_id: str,
        limit: int | None = None,
        offset: int = 0,
        project_id: uuid.UUID | None = None,
    ) -> list[dict]:
        """Lists sessions with titles extracted from first user message.

        @deprecated: Temporary method for frontend development. Will be replaced.
        """
        sessions = SessionRepository.list_by_user_with_messages(
            db, user_id, limit, offset, project_id
        )

        result = []
        for session in sessions:
            title = self._extract_title_from_session(session)
            result.append({"session": session, "title": title})

        return result
