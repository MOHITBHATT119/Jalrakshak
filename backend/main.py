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

from app.api.routes import router
from app.api.data_router import data_router
from app.core.config import settings
from app.services.database import init_db

app = FastAPI(
    title="JalRakshak AI 2.0",
    description="Intelligent Drought & Groundwater Depletion Advisor for Saurashtra",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

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
    allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com|railway\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(data_router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup():
    """Ensure DB schema exists and is seeded on every server start."""
    init_db()


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
