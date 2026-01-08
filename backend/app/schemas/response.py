from typing import Any, Generic, TypeVar

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel

T = TypeVar("T")


class ResponseSchema(BaseModel, Generic[T]):
    code: int
    message: str
    data: T | None


class Response:
    """Unified API response builder."""

    @staticmethod
    def _build_response(
        code: int,
        message: str,
        data: Any,
        status_code: int,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status_code,
            content=jsonable_encoder(
                ResponseSchema[Any](
                    code=code,
                    message=message,
                    data=data,
                )
            ),
        )

    @staticmethod
    def success(
        data: T | None = None,
        message: str = "Success",
    ) -> JSONResponse:
        return Response._build_response(
            code=0,
            message=message,
            data=data,
            status_code=200,
        )

    @staticmethod
    def paginated(
        data: list[T],
        total: int,
        page: int = 1,
        page_size: int = 20,
        message: str = "Success",
    ) -> JSONResponse:
        total_pages = (total + page_size - 1) // page_size

        paginated_data = {
            "items": data,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
        }

        return Response._build_response(
            code=0,
            message=message,
            data=paginated_data,
            status_code=200,
        )

    @staticmethod
    def error(
        code: int,
        message: str,
        data: Any = None,
        status_code: int = 400,
    ) -> JSONResponse:
        return Response._build_response(
            code=code,
            message=message,
            data=data,
            status_code=status_code,
        )
