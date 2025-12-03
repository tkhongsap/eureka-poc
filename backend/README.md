# Eureka CMMS Backend API

Backend API สำหรับระบบ Eureka CMMS ใช้ FastAPI

## โครงสร้างโปรเจค

```
backend/
├── main.py              # FastAPI application หลัก
├── run.py               # Runner script
├── requirements.txt     # Python dependencies
├── README.md
├── schemas/             # Pydantic schemas (request/response models)
│   ├── __init__.py
│   ├── image.py         # Image model
│   ├── request.py       # Request schemas
│   └── workorder.py     # Work Order schemas
├── routes/              # API routes
│   ├── __init__.py
│   ├── images.py        # /api/images endpoints
│   ├── requests.py      # /api/requests endpoints
│   └── workorders.py    # /api/workorders endpoints
└── utils/               # Utility functions
    ├── __init__.py
    ├── helpers.py       # Helper functions
    └── storage.py       # Storage configuration
```

## การติดตั้ง

```bash
cd backend
pip install -r requirements.txt
```

## การรัน

```bash
python run.py
```

หรือ

```bash
uvicorn main:app --reload --port 8000
```

## API Documentation

เมื่อ server รันแล้ว สามารถดู API docs ได้ที่:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Images
- `POST /api/images/upload` - อัปโหลดรูปภาพ
- `GET /api/images/{image_id}` - ดึงรูปภาพ
- `GET /api/images` - รายการรูปภาพทั้งหมด
- `DELETE /api/images/{image_id}` - ลบรูปภาพ

### Requests
- `POST /api/requests` - สร้าง Request ใหม่
- `GET /api/requests` - รายการ Request ทั้งหมด
- `GET /api/requests/{request_id}` - ดึง Request
- `PUT /api/requests/{request_id}` - อัปเดต Request
- `DELETE /api/requests/{request_id}` - ลบ Request
- `POST /api/requests/{request_id}/convert` - แปลง Request เป็น Work Order

### Work Orders
- `POST /api/workorders` - สร้าง Work Order ใหม่
- `GET /api/workorders` - รายการ Work Order ทั้งหมด
- `GET /api/workorders/{wo_id}` - ดึง Work Order
- `PUT /api/workorders/{wo_id}` - อัปเดต Work Order
- `DELETE /api/workorders/{wo_id}` - ลบ Work Order

## โครงสร้างไฟล์

```
backend/
├── main.py           # FastAPI application
├── run.py            # Runner script
├── requirements.txt  # Python dependencies
└── README.md

storage/
├── pictures/         # เก็บไฟล์รูปภาพ
└── information/      # เก็บข้อมูล JSON
    ├── requests.json
    ├── workorders.json
    └── images.json
```

## Database Migrations with Alembic

This backend uses **Alembic** to manage database schema changes (tables, columns, constraints) for the SQLAlchemy models under `db/models/`.

### Prerequisites

- Python venv activated
- Dependencies installed:
```bash
cd backend
pip install -r requirements.txt
```

- `DATABASE_URL` set in the environment (or `.env` at project root), e.g.:
```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/eureka
```

### 1. Initial schema (first time only)

On a new database:
```bash
cd backend
alembic revision --autogenerate -m "initial_tables"
alembic upgrade head
```
This will create an initial migration under `alembic/versions/` and apply it.

### 2. Updating the schema after model changes

Whenever you change SQLAlchemy models in `db/models/*.py` (add/remove/rename columns, new tables, etc.):

1. **Generate a migration script**:
```bash
cd backend
alembic revision --autogenerate -m "describe_the_change"
```
2. **Review the generated file** in `backend/alembic/versions/`  
   - Check `upgrade()` and `downgrade()` to ensure the operations match your intent.

3. **Apply the migration** to the database:
```bash
alembic upgrade head
```
### 3. Downgrading (rolling back)

To revert the last migration (for development only):
```bash
alembic downgrade -1
```
Or to go back to a specific revision:
```bash
alembic downgrade <revision_id>
```
You can see the current revision with:

```bash
alembic current
```
### 4. App startup vs Alembic

- The app **does not** call `Base.metadata.create_all()` on startup.
- All schema changes must go through **Alembic**:
  - Generate migration with `alembic revision --autogenerate ...`
  - Apply with `alembic upgrade head`.

This keeps database structure consistent across all environments and under version control.

## Running tests (pytest)

### Basic commands

- **รันทุก test ของ backend**

```bash
cd backend
python -m pytest
```

- **รันเฉพาะไฟล์**

```bash
cd backend
python -m pytest tests/test_images.py
python -m pytest tests/test_notifications.py
python -m pytest tests/test_workorders.py
python -m pytest tests/test_requests.py
```

- **รันเฉพาะ test หนึ่งตัว**

```bash
cd backend
python -m pytest tests/test_notifications.py::test_delete_single_notification
python -m pytest tests/test_images.py::test_upload_image
```