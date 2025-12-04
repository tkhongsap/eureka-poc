from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from typing import List

from db import get_db
from db.models import WorkOrder as WorkOrderModel
from fastapi import APIRouter, Depends
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from schemas.dashboard import (
    AverageCompletionTime,
    DashboardStats,
    DailyWorkOrderPoint,
    PriorityDistribution,
    StatusCounts,
    WorkOrdersByAssignee,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)) -> DashboardStats:
    """Return aggregated statistics for the operations dashboard."""
    # --- Status counts ---
    status_rows = (
        db.query(WorkOrderModel.status, func.count(WorkOrderModel.id))
        .group_by(WorkOrderModel.status)
        .all()
    )
    status_counter = Counter({row[0] or "Unknown": row[1] for row in status_rows})

    status_counts = StatusCounts(
        open=status_counter.get("Open", 0),
        inProgress=status_counter.get("In Progress", 0),
        pending=status_counter.get("Pending", 0),
        completed=status_counter.get("Completed", 0),
        closed=status_counter.get("Closed", 0),
    )

    # --- Average completion time (created_at -> closed_at/approved_at) ---
    completed_q = db.query(WorkOrderModel).filter(
        WorkOrderModel.status.in_(["Completed", "Closed"]),
        WorkOrderModel.created_at.isnot(None),
    )

    durations: List[float] = []
    for wo in completed_q:
        end_time = wo.closed_at or wo.approved_at
        if not end_time:
            continue
        delta = end_time - wo.created_at
        durations.append(delta.total_seconds() / 3600.0)

    average_completion = None
    if durations:
        avg_hours = sum(durations) / len(durations)
        total_minutes = int(avg_hours * 60)
        days = total_minutes // (24 * 60)
        remainder_minutes = total_minutes % (24 * 60)
        hours = remainder_minutes // 60
        minutes = remainder_minutes % 60
        formatted_parts = []
        if days:
            formatted_parts.append(f"{days}d")
        if hours or (days and minutes):
            formatted_parts.append(f"{hours}h")
        if minutes and not days:
            formatted_parts.append(f"{minutes}m")

        average_completion = AverageCompletionTime(
            hours=round(avg_hours, 2),
            formattedText=" ".join(formatted_parts) or "0h",
        )

    # --- Daily work orders for last 7 days ---
    today = date.today()
    start_date = today - timedelta(days=6)

    created_rows = (
        db.query(func.date(WorkOrderModel.created_at), func.count(WorkOrderModel.id))
        .filter(
            and_(
                WorkOrderModel.created_at
                >= datetime.combine(start_date, datetime.min.time()),
                WorkOrderModel.created_at
                <= datetime.combine(today, datetime.max.time()),
            )
        )
        .group_by(func.date(WorkOrderModel.created_at))
        .all()
    )
    created_map = {}
    for dt_value, count in created_rows:
        if isinstance(dt_value, date):
            key = dt_value
        else:
            # SQLite may return a string 'YYYY-MM-DD'
            key = datetime.fromisoformat(str(dt_value)).date()
        created_map[key] = count

    completed_rows = (
        db.query(func.date(WorkOrderModel.approved_at), func.count(WorkOrderModel.id))
        .filter(
            and_(
                WorkOrderModel.approved_at.isnot(None),
                WorkOrderModel.approved_at
                >= datetime.combine(start_date, datetime.min.time()),
                WorkOrderModel.approved_at
                <= datetime.combine(today, datetime.max.time()),
            )
        )
        .group_by(func.date(WorkOrderModel.approved_at))
        .all()
    )
    completed_map = {}
    for dt_value, count in completed_rows:
        if isinstance(dt_value, date):
            key = dt_value
        else:
            key = datetime.fromisoformat(str(dt_value)).date()
        completed_map[key] = count

    daily_points: List[DailyWorkOrderPoint] = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        daily_points.append(
            DailyWorkOrderPoint(
                date=d,
                dayName=d.strftime("%a"),
                created=created_map.get(d, 0),
                completed=completed_map.get(d, 0),
            )
        )

    # --- Priority distribution ---
    priority_rows = (
        db.query(WorkOrderModel.priority, func.count(WorkOrderModel.id))
        .group_by(WorkOrderModel.priority)
        .all()
    )
    priority_counter = defaultdict(int)
    for prio, count in priority_rows:
        if prio is None:
            key = "other"
        else:
            p = prio.lower()
            if p in {"critical", "high", "medium", "low"}:
                key = p
            else:
                key = "other"
        priority_counter[key] += count

    priority_distribution = PriorityDistribution(
        critical=priority_counter.get("critical", 0),
        high=priority_counter.get("high", 0),
        medium=priority_counter.get("medium", 0),
        low=priority_counter.get("low", 0),
        other=priority_counter.get("other", 0),
    )

    # --- Overdue count (due_date < today and not Completed/Closed) ---
    overdue_count = (
        db.query(func.count(WorkOrderModel.id))
        .filter(
            WorkOrderModel.due_date.isnot(None),
            WorkOrderModel.due_date < today.isoformat(),
            WorkOrderModel.status.notin_(["Completed", "Closed"]),
        )
        .scalar()
        or 0
    )

    # --- Work orders by assignee ---
    assignee_rows = (
        db.query(WorkOrderModel.assigned_to, func.count(WorkOrderModel.id))
        .group_by(WorkOrderModel.assigned_to)
        .all()
    )
    assignees: List[WorkOrdersByAssignee] = []
    for name, count in assignee_rows:
        if not name:
            continue
        assignees.append(WorkOrdersByAssignee(name=name, count=count))

    return DashboardStats(
        statusCounts=status_counts,
        averageCompletionTime=average_completion,
        dailyWorkOrders=daily_points,
        priorityDistribution=priority_distribution,
        overdueCount=overdue_count,
        workOrdersByAssignee=assignees,
    )
