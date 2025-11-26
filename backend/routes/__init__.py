from .images import router as images_router
from .requests import router as requests_router
from .workorders import router as workorders_router

__all__ = [
    "images_router",
    "requests_router", 
    "workorders_router",
]
