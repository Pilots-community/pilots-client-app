# Frontend Configuration Guide

## Quick Setup

Use these settings to connect your weighing-app frontend to this mock backend:

### API URL
```
http://localhost:3000
```

### Get Authentication Token

**Endpoint:** `POST /auth/token`

**Request:**
```json
{
  "username": "demo-user"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "username": "demo-user",
    "displayName": "Demo User",
    "role": "operator"
  }
}
```

### Example Frontend Config

If your frontend has a config file (like `config.js`), update it with:

```javascript
// config.js
const config = {
  production: {
    apiBaseUrl: 'http://localhost:3000',
    authEndpoint: '/auth/token',
    serviceInstancesEndpoint: '/serviceInstances',
    requireAuth: false  // Set to true if you want to test with auth
  }
};
```

### Testing the Connection

1. **Start the mock backend:**
   ```bash
   cd "c:\Users\bergma57\weighing-app mock-backend"
   npm start
   ```

2. **Get a token (optional):**
   ```bash
   curl -X POST http://localhost:3000/auth/token \
     -H "Content-Type: application/json" \
     -d "{\"username\": \"demo-user\"}"
   ```

3. **Test listing instances:**
   ```bash
   # Without auth
   curl http://localhost:3000/serviceInstances

   # With auth (if you enabled it)
   curl http://localhost:3000/serviceInstances \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Authentication Notes

- **Optional by default:** The API accepts requests with or without tokens
- **To enable required auth:** Uncomment line 24 in server.js:
  ```javascript
  app.use('/serviceInstances', validateToken);
  ```
- **Token validation:** Mock implementation - accepts any valid Bearer token format
- **Token expiry:** Mock tokens are valid for 24 hours (but not actually validated)

### Available Test Data

The backend starts with 5 seed service instances:

| Vehicle | Material | State | Customer |
|---------|----------|-------|----------|
| ABC123 | aggregates | pending | Acme Corp |
| XYZ789 | sand | in-progress | BuildCo Inc |
| LMN456 | gravel | completed | Transport Solutions |
| QRS222 | concrete | cancelled | Acme Corp |
| DEF333 | limestone | pending | QuarryMax |

### CORS

CORS is enabled for all origins, so you can call this API from any frontend running on any port.
