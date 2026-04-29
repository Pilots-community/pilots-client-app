# Pilots Client App - Container Weighing Control Center

A full-stack demonstration application for managing VGM (Verified Gross Mass) container weighing workflows, implementing the Service Instance API specification.
Live demo running (currently) on: https://weighingapp78107.z6.web.core.windows.net/ (frontend) & https://azappkyixgy3com6f6.azurewebsites.net/health (backend)

## 🏗️ Project Structure

```
pilots-client-app/
├── frontend/          # React-based UI (Azure Static Website)
├── backend/           # Mock REST API (Azure App Service)
└── README.md          # This file
```

## 🚀 Quick Start

### Frontend Deployment

The frontend is a pure HTML/CSS/JavaScript app with no build step required.

```powershell
cd frontend
./deploy.ps1
```

**After deployment**, the script will output your unique frontend URL.

### Backend Deployment

The backend is a Node.js Express API server.

```powershell
cd backend
az webapp up --resource-group <your-resource-group> --name <your-app-name> --runtime "NODE:20-lts"
```

**After deployment**, update `frontend/js/config.js` with your backend URL.

## 📋 Features

### Frontend (`/frontend`)
- **5-State Workflow**: OrderCreated → TruckerAnnounced → MeasurementCreated → PurchaseVGM → VGMPurchased
- **Dual Mode**: Demo (mock data) and Production (real API)
- **ETag Concurrency Control**: Prevents conflicting updates
- **JWT Authentication**: Bearer token support
- **No Build Required**: Pure HTML/CSS/JS with React CDN

### Backend (`/backend`)
- **RESTful API**: Implements Service Instance API spec
- **In-Memory Storage**: Fast, simple data persistence
- **CORS Enabled**: Works with any frontend
- **Mock Authentication**: Accepts any bearer token
- **Seed Data**: 6 pre-loaded container instances

## 🔧 Configuration

After deploying both frontend and backend, configure the connection:

1. Open `frontend/js/config.js`
2. Update `apiBaseUrl` with your backend URL
3. Set `demoMode: false` to connect to the real backend
4. Optionally get a JWT token from `/auth/token` endpoint

## 📖 Documentation

- See `/frontend/README.md` for frontend details
- See `/frontend/FRONTEND_BACKEND_INTEGRATION.md` for API integration guide
- See `/backend/Service-instances_Documentation.yaml` for OpenAPI spec

## 🧪 Testing

### Create New Weighing Order
1. Open the frontend app
2. Click "New Weighing Order"
3. Fill in container details
4. Watch it flow through the workflow states

### Update Instance State
1. Click on any instance
2. Use "Advance State" to move through the workflow
3. ETag ensures no conflicts

### View Backyour-backend-app
```powershell
curl .../serviceInstances
```

## 🛠️ Technology Stack

**Frontend:**
- React 18 (CDN)
- Pure CSS
- Azure Storage Static Website

**Backend:**
- Node.js 20 LTS
- Express.js
- Azure App Service

## 📝 API Endpoints

```
POST   /auth/token               Get JWT token
GET    /health                   Health check
POST   /serviceInstances         Create instance
GET    /serviceInstances         List instances (with filters)
GET    /serviceInstances/:id     Get instance
PATCH  /serviceInstances/:id     Update instance
DELETE /serviceInstances/:id     Delete instance
```

## 🌐 Deployment

Deploy the frontend and backend separately, then configure `frontend/js/config.js` to connect them.

See individual README files in `/frontend` and `/backend` for detailed deployment instructions.

## 🤝 Contributing

This is a demonstration project implementing the Service Instance API specification for container weighing workflows.
