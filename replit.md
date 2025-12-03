# Eureka CMMS - Computerized Maintenance Management System

## Overview

Eureka CMMS is a comprehensive maintenance management system that helps track repair requests, work orders, inventory, and team schedules. The system features AI-powered analysis using Google Gemini to help diagnose maintenance issues.

**Current Status**: Fully configured and running on Replit with PostgreSQL database

## Project Architecture

### Tech Stack
- **Frontend**: React 19.2 + TypeScript + Vite 6.2 + Tailwind CSS
- **Backend**: Python 3.11 + FastAPI 0.104 + Uvicorn
- **Database**: PostgreSQL (Replit built-in) + SQLAlchemy 2.0
- **AI Integration**: Google Gemini API
- **Charts**: Recharts 3.5
- **Icons**: Lucide React

### Project Structure
```
eureka-cmms/
├── components/          # React UI components
│   ├── Dashboard.tsx
│   ├── WorkOrders.tsx
│   ├── WorkRequestPortal.tsx
│   ├── Inventory.tsx
│   ├── TeamSchedule.tsx
│   ├── AssetHierarchy.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
├── services/           # Frontend services
│   ├── apiService.ts   # Backend API client (auto-detects Replit URL)
│   └── geminiService.ts
├── backend/           # FastAPI backend
│   ├── main.py        # FastAPI app entry point
│   ├── database.py    # SQLAlchemy database connection
│   ├── db_models.py   # SQLAlchemy table models
│   ├── routes/        # API route handlers
│   ├── models/        # Pydantic data models
│   └── utils/         # Helper utilities
├── storage/           # File storage for images
│   └── pictures/      # Uploaded images
└── App.tsx           # Main React application
```

## Features

### Core Functionality
- **Work Orders Management** - Kanban board (Open, In Progress, Completed)
- **Request Portal** - Submit repair requests with image attachments
- **Inventory Management** - Track parts and supplies
- **Team Scheduling** - Manage technician schedules
- **AI Analysis** - Gemini-powered issue diagnosis
- **Image Upload** - Attach photos to work orders and requests
- **Notifications** - Workflow notifications for role-based updates

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/login` | Initiate Replit Auth login |
| GET | `/api/auth/callback` | OAuth callback handler |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/images/upload` | Upload image |
| GET | `/api/images/{id}` | Get image |
| GET | `/api/images` | List all images |
| POST | `/api/requests` | Create repair request |
| GET | `/api/requests` | List all requests |
| PUT | `/api/requests/{id}` | Update request |
| DELETE | `/api/requests/{id}` | Delete request |
| POST | `/api/workorders` | Create work order |
| GET | `/api/workorders` | List all work orders |
| PUT | `/api/workorders/{id}` | Update work order |
| DELETE | `/api/workorders/{id}` | Delete work order |
| GET | `/api/notifications` | List all notifications |
| POST | `/api/notifications` | Create notification |

## Recent Changes

### December 3, 2025 - Replit Auth Integration
- Added Google sign-in authentication using Replit Auth (OIDC provider)
- Updated User model with `replit_user_id` field for OAuth user linking
- Made `password_hash` and `email` nullable to support OAuth-only users
- Created OAuth model for token storage in database
- Added auth routes: `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`, `/api/auth/me`
- Updated LoginPage with "Sign in with Google" button
- Created AuthSuccessPage for handling OAuth callback
- Updated App.tsx to handle both legacy mock auth and Replit Auth users
- Configured Vite proxy to forward `/api` requests to backend on port 8000
- Installed authlib, httpx, itsdangerous, pyjwt packages for auth handling

### December 3, 2025 - Production Deployment Configuration
- Configured Tailwind CSS with @tailwindcss/postcss for proper production builds
- Updated backend main.py to serve static frontend files from dist/ folder
- Updated apiService.ts to automatically detect development vs production environment
- Configured autoscale deployment with build and run commands
- Removed CDN Tailwind CSS, now using proper npm package

### November 30, 2025 - PostgreSQL Database Integration
- Added SQLAlchemy 2.0 with PostgreSQL support
- Created database models for Requests, WorkOrders, Images, and Notifications
- Migrated all routes from JSON file storage to PostgreSQL database
- Database tables are auto-created on application startup
- Added proper JSON serialization for API responses

### November 26, 2025 - Replit Setup
- Installed Node.js 20 and Python 3.11 modules
- Configured Vite to run on port 5000 for Replit webview
- Updated API service to auto-detect Replit backend URL
- Configured HMR WebSocket for Replit proxy
- Updated .gitignore for Node.js and Python artifacts
- Installed all frontend and backend dependencies
- Created "Backend API" workflow (localhost:8000)
- Created "Frontend" workflow (0.0.0.0:5000)
- Configured autoscale deployment
- Verified application is running successfully

## Authentication

### Replit Auth Integration
The system uses Replit Auth (OIDC provider) for Google sign-in authentication:

1. **Login Flow**: User clicks "Sign in with Google" → Redirected to Replit OIDC → Callback with authorization code → Token exchange → Session cookie set

2. **Session Management**: 
   - Uses signed HttpOnly cookies with itsdangerous
   - Session tokens are cryptographically signed with SESSION_SECRET
   - Session expiry: 7 days

3. **Security Features**:
   - PKCE (Proof Key for Code Exchange) for authorization flow
   - Nonce validation to prevent replay attacks
   - ID token signature verification using Replit JWKS
   - Server-side session verification on each request

4. **Role-Based Access**:
   - Roles: Admin, Head Technician, Technician, Requester
   - New users default to "Requester" role
   - Admin can update user roles via user management

### Auth Dependencies (backend/utils/auth.py)
- `get_current_user` - Required authentication dependency
- `get_current_user_optional` - Optional authentication (returns None if not logged in)
- `require_admin` - Requires Admin role
- `require_technician_or_above` - Requires Technician, Head Technician, or Admin

## Configuration

### Environment Variables
The app uses the following environment variables:
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual PostgreSQL settings
- `GEMINI_API_KEY` - Optional API key for Google Gemini AI analysis features
- `SESSION_SECRET` - Secret key for signing session tokens (auto-generated if not set)

### Workflows
Two workflows are configured to run the application:

1. **Backend API** (Console)
   - Command: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
   - Port: 8000 (internal)
   - Status: Running

2. **Frontend** (Webview)
   - Command: `npm run dev`
   - Port: 5000 (exposed to web)
   - Status: Running

### Development vs Production
- **Development**: Both workflows run with hot-reload enabled
- **Production**: Deployment uses autoscale with built frontend and FastAPI backend

## Database

The application uses PostgreSQL for data persistence with SQLAlchemy ORM:

### Tables
- **requests** - Maintenance requests from users
- **workorders** - Work orders for technicians
- **images** - Image metadata (files stored in storage/pictures/)
- **notifications** - Workflow notifications

### Database Files
- `backend/database.py` - Database connection configuration
- `backend/db_models.py` - SQLAlchemy table models

### Image Storage
Images are stored in the filesystem at `storage/pictures/` while metadata is stored in the database.

## How to Use

### Running the App
The application starts automatically with two workflows:
1. Backend API runs on port 8000 (internal)
2. Frontend runs on port 5000 (webview)

### Adding Dependencies

**Frontend:**
```bash
npm install <package-name>
```

**Backend:**
```bash
cd backend
pip install <package-name>
```

### API Testing
Access the FastAPI documentation at:
- Swagger UI: `https://<your-repl>-8000.replit.dev/docs`
- ReDoc: `https://<your-repl>-8000.replit.dev/redoc`

## Deployment

The app is configured for Replit autoscale deployment:
- **Build**: `npm run build` (builds Vite frontend to `dist/` folder)
- **Run**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 5000`
- **Type**: Autoscale (scales based on traffic)

### Production Architecture
In production, the FastAPI backend serves both:
1. API endpoints at `/api/*`
2. Static frontend files from the `dist/` folder

The frontend apiService.ts automatically detects the environment:
- **Development**: Uses port 5000 for frontend, port 8000 for backend API
- **Production**: Uses same origin (port 5000) for both frontend and API

To publish: Click the "Deploy" button in Replit

## User Preferences

None specified yet.

## Troubleshooting

### Frontend not loading
- Check that Frontend workflow is running
- Verify port 5000 is not blocked
- Check browser console for errors

### Backend API errors
- Check Backend API workflow logs
- Verify Python dependencies are installed
- Check database connection (DATABASE_URL must be set)

### Database issues
- Verify DATABASE_URL environment variable is set
- Check PostgreSQL is provisioned in Replit
- Tables are auto-created on startup - restart Backend API workflow

### Images not uploading
- Ensure storage/pictures directory exists
- Check file size limits
- Verify backend API is accessible

## Original Repository
This is a GitHub import configured for the Replit environment.
