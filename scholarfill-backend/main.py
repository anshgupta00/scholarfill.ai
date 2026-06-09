import os
import sys
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import create_tables
from routers import auth, cv, forms, applications
from routers import google_auth
from routers import admin, opportunities, notifications

# ── Windows fix: Playwright needs ProactorEventLoop to spawn the browser ──────
# SelectorEventLoop (uvicorn's default on Windows) does NOT support subprocess.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables and upload directory on startup
    await create_tables()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="scholarfill.ai API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static directory
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register all routers
app.include_router(auth.router)
app.include_router(cv.router)
app.include_router(forms.router)
app.include_router(applications.router)
app.include_router(google_auth.router)
app.include_router(admin.router)
app.include_router(opportunities.router)
app.include_router(notifications.router)


@app.get("/")
async def root():
    return {"status": "scholarfill.ai API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
