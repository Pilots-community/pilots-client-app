# Weighing App Mock Backend

A lightweight mock API server implementing the Service Instance specification for testing and demonstration purposes.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000` by default.

## API Configuration

**Base URL:** `http://localhost:3000`

**Authentication:** Optional Bearer token (mock implementation)

## Endpoints

### Authentication
- `POST /auth/token` - Get a mock JWT token
- `GET /health` - Health check

### Service Instances
- `POST /serviceInstances` - Create a new service instance
- `GET /serviceInstances` - List service instances with filtering
- `GET /serviceInstances/:id` - Get a specific service instance
- `PUT /serviceInstances/:id` - Replace a service instance
- `PATCH /serviceInstances/:id` - Partially update a service instance
- `DELETE /serviceInstances/:id` - Delete a service instance

## Seed Data

The server initializes with 5 pre-populated service instances representing different states:
- PFrontend Integration

### Configure your frontend

For production mode, use these settings in your frontend config:

```javascript
const API_CONFIG = {
  baseUrl: 'http://localhost:3000',
  endpoints: {
    token: '/auth/token',
    serviceInstances: '/serviceInstances'
  }
};
```

### Get a token

```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "demo-user"}'
```

Response:
```json
{
  "access_token": "eyJhbG...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "username": "demo-user",
    "displayName": "Demo User",
    "role": "operator"
  }
}
```

### Use the token

All service instance requests can optionally include the Bearer token:

```bash
curl http://localhost:3000/serviceInstances \
  -H "Authorization: Bearer eyJhbG..."
```

## Example Requests

### Health check
```bash
curl http://localhost:3000/health
```requests
- In-progress weighings
- Completed weighings
- Cancelled requests

Each instance includes:
- Vehicle registrations (ABC123, XYZ789, LMN456, etc.)
- Material types (aggregates, sand, gravel, concrete, limestone)
- Different stakeholder configurations (customers, suppliers, carriers)
- Various states (pending, in-progress, completed, cancelled)

## Example Requests

### List all service instances
```bash
curl http://localhost:3000/serviceInstances
```

### Filter by state
```bash
curl "http://localhost:3000/serviceInstances?state=pending"
```

### Filter by stakeholder
```bash
curl "http://localhost:3000/serviceInstances?stakeholderParty=party-001"
```

### Get specific instance
```bash
curl http://localhost:3000/serviceInstances/{id}
```

### Create new instance
```bash
curl -X POST http://localhost:3000/serviceInstances \
  -H "Content-Type: application/json" \
  -d '{
    "serviceDefinition": "https://example.com/services/weighing-basic",
    "stakeholders": [
      {"role": "customer", "party": "party-007", "displayName": "Test Corp"}
    ],
    "parameters": {
      "vehicleRegistration": "TEST001",
      "materialType": "stone"
    }
  }'
```

### Update instance state (requires ETag from GET)
```bash
curl -X PATCH http://localhost:3000/serviceInstances/{id} \
  -H "Content-Type: application/json" \
  -H "If-Match: \"1\"" \
  -d '{"state": "in-progress"}'
```

## Features

- ✅ Full CRUD operations
- ✅ ETag-based optimistic concurrency control
- ✅ Query filtering (state, stakeholder, timestamps, parameters)
- ✅ Pagination support
- ✅ In-memory storage (resets on restart)
- ✅ CORS enabled for frontend testing
- ✅ RFC 7807 Problem Details error responses

## Notes

- All data is stored in memory and resets when the server restarts
- ETag values are based on version numbers
- Authentication is not implemented (mock only)
- Perfect for testing frontend integrations and API behavior
