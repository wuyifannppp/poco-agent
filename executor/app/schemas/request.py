from pydantic import BaseModel, Field


class TaskConfig(BaseModel):
    repo_url: str | None = None
    git_branch: str = "main"
    mcp_config: dict = Field(default_factory=dict)
    skill_files: dict = Field(default_factory=dict)


class TaskRun(BaseModel):
    session_id: str
    prompt: str
    callback_url: str
    callback_token: str
    config: TaskConfig
