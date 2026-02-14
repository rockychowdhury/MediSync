from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import router as v1_router
from app.middleware.error_handler import register_exception_handlers
from app.utils.response import APIResponse


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI instance."""

    app = FastAPI(
        title=settings.APP_NAME,
        description="MediSync Backend API",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # ── CORS ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ──
    register_exception_handlers(app)

    # ── Routes ──
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    app.include_router(v1_router, prefix="/api/v1", tags=["v1"])

    return app


app = create_app()
