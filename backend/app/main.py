from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.api.v1.router import api_router
from app.middleware.cors import setup_cors


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown routines."""
    # Startup: e.g. initialize DB connections or verify caches
    yield
    # Shutdown: e.g. close connection pools


app = FastAPI(
    title=f"{settings.PROJECT_NAME} Online Pharmacy API",
    description="Backend REST API for Single Pharmacy Online Medicine Platform (Indian Market)",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Setup CORS
setup_cors(app)

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", include_in_schema=False)
async def root():
    """Redirect root path to interactive Swagger documentation."""
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

