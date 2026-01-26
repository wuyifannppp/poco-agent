import logging
import uuid

from pydantic import ValidationError

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.agent_message import AgentMessage
from app.repositories.message_repository import MessageRepository
from app.repositories.run_repository import RunRepository
from app.schemas.input_file import InputFile
from app.schemas.message import (
    InputFileWithUrl,
    MessageResponse,
    MessageWithFilesResponse,
)
from app.services.storage_service import S3StorageService

logger = logging.getLogger(__name__)


class MessageService:
    """Service layer for message queries."""

    def get_messages(self, db: Session, session_id: uuid.UUID) -> list[AgentMessage]:
        """Gets all messages for a session.

        Args:
            db: Database session
            session_id: Session ID

        Returns:
            List of messages ordered by creation time
        """
        messages = MessageRepository.list_by_session(db, session_id)
        logger.debug(f"Retrieved {len(messages)} messages for session {session_id}")
        return messages

    def get_message(self, db: Session, message_id: int) -> AgentMessage:
        """Gets a message by ID.

        Args:
            db: Database session
            message_id: Message ID

        Returns:
            The message

        Raises:
            AppException: If message not found
        """
        message = MessageRepository.get_by_id(db, message_id)
        if not message:
            raise AppException(
                error_code=ErrorCode.NOT_FOUND,
                message=f"Message not found: {message_id}",
            )
        return message

    def get_messages_with_files(
        self, db: Session, session_id: uuid.UUID, *, user_id: str
    ) -> list[MessageWithFilesResponse]:
        """Gets messages for a session and attaches per-run uploaded files.

        Attachments are derived from the run snapshot to avoid coupling the
        message content schema to any upstream agent SDK format.
        """

        storage_service = S3StorageService()
        key_prefix = f"attachments/{user_id}/"

        messages = MessageRepository.list_by_session(db, session_id, limit=1000)
        runs = RunRepository.list_by_session(db, session_id, limit=1000)

        message_id_to_attachments: dict[int, list[InputFile]] = {}
        for run in runs:
            snapshot = run.config_snapshot or {}
            if not isinstance(snapshot, dict):
                continue

            uploaded = snapshot.get("input_files")
            if not isinstance(uploaded, list) or not uploaded:
                continue

            parsed: list[InputFile] = []
            for item in uploaded:
                if not isinstance(item, dict):
                    continue
                try:
                    parsed.append(InputFile.model_validate(item))
                except ValidationError:
                    continue

            if parsed:
                message_id_to_attachments[run.user_message_id] = parsed

        result: list[MessageWithFilesResponse] = []
        for msg in messages:
            base = MessageResponse.model_validate(msg)
            raw_attachments = message_id_to_attachments.get(msg.id) or []
            attachments: list[InputFileWithUrl] = []
            for file in raw_attachments:
                key = (file.source or "").strip()
                url = None
                if key and key.startswith(key_prefix):
                    try:
                        url = storage_service.presign_get(
                            key,
                            response_content_disposition="inline",
                            response_content_type=file.content_type,
                        )
                    except Exception:
                        url = None
                attachments.append(
                    InputFileWithUrl(
                        **file.model_dump(mode="json"),
                        url=url,
                    )
                )
            result.append(
                MessageWithFilesResponse(
                    **base.model_dump(mode="json"),
                    attachments=attachments,
                )
            )

        logger.debug(
            "messages_with_files_retrieved",
            extra={
                "session_id": str(session_id),
                "message_count": len(messages),
                "attachments_mapped": len(message_id_to_attachments),
            },
        )
        return result
