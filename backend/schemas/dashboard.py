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


class RecentWorkOrder(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: str
    priority: str
    assignedTo: Optional[str]
    createdBy: Optional[str]
    createdAt: str
    dueDate: Optional[str]


class Alert(BaseModel):
    id: int
    type: str  # "overdue", "high_priority", "unassigned"
    title: str
    message: str
    workOrderId: Optional[str]
    priority: str
    createdAt: str
    assignedTo: Optional[str]
    dueDate: Optional[str]
    daysOverdue: Optional[int]
    createdBy: Optional[str]
    status: Optional[str]
    description: Optional[str]


class DashboardStats(BaseModel):
    statusCounts: StatusCounts
    averageCompletionTime: Optional[AverageCompletionTime]
    dailyWorkOrders: List[DailyWorkOrderPoint]
    priorityDistribution: PriorityDistribution
    overdueCount: int
    workOrdersByAssignee: List[WorkOrdersByAssignee]
    recentWorkOrders: List[RecentWorkOrder]
    alerts: List[Alert]


