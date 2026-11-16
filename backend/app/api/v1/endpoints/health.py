from fastapi import APIRouter, status
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Returns the operational status of the Online Pharmacy API service.",
    response_description="API health status and version metadata.",
)
async def health_check() -> HealthResponse:
    """Returns application status, name, and current version."""
    return HealthResponse(
        status="ok",
        application=settings.APPLICATION_NAME,
        version=settings.VERSION,
    )

