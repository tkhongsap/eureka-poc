<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Eureka CMMS - ระบบจัดการงานซ่อมบำรุง

**Eureka CMMS** (Computerized Maintenance Management System) เป็นระบบจัดการงานซ่อมบำรุงที่ช่วยติดตามคำขอซ่อม (Requests), ใบสั่งงาน (Work Orders), สินค้าคงคลัง (Inventory) และตารางทีมช่าง พร้อมระบบ AI สำหรับวิเคราะห์และทำนายปัญหาการซ่อมบำรุง

## 📋 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Development Guide](#-development-guide)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

### Core Features

- **📋 Work Orders Management**
  - Kanban board interface (Open, In Progress, Completed)
  - Drag-and-drop status updates
  - Priority-based sorting (Critical, High, Medium, Low)
  - Assignment to technicians
  - Due date tracking
  - Parts usage tracking
  - Technician notes and images

- **📝 Request Portal**
  - Submit maintenance requests with detailed descriptions
  - Image attachments support
  - Location and priority selection
  - Auto-generation of work orders from requests
  - Request status tracking

- **📦 Inventory Management**
  - Track spare parts and supplies
  - SKU management
  - Reorder point (ROP) alerts
  - Quantity tracking
  - Cost tracking
  - Location-based inventory
  - Category organization
  - AI-powered inventory predictions

- **👥 Team Schedule**
  - Technician availability tracking
  - Current task assignment
  - Skills management
  - Status indicators (Available, Busy, Off-Shift, On-Leave)
  - Workload visualization

- **🏗️ Asset Hierarchy**
  - Hierarchical asset structure
  - Asset health scoring
  - Criticality levels
  - Maintenance history
  - Parent-child relationships
  - Location tracking

- **📊 Dashboard & Analytics**
  - Real-time KPIs
  - Work order statistics
  - Performance metrics
  - Trend analysis
  - Visual charts and graphs

### AI-Powered Features

- **🤖 Issue Analysis**
  - Root cause analysis using Google Gemini AI
  - Recommended maintenance actions
  - Safety precautions identification
  - Estimated repair time prediction

- **📋 Smart Checklists**
  - AI-generated preventive maintenance checklists
  - Asset-type specific recommendations

- **🔮 Asset Reliability Analysis**
  - Historical data analysis
  - Health score predictions
  - Maintenance frequency recommendations

- **📈 Inventory Predictions**
  - Low stock alerts
  - Usage pattern analysis
  - Reorder recommendations

- **✍️ Title Generation**
  - Automatic work order title generation from descriptions
  - Multi-language support (English/Thai)

### User Management

- **🔐 Role-Based Access Control**
  - **Admin**: Full system access
  - **Technician**: Work order management, inventory updates
  - **Requester**: Submit requests, view assigned work orders
  - Session-based authentication
  - Secure login system

---

## 📁 Project Structure

```
eureka/
├── components/                  # React UI Components
│   ├── Dashboard.tsx            # Main dashboard with KPIs and charts
│   ├── WorkOrders.tsx          # Kanban board for work orders
│   ├── WorkRequestPortal.tsx   # Request submission form
│   ├── Inventory.tsx            # Inventory management interface
│   ├── TeamSchedule.tsx        # Technician schedule view
│   ├── AssetHierarchy.tsx      # Asset tree structure
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── Header.tsx              # Top navigation bar
│   └── LandingPage.tsx         # Public landing page
│
├── pages/                       # Page-level Components
│   ├── LoginPage.tsx           # Authentication page
│   └── RequestPortalPage.tsx   # Public request portal
│
├── services/                    # Business Logic Services
│   ├── apiService.ts           # Backend API client
│   ├── geminiService.ts        # Google Gemini AI integration
│   └── storageService.ts       # Local storage (deprecated)
│
├── backend/                     # Python FastAPI Backend
│   ├── main.py                 # FastAPI application entry point
│   ├── run.py                  # Development server runner
│   ├── requirements.txt        # Python dependencies
│   ├── README.md              # Backend documentation
│   │
│   ├── routes/                 # API Route Handlers
│   │   ├── __init__.py
│   │   ├── images.py          # Image upload/download endpoints
│   │   ├── requests.py        # Maintenance request endpoints
│   │   └── workorders.py      # Work order endpoints
│   │
│   ├── models/                 # Pydantic Data Models
│   │   ├── __init__.py
│   │   ├── image.py           # ImageInfo model
│   │   ├── request.py         # Request models (Create/Update/Item)
│   │   └── workorder.py       # WorkOrder models (Create/Update/Item)
│   │
│   └── utils/                   # Utility Functions
│       ├── __init__.py
│       ├── helpers.py          # Helper functions
│       └── storage.py          # File storage configuration
│
├── storage/                     # Data Storage (auto-generated)
│   ├── pictures/               # Uploaded images
│   └── information/            # JSON data files
│       ├── requests.json       # Maintenance requests data
│       ├── workorders.json     # Work orders data
│       └── images.json         # Image metadata
│
├── types.ts                     # TypeScript type definitions
├── App.tsx                      # Main React application component
├── index.tsx                    # React entry point
├── index.html                   # HTML template
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Node.js dependencies
├── start_all.bat               # Windows startup script
├── start_backend.bat           # Backend startup script
├── start_frontend.bat          # Frontend startup script
└── README.md                   # This file
```

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  React 19 + TypeScript + Tailwind CSS + Vite                │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Dashboard│  │WorkOrders│  │ Inventory│  │  Team    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Services Layer (apiService.ts)              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
│              Python 3.10+ + FastAPI + Pydantic              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Images  │  │ Requests │  │WorkOrders│                 │
│  │  Router  │  │  Router  │  │  Router  │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Storage Layer (JSON Files)                    │  │
│  │  storage/information/{requests,workorders,images}.json│  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ API Calls
┌─────────────────────────────────────────────────────────────┐
│                      External Services                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Google Gemini AI API                          │  │
│  │  (Issue Analysis, Predictions, Title Generation)     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User submits request
   ↓
2. RequestPortalPage → POST /api/requests
   ↓
3. Backend creates request → saves to requests.json
   ↓
4. Backend auto-creates work order → saves to workorders.json
   ↓
5. Frontend polls/refreshes → displays in WorkOrders Kanban
   ↓
6. Technician updates status → PUT /api/workorders/{id}
   ↓
7. Status updated in workorders.json
   ↓
8. UI reflects changes in real-time
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | React | 19.2.0 | UI library |
| **Language** | TypeScript | 5.8.2 | Type safety |
| **Build Tool** | Vite | 6.2.0 | Fast build & dev server |
| **Styling** | Tailwind CSS | Latest | Utility-first CSS |
| **Routing** | React Router | 7.9.6 | Client-side routing |
| **Icons** | Lucide React | 0.554.0 | Icon library |
| **Charts** | Recharts | 3.5.0 | Data visualization |
| **Backend Framework** | FastAPI | 0.104.1 | Python web framework |
| **Python Version** | Python | 3.10+ | Runtime |
| **ASGI Server** | Uvicorn | 0.24.0 | ASGI server |
| **Data Validation** | Pydantic | 2.5.2 | Data models |
| **File Handling** | aiofiles | 23.2.1 | Async file operations |
| **AI Service** | Google Gemini | 1.30.0 | AI analysis |
| **Storage** | JSON Files | - | Local data persistence |

---

## 🏃 Installation

### Prerequisites

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Python** v3.10 or higher ([Download](https://www.python.org/downloads/))
- **npm** (comes with Node.js) or **yarn**
- **Git** (for cloning the repository)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd eureka-cmms
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- React and React DOM
- TypeScript and type definitions
- Vite and plugins
- Tailwind CSS
- React Router
- Lucide React icons
- Recharts
- Google Gemini AI SDK

### Step 3: Install Backend Dependencies

**Option A: Using pip (Recommended)**

```bash
cd backend
pip install -r requirements.txt
```

**Option B: Using Conda/Virtual Environment**

```bash
# Create virtual environment
conda create -n eureka python=3.11
conda activate eureka

# Or using venv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

**Backend Dependencies:**
- `fastapi==0.104.1` - Web framework
- `uvicorn==0.24.0` - ASGI server
- `python-multipart==0.0.6` - File upload support
- `aiofiles==23.2.1` - Async file operations
- `pydantic==2.5.2` - Data validation

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Google Gemini API Key (Required for AI features)
API_KEY=your_gemini_api_key_here
```

**Getting a Gemini API Key:**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Paste it into your `.env` file

> ⚠️ **Important:** 
> - Never commit `.env` files to version control
> - If no API key is provided, the system will use mock data for AI features
> - The API key is used only for AI-powered features (analysis, predictions, title generation)

### Backend Configuration

The backend automatically creates the `storage/` directory structure on first run:

```
storage/
├── pictures/          # Created automatically
└── information/       # Created automatically
    ├── requests.json
    ├── workorders.json
    └── images.json
```

### Frontend Configuration

The frontend automatically detects the backend URL:
- **Local Development**: `http://localhost:8000/api`
- **Replit Deployment**: Auto-detects Replit URL pattern

---

## 🚀 Usage

### Starting the Application

**Option 1: Using Batch Scripts (Windows)**

```bash
# Start both frontend and backend
.\start_all.bat
```

**Option 2: Manual Start (All Platforms)**

**Terminal 1 - Start Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

### Accessing the Application

Once both servers are running:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **API Documentation (ReDoc)**: http://localhost:8000/redoc

### Basic Workflow

1. **Login** → Access the login page and authenticate
2. **Submit Request** → Navigate to Request Portal, fill form, attach images
3. **View Work Orders** → Work order automatically created, visible in Kanban board
4. **Assign Technician** → Drag work order to technician or use assignment dropdown
5. **Update Status** → Drag work order between columns (Open → In Progress → Completed)
6. **Track Inventory** → View and manage spare parts in Inventory section
7. **Monitor Dashboard** → View KPIs and analytics on Dashboard

---

## 📚 API Documentation

### Base URL

- **Local**: `http://localhost:8000/api`
- **Replit**: Auto-detected based on hostname

### Authentication

Currently, the API uses session-based authentication managed by the frontend. All API requests are made from authenticated sessions.

### Endpoints Overview

#### Images

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/images/upload` | Upload image | `FormData` (file) | `ImageInfo` |
| `GET` | `/api/images/{id}` | Get image file | - | Image file |
| `GET` | `/api/images` | List all images | - | `ImageInfo[]` |
| `DELETE` | `/api/images/{id}` | Delete image | - | `200 OK` |

**Example: Upload Image**
```bash
curl -X POST "http://localhost:8000/api/images/upload" \
  -F "file=@image.jpg"
```

**Response:**
```json
{
  "id": "IMG-20241024-abc123",
  "originalName": "image.jpg",
  "filename": "IMG-20241024-abc123.jpg",
  "createdAt": "2024-10-24T10:30:00"
}
```

#### Requests

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/requests` | Create request | `RequestCreate` | `RequestItem` |
| `GET` | `/api/requests` | List all requests | - | `RequestItem[]` |
| `GET` | `/api/requests/{id}` | Get request | - | `RequestItem` |
| `PUT` | `/api/requests/{id}` | Update request | `RequestUpdate` | `RequestItem` |
| `DELETE` | `/api/requests/{id}` | Delete request | - | `200 OK` |

**Example: Create Request**
```bash
curl -X POST "http://localhost:8000/api/requests" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Building A, Floor 2",
    "priority": "High",
    "description": "AC unit not cooling properly",
    "imageIds": ["IMG-20241024-abc123"],
    "createdBy": "user"
  }'
```

**Response:**
```json
{
  "id": "REQ-20241024-xyz789",
  "location": "Building A, Floor 2",
  "priority": "High",
  "description": "AC unit not cooling properly",
  "status": "Open",
  "createdAt": "2024-10-24T10:35:00",
  "imageIds": ["IMG-20241024-abc123"],
  "createdBy": "user"
}
```

#### Work Orders

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/workorders` | Create work order | `WorkOrderCreate` | `WorkOrder` |
| `GET` | `/api/workorders` | List all work orders | - | `WorkOrder[]` |
| `GET` | `/api/workorders/{id}` | Get work order | - | `WorkOrder` |
| `PUT` | `/api/workorders/{id}` | Update work order | `WorkOrderUpdate` | `WorkOrder` |
| `DELETE` | `/api/workorders/{id}` | Delete work order | - | `200 OK` |

**Example: Update Work Order Status**
```bash
curl -X PUT "http://localhost:8000/api/workorders/WO-2024-001" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress",
    "assignedTo": "John Doe"
  }'
```

#### Health Check

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/health` | Health check | `HealthStatus` |

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-10-24T10:40:00",
  "version": "1.0.0"
}
```

### Data Models

#### RequestItem
```typescript
{
  id: string;              // Format: "REQ-YYYYMMDD-xxxxxx"
  location: string;        // e.g., "Building A, Floor 2"
  priority: string;        // "Critical" | "High" | "Medium" | "Low"
  description: string;     // Detailed description
  status: string;          // "Open" | "In Progress" | "Completed" | "Closed"
  createdAt: string;       // ISO 8601 datetime
  imageIds: string[];      // Array of image IDs
  assignedTo?: string;     // Technician name (optional)
  createdBy?: string;      // Username (optional)
}
```

#### WorkOrder
```typescript
{
  id: string;              // Format: "WO-YYYY-###"
  title: string;           // Work order title
  description: string;     // Detailed description
  assetName: string;       // Asset/equipment name
  location: string;        // Physical location
  priority: Priority;      // Critical | High | Medium | Low
  status: Status;          // Open | In Progress | Pending | Completed | Closed
  assignedTo?: string;     // Technician name
  dueDate: string;         // YYYY-MM-DD format
  createdAt: string;       // ISO 8601 datetime
  partsUsed?: PartUsage[]; // Array of parts used
  imageIds?: string[];     // Attached images
  requestId?: string;      // Original request ID
  technicianNotes?: string;
  technicianImages?: string[];
}
```

### Interactive API Documentation

When the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide interactive documentation where you can test endpoints directly.

---

## 💻 Development Guide

### Project Setup for Development

1. **Clone and Install** (see Installation section)
2. **Set up Environment** (create `.env` file)
3. **Start Development Servers**

### Development Scripts

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

**Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
# Or use the run script:
python run.py
```

### Code Structure Guidelines

**Frontend Components:**
- Use functional components with hooks
- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Keep components focused and reusable
- Use services for API calls

**Backend:**
- Follow FastAPI best practices
- Use Pydantic models for validation
- Keep routes focused on single resources
- Use async/await for I/O operations
- Store data in JSON files (can be migrated to database later)

### Adding New Features

1. **Backend API:**
   - Create model in `backend/models/`
   - Create route in `backend/routes/`
   - Register route in `backend/main.py`
   - Update storage utilities if needed

2. **Frontend:**
   - Create component in `components/` or `pages/`
   - Add service method in `services/apiService.ts`
   - Update types in `types.ts` if needed
   - Add route in `App.tsx` or `index.tsx`

### Testing

Currently, the project uses manual testing. For automated testing:

**Frontend Testing:**
- Consider adding Vitest or Jest
- Test components with React Testing Library

**Backend Testing:**
- Consider adding pytest
- Test API endpoints with TestClient

### Code Style

- **TypeScript/JavaScript**: Follow ESLint/Prettier (if configured)
- **Python**: Follow PEP 8
- **Naming**: Use descriptive names, camelCase for JS/TS, snake_case for Python

---

## 🔧 Troubleshooting

### Common Issues

#### Backend won't start

**Problem:** `ModuleNotFoundError` or import errors

**Solution:**
```bash
cd backend
pip install -r requirements.txt
# Make sure you're in the correct virtual environment
```

#### Frontend can't connect to backend

**Problem:** CORS errors or connection refused

**Solution:**
1. Ensure backend is running on port 8000
2. Check `backend/main.py` CORS settings
3. Verify API_BASE_URL in `services/apiService.ts`
4. Check browser console for specific errors

#### Images not uploading

**Problem:** Upload fails or images not displaying

**Solution:**
1. Check `storage/pictures/` directory exists
2. Verify file permissions
3. Check backend logs for errors
4. Ensure `python-multipart` is installed

#### AI features not working

**Problem:** AI analysis returns mock data

**Solution:**
1. Check `.env` file exists and contains `API_KEY`
2. Verify API key is valid
3. Check browser console for API errors
4. Ensure `@google/genai` package is installed

#### Port already in use

**Problem:** `Address already in use` error

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use different port
python -m uvicorn main:app --reload --port 8001
```

#### Build errors

**Problem:** TypeScript or build errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

### Debugging Tips

1. **Backend Logs**: Check terminal where backend is running
2. **Frontend Console**: Open browser DevTools (F12)
3. **Network Tab**: Check API requests/responses
4. **API Docs**: Use Swagger UI to test endpoints directly

---

## 🚢 Deployment

### Production Build

**Frontend:**
```bash
npm run build
# Output in dist/ directory
```

**Backend:**
```bash
# Use production ASGI server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Environment Considerations

**Production Checklist:**
- [ ] Set secure API keys in environment variables
- [ ] Enable HTTPS
- [ ] Configure CORS properly (restrict origins)
- [ ] Set up proper database (replace JSON files)
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Enable rate limiting
- [ ] Set up backups for storage directory

### Deployment Platforms

**Replit:**
- Already configured for Replit deployment
- Auto-detects Replit URL pattern
- See `replit.md` for details

**Docker (Future):**
```dockerfile
# Example Dockerfile structure
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
```

**Cloud Platforms:**
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, Fly.io, AWS, GCP

---

## 🔒 Security Considerations

### Current Security Status

⚠️ **Note:** This is a demo/development system. For production:

1. **Authentication**: Implement proper JWT or OAuth2
2. **Authorization**: Add role-based access control at API level
3. **Input Validation**: Already handled by Pydantic models
4. **File Upload**: Add file type/size validation
5. **API Keys**: Store securely, never commit to repository
6. **HTTPS**: Always use HTTPS in production
7. **CORS**: Restrict allowed origins
8. **Rate Limiting**: Add rate limiting to prevent abuse
9. **SQL Injection**: N/A (using JSON files), but migrate to parameterized queries when using database
10. **XSS**: React automatically escapes, but validate user inputs

### Best Practices

- Never commit `.env` files
- Use environment variables for secrets
- Regularly update dependencies
- Implement proper logging
- Set up monitoring and alerts

---

## 📊 Performance Considerations

### Current Limitations

- **Storage**: JSON files are fine for small-scale use, but consider database for production
- **Concurrency**: File-based storage may have race conditions with high concurrency
- **Scalability**: Single-server architecture, consider microservices for scale

### Optimization Tips

1. **Frontend:**
   - Code splitting for large components
   - Image optimization and lazy loading
   - Memoization for expensive computations

2. **Backend:**
   - Database migration for better performance
   - Caching for frequently accessed data
   - Async operations for I/O

3. **AI Features:**
   - Cache AI responses when possible
   - Batch requests when appropriate
   - Use appropriate model (flash vs. pro)

---

## 🗺️ Roadmap & Future Enhancements

### Planned Features

- [ ] Database integration (PostgreSQL/MySQL)
- [ ] Real-time notifications
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Advanced reporting and analytics
- [ ] Multi-language support (i18n)
- [ ] Calendar integration
- [ ] Barcode/QR code scanning
- [ ] Document management
- [ ] Vendor management
- [ ] Purchase orders
- [ ] Preventive maintenance scheduling
- [ ] Equipment warranty tracking
- [ ] Cost tracking and budgeting

### Technical Improvements

- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Kubernetes deployment configs
- [ ] API versioning
- [ ] GraphQL API option
- [ ] WebSocket for real-time updates
- [ ] Advanced caching strategies

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow code style guidelines
   - Add comments for complex logic
   - Update documentation as needed
4. **Test your changes**
   - Test manually
   - Ensure no breaking changes
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**
   - Provide clear description
   - Reference any related issues
   - Include screenshots if UI changes

### Contribution Guidelines

- Write clear, descriptive commit messages
- Keep PRs focused on single features
- Update documentation for new features
- Follow existing code patterns
- Add tests when possible

---

## 📝 License

MIT License

Copyright (c) 2024 Eureka CMMS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 📧 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: See `/docs` directory (if available)

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful AI capabilities
- **FastAPI** team for excellent framework
- **React** team for amazing UI library
- **Tailwind CSS** for beautiful styling
- All open-source contributors and libraries used in this project

---

<div align="center">
Made with ❤️ by the Eureka CMMS Team
</div>
