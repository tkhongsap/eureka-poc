from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from typing import List, Optional

from db import get_db
from db.models import WorkOrder as WorkOrderModel
from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from schemas.dashboard import (
    AverageCompletionTime,
    DashboardStats,
    DailyWorkOrderPoint,
    PriorityDistribution,
    StatusCounts,
    WorkOrdersByAssignee,
    RecentWorkOrder,
    Alert,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    days: int = Query(default=7, ge=1, le=365, description="Number of days for trend data"),
    db: Session = Depends(get_db)
) -> DashboardStats:
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
        completion_days = total_minutes // (24 * 60)
        remainder_minutes = total_minutes % (24 * 60)
        hours = remainder_minutes // 60
        minutes = remainder_minutes % 60
        formatted_parts = []
        if completion_days:
            formatted_parts.append(f"{completion_days}d")
        if hours or (completion_days and minutes):
            formatted_parts.append(f"{hours}h")
        if minutes and not completion_days:
            formatted_parts.append(f"{minutes}m")

        average_completion = AverageCompletionTime(
            hours=round(avg_hours, 2),
            formattedText=" ".join(formatted_parts) or "0h",
        )

    # --- Daily work orders for specified days ---
    today = date.today()
    start_date = today - timedelta(days=days - 1)

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
    for i in range(days):
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

    # --- Recent work orders (last 8) ---
    recent_wo_rows = (
        db.query(WorkOrderModel)
        .order_by(WorkOrderModel.created_at.desc())
        .limit(8)
        .all()
    )
    recent_work_orders: List[RecentWorkOrder] = []
    for wo in recent_wo_rows:
        recent_work_orders.append(
            RecentWorkOrder(
                id=wo.id,
                title=wo.title or f"WO-{wo.id}",
                description=wo.description,
                status=wo.status or "Open",
                priority=wo.priority or "Medium",
                assignedTo=wo.assigned_to,
                createdBy=wo.created_by,
                createdAt=wo.created_at.isoformat() if wo.created_at else "",
                dueDate=wo.due_date if wo.due_date else None,
            )
        )

    # --- Alerts (overdue, high priority unassigned, etc.) ---
    alerts: List[Alert] = []
    alert_id = 1

    # Overdue work orders
    overdue_wos = (
        db.query(WorkOrderModel)
        .filter(
            WorkOrderModel.due_date.isnot(None),
            WorkOrderModel.due_date < today.isoformat(),
            WorkOrderModel.status.notin_(["Completed", "Closed"]),
        )
        .order_by(WorkOrderModel.due_date.asc())
        .limit(10)
        .all()
    )
    for wo in overdue_wos:
        alerts.append(
            Alert(
                id=alert_id,
                type="overdue",
                title=f"Overdue: {wo.title or f'WO-{wo.id}'}",
                message=f"Due date was {wo.due_date}",
                workOrderId=wo.id,
                priority=wo.priority or "Medium",
                createdAt=wo.created_at.isoformat() if wo.created_at else "",
                assignedTo=wo.assigned_to,
            )
        )
        alert_id += 1

    # High/Critical priority unassigned
    unassigned_high = (
        db.query(WorkOrderModel)
        .filter(
            WorkOrderModel.priority.in_(["Critical", "High"]),
            WorkOrderModel.assigned_to.is_(None),
            WorkOrderModel.status.notin_(["Completed", "Closed"]),
        )
        .limit(5)
        .all()
    )
    for wo in unassigned_high:
        alerts.append(
            Alert(
                id=alert_id,
                type="unassigned",
                title=f"Unassigned: {wo.title or f'WO-{wo.id}'}",
                message=f"{wo.priority} priority work order needs assignment",
                workOrderId=wo.id,
                priority=wo.priority or "High",
                createdAt=wo.created_at.isoformat() if wo.created_at else "",
                assignedTo=wo.assigned_to,
            )
        )
        alert_id += 1

    return DashboardStats(
        statusCounts=status_counts,
        averageCompletionTime=average_completion,
        dailyWorkOrders=daily_points,
        priorityDistribution=priority_distribution,
        overdueCount=overdue_count,
        workOrdersByAssignee=assignees,
        recentWorkOrders=recent_work_orders,
        alerts=alerts,
    )
