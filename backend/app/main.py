"""FastAPI application — port of src/index.ts (Express → FastAPI)."""
from __future__ import annotations

import os
from datetime import datetime, timezone

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.routers import assess, chat, export, geocode, gridoperator, irradiance, roof_image, sources, tender

# ── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["100/day"])

# ── Application ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Plankton PV Assistant API",
    description="Solar PV regulatory compliance assistant for Germany",
    version="1.0.0",
    redirect_slashes=False,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

# CORS — open in dev, restrict in production
_is_prod = os.getenv("NODE_ENV") == "production"
app.add_middleware(
    CORSMiddleware,
    allow_origins=[] if _is_prod else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(assess.router,       prefix="/api/assess",       tags=["assess"])
app.include_router(gridoperator.router, prefix="/api/gridoperator", tags=["gridoperator"])
app.include_router(sources.router,      prefix="/api/sources",      tags=["sources"])
app.include_router(export.router,       prefix="/api/export",       tags=["export"])
app.include_router(chat.router,         prefix="/api/chat",         tags=["chat"])
app.include_router(geocode.router,      prefix="/api/geocode",      tags=["geocode"])
app.include_router(irradiance.router,   prefix="/api/irradiance",   tags=["irradiance"])
app.include_router(roof_image.router,   prefix="/api/roof-image",   tags=["roof-image"])
app.include_router(tender.router,       prefix="/api/tender",       tags=["tender"])


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "ts": datetime.now(timezone.utc).isoformat()}
