# Container Weighing Control Center

A lightweight React-based frontend for managing the VGM (Verified Gross Mass) container weighing workflow. Supports both **demo mode** (mock data) and **production mode** (real Java backend).

## 🎯 Features

- **5-State Workflow**: OrderCreated → TruckerAnnounced → MeasurementCreated → PurchaseVGM → VGMPurchased
- **Dual Mode Operation**: 
  - 🎮 **Demo Mode**: Use mock data for testing/presentations
  - 🚀 **Production Mode**: Connect to real Java backend via REST API
- **ETag Concurrency Control**: Prevents conflicting updates
- **Bearer JWT Authentication**: Secure API access
- **No Build Step**: Pure HTML/CSS/JS with React CDN
- **Azure Static Website Ready**: Deploy to Azure Storage in seconds

## 📁 Project Structure

```
weighing-app/
├── index.html                              # Main SPA
├── css/
│   └── styles.css                          # Styling
├── js/
│   ├── config.js                           # Backend configuration
│   ├── models.js                           # Data models & seed data
│   ├── services.js                         # Mock API service (demo mode)
│   ├── backend-api.js                      # Real backend client (production)
│   └── api-wrapper.js                      # Mode switcher
├── deploy.ps1                              # Initial Azure deployment script
├── redeploy.ps1                            # Quick redeploy script
├── .azure-deploy.json                      # Azure credentials (DO NOT COMMIT)
├── .azure-deploy.json.template             # Template for Azure config
├── BACKEND_INTEGRATION.md                  # Message schemas & workflow docs
├── FRONTEND_BACKEND_INTEGRATION.md         # Integration guide
└── Service-instances_Documentation.yaml    # OpenAPI 3.0.3 specification
```

## 🚀 Quick Start

### Prerequisites

- **Azure CLI** installed: `winget install Microsoft.AzureCLI`
- **Azure subscription** with permissions to create resources

### Deploy to Azure

1. **Clone the repository**:
   ```powershell
   git clone <your-repo-url>
   cd weighing-app
   ```

2. **Configure Azure credentials**:
   ```powershell
   # Copy template and fill in your values
   Copy-Item .azure-deploy.json.template .azure-deploy.json
   # Edit .azure-deploy.json with your subscription ID and resource names
   ```

3. **Initial deployment** (creates all Azure resources):
   ```powershell
   .\deploy.ps1
   ```

4. **Subsequent deployments** (updates existing resources):
   ```powershell
   .\redeploy.ps1
   ```

### Local Development

Simply open `index.html` in a browser - no build step required!

```powershell
# Serve locally (optional - PowerShell http server)
python -m http.server 8000
# Open http://localhost:8000
```

## ⚙️ Configuration

### Demo Mode (Default)

Perfect for testing and presentations:
- Uses 5 pre-seeded instances
- No backend required
- All data stored in memory

### Production Mode

Connect to real Java backend:

1. **Open Settings** (⚙️ button in header)
2. **Toggle to Production Mode**
3. **Enter Backend URL**: `https://your-backend.example.com`
4. **Paste JWT Token** from your auth system
5. **Save Settings**

Or configure programmatically in `js/config.js`:

```javascript
window.AppConfig = {
  apiBaseUrl: "https://your-backend.example.com",
  demoMode: false
};
window.AppConfig.auth.setToken('your-jwt-token');
```

## 🔐 Security

**NEVER commit these files**:

- `.azure-deploy.json` - Contains subscription ID and resource names
- Any files with actual auth tokens or API keys

The `.gitignore` is pre-configured to exclude sensitive files.

## 📡 Backend API Requirements

Your Java backend must implement:

- **OpenAPI Spec**: See `Service-instances_Documentation.yaml`
- **Endpoints**:
  - `POST /serviceInstances` - Create orders
  - `GET /serviceInstances` - List/filter instances
  - `GET /serviceInstances/{id}` - Get single instance
  - `PATCH /serviceInstances/{id}` - Update instance
  - `DELETE /serviceInstances/{id}` - Delete instance
- **Headers**:
  - `Authorization: Bearer <jwt>`
  - `ETag` in responses
  - `If-Match` validation for updates
- **CORS**: Allow frontend origin

See `FRONTEND_BACKEND_INTEGRATION.md` for detailed integration guide.

## 🔄 Workflow States

1. **order_created**: Customer creates order with container/booking details
2. **trucker_announced**: Truck driver announces arrival with license plate
3. **measurement_created**: Container sealed and ready for weighing
4. **purchase_vgm**: Customer purchases VGM certificate
5. **vgm_purchased**: Weight recorded and certificate issued

## 📝 Data Model

Each instance contains:

- **OrderCreated**: containernr, bookingnr, liner, location, shipper info
- **TruckerAnnounced**: truck driver IRI, license plate, announcement timestamp
- **MeasurementCreated**: seal number, weighing timestamp
- **VGMPurchased**: official weight (in grams)

## 🛠️ Technology Stack

- **Frontend**: React 18 (CDN), vanilla JavaScript
- **Styling**: CSS3 (no preprocessors)
- **Hosting**: Azure Storage Static Website
- **Backend Protocol**: REST/HTTP with JSON-LD
- **Authentication**: Bearer JWT tokens
- **Concurrency**: HTTP ETag/If-Match

## 📚 Documentation

- `BACKEND_INTEGRATION.md` - VGM message schemas and workflow
- `FRONTEND_BACKEND_INTEGRATION.md` - Frontend-backend integration guide
- `Service-instances_Documentation.yaml` - Complete OpenAPI specification

## 🧪 Testing

### Demo Mode Testing

1. Open app in browser
2. Verify 5 seed instances displayed
3. Create new order
4. Advance through workflow states
5. Check state-specific forms (driver info, seal, weight)

### Production Mode Testing

1. Configure backend URL and token
2. Switch to production mode
3. Open browser DevTools → Network tab
4. Create order → verify `POST /serviceInstances`
5. Check request/response formats
6. Test ETag concurrency (open same instance in 2 tabs, update both)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit pull request

## 📄 License

[Your License Here]

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- React team for React 18
- Microsoft Azure for static website hosting
- Van Moer Logistics for VGM workflow requirements
