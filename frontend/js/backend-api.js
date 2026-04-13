// ============================================================
// Backend API Client - Service Instance API
// ============================================================
// Real HTTP client for Java backend implementing OpenAPI spec

window.BackendApiService = (function () {
  
  // ETag cache for optimistic locking
  const etagCache = new Map();
  
  /**
   * Make authenticated HTTP request with ETag support
   */
  async function apiRequest(method, path, body = null, requireETag = false) {
    const config = window.AppConfig;
    const url = `${config.apiBaseUrl}${path}`;
    const token = config.auth.getToken();
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authentication
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add If-Match header for updates (ETag-based concurrency control)
    if (requireETag && (method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
      const etag = etagCache.get(path);
      if (!etag) {
        throw new Error('ETag required but not available. Please refresh the resource.');
      }
      headers['If-Match'] = etag;
    }
    
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    };
    
    const response = await fetch(url, options);
    
    // Store ETag from response for future updates
    const etag = response.headers.get('ETag');
    if (etag) {
      etagCache.set(path, etag);
    }
    
    // Handle non-2xx responses
    if (!response.ok) {
      const problemDetails = await response.json().catch(() => ({}));
      throw new Error(problemDetails.detail || problemDetails.title || `HTTP ${response.status}`);
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    return await response.json();
  }
  
  /**
   * Convert frontend instance to backend ServiceInstance schema
   */
  function toServiceInstance(frontendInstance, isCreate = false) {
    const stakeholders = [
      {
        role: 'provider',
        party: 'did:web:identityhub.certi-weight.be',
        displayName: frontendInstance.serviceProvider || 'Certi-Weight'
      }
    ];
    
    // Add shipper stakeholder if available
    if (frontendInstance.shipper) {
      stakeholders.push({
        role: 'shipper',
        party: frontendInstance.shipper['@id'] || 'did:web:identityhub.van-moer.be',
        displayName: frontendInstance.shipper.company || 'Van Moer Logistics'
      });
    }
    
    // Add truck driver as carrier if available
    if (frontendInstance.truckDriver) {
      stakeholders.push({
        role: 'carrier',
        party: frontendInstance.truckDriver['@id'] || 'unknown',
        displayName: frontendInstance.truckDriver.name || 'Unknown Driver'
      });
    }
    
    // Map all VGM fields to parameters
    const parameters = {
      containernr: frontendInstance.containernr,
      bookingnr: frontendInstance.bookingnr,
      liner: frontendInstance.liner,
      location: frontendInstance.location,
      announcementDate: frontendInstance.announcementDate,
      transportbedrijf: frontendInstance.transportbedrijf,
      customerReference: frontendInstance.customerReference
    };
    
    // Add state-specific parameters
    if (frontendInstance.truckDriver) {
      parameters.truckDriver = frontendInstance.truckDriver;
      parameters.announcementTimestamp = frontendInstance.announcementTimestamp;
    }
    if (frontendInstance.seal) {
      parameters.seal = frontendInstance.seal;
    }
    if (frontendInstance.weighingTimestamp) {
      parameters.weighingTimestamp = frontendInstance.weighingTimestamp;
    }
    if (frontendInstance.weight) {
      parameters.weight = frontendInstance.weight;
    }
    
    const payload = {
      serviceDefinition: window.AppConfig.serviceDefinitionUri,
      stakeholders,
      parameters,
      state: frontendInstance.state
    };
    
    // Add optional fields
    if (frontendInstance.serviceOfferingId) {
      payload.serviceOffering = `https://certi-weight.be/offerings/${frontendInstance.serviceOfferingId}`;
    }
    
    return payload;
  }
  
  /**
   * Convert backend ServiceInstance to frontend format
   */
  function fromServiceInstance(backendInstance) {
    const params = backendInstance.parameters || {};
    
    // Extract stakeholder info
    const provider = backendInstance.stakeholders.find(s => s.role === 'provider');
    const shipper = backendInstance.stakeholders.find(s => s.role === 'shipper');
    const carrier = backendInstance.stakeholders.find(s => s.role === 'carrier');
    
    return {
      '@context': window.JSONLD_CONTEXT['@context'],
      id: backendInstance.id,
      serviceOfferingId: backendInstance.serviceOffering?.split('/').pop() || 'TestID-123',
      state: backendInstance.state,
      
      // OrderCreated fields
      containernr: params.containernr,
      bookingnr: params.bookingnr,
      liner: params.liner,
      location: params.location,
      announcementDate: params.announcementDate,
      transportbedrijf: params.transportbedrijf,
      customerReference: params.customerReference,
      
      // Shipper info
      shipper: shipper ? {
        '@id': shipper.party,
        contact: params.shipperContact || 'Unknown',
        company: shipper.displayName,
        address: params.shipperAddress || 'Unknown'
      } : null,
      
      // TruckerAnnounced fields
      truckDriver: params.truckDriver || (carrier ? {
        '@id': carrier.party,
        name: carrier.displayName,
        licensePlate: params.licensePlate || 'Unknown',
        company: params.transportbedrijf || 'Unknown'
      } : null),
      announcementTimestamp: params.announcementTimestamp,
      
      // MeasurementCreated fields
      seal: params.seal,
      weighingTimestamp: params.weighingTimestamp,
      
      // VGMPurchased field
      weight: params.weight,
      
      serviceProvider: provider?.displayName || 'Certi-Weight',
      lastUpdated: backendInstance.updatedAt,
      
      // Backend metadata
      _etag: backendInstance.version,
      _backendId: backendInstance.id
    };
  }
  
  return {
    
    // ---- Service Offerings ----
    
    /**
     * GET /serviceOfferings - List available offerings (placeholder)
     * In real implementation, this would call a separate offering endpoint
     */
    getOfferings: async function() {
      // For demo, return static offering
      // In production, this would call a real endpoint
      return [
        {
          id: 'TestID-123',
          name: 'Container Weighing',
          provider: 'Certi-Weight',
          createdAt: '2026-03-18'
        }
      ];
    },
    
    /**
     * GET /serviceOfferings/:id - Get single offering (placeholder)
     */
    getOffering: async function(id) {
      const offerings = await this.getOfferings();
      const offering = offerings.find(o => o.id === id);
      if (!offering) {
        throw new Error('Offering not found');
      }
      return offering;
    },
    
    // ---- Service Instances ----
    
    /**
     * POST /serviceInstances - Create new instance
     */
    createInstance: async function (serviceOfferingId, data) {
      const frontendInstance = {
        serviceOfferingId,
        state: 'order_created',
        containernr: data.containernr,
        bookingnr: data.bookingnr,
        liner: data.liner,
        location: data.location,
        transportbedrijf: data.transportbedrijf,
        customerReference: data.customerReference,
        announcementDate: new Date().toISOString(),
        shipper: {
          '@id': 'did:web:identityhub.van-moer.be',
          contact: data.shipperContact || 'Unknown',
          company: data.shipperCompany || 'Van Moer Logistics',
          address: data.shipperAddress || 'Havenstraat 123, 2030 Antwerp, Belgium'
        },
        serviceProvider: 'Certi-Weight'
      };
      
      const payload = toServiceInstance(frontendInstance, true);
      const response = await apiRequest('POST', '/serviceInstances', payload);
      
      return fromServiceInstance(response);
    },
    
    /**
     * GET /serviceInstances - List instances with filtering
     */
    getInstances: async function (filters = {}) {
      const queryParams = new URLSearchParams();
      
      if (filters.serviceOffering) {
        queryParams.append('serviceOffering', filters.serviceOffering);
      }
      if (filters.state) {
        queryParams.append('state', filters.state);
      }
      if (filters.limit) {
        queryParams.append('limit', filters.limit);
      }
      if (filters.offset) {
        queryParams.append('offset', filters.offset);
      }
      
      const queryString = queryParams.toString();
      const path = `/serviceInstances${queryString ? '?' + queryString : ''}`;
      
      const response = await apiRequest('GET', path);
      
      return response.items.map(item => fromServiceInstance(item));
    },
    
    /**
     * GET /serviceInstances/:id - Get single instance
     */
    getInstance: async function (id) {
      const response = await apiRequest('GET', `/serviceInstances/${id}`);
      return fromServiceInstance(response);
    },
    
    /**
     * PATCH /serviceInstances/:id - Partial update
     */
    patchInstance: async function (id, updates) {
      // ALWAYS fetch current instance first to ensure ETag is cached
      const path = `/serviceInstances/${id}`;
      const current = await apiRequest('GET', path);
      const currentMapped = fromServiceInstance(current);
      
      // Apply updates to current state
      const updated = { ...currentMapped, ...updates };
      
      // Build partial update payload for backend
      const patchPayload = {};
      
      // Update state if changed
      if (updates.state) {
        patchPayload.state = updates.state;
      }
      
      // Update parameters
      const paramUpdates = {};
      if (updates.seal) paramUpdates.seal = updates.seal;
      if (updates.weighingTimestamp) paramUpdates.weighingTimestamp = updates.weighingTimestamp;
      if (updates.weight !== undefined) paramUpdates.weight = updates.weight;
      if (updates.truckDriver) paramUpdates.truckDriver = updates.truckDriver;
      if (updates.announcementTimestamp) paramUpdates.announcementTimestamp = updates.announcementTimestamp;
      if (updates.driverName) paramUpdates.driverName = updates.driverName;
      if (updates.licensePlate) paramUpdates.licensePlate = updates.licensePlate;
      
      if (Object.keys(paramUpdates).length > 0) {
        // Merge with existing backend parameters
        patchPayload.parameters = { ...(current.parameters || {}), ...paramUpdates };
      }
      
      const response = await apiRequest('PATCH', path, patchPayload, true);
      return fromServiceInstance(response);
    },
    
    /**
     * DELETE /serviceInstances/:id - Delete instance
     */
    deleteInstance: async function (id) {
      // Fetch instance first to ensure ETag is cached
      const path = `/serviceInstances/${id}`;
      await apiRequest('GET', path);
      
      // Now delete with ETag
      await apiRequest('DELETE', path, null, true);
    },
    
    /**
     * Get instances filtered by service offering
     */
    getInstancesByOffering: async function (offeringId) {
      return this.getInstances({
        serviceOffering: `https://certi-weight.be/offerings/${offeringId}`
      });
    },
    
    /**
     * Helper: Get valid next states for current state
     */
    getNextStates: function (currentState) {
      const STATES = window.STATES;
      const currentIndex = STATES.indexOf(currentState);
      if (currentIndex === -1 || currentIndex >= STATES.length - 1) return [];
      return [STATES[currentIndex + 1]];
    }
  };
})();
