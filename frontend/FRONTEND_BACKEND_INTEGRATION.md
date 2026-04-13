# Frontend to Backend Integration Guide

## 📋 Summary of Changes

Your frontend has been updated to work as a **lightweight client** that can talk to the Java backend implementing the Service Instance API.

### **What Was Added:**

1. **`js/config.js`** - Configuration file for backend URL and authentication
2. **`js/backend-api.js`** - Real HTTP client that talks to Java backend via REST API
3. **`js/api-wrapper.js`** - Smart wrapper that switches between mock and real backend
4. **Updated `index.html`** - Now uses unified `window.API` instead of mock service

### **Key Features:**

✅ **ETag-based optimistic locking** - Prevents concurrent update conflicts  
✅ **Bearer token authentication** - JWT-based security  
✅ **Automatic data mapping** - Converts between frontend and backend schemas  
✅ **Demo mode toggle** - Switch between mock and real backend  
✅ **Error handling** - RFC 7807 Problem Details support  

---

## 🔧 Configuration Steps

### **1. Set Backend URL**

Edit [`js/config.js`](js/config.js):

```javascript
window.AppConfig = {
  apiBaseUrl: "https://your-backend.example.com",  // ← UPDATE THIS
  // ...
};
```

### **2. Set Authentication Token**

After user login, set the bearer token:

```javascript
// In your login flow:
window.AppConfig.auth.setToken('eyJhbGciOiJIUzI1NiIs...');
```

Or manually for testing:
```javascript
// Open browser console:
window.AppConfig.auth.setToken('your-jwt-token-here');
```

### **3. Switch to Production Mode**

Edit [`js/config.js`](js/config.js):

```javascript
window.AppConfig = {
  // ...
  demoMode: false  // ← Set to false to use real backend
};
```

Or toggle at runtime in browser console:
```javascript
window.API.setDemoMode(false);  // Switch to production
window.API.setDemoMode(true);   // Switch back to demo
```

---

## 🔄 Data Mapping

### **Frontend → Backend (ServiceInstance)**

Your frontend VGM data is mapped to the backend schema:

```javascript
Frontend Instance                  Backend ServiceInstance
─────────────────────              ──────────────────────────
state: "order_created"      →      state: "order_created"
containernr: "MSKU123"      →      parameters: {
bookingnr: "BK2026-001"     →        containernr: "MSKU123",
liner: "Maersk"             →        bookingnr: "BK2026-001",
location: "Antwerp"         →        liner: "Maersk",
transportbedrijf: "..."     →        location: "Antwerp",
customerReference: "..."    →        transportbedrijf: "...",
seal: "SEAL-123"            →        customerReference: "...",
weight: 28450.5             →        seal: "SEAL-123",
truckDriver: {...}          →        weight: 28450.5,
shipper: {...}              →        truckDriver: {...}
                            →      }
                            →      stakeholders: [
                            →        {role: "provider", party: "..."},
                            →        {role: "shipper", party: "..."},
                            →        {role: "carrier", party: "..."}
                            →      ]
```

### **Stakeholder Mapping**

- **`provider`** → Certi-Weight (service provider)
- **`shipper`** → Van Moer Logistics (customer)
- **`carrier`** → Truck driver/transport company

---

## 🧪 Testing

### **Demo Mode (Default)**
Uses mock data from `js/services.js`:
```javascript
window.API.isDemoMode();  // → true
```

### **Production Mode**
Connects to real Java backend:
```javascript
window.API.setDemoMode(false);
window.API.isDemoMode();  // → false
```

### **Test API Calls**

Open browser console and try:

```javascript
// Create new order
window.API.createInstance('TestID-123', {
  containernr: 'TEST1234567',
  bookingnr: 'BK2026-TEST',
  liner: 'Test Line',
  location: 'Port of Test',
  transportbedrijf: 'Test Transport',
  customerReference: 'TEST-001',
  shipperContact: 'Test User',
  shipperCompany: 'Test Company',
  shipperAddress: 'Test Address'
});

// List all instances
window.API.getInstances();

// Get specific instance
window.API.getInstance('uuid-here');

// Update instance state
window.API.patchInstance('uuid-here', {
  state: 'trucker_announced',
  driverName: 'John Doe',
  licensePlate: '1-ABC-123'
});
```

---

## 🔐 Authentication Flow

For production, implement proper authentication:

### **Option 1: OAuth/OIDC Flow**

```javascript
// After OAuth login:
async function handleLogin(authCode) {
  const tokenResponse = await fetch('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({ code: authCode })
  });
  const { access_token } = await tokenResponse.json();
  window.AppConfig.auth.setToken(access_token);
}
```

### **Option 2: Session Storage**

Token is automatically saved to sessionStorage:
```javascript
// Set token (saves to sessionStorage)
window.AppConfig.auth.setToken('token');

// Reload page - token persists
window.AppConfig.auth.getToken();  // → 'token'
```

---

## 📡 Backend API Endpoints Used

Your frontend makes these calls to the Java backend:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/serviceInstances` | Create new order (OrderCreated) |
| `GET` | `/serviceInstances?serviceOffering=...` | List instances for offering |
| `GET` | `/serviceInstances/{id}` | Get single instance details |
| `PATCH` | `/serviceInstances/{id}` | Update state/parameters |
| `DELETE` | `/serviceInstances/{id}` | Delete instance |

### **Required Headers:**

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
If-Match: <etag>  # Required for PATCH/DELETE
```

---

## 🛠️ Backend Requirements

Your Java backend must implement:

1. ✅ **OpenAPI spec** from `Service-instances_Documentation.yaml`
2. ✅ **ETag generation** - Include `ETag` header in responses
3. ✅ **ETag validation** - Check `If-Match` header on updates
4. ✅ **CORS headers** - Allow frontend domain
5. ✅ **JWT authentication** - Validate bearer tokens
6. ✅ **Service definition URI** - Support `https://certi-weight.be/services/vgm-weighing/v1`

### **Example Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
ETag: "1"

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "serviceDefinition": "https://certi-weight.be/services/vgm-weighing/v1",
  "state": "order_created",
  "stakeholders": [
    {"role": "provider", "party": "did:web:identityhub.certi-weight.be"},
    {"role": "shipper", "party": "did:web:identityhub.van-moer.be"}
  ],
  "parameters": {
    "containernr": "MSKU1234567",
    "bookingnr": "BK2026-001",
    "liner": "Maersk Line"
  },
  "version": 1,
  "createdAt": "2026-04-10T10:00:00Z",
  "updatedAt": "2026-04-10T10:00:00Z"
}
```

---

## 🚀 Deployment Checklist

Before connecting to production backend:

- [ ] Update `apiBaseUrl` in `config.js`
- [ ] Set `demoMode: false` in `config.js`
- [ ] Implement authentication flow (OAuth/JWT)
- [ ] Test backend connectivity
- [ ] Verify CORS configuration
- [ ] Test ETag concurrency handling
- [ ] Deploy updated frontend files

### **Deploy Command:**

```powershell
.\redeploy.ps1
```

---

## 🐛 Troubleshooting

### **CORS Errors**

Backend must include:
```
Access-Control-Allow-Origin: https://your-storage-account.z6.web.core.windows.net
Access-Control-Allow-Headers: Authorization, Content-Type, If-Match
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
Access-Control-Expose-Headers: ETag, Location
```

### **401 Unauthorized**

Check authentication token:
```javascript
window.AppConfig.auth.getToken();  // Should return JWT
```

### **412 Precondition Failed**

ETag mismatch - refresh instance:
```javascript
// Get fresh instance with new ETag
const instance = await window.API.getInstance(id);
// Then try update again
```

### **Check Current Mode**

```javascript
window.API.isDemoMode();  // true = mock, false = real backend
```

---

## 📞 Support

For backend API questions, refer to:
- [`Service-instances_Documentation.yaml`](Service-instances_Documentation.yaml) - Full OpenAPI spec
- [`BACKEND_INTEGRATION.md`](BACKEND_INTEGRATION.md) - Message schemas

For frontend questions, check:
- `js/backend-api.js` - HTTP client implementation
- `js/config.js` - Configuration options
