from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.repositories.session_repository import SessionRepository
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
)


class ProjectService:
    def list_projects(self, db: Session, user_id: str) -> list[ProjectResponse]:
        projects = ProjectRepository.list_by_user(db, user_id)
        return [ProjectResponse.model_validate(p) for p in projects]

    def get_project(
        self, db: Session, user_id: str, project_id: UUID
    ) -> ProjectResponse:
        project = ProjectRepository.get_by_id(db, project_id)
        if not project or project.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.PROJECT_NOT_FOUND,
                message=f"Project not found: {project_id}",
            )
        return ProjectResponse.model_validate(project)

    def create_project(
        self, db: Session, user_id: str, request: ProjectCreateRequest
    ) -> ProjectResponse:
        project = Project(
            user_id=user_id,
            name=request.name,
        )
        ProjectRepository.create(db, project)
        db.commit()
        db.refresh(project)
        return ProjectResponse.model_validate(project)

    def update_project(
        self,
        db: Session,
        user_id: str,
        project_id: UUID,
        request: ProjectUpdateRequest,
    ) -> ProjectResponse:
        project = ProjectRepository.get_by_id(db, project_id)
        if not project or project.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.PROJECT_NOT_FOUND,
                message=f"Project not found: {project_id}",
            )

        if request.name is not None:
            project.name = request.name

        db.commit()
        db.refresh(project)
        return ProjectResponse.model_validate(project)

    def delete_project(self, db: Session, user_id: str, project_id: UUID) -> None:
        project = ProjectRepository.get_by_id(db, project_id)
        if not project or project.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.PROJECT_NOT_FOUND,
                message=f"Project not found: {project_id}",
            )

        project.is_deleted = True
        SessionRepository.clear_project_id(db, project_id)
        db.commit()
