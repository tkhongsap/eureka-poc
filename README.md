<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Eureka CMMS - ระบบจัดการงานซ่อมบำรุง

**Eureka CMMS** (Computerized Maintenance Management System) เป็นระบบจัดการงานซ่อมบำรุงที่ช่วยติดตามคำขอซ่อม (Requests), ใบสั่งงาน (Work Orders), สินค้าคงคลัง (Inventory) และตารางทีมช่าง

## 🚀 Features

- **📋 Work Orders** - จัดการใบสั่งงานแบบ Kanban Board (Open, In Progress, Completed)
- **📝 Request Portal** - ส่งคำขอซ่อมพร้อมแนบรูปภาพ
- **📦 Inventory** - จัดการอะไหล่และสินค้าคงคลัง
- **👥 Team Schedule** - ตารางงานทีมช่าง
- **🤖 AI Analysis** - วิเคราะห์ปัญหาด้วย Gemini AI
- **📸 Image Upload** - อัพโหลดรูปภาพประกอบงาน

---

## 📁 โครงสร้างโปรเจค

```
eureka/
├── components/          # React Components
│   ├── Dashboard.tsx    # หน้า Dashboard
│   ├── WorkOrders.tsx   # จัดการใบสั่งงาน
│   ├── WorkRequestPortal.tsx  # ส่งคำขอซ่อม
│   ├── Inventory.tsx    # คลังอะไหล่
│   ├── TeamSchedule.tsx # ตารางทีมช่าง
│   ├── Sidebar.tsx      # เมนูด้านข้าง
│   └── Header.tsx       # ส่วนหัว
├── services/            # Services
│   ├── apiService.ts    # เชื่อมต่อ Backend API
│   ├── geminiService.ts # Gemini AI Service
│   └── storageService.ts # Local Storage (deprecated)
├── backend/             # Python FastAPI Backend
│   ├── main.py          # Entry point
│   ├── routes/          # API Routes
│   ├── models/          # Pydantic Models
│   └── utils/           # Utilities
├── storage/             # ที่เก็บข้อมูล (auto-generated)
│   ├── pictures/        # รูปภาพที่อัพโหลด
│   └── information/     # JSON data files
├── App.tsx              # Main App Component
├── index.tsx            # Entry point
└── vite.config.ts       # Vite config
```

---

## 🔧 Backend API (FastAPI)

### Models (`backend/models/`)

| File | Description |
|------|-------------|
| `image.py` | **ImageInfo** - ข้อมูลรูปภาพ (id, filename, createdAt) |
| `request.py` | **RequestItem/Create/Update** - คำขอซ่อม (location, priority, description, imageIds) |
| `workorder.py` | **WorkOrder/Create/Update** - ใบสั่งงาน (title, assetName, status, assignedTo, dueDate) |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/images/upload` | อัพโหลดรูปภาพ |
| `GET` | `/api/images/{id}` | ดึงรูปภาพ |
| `GET` | `/api/images` | รายการรูปภาพทั้งหมด |
| `POST` | `/api/requests` | สร้างคำขอซ่อม |
| `GET` | `/api/requests` | รายการคำขอทั้งหมด |
| `GET` | `/api/requests/{id}` | ดึงคำขอเฉพาะ |
| `PUT` | `/api/requests/{id}` | อัพเดทคำขอ |
| `DELETE` | `/api/requests/{id}` | ลบคำขอ |
| `POST` | `/api/workorders` | สร้างใบสั่งงาน |
| `GET` | `/api/workorders` | รายการใบสั่งงานทั้งหมด |
| `PUT` | `/api/workorders/{id}` | อัพเดทใบสั่งงาน |
| `DELETE` | `/api/workorders/{id}` | ลบใบสั่งงาน |
| `GET` | `/api/health` | Health check |

### Storage (`storage/`)

```
storage/
├── pictures/            # รูปภาพ (IMG-xxx.jpg, .png, etc.)
└── information/
    ├── requests.json    # ข้อมูลคำขอซ่อม
    ├── workorders.json  # ข้อมูลใบสั่งงาน
    └── images.json      # metadata รูปภาพ
```

> 📝 **Note:** โฟลเดอร์ `storage/` จะถูกสร้างอัตโนมัติเมื่อ backend เริ่มทำงาน

---

## 🏃 วิธีรันโปรเจค

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Conda** (recommended) หรือ pip

### 1. ติดตั้ง Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
pip install fastapi uvicorn aiofiles python-multipart
```

หรือใช้ Conda:
```bash
conda create -n eureka python=3.11
conda activate eureka
pip install fastapi uvicorn aiofiles python-multipart
```

### 2. ตั้งค่า Environment

สร้างไฟล์ `.env.local` และใส่ Gemini API Key:
```
GEMINI_API_KEY=your_api_key_here
```

### 3. รันโปรเจค

**วิธีง่ายๆ (Windows):**
```bash
# รันทั้ง frontend และ backend
.\start_all.bat
```

**หรือรันแยก:**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 4. เปิดใช้งาน

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📊 Data Flow

```
User Request → WorkRequestPortal → API → storage/information/requests.json
                                      ↓
                               Auto-create Work Order
                                      ↓
                               WorkOrders (Kanban)
                                      ↓
                               Update status, assign tech
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Backend | Python, FastAPI, Pydantic |
| AI | Google Gemini API |
| Storage | JSON files (local), localStorage (fallback) |

---

## 📝 License

MIT License
