from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class TenantBase(BaseModel):
    tenant_name: str
    owner: str


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    tenant_name: Optional[str] = None
    owner: Optional[str] = None


class Tenant(TenantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
