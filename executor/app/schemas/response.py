from pydantic import BaseModel


class TaskRunResponse(BaseModel):
    status: str = "accepted"
    session_id: str
