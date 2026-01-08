from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.schemas.state import AgentCurrentState


class AgentReportCallback(BaseModel):
    session_id: str
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str
    progress: int
    new_message: Optional[Any] = None
    state_patch: Optional[AgentCurrentState] = None
