from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class SiteBase(BaseModel):
    site_name: str
    tenant_id: int


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    site_name: Optional[str] = None
    tenant_id: Optional[int] = None


class Site(SiteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
