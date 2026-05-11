// ============================================================
// Container Weighing Control Center App - Data Models & Seeds
// ============================================================

// JSON-LD Context
window.JSONLD_CONTEXT = {
  "@context": "https://example.com/context/vgm.jsonld",
  "@vocab": "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
};

// Allowed states in order (state machine) - aligned with backend message events
window.STATES = [
  "order_created",
  "trucker_announced",
  "measurement_created",
  "purchase_vgm",
  "vgm_purchased"
];

// Human-readable state labels
window.STATE_LABELS = {
  order_created: "Order Created",
  trucker_announced: "Trucker Announced",
  measurement_created: "Measurement Created",
  purchase_vgm: "Purchase VGM",
  vgm_purchased: "VGM Purchased"
};

// State badge colors
window.STATE_COLORS = {
  order_created: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  trucker_announced: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  measurement_created: { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
  purchase_vgm: { bg: "#fce7f3", text: "#9f1239", border: "#fbcfe8" },
  vgm_purchased: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" }
};

// ── Real backend process state flows ─────────────────────────────────────────
// Maps Flowable process definition key → ordered state sequence with display info
window.BACKEND_STATE_FLOWS = {
  shipperProcess: [
    { key: 'STARTED',              label: 'Order Created',     color: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' } },
    { key: 'ORDER_CONFIRMED',      label: 'Order Confirmed',   color: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' } },
    { key: 'TRUCKER_ANNOUNCED',    label: 'Truck Arrived',     color: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' } },
    { key: 'MEASUREMENT_RECEIVED', label: 'Weight Measured',   color: { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' } },
    { key: 'VGM_PURCHASED',        label: 'VGM Issued',        color: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' } },
  ],
  certiweightVGMProcess: [
    { key: 'STARTED',            label: 'Order Received',     color: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' } },
    { key: 'TRUCKER_ANNOUNCED',  label: 'Truck Arrived',      color: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' } },
    { key: 'PURCHASE_CONFIRMED', label: 'Purchase Confirmed', color: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' } },
  ],
};

// Returns the process flow for the configured serviceDefinitionUri, or null
window.getProcessFlow = function() {
  const def = window.AppConfig && window.AppConfig.serviceDefinitionUri;
  return window.BACKEND_STATE_FLOWS[def] || null;
};

// Returns display info for any state key (backend or mock)
window.getStateInfo = function(stateKey) {
  const flow = window.getProcessFlow();
  if (flow) {
    const found = flow.find(function(s) { return s.key === stateKey; });
    if (found) return { label: found.label, color: found.color };
  }
  if (window.STATE_LABELS[stateKey]) {
    return {
      label: window.STATE_LABELS[stateKey],
      color: window.STATE_COLORS[stateKey] || { bg: '#e5e7eb', text: '#374151', border: '#9ca3af' }
    };
  }
  return {
    label: stateKey.replace(/_/g, ' '),
    color: { bg: '#e5e7eb', text: '#374151', border: '#9ca3af' }
  };
};

// ── Process Display Configuration ────────────────────────────────────────────
// Per-process metadata display hints. The frontend uses these to decide which
// parameters to show in the list, how to label them, and which are internal
// implementation details that should be hidden.
// Any process not listed here falls back to auto-formatting.
window.PROCESS_DISPLAY_CONFIG = {
  shipperProcess: {
    listColumns: [
      { key: 'containernr', label: 'Container' },
      { key: 'bookingnr',   label: 'Booking' },
      { key: 'liner',       label: 'Liner' },
      { key: 'location',    label: 'Location' },
      { key: 'grossMass',   label: 'Weight (kg)' },
    ],
    hiddenParameters: ['internalApiUrl', 'payloadData', 'certiweightInstanceId', 'containerNr'],
    parameterLabels: {
      containernr:      'Container Nr',
      bookingnr:        'Booking Nr',
      liner:            'Liner',
      location:         'Location',
      announcementDate: 'Announcement Date',
      transportbedrijf: 'Transport Company',
      customerReference:'Customer Reference',
      grossMass:        'Gross Mass (kg)',
      certificateRef:   'Certificate Ref',
      certificateUrl:   'Certificate URL',
    }
  },
  certiweightVGMProcess: {
    listColumns: [
      { key: 'containernr', label: 'Container' },
      { key: 'bookingnr',   label: 'Booking' },
      { key: 'liner',       label: 'Liner' },
      { key: 'location',    label: 'Location' },
    ],
    hiddenParameters: ['internalApiUrl', 'payloadData'],
    parameterLabels: {
      containernr:      'Container Nr',
      bookingnr:        'Booking Nr',
      liner:            'Liner',
      location:         'Location',
      announcementDate: 'Announcement Date',
      transportbedrijf: 'Transport Company',
      customerReference:'Customer Reference',
    },
    stateTransitions: {
      TRUCKER_ANNOUNCED: [
        { key: 'transportbedrijf', label: 'Transport Company', type: 'text', placeholder: 'e.g. Van Moer Transport', required: true }
      ]
    }
  }
};

// Returns display config for the active service definition, or {}
window.getDisplayConfig = function() {
  var def = window.AppConfig && window.AppConfig.serviceDefinitionUri;
  return window.PROCESS_DISPLAY_CONFIG[def] || {};
};

// Returns list columns for the active process; falls back to first 4 param keys
window.getTableColumns = function(instances) {
  var config = window.getDisplayConfig();
  if (config.listColumns && config.listColumns.length > 0) return config.listColumns;
  if (instances && instances.length > 0) {
    return Object.keys(instances[0].parameters || {}).slice(0, 4).map(function(k) {
      return { key: k, label: window.getParameterLabel(k) };
    });
  }
  return [];
};

// Human-readable label for a parameter key; auto-formats camelCase/snake_case
window.getParameterLabel = function(key) {
  var config = window.getDisplayConfig();
  if (config.parameterLabels && config.parameterLabels[key]) return config.parameterLabels[key];
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
            .replace(/^\w/, function(c) { return c.toUpperCase(); }).trim();
};

// True if a parameter key should be hidden in the detail view
window.isHiddenParameter = function(key) {
  var hidden = window.getDisplayConfig().hiddenParameters || [];
  return hidden.indexOf(key) !== -1;
};

// Extra form fields to collect when advancing to a given state key
// Returns array of { key, label, type, placeholder, required }
window.getStateTransitionFields = function(stateKey) {
  var transitions = window.getDisplayConfig().stateTransitions || {};
  return transitions[stateKey] || [];
};

// ---- Seed Data ----

window.SEED_OFFERINGS = [
  {
    id: "TestID-123",
    name: "Container Weighing",
    provider: "Certi-Weight",
    createdAt: "2026-03-18"
  }
];

// Seed data matching backend message schemas
window.SEED_INSTANCES = [
  {
    "@context": window.JSONLD_CONTEXT["@context"],
    id: "inst-001",
    serviceOfferingId: "TestID-123",
    state: "order_created",
    // OrderCreated fields
    containernr: "MSKU1234567",
    bookingnr: "BK2026-001",
    liner: "Maersk Line",
    location: "Port of Antwerp",
    announcementDate: "2026-04-09T09:00:00Z",
    transportbedrijf: "Van Moer Transport",
    customerReference: "CUST-REF-001",
    shipper: {
      "@id": "https://van-moer.be/shippers/001",
      contact: "John Doe",
      company: "Van Moer Logistics",
      address: "Havenstraat 123, 2030 Antwerp, Belgium"
    },
    // Fields populated in later states
    truckDriver: null,
    announcementTimestamp: null,
    seal: null,
    weighingTimestamp: null,
    weight: null,
    serviceProvider: "Certi-Weight",
    lastUpdated: "2026-04-09T09:00:00Z"
  },
  {
    "@context": window.JSONLD_CONTEXT["@context"],
    id: "inst-002",
    serviceOfferingId: "TestID-123",
    state: "trucker_announced",
    // OrderCreated fields
    containernr: "CSQU7654321",
    bookingnr: "BK2026-002",
    liner: "MSC",
    location: "Port of Rotterdam",
    announcementDate: "2026-04-08T14:30:00Z",
    transportbedrijf: "TransCo Logistics",
    customerReference: "CUST-REF-002",
    shipper: {
      "@id": "https://van-moer.be/shippers/002",
      contact: "Jane Smith",
      company: "Van Moer Logistics",
      address: "Havenstraat 123, 2030 Antwerp, Belgium"
    },
    // TruckerAnnounced fields
    truckDriver: {
      "@id": "https://transco.be/drivers/042",
      name: "Marc Vermeulen",
      licensePlate: "1-ABC-123",
      company: "TransCo Logistics"
    },
    announcementTimestamp: "2026-04-09T08:15:00Z",
    seal: null,
    weighingTimestamp: null,
    weight: null,
    serviceProvider: "Certi-Weight",
    lastUpdated: "2026-04-09T08:15:00Z"
  },
  {
    "@context": window.JSONLD_CONTEXT["@context"],
    id: "inst-003",
    serviceOfferingId: "TestID-123",
    state: "measurement_created",
    // OrderCreated fields
    containernr: "TRIU9988776",
    bookingnr: "BK2026-003",
    liner: "CMA CGM",
    location: "Port of Hamburg",
    announcementDate: "2026-04-07T08:15:00Z",
    transportbedrijf: "FastFreight BV",
    customerReference: "CUST-REF-003",
    shipper: {
      "@id": "https://van-moer.be/shippers/003",
      contact: "Bob Johnson",
      company: "Van Moer Logistics",
      address: "Havenstraat 123, 2030 Antwerp, Belgium"
    },
    // TruckerAnnounced fields
    truckDriver: {
      "@id": "https://fastfreight.be/drivers/078",
      name: "Peter Janssen",
      licensePlate: "2-XYZ-789",
      company: "FastFreight BV"
    },
    announcementTimestamp: "2026-04-08T07:30:00Z",
    // MeasurementCreated fields
    seal: "SEAL-123789",
    weighingTimestamp: "2026-04-09T10:20:00Z",
    weight: null, // Hidden - not yet purchased
    serviceProvider: "Certi-Weight",
    lastUpdated: "2026-04-09T10:20:00Z"
  },
  {
    "@context": window.JSONLD_CONTEXT["@context"],
    id: "inst-004",
    serviceOfferingId: "TestID-123",
    state: "purchase_vgm",
    // OrderCreated fields
    containernr: "HLCU5566778",
    bookingnr: "BK2026-004",
    liner: "Hapag-Lloyd",
    location: "Port of Antwerp",
    announcementDate: "2026-04-06T10:00:00Z",
    transportbedrijf: "Port Express",
    customerReference: "CUST-REF-004",
    shipper: {
      "@id": "https://van-moer.be/shippers/004",
      contact: "Sarah Williams",
      company: "Van Moer Logistics",
      address: "Havenstraat 123, 2030 Antwerp, Belgium"
    },
    // TruckerAnnounced fields
    truckDriver: {
      "@id": "https://portexpress.be/drivers/015",
      name: "Tom De Vries",
      licensePlate: "1-DEF-456",
      company: "Port Express"
    },
    announcementTimestamp: "2026-04-08T09:00:00Z",
    // MeasurementCreated fields
    seal: "SEAL-445566",
    weighingTimestamp: "2026-04-09T09:15:00Z",
    weight: null, // Hidden until purchased
    serviceProvider: "Certi-Weight",
    lastUpdated: "2026-04-09T12:00:00Z"
  },
  {
    "@context": window.JSONLD_CONTEXT["@context"],
    id: "inst-005",
    serviceOfferingId: "TestID-123",
    state: "vgm_purchased",
    // OrderCreated fields
    containernr: "MSCU8899001",
    bookingnr: "BK2026-005",
    liner: "MSC",
    location: "Port of Zeebrugge",
    announcementDate: "2026-04-05T11:30:00Z",
    transportbedrijf: "TransCo Logistics",
    customerReference: "CUST-REF-005",
    shipper: {
      "@id": "https://van-moer.be/shippers/005",
      contact: "Michael Brown",
      company: "Van Moer Logistics",
      address: "Havenstraat 123, 2030 Antwerp, Belgium"
    },
    // TruckerAnnounced fields
    truckDriver: {
      "@id": "https://transco.be/drivers/099",
      name: "Jan Peeters",
      licensePlate: "1-GHI-789",
      company: "TransCo Logistics"
    },
    announcementTimestamp: "2026-04-08T08:45:00Z",
    // MeasurementCreated fields
    seal: "SEAL-998877",
    weighingTimestamp: "2026-04-09T09:50:00Z",
    // VGMPurchased - weight is now visible
    weight: 31250.8,
    serviceProvider: "Certi-Weight",
    lastUpdated: "2026-04-09T14:15:00Z"
  }
];
