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
