import uuid
from datetime import datetime


def generate_id(prefix: str) -> str:
    """Generate unique ID with prefix"""
    return f"{prefix}-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"


def get_current_date() -> str:
    """Get current date as string"""
    return datetime.now().isoformat().split("T")[0]


def get_current_datetime() -> str:
    """Get current datetime as ISO string"""
    return datetime.now().isoformat()
