// ============================================================
// Container Weighing Control Center App - Mock API Service
// ============================================================
// Simulates REST API calls using in-memory state.
// All methods return Promises to mimic async API behavior.

window.ApiService = (function () {
  // Deep clone seed data so we don't mutate originals
  let offerings = JSON.parse(JSON.stringify(window.SEED_OFFERINGS));
  let instances = JSON.parse(JSON.stringify(window.SEED_INSTANCES));
  let nextId = 6;

  const STATES = window.STATES;

  // Simulate network delay (ms)
  const DELAY = 200;
  function delay(data) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(data); }, DELAY);
    });
  }
  function delayReject(msg) {
    return new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error(msg)); }, DELAY);
    });
  }

  return {

    // ---- Service Offerings ----

    /** GET /service-offerings */
    getOfferings: function () {
      return delay(offerings.map(function (o) { return Object.assign({}, o); }));
    },

    /** GET /service-offerings/:id */
    getOffering: function (id) {
      var o = offerings.find(function (o) { return o.id === id; });
      return o ? delay(Object.assign({}, o)) : delayReject("Offering not found");
    },

    // ---- Service Instances ----

    /** POST /service-instance/:serviceOfferingId - Creates OrderCreated message */
    createInstance: function (serviceOfferingId, data) {
      var instance = {
        "@context": window.JSONLD_CONTEXT["@context"],
        id: "inst-" + String(nextId++).padStart(3, "0"),
        serviceOfferingId: serviceOfferingId,
        state: "order_created",
        // OrderCreated message fields
        containernr: data.containernr || data.containerNumber,
        bookingnr: data.bookingnr,
        liner: data.liner,
        location: data.location,
        announcementDate: new Date().toISOString(),
        transportbedrijf: data.transportbedrijf || "",
        customerReference: data.customerReference || "",
        shipper: data.shipper || {
          "@id": "https://van-moer.be/shippers/new",
          contact: data.shipperContact || "Unknown",
          company: data.shipperCompany || "Van Moer Logistics",
          address: data.shipperAddress || "Unknown"
        },
        // Fields populated in later states
        truckDriver: null,
        announcementTimestamp: null,
        seal: null,
        weighingTimestamp: null,
        weight: null,
        serviceProvider: "Certi-Weight",
        lastUpdated: new Date().toISOString()
      };
      instances.push(instance);
      return delay(Object.assign({}, instance));
    },

    /** GET /service-instance */
    getInstances: function () {
      return delay(instances.map(function (i) { return Object.assign({}, i); }));
    },

    /** GET /service-instance (filtered by offering) */
    getInstancesByOffering: function (offeringId) {
      var filtered = instances.filter(function (i) {
        return i.serviceOfferingId === offeringId;
      });
      return delay(filtered.map(function (i) { return Object.assign({}, i); }));
    },

    /** GET /service-instance/:serviceInstanceId */
    getInstance: function (id) {
      var instance = instances.find(function (i) { return i.id === id; });
      return instance
        ? delay(Object.assign({}, instance))
        : delayReject("Instance not found: " + id);
    },

    /**
     * PATCH /service-instance/:serviceInstanceId
     * Handles state transitions and field updates based on backend message schema:
     * - order_created -> trucker_announced: adds truckDriver, announcementTimestamp
     * - trucker_announced -> measurement_created: adds seal, weighingTimestamp
     * - measurement_created -> purchase_vgm: shipper initiates purchase
     * - purchase_vgm -> vgm_purchased: adds weight (visible after purchase)
     */
    patchInstance: function (id, updates) {
      var index = instances.findIndex(function (i) { return i.id === id; });
      if (index === -1) return delayReject("Instance not found: " + id);

      // Validate state transition
      if (updates.state !== undefined) {
        var currentStateIdx = STATES.indexOf(instances[index].state);
        var newStateIdx = STATES.indexOf(updates.state);

        if (newStateIdx === -1) {
          return delayReject("Invalid state: " + updates.state);
        }
        if (newStateIdx <= currentStateIdx) {
          return delayReject("Cannot move backwards in state machine");
        }
        if (newStateIdx > currentStateIdx + 1) {
          return delayReject("Cannot skip states. Next valid state: " + STATES[currentStateIdx + 1]);
        }

        // State-specific field requirements
        if (updates.state === "trucker_announced") {
          // TruckerAnnounced message requires truckDriver info
          if (updates.truckDriver) {
            instances[index].truckDriver = updates.truckDriver;
          } else if (!instances[index].truckDriver) {
            // Auto-generate if not provided
            instances[index].truckDriver = {
              "@id": "https://transport.be/drivers/" + Date.now(),
              name: updates.driverName || "Driver TBD",
              licensePlate: updates.licensePlate || "TBD",
              company: instances[index].transportbedrijf || "Unknown"
            };
          }
          instances[index].announcementTimestamp = updates.announcementTimestamp || new Date().toISOString();
        }
        
        if (updates.state === "measurement_created") {
          // MeasurementCreated message requires seal and weighingTimestamp
          if (!updates.seal && !instances[index].seal) {
            return delayReject("seal is required for measurement_created state");
          }
          instances[index].seal = updates.seal || instances[index].seal || "SEAL-" + Date.now();
          instances[index].weighingTimestamp = updates.weighingTimestamp || new Date().toISOString();
          // Weight is measured but NOT visible yet
          instances[index].weight = null; // Explicitly hidden
        }

        if (updates.state === "purchase_vgm") {
          // PurchaseVGM event - shipper → certiweight transaction
          // No new fields, just state transition
        }
        
        if (updates.state === "vgm_purchased") {
          // VGMPurchased message includes weight (visible after purchase)
          instances[index].weight = updates.weight || (Math.random() * 30000 + 10000).toFixed(1);
        }
      }

      // Apply allowed updates
      var allowedFields = [
        "state", "seal", "weighingTimestamp", "weight", 
        "truckDriver", "announcementTimestamp", "driverName", "licensePlate",
        "transportbedrijf", "customerReference", "liner", "location", "bookingnr"
      ];
      allowedFields.forEach(function (field) {
        if (updates[field] !== undefined && field !== "driverName" && field !== "licensePlate") {
          instances[index][field] = updates[field];
        }
      });
      instances[index].lastUpdated = new Date().toISOString();

      return delay(Object.assign({}, instances[index]));
    },

    // ---- Helpers ----

    /** Returns the list of valid next states for a given current state */
    getNextStates: function (currentState) {
      var currentIndex = STATES.indexOf(currentState);
      if (currentIndex === -1 || currentIndex >= STATES.length - 1) return [];
      return [STATES[currentIndex + 1]];
    },

    /**
     * Process incoming backend message (JSON-LD format)
     * Handles OrderCreated, MeasurementCreated, VGMPurchased events
     */
    processBackendMessage: function (message) {
      // Validate JSON-LD context
      if (!message["@context"]) {
        return delayReject("Invalid message: missing @context");
      }

      // Find or create instance based on containernr
      var instance = instances.find(function (i) { return i.containernr === message.containernr; });
      
      if (!instance) {
        // New OrderCreated message - create instance
        var newInstance = Object.assign({}, message, {
          id: "inst-" + String(nextId++).padStart(3, "0"),
          serviceOfferingId: "TestID-123",
          serviceProvider: "Certi-Weight",
          lastUpdated: new Date().toISOString()
        });
        instances.push(newInstance);
        return delay(Object.assign({}, newInstance));
      } else {
        // Update existing instance with new message data
        Object.keys(message).forEach(function (key) {
          if (key !== "id" && key !== "serviceOfferingId") {
            instance[key] = message[key];
          }
        });
        instance.lastUpdated = new Date().toISOString();
        return delay(Object.assign({}, instance));
      }
    }
  };
})();
