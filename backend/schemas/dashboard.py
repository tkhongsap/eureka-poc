from datetime import date
from typing import Dict, List, Optional

from pydantic import BaseModel


class StatusCounts(BaseModel):
    open: int
    inProgress: int
    pending: int
    completed: int
    closed: int


class AverageCompletionTime(BaseModel):
    hours: float
    formattedText: str


class DailyWorkOrderPoint(BaseModel):
    date: date
    dayName: str
    created: int
    completed: int


class PriorityDistribution(BaseModel):
    critical: int
    high: int
    medium: int
    low: int
    other: int


class WorkOrdersByAssignee(BaseModel):
    name: str
    count: int


class DashboardStats(BaseModel):
    statusCounts: StatusCounts
    averageCompletionTime: Optional[AverageCompletionTime]
    dailyWorkOrders: List[DailyWorkOrderPoint]
    priorityDistribution: PriorityDistribution
    overdueCount: int
    workOrdersByAssignee: List[WorkOrdersByAssignee]


