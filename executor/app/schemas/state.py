from datetime import datetime, timezone

from pydantic import BaseModel, Field


class TodoItem(BaseModel):
    content: str
    status: str
    activeForm: str | None = None


class McpStatus(BaseModel):
    name: str
    status: str


class WorkspaceState(BaseModel):
    repository: str | None = None
    branch: str | None = None

    modified_files: list[str] = Field(default_factory=list)
    untracked_files: list[str] = Field(default_factory=list)

    last_change: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgentCurrentState(BaseModel):
    todos: list[TodoItem] = Field(default_factory=list)
    mcp_status: list[McpStatus] = Field(default_factory=list)

    workspace_state: WorkspaceState | None = None
    current_step: str | None = None
