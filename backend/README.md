# Eureka CMMS Backend API

Backend API สำหรับระบบ Eureka CMMS ใช้ FastAPI

## โครงสร้างโปรเจค

```
backend/
├── main.py              # FastAPI application หลัก
├── run.py               # Runner script
├── requirements.txt     # Python dependencies
├── README.md
├── models/              # Pydantic models
│   ├── __init__.py
│   ├── image.py         # Image model
│   ├── request.py       # Request models
│   └── workorder.py     # Work Order models
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
