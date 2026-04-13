const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to expose ETag header
app.use(cors({
  exposedHeaders: ['ETag', 'Location']
}));
app.use(express.json());

// In-memory storage
let serviceInstances = [];
let nextVersion = 1;

// Simple bearer token validation (mock only - accepts any token)
function validateToken(req, res, next) {
  const authHeader = req.header('Authorization');
  
  // For mock purposes, we're lenient - just check if Bearer token exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Bearer token required'
    });
  }
  
  next();
}

// Optional: Apply auth middleware (uncomment to enable)
// app.use('/serviceInstances', validateToken);

// Helper functions
function generateId() {
  return crypto.randomUUID();
}

function generateETag(instance) {
  return `"${instance.version}"`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function matchesFilters(instance, filters) {
  if (filters.serviceDefinition && instance.serviceDefinition !== filters.serviceDefinition) return false;
  if (filters.serviceOffering && instance.serviceOffering !== filters.serviceOffering) return false;
  if (filters.serviceQuotation && instance.serviceQuotation !== filters.serviceQuotation) return false;
  if (filters.state && instance.state !== filters.state) return false;
  
  if (filters.stakeholderRole || filters.stakeholderParty) {
    const matches = instance.stakeholders.some(sh => {
      if (filters.stakeholderRole && filters.stakeholderParty) {
        return sh.role === filters.stakeholderRole && sh.party === filters.stakeholderParty;
      }
      if (filters.stakeholderRole) return sh.role === filters.stakeholderRole;
      if (filters.stakeholderParty) return sh.party === filters.stakeholderParty;
      return false;
    });
    if (!matches) return false;
  }
  
  if (filters.createdAfter && new Date(instance.createdAt) <= new Date(filters.createdAfter)) return false;
  if (filters.createdBefore && new Date(instance.createdAt) >= new Date(filters.createdBefore)) return false;
  if (filters.updatedAfter && new Date(instance.updatedAt) <= new Date(filters.updatedAfter)) return false;
  if (filters.updatedBefore && new Date(instance.updatedAt) >= new Date(filters.updatedBefore)) return false;
  if (filters.lastEventType && instance.lastEventType !== filters.lastEventType) return false;
  
  if (filters.parameterKey && filters.parameterValue) {
    if (instance.parameters[filters.parameterKey] !== filters.parameterValue) return false;
  }
  
  return true;
}

// Auth Routes
app.post('/auth/token', (req, res) => {
  // Mock token generation - returns a simple JWT-like token
  // In production, this would validate credentials and return a real JWT
  const mockPayload = {
    sub: req.body.username || 'demo-user',
    name: req.body.username || 'Demo User',
    role: 'operator',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Mock JWT (base64 encoded header.payload.signature)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
  const signature = Buffer.from('mock-signature').toString('base64url');
  const token = `${header}.${payload}.${signature}`;
  
  res.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 86400,
    user: {
      username: mockPayload.sub,
      displayName: mockPayload.name,
      role: mockPayload.role
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    instances: serviceInstances.length 
  });
});

// Routes
app.post('/serviceInstances', (req, res) => {
  const now = createTimestamp();
  const newInstance = {
    id: generateId(),
    serviceDefinition: req.body.serviceDefinition,
    stakeholders: req.body.stakeholders,
    serviceOffering: req.body.serviceOffering || null,
    serviceQuotation: req.body.serviceQuotation || null,
    parameters: req.body.parameters,
    payload: req.body.payload || null,
    payloadMimeType: req.body.payloadMimeType || null,
    state: req.body.state || 'pending',
    version: nextVersion++,
    createdAt: now,
    updatedAt: now,
    lastEventType: null,
    lastEventAt: null,
    eventCount: 0
  };
  
  serviceInstances.push(newInstance);
  
  res.status(201)
    .header('Location', `/serviceInstances/${newInstance.id}`)
    .header('ETag', generateETag(newInstance))
    .json(newInstance);
});

app.get('/serviceInstances', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  const filters = {
    serviceDefinition: req.query.serviceDefinition,
    serviceOffering: req.query.serviceOffering,
    serviceQuotation: req.query.serviceQuotation,
    state: req.query.state,
    stakeholderRole: req.query.stakeholderRole,
    stakeholderParty: req.query.stakeholderParty,
    createdAfter: req.query.createdAfter,
    createdBefore: req.query.createdBefore,
    updatedAfter: req.query.updatedAfter,
    updatedBefore: req.query.updatedBefore,
    lastEventType: req.query.lastEventType,
    parameterKey: req.query.parameterKey,
    parameterValue: req.query.parameterValue
  };
  
  const filtered = serviceInstances.filter(inst => matchesFilters(inst, filters));
  const paginated = filtered.slice(offset, offset + limit);
  
  res.json({
    items: paginated,
    count: paginated.length,
    total: filtered.length,
    limit,
    offset
  });
});

app.get('/serviceInstances/:serviceInstanceId', (req, res) => {
  const instance = serviceInstances.find(inst => inst.id === req.params.serviceInstanceId);
  
  if (!instance) {
    return res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Service instance not found'
    });
  }
  
  res.header('ETag', generateETag(instance)).json(instance);
});

app.put('/serviceInstances/:serviceInstanceId', (req, res) => {
  const ifMatch = req.header('If-Match');
  
  if (!ifMatch) {
    return res.status(428).json({
      type: 'about:blank',
      title: 'Precondition Required',
      status: 428,
      detail: 'If-Match header is required'
    });
  }
  
  const instance = serviceInstances.find(inst => inst.id === req.params.serviceInstanceId);
  
  if (!instance) {
    return res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Service instance not found'
    });
  }
  
  const currentETag = generateETag(instance);
  if (ifMatch !== currentETag) {
    return res.status(412).json({
      type: 'about:blank',
      title: 'Precondition Failed',
      status: 412,
      detail: 'ETag mismatch'
    });
  }
  
  instance.serviceDefinition = req.body.serviceDefinition;
  instance.stakeholders = req.body.stakeholders;
  instance.serviceOffering = req.body.serviceOffering || null;
  instance.serviceQuotation = req.body.serviceQuotation || null;
  instance.parameters = req.body.parameters;
  instance.payload = req.body.payload || null;
  instance.payloadMimeType = req.body.payloadMimeType || null;
  instance.state = req.body.state;
  instance.version = nextVersion++;
  instance.updatedAt = createTimestamp();
  
  res.header('ETag', generateETag(instance)).json(instance);
});

app.patch('/serviceInstances/:serviceInstanceId', (req, res) => {
  const ifMatch = req.header('If-Match');
  
  if (!ifMatch) {
    return res.status(428).json({
      type: 'about:blank',
      title: 'Precondition Required',
      status: 428,
      detail: 'If-Match header is required'
    });
  }
  
  const instance = serviceInstances.find(inst => inst.id === req.params.serviceInstanceId);
  
  if (!instance) {
    return res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Service instance not found'
    });
  }
  
  const currentETag = generateETag(instance);
  if (ifMatch !== currentETag) {
    return res.status(412).json({
      type: 'about:blank',
      title: 'Precondition Failed',
      status: 412,
      detail: 'ETag mismatch'
    });
  }
  
  // Apply partial updates
  if (req.body.serviceDefinition !== undefined) instance.serviceDefinition = req.body.serviceDefinition;
  if (req.body.stakeholders !== undefined) instance.stakeholders = req.body.stakeholders;
  if (req.body.serviceOffering !== undefined) instance.serviceOffering = req.body.serviceOffering;
  if (req.body.serviceQuotation !== undefined) instance.serviceQuotation = req.body.serviceQuotation;
  if (req.body.parameters !== undefined) instance.parameters = req.body.parameters;
  if (req.body.payload !== undefined) instance.payload = req.body.payload;
  if (req.body.payloadMimeType !== undefined) instance.payloadMimeType = req.body.payloadMimeType;
  if (req.body.state !== undefined) instance.state = req.body.state;
  
  instance.version = nextVersion++;
  instance.updatedAt = createTimestamp();
  
  res.header('ETag', generateETag(instance)).json(instance);
});

app.delete('/serviceInstances/:serviceInstanceId', (req, res) => {
  const ifMatch = req.header('If-Match');
  
  if (!ifMatch) {
    return res.status(428).json({
      type: 'about:blank',
      title: 'Precondition Required',
      status: 428,
      detail: 'If-Match header is required'
    });
  }
  
  const index = serviceInstances.findIndex(inst => inst.id === req.params.serviceInstanceId);
  
  if (index === -1) {
    return res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Service instance not found'
    });
  }
  
  const instance = serviceInstances[index];
  const currentETag = generateETag(instance);
  
  if (ifMatch !== currentETag) {
    return res.status(412).json({
      type: 'about:blank',
      title: 'Precondition Failed',
      status: 412,
      detail: 'ETag mismatch'
    });
  }
  
  serviceInstances.splice(index, 1);
  res.status(204).send();
});

// Initialize seed data
function initializeSeedData() {
  const now = createTimestamp();
  const baseTime = new Date('2026-04-01T10:00:00Z');
  
  const seedData = [
    {
      id: generateId(),
      serviceDefinition: 'https://certi-weight.be/services/vgm-weighing/v1',
      stakeholders: [
        { role: 'provider', party: 'did:web:identityhub.certi-weight.be', displayName: 'Certi-Weight' },
        { role: 'shipper', party: 'did:web:identityhub.acme-corp.com', displayName: 'Acme Corp' }
      ],
      serviceOffering: 'https://certi-weight.be/offerings/TestID-123',
      serviceQuotation: null,
      parameters: {
        containernr: 'MSKU1234567',
        bookingnr: 'BK2026-001',
        liner: 'Maersk',
        location: 'Port of Antwerp',
        announcementDate: '2026-04-01T10:00:00Z',
        transportbedrijf: 'Van Moer Logistics',
        customerReference: 'REF-001'
      },
      payload: null,
      payloadMimeType: null,
      state: 'order_created',
      version: nextVersion++,
      createdAt: new Date(baseTime.getTime()).toISOString(),
      updatedAt: new Date(baseTime.getTime()).toISOString(),
      lastEventType: 'created',
      lastEventAt: new Date(baseTime.getTime()).toISOString(),
      eventCount: 1
    },
    {
      id: generateId(),
      serviceDefinition: 'https://certi-weight.be/services/vgm-weighing/v1',
      stakeholders: [
        { role: 'provider', party: 'did:web:identityhub.certi-weight.be', displayName: 'Certi-Weight' },
        { role: 'shipper', party: 'did:web:identityhub.buildco.com', displayName: 'BuildCo Inc' },
        { role: 'carrier', party: 'did:web:transport.example', displayName: 'John Doe' }
      ],
      serviceOffering: 'https://certi-weight.be/offerings/TestID-123',
      serviceQuotation: null,
      parameters: {
        containernr: 'CSQU9876543',
        bookingnr: 'BK2026-042',
        liner: 'MSC',
        location: 'Port of Rotterdam',
        announcementDate: '2026-04-01T11:00:00Z',
        transportbedrijf: 'Fast Logistics',
        customerReference: 'REF-042',
        truckDriver: {
          '@id': 'did:web:transport.example',
          name: 'John Doe',
          licensePlate: '1-ABC-123',
          company: 'Fast Logistics'
        },
        announcementTimestamp: '2026-04-01T11:30:00Z',
        seal: 'SEAL-98765'
      },
      payload: null,
      payloadMimeType: null,
      state: 'trucker_announced',
      version: nextVersion++,
      createdAt: new Date(baseTime.getTime() + 3600000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 7200000).toISOString(),
      lastEventType: 'trucker-announced',
      lastEventAt: new Date(baseTime.getTime() + 7200000).toISOString(),
      eventCount: 3
    },
    {
      id: generateId(),
      serviceDefinition: 'https://certi-weight.be/services/vgm-weighing/v1',
      stakeholders: [
        { role: 'provider', party: 'did:web:identityhub.certi-weight.be', displayName: 'Certi-Weight' },
        { role: 'shipper', party: 'did:web:identityhub.transport-solutions.com', displayName: 'Transport Solutions' },
        { role: 'carrier', party: 'did:web:driver.example', displayName: 'Jane Smith' }
      ],
      serviceOffering: 'https://certi-weight.be/offerings/TestID-123',
      serviceQuotation: null,
      parameters: {
        containernr: 'TCLU5555555',
        bookingnr: 'BK2026-043',
        liner: 'CMA CGM',
        location: 'Port of Hamburg',
        announcementDate: '2026-04-01T12:00:00Z',
        transportbedrijf: 'Express Transport',
        customerReference: 'REF-043',
        truckDriver: {
          '@id': 'did:web:driver.example',
          name: 'Jane Smith',
          licensePlate: '2-XYZ-789',
          company: 'Express Transport'
        },
        announcementTimestamp: '2026-04-01T12:30:00Z',
        seal: 'SEAL-55555',
        weighingTimestamp: '2026-04-01T13:00:00Z',
        weight: '28450.5'
      },
      payload: null,
      payloadMimeType: null,
      state: 'vgm_purchased',
      version: nextVersion++,
      createdAt: new Date(baseTime.getTime() + 7200000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 14400000).toISOString(),
      lastEventType: 'vgm-purchased',
      lastEventAt: new Date(baseTime.getTime() + 14400000).toISOString(),
      eventCount: 5
    },
    {
      id: generateId(),
      serviceDefinition: 'https://certi-weight.be/services/vgm-weighing/v1',
      stakeholders: [
        { role: 'provider', party: 'did:web:identityhub.certi-weight.be', displayName: 'Certi-Weight' },
        { role: 'shipper', party: 'did:web:identityhub.maritime-co.com', displayName: 'Maritime Co' }
      ],
      serviceOffering: 'https://certi-weight.be/offerings/TestID-123',
      serviceQuotation: null,
      parameters: {
        containernr: 'HLCU7777777',
        bookingnr: 'BK2026-099',
        liner: 'Hapag-Lloyd',
        location: 'Port of Antwerp',
        announcementDate: '2026-04-01T14:00:00Z',
        transportbedrijf: 'Quick Transport',
        customerReference: 'REF-099'
      },
      payload: null,
      payloadMimeType: null,
      state: 'order_created',
      version: nextVersion++,
      createdAt: new Date(baseTime.getTime() + 10800000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 10800000).toISOString(),
      lastEventType: 'created',
      lastEventAt: new Date(baseTime.getTime() + 10800000).toISOString(),
      eventCount: 1
    },
    {
      id: generateId(),
      serviceDefinition: 'https://certi-weight.be/services/vgm-weighing/v1',
      stakeholders: [
        { role: 'provider', party: 'did:web:identityhub.certi-weight.be', displayName: 'Certi-Weight' },
        { role: 'shipper', party: 'did:web:identityhub.cargo-experts.com', displayName: 'Cargo Experts' },
        { role: 'carrier', party: 'did:web:driver2.example', displayName: 'Bob Johnson' }
      ],
      serviceOffering: 'https://certi-weight.be/offerings/TestID-123',
      serviceQuotation: null,
      parameters: {
        containernr: 'OOLU1111111',
        bookingnr: 'BK2026-088',
        liner: 'OOCL',
        location: 'Port of Felixstowe',
        announcementDate: '2026-04-01T15:00:00Z',
        transportbedrijf: 'Reliable Haulage',
        customerReference: 'REF-088',
        truckDriver: {
          '@id': 'did:web:driver2.example',
          name: 'Bob Johnson',
          licensePlate: '3-DEF-456',
          company: 'Reliable Haulage'
        },
        announcementTimestamp: '2026-04-01T15:30:00Z',
        seal: 'SEAL-11111',
        weighingTimestamp: '2026-04-01T16:00:00Z'
      },
      payload: null,
      payloadMimeType: null,
      state: 'measurement_created',
      version: nextVersion++,
      createdAt: new Date(baseTime.getTime() + 14400000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 18000000).toISOString(),
      lastEventType: 'measurement-created',
      lastEventAt: new Date(baseTime.getTime() + 18000000).toISOString(),
      eventCount: 4
    }
  ];
  
  serviceInstances = seedData;
  console.log(`Initialized with ${seedData.length} seed service instances`);
}

// Start server
app.listen(PORT, () => {
  initializeSeedData();
  console.log(`\n✅ Mock API server running on http://localhost:${PORT}`);
  console.log(`\nAuth Endpoints:`);
  console.log(`  POST   /auth/token               Get mock JWT token`);
  console.log(`  GET    /health                   Health check`);
  console.log(`\nService Instance Endpoints:`);
  console.log(`  POST   /serviceInstances         Create instance`);
  console.log(`  GET    /serviceInstances         List instances (with filters)`);
  console.log(`  GET    /serviceInstances/:id     Get instance`);
  console.log(`  PUT    /serviceInstances/:id     Replace instance`);
  console.log(`  PATCH  /serviceInstances/:id     Update instance`);
  console.log(`  DELETE /serviceInstances/:id     Delete instance`);
  console.log(`\n📝 ${serviceInstances.length} seed instances loaded\n`);
});
