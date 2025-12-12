from .images import router as images_router
from .requests import router as requests_router
from .workorders import router as workorders_router
from .notifications import router as notifications_router
from .users import router as users_router
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .audit import router as audit_router
from .assets import router as assets_router
from .spare_parts import router as spare_parts_router

__all__ = [
    "images_router",
    "requests_router",
    "workorders_router",
    "notifications_router",
    "users_router",
    "auth_router",
    "dashboard_router",
    "audit_router",
]
