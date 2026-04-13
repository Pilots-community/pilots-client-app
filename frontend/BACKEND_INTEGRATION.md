# Backend Integration - VGM Message Schemas

This document describes how the Container Weighing Control Center app integrates with the backend message system using JSON-LD schemas.

## Message Event Flow

The system follows this 5-state progression:

1. **OrderCreated** (`order_created`)
2. **TruckerAnnounced** (`trucker_announced`)
3. **MeasurementCreated** (`measurement_created`)
4. **PurchaseVGM** (`purchase_vgm`)
5. **VGMPurchased** (`vgm_purchased`)

## JSON-LD Message Schemas

### 1. OrderCreated (order_created)

Triggered when a new weighing order is created.

**Required Fields:**
- `containernr` (xsd:string): ISO 6346 container number (Primary identifier)
- `bookingnr` (xsd:string): Booking reference number
- `liner` (xsd:string): Shipping line name
- `location` (xsd:string): Port location
- `announcementDate` (xsd:dateTime): When the order was announced
- `transportbedrijf` (xsd:string): Transport company name
- `customerReference` (xsd:string): Customer reference number
- `shipper` (xsd:IRI): Nested object with contact, company, address

**Example:**
```json
{
  "@context": "https://example.com/context/vgm.jsonld",
  "containernr": "MSKU1234567",
  "bookingnr": "BK2026-001",
  "liner": "Maersk Line",
  "location": "Port of Antwerp",
  "announcementDate": "2026-04-09T09:00:00Z",
  "transportbedrijf": "Van Moer Transport",
  "customerReference": "CUST-REF-001",
  "shipper": {
    "@id": "https://van-moer.be/shippers/001",
    "contact": "John Doe",
    "company": "Van Moer Logistics",
    "address": "Havenstraat 123, 2030 Antwerp, Belgium"
  }
}
```

### 2. TruckerAnnounced (trucker_announced)

Triggered when a truck driver is announced for the container transport.

**Additional Fields (beyond OrderCreated):**
- `truckDriver` (xsd:IRI): Nested object with name, licensePlate, company
- `announcementTimestamp` (xsd:dateTime): When the trucker was announced

**Example:**
```json
{
  "@context": "https://example.com/context/vgm.jsonld",
  "containernr": "MSKU1234567",
  "bookingnr": "BK2026-001",
  "liner": "Maersk Line",
  "location": "Port of Antwerp",
  "truckDriver": {
    "@id": "https://transco.be/drivers/042",
    "name": "Marc Vermeulen",
    "licensePlate": "1-ABC-123",
    "company": "TransCo Logistics"
  },
  "announcementTimestamp": "2026-04-09T08:15:00Z"
}
```

### 3. MeasurementCreated (measurement_created)

Triggered when weighing measurement is completed.

**Additional Fields:**
- `seal` (xsd:string): Container seal number
- `weighingTimestamp` (xsd:dateTime): When weighing was performed
- `Weight` (xsd:float): **HIDDEN** - not published externally until purchased

**Example:**
```json
{
  "@context": "https://example.com/context/vgm.jsonld",
  "containernr": "MSKU1234567",
  "bookingnr": "BK2026-001",
  "liner": "Maersk Line",
  "location": "Port of Antwerp",
  "seal": "SEAL-789456",
  "weighingTimestamp": "2026-04-09T11:45:00Z"
  // Weight is HIDDEN at this stage
}
```

### 4. PurchaseVGM (purchase_vgm)

Shipper → Certiweight transaction to purchase VGM data.

**Fields:**
- `containernr` (xsd:string)
- `bookingnr` (xsd:string)
- `liner` (xsd:string)
- `shipper` (xsd:IRI): Full shipper details

**Example:**
```json
{
  "@context": "https://example.com/context/vgm.jsonld",
  "containernr": "MSKU1234567",
  "bookingnr": "BK2026-001",
  "liner": "Maersk Line",
  "shipper": {
    "@id": "https://van-moer.be/shippers/001",
    "contact": "John Doe",
    "company": "Van Moer Logistics",
    "address": "Havenstraat 123, 2030 Antwerp, Belgium"
  }
}
```

### 5. VGMPurchased (vgm_purchased)

Triggered after VGM data is purchased and delivered.

**Additional Fields:**
- `Weight` (xsd:float): Container weight in kg - **VISIBLE after purchase**
- Full `shipper` object details included

**Example:**
```json
{
  "@context": "https://example.com/context/vgm.jsonld",
  "containernr": "MSKU1234567",
  "bookingnr": "BK2026-001",
  "liner": "Maersk Line",
  "location": "Port of Antwerp",
  "seal": "SEAL-789456",
  "weighingTimestamp": "2026-04-09T11:45:00Z",
  "Weight": 28450.5,
  "shipper": {
    "@id": "https://van-moer.be/shippers/001",
    "contact": "John Doe",
    "company": "Van Moer Logistics",
    "address": "Havenstraat 123, 2030 Antwerp, Belgium"
  }
}
```

## JSON-LD Context

All messages include:
- `@context`: "https://example.com/context/vgm.jsonld"
- Namespace: `xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"`

## Frontend Implementation

### Data Models (`js/models.js`)

- Updated states to 5-state workflow: `order_created`, `trucker_announced`, `measurement_created`, `purchase_vgm`, `vgm_purchased`
- Seed data includes all JSON-LD message fields for all states
- Added `JSONLD_CONTEXT` for semantic interoperability

### API Service (`js/services.js`)

#### Key Methods:

**`createInstance(serviceOfferingId, data)`**
- Creates an OrderCreated message
- Returns instance with `order_created` state
- Captures: containernr, bookingnr, liner, location, transportbedrijf, customerReference, shipper

**`patchInstance(id, updates)`**
- Handles state transitions with field validation
- State-specific requirements:
  - `trucker_announced`: Adds `truckDriver` (IRI) and `announcementTimestamp`
  - `measurement_created`: Requires `seal`, adds `weighingTimestamp`, weight is explicitly hidden
  - `purchase_vgm`: Transaction state (no additional fields)
  - `vgm_purchased`: Adds `Weight` (visible after purchase)

**`processBackendMessage(message)`**
- Handles incoming JSON-LD messages from backend
- Validates `@context`
- Creates or updates instances based on `containernr`

### UI Components (`index.html`)

#### CreateInstanceModal
- Captures OrderCreated message fields:
  - containernr, bookingnr, liner, location
  - transportbedrijf, customerReference
  - shipper contact information

#### InstanceDetailModal
- Displays all JSON-LD message fields with state-aware sections
- Shows `@context` badge
- Conditional field display:
  - **Order Created**: Basic order info, transport company, customer reference
  - **Trucker Announced**: + truck driver info (name, license plate, company), announcement timestamp
  - **Measurement Created**: + seal, weighing timestamp
  - **Purchase VGM**: Transaction initiated
  - **VGM Purchased**: + Weight (🔒 unlocked and visible)
- State advancement with state-specific forms:
  - TruckerAnnounced: Driver name, license plate
  - MeasurementCreated: Seal number
  - VGMPurchased: Weight value

#### Instance Table
- Columns: State, Container, Booking, Liner, Location, Trucker, Weight, Last Updated
- Trucker column shows:
  - 🚛 Driver name (when truck driver announced)
  - Transport company name (when only order created)
  - Empty placeholder (when neither available)
- Weight shown in green when available, grayed out when hidden

## Backend Integration Points

### Receiving Messages

When your backend sends a message, call:

```javascript
await window.ApiService.processBackendMessage(messagePayload);
```

This will:
1. Validate JSON-LD context
2. Find or create instance by `containernr`
3. Update instance with new message data
4. Trigger UI refresh

### Sending State Updates

When user advances state in UI:

```javascript
await window.ApiService.patchInstance(instanceId, {
  state: 'measurement_created',
  seal: 'SEAL-123456'
});
```

Backend should listen for these updates and:
1. Generate corresponding message event
2. Apply EDC policies (strip weight for non-entitled consumers)
3. Broadcast to relevant parties

## Security & Access Control

- **Weight field**: Hidden until `vgm_purchased` state
- **EDC integration**: Backend must enforce data access policies
- **Shipper data**: Full object only available in certain states

## Testing

Use the seed data in `models.js` to test all five states:
- **inst-001**: `order_created` - Basic order, no trucker or measurements yet
- **inst-002**: `trucker_announced` - Truck driver assigned (Marc Vermeulen, 1-ABC-123)
- **inst-003**: `measurement_created` - Measured with seal, weight hidden
- **inst-004**: `purchase_vgm` - Purchase transaction initiated
- **inst-005**: `vgm_purchased` - Complete with visible weight (31,250.8 kg)

Each instance demonstrates different stages of the workflow with realistic test data.

## Next Steps

1. Connect `processBackendMessage()` to your WebSocket/SSE endpoint
2. Implement backend message generation for each state transition
3. Add EDC policy enforcement for weight field access
4. Implement authentication for shipper data access
