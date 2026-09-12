"""
JalRakshak AI 2.0 - FastAPI Backend
Intelligent Drought & Groundwater Depletion Advisor for Saurashtra
"""
import os
import sys

# Add the parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from contextlib import asynccontextmanager

from app.api.routes import router, limiter as routes_limiter
from app.api.data_router import data_router
from app.api.auth_router import auth_router
from app.api.user_router import user_router
from app.api.ingestion_router import ingestion_router
from app.core.config import settings
from app.services.database import init_db
import logging


class NoisyAccessLogFilter(logging.Filter):
    """
    Filter out routine 200 OK / 304 Not Modified access logs to keep terminal clean.
    Errors (4xx, 5xx), warnings, and operational events still log.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        if " 200 OK" in msg or " 200 " in msg or " 304 " in msg:
            return False
        return True


_noisy_filter = NoisyAccessLogFilter()
logging.getLogger("uvicorn.access").addFilter(_noisy_filter)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure DB schema exists and is seeded on server start."""
    access_logger = logging.getLogger("uvicorn.access")
    if _noisy_filter not in access_logger.filters:
        access_logger.addFilter(_noisy_filter)
    init_db()
    yield


app = FastAPI(
    title="JalRakshak AI 2.0",
    description="Intelligent Drought & Groundwater Depletion Advisor for Saurashtra",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Register the routes limiter on app state so slowapi handles 429 responses
app.state.limiter = routes_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - allow local dev + any Vercel/Render production URL
_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
# Pick up extra origins from env (comma-separated), e.g. CORS_ORIGINS=https://jalrakshak.vercel.app
_extra = os.environ.get("CORS_ORIGINS", "")
if _extra:
    _CORS_ORIGINS += [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com|railway\.app|codeengine\.appdomain\.cloud)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(data_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(ingestion_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "app": "JalRakshak AI 2.0",
        "tagline": "From Water Data to Intelligent Water Action.",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )
