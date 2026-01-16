from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreateRequest(BaseModel):
    name: str


class ProjectUpdateRequest(BaseModel):
    name: str | None = None


class ProjectResponse(BaseModel):
    project_id: UUID = Field(validation_alias="id")
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
