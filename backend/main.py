from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime

from routes import images_router, requests_router, workorders_router, notifications_router
from utils import PICTURES_DIR

app = FastAPI(
    title="Eureka CMMS API",
    version="1.0.0",
    description="Backend API for Eureka CMMS - Computerized Maintenance Management System"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    # Explicit allowed origins to avoid strict proxy/preflight behavior
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
        "http://localhost:5000/",
    ],
    allow_credentials=True,
    # Explicitly enumerate methods to ensure PATCH/OPTIONS are permitted
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(images_router)
app.include_router(requests_router)
app.include_router(workorders_router)
app.include_router(notifications_router)


# Health Check
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Check if API is healthy"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info"""
    return {
        "name": "Eureka CMMS API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


# Mount static files for images
app.mount("/storage/pictures", StaticFiles(directory=PICTURES_DIR), name="pictures")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
