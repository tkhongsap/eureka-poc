import os
from contextlib import asynccontextmanager
from datetime import datetime

from db import init_db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import (
    images_router,
    notifications_router,
    requests_router,
    workorders_router,
)

from utils import PICTURES_DIR

SHOULD_INIT_DB = os.getenv("INIT_DB_WITH_METADATA", "1") == "1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if SHOULD_INIT_DB:
        print("[Startup] Initializing database...")
        init_db()
        print("[Startup] Database initialized successfully")
    else:
        print(
            "[Startup] Skipping database initialization. Using Alembic migrations instead."
        )
    yield
    print("[Shutdown] Application shutting down...")


app = FastAPI(
    title="Eureka CMMS API",
    version="1.0.0",
    description="Backend API for Eureka CMMS - Computerized Maintenance Management System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
        "http://localhost:5000/",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(images_router)
app.include_router(requests_router)
app.include_router(workorders_router)
app.include_router(notifications_router)


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Check if API is healthy"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info"""
    return {
        "name": "Eureka CMMS API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


app.mount("/storage/pictures", StaticFiles(directory=PICTURES_DIR), name="pictures")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
