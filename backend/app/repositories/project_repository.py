import uuid

from sqlalchemy.orm import Session

from app.models.project import Project


class ProjectRepository:
    @staticmethod
    def create(session_db: Session, project: Project) -> Project:
        session_db.add(project)
        return project

    @staticmethod
    def get_by_id(
        session_db: Session,
        project_id: uuid.UUID,
        *,
        include_deleted: bool = False,
    ) -> Project | None:
        query = session_db.query(Project).filter(Project.id == project_id)
        if not include_deleted:
            query = query.filter(Project.is_deleted.is_(False))
        return query.first()

    @staticmethod
    def list_by_user(
        session_db: Session,
        user_id: str,
        *,
        include_deleted: bool = False,
    ) -> list[Project]:
        query = session_db.query(Project).filter(Project.user_id == user_id)
        if not include_deleted:
            query = query.filter(Project.is_deleted.is_(False))
        return query.order_by(Project.created_at.desc()).all()
