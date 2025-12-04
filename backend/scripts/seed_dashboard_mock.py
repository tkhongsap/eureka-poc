"""
Seed script to generate mock Work Order data for Dashboard testing.
Run from backend folder: python scripts/seed_dashboard_mock.py
"""

import os
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load .env
project_root = Path(__file__).parent.parent.parent
load_dotenv(dotenv_path=project_root / ".env")

from db.session import SessionLocal
from db.models import WorkOrder


def generate_mock_workorders(count: int = 100):
    """Generate mock work orders for dashboard testing."""
    
    # Sample data pools
    titles = [
        "เครื่องปรับอากาศไม่เย็น",
        "ไฟฟ้าดับบางส่วน",
        "ท่อน้ำรั่ว",
        "ประตูเสีย",
        "ลิฟต์ทำงานผิดปกติ",
        "เครื่องพิมพ์เสีย",
        "คอมพิวเตอร์ช้า",
        "แอร์มีเสียงดัง",
        "หลอดไฟเสีย",
        "พัดลมไม่ทำงาน",
        "กุญแจห้องหาย",
        "เก้าอี้พัง",
        "โต๊ะชำรุด",
        "หน้าต่างปิดไม่สนิท",
        "พื้นชำรุด",
    ]
    
    assets = [
        "เครื่องปรับอากาศ Daikin",
        "ระบบไฟฟ้าหลัก",
        "ท่อประปา",
        "ประตูอัตโนมัติ",
        "ลิฟต์โดยสาร A",
        "เครื่องพิมพ์ HP LaserJet",
        "คอมพิวเตอร์ Dell",
        "เครื่องปรับอากาศ Samsung",
        "หลอด LED",
        "พัดลมดูดอากาศ",
        "กุญแจแม่เหล็ก",
        "เก้าอี้สำนักงาน",
        "โต๊ะทำงาน",
        "หน้าต่างอลูมิเนียม",
        "พื้นกระเบื้อง",
    ]
    
    locations = [
        "อาคาร A ชั้น 1",
        "อาคาร A ชั้น 2",
        "อาคาร A ชั้น 3",
        "อาคาร B ชั้น 1",
        "อาคาร B ชั้น 2",
        "อาคาร C ชั้น 1",
        "ห้องประชุมใหญ่",
        "ห้องประชุม 1",
        "ห้องประชุม 2",
        "โถงต้อนรับ",
        "ห้องพักพนักงาน",
        "โรงอาหาร",
        "ห้องเซิร์ฟเวอร์",
        "ห้องผู้บริหาร",
        "ห้องน้ำชั้น 1",
    ]
    
    technicians = [
        "สมชาย ใจดี",
        "สมหญิง รักงาน",
        "วิชัย เก่งซ่อม",
        "ประเสริฐ ชำนาญ",
        "อนันต์ มือทอง",
        None,  # Unassigned
    ]
    
    priorities = ["Critical", "High", "Medium", "Low"]
    priority_weights = [5, 15, 50, 30]  # Weighted distribution
    
    statuses = ["Open", "In Progress", "Pending", "Completed", "Closed"]
    status_weights = [20, 25, 10, 30, 15]  # Weighted distribution
    
    requesters = [
        "นายกิตติ สุขใจ",
        "นางสาวมาลี ดีใจ",
        "นายประยุทธ์ มั่นคง",
        "นางสาวสมศรี ใจดี",
        "นายวิชัย รักษ์งาน",
    ]
    
    workorders = []
    today = datetime.now()
    
    for i in range(count):
        # Generate random created_at within last 364 days (to match API query range)
        days_ago = random.randint(0, 364)
        hours_ago = random.randint(0, 23)
        created_at = today - timedelta(days=days_ago, hours=hours_ago)
        
        # Select status with weighted distribution
        status = random.choices(statuses, weights=status_weights)[0]
        
        # Generate completion data for completed/closed orders
        approved_at = None
        closed_at = None
        approved_by = None
        closed_by = None
        
        if status in ["Completed", "Closed"]:
            # Completion time: 1 hour to 7 days after creation
            completion_hours = random.randint(1, 168)
            approved_at = created_at + timedelta(hours=completion_hours)
            approved_by = random.choice(technicians[:-1])  # Exclude None
            
            if status == "Closed":
                # Closed 1-24 hours after approval
                closed_at = approved_at + timedelta(hours=random.randint(1, 24))
                closed_by = "Admin System"
        
        # Generate due date (some past, some future)
        due_offset = random.randint(-7, 14)
        due_date = (today + timedelta(days=due_offset)).strftime("%Y-%m-%d")
        
        # Select priority with weighted distribution
        priority = random.choices(priorities, weights=priority_weights)[0]
        
        # Build work order
        wo = WorkOrder(
            id=f"WO-{2024000 + i:06d}",
            title=random.choice(titles),
            description=f"รายละเอียดงานซ่อม: {random.choice(titles)}. กรุณาดำเนินการโดยเร็ว.",
            asset_name=random.choice(assets),
            location=random.choice(locations),
            priority=priority,
            status=status,
            assigned_to=random.choice(technicians) if status != "Open" else None,
            due_date=due_date,
            created_at=created_at,
            created_by=random.choice(requesters),
            approved_at=approved_at,
            approved_by=approved_by,
            closed_at=closed_at,
            closed_by=closed_by,
        )
        
        workorders.append(wo)
    
    return workorders


def seed_database(count: int = 100, clear_existing: bool = False):
    """Seed the database with mock work orders."""
    db = SessionLocal()
    
    try:
        if clear_existing:
            deleted = db.query(WorkOrder).delete()
            print(f"🗑️  Deleted {deleted} existing work orders")
        
        workorders = generate_mock_workorders(count)
        
        for wo in workorders:
            db.add(wo)
        
        db.commit()
        
        # Print summary
        print(f"\n✅ Successfully created {count} mock work orders!")
        print("\n📊 Summary:")
        
        # Count by status
        status_counts = {}
        priority_counts = {}
        
        for wo in workorders:
            status_counts[wo.status] = status_counts.get(wo.status, 0) + 1
            priority_counts[wo.priority] = priority_counts.get(wo.priority, 0) + 1
        
        print("\nBy Status:")
        for status, count in sorted(status_counts.items()):
            print(f"  • {status}: {count}")
        
        print("\nBy Priority:")
        for priority, count in sorted(priority_counts.items()):
            print(f"  • {priority}: {count}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed mock work orders for Dashboard")
    parser.add_argument(
        "-n", "--count",
        type=int,
        default=100,
        help="Number of work orders to create (default: 100)"
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing work orders before seeding"
    )
    
    args = parser.parse_args()
    
    print(f"🌱 Seeding {args.count} mock work orders...")
    if args.clear:
        print("⚠️  Will clear existing work orders first!")
    
    seed_database(count=args.count, clear_existing=args.clear)
