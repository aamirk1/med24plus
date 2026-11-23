import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.middleware.cors import setup_cors
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown routines."""
    # Startup initialization
    yield
    # Shutdown routines


app = FastAPI(
    title=f"{settings.PROJECT_NAME} Online Pharmacy API",
    description="Backend REST API for Single Pharmacy Online Medicine Platform (Indian Market)",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Hardened Security Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Setup CORS
setup_cors(app)


def get_cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if origin and (origin in settings.CORS_ORIGINS or "serwex.in" in origin or "localhost" in origin):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Vary": "Origin",
        }
    return {}


# Custom Exception Handler for HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Normalize HTTPException into standardized Med24Plus error envelope with CORS."""
    headers = dict(exc.headers or {})
    headers.update(get_cors_headers(request))
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail,
            headers=headers,
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "error": {"code": "HTTP_ERROR"},
        },
        headers=headers,
    )


# Custom Exception Handler for Validation Errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format Pydantic request validation errors with CORS."""
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"] if loc != "body")
        errors.append({"field": field, "message": err["msg"]})

    headers = get_cors_headers(request)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error in submitted request.",
            "error": {
                "code": "VALIDATION_ERROR",
                "details": errors,
            },
        },
        headers=headers,
    )


import re
from sqlalchemy.exc import IntegrityError


# Custom Exception Handler for Database Integrity / Unique Constraint Violations
@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    """Normalize database unique constraint violations into standardized 400 Bad Request with CORS."""
    headers = get_cors_headers(request)
    orig_msg = str(exc.orig) if hasattr(exc, "orig") else str(exc)
    user_msg = "Database integrity constraint violation: a record with these unique details already exists."
    
    match = re.search(r"Key \((.*?)\)=\((.*?)\) already exists", orig_msg)
    if match:
        field, val = match.groups()
        user_msg = f"The {field} '{val}' is already in use. Please choose a different {field} or leave it blank to auto-generate."
    elif "UniqueViolationError" in orig_msg or "duplicate key" in orig_msg:
        user_msg = "A record with this unique value (slug, SKU, or name) already exists. Please choose a different value."

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "message": user_msg,
            "error": {
                "code": "DUPLICATE_ENTRY",
                "details": orig_msg,
            },
        },
        headers=headers,
    )


# Custom Exception Handler for Generic Unhandled Server Errors
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all 500 handler ensuring CORS headers and clean JSON envelope."""
    import logging
    logging.exception(f"Unhandled error processing {request.method} {request.url}: {exc}")
    headers = get_cors_headers(request)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": f"Server processing error: {str(exc)}",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "details": str(exc),
            },
        },
        headers=headers,
    )


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Ensure static upload directories exist and mount static files handler
static_dir = Path("static")
static_dir.mkdir(parents=True, exist_ok=True)
(static_dir / "uploads" / "products").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", include_in_schema=False)
async def root():
    """Redirect root path to interactive Swagger documentation."""
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
