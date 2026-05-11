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
    const config = window.AppConfig;
    const stakeholders = [
      {
        role: 'provider',
        party: config.counterpartyDid,
        displayName: frontendInstance.serviceProvider || 'Certi-Weight'
      }
    ];

    if (frontendInstance.shipper) {
      stakeholders.push({
        role: 'shipper',
        party: config.ownDid,
        displayName: frontendInstance.shipper.company || 'Van Moer Logistics'
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
   * Convert backend ServiceInstance to frontend format.
   * Passes through the parameters map as-is so the UI can display any process generically.
   */
  function fromServiceInstance(backendInstance) {
    const stakeholders = backendInstance.stakeholders || [];
    const provider = stakeholders.find(s => s.role === 'provider');
    return {
      id: backendInstance.id,
      serviceOfferingId: backendInstance.serviceOffering?.split('/').pop() || 'TestID-123',
      state: backendInstance.state,
      parameters: backendInstance.parameters || {},
      stakeholders,
      serviceDefinition: backendInstance.serviceDefinition,
      serviceProvider: provider?.displayName || 'Certi-Weight',
      updatedAt: backendInstance.updatedAt,
      createdAt: backendInstance.createdAt,
      _etag: backendInstance.version,
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
      
      if (filters.serviceDefinition) {
        queryParams.append('serviceDefinition', filters.serviceDefinition);
      }
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
     * Accepts { state?, parameters?, stakeholders? }
     */
    patchInstance: async function (id, updates) {
      const path = `/serviceInstances/${id}`;
      const current = await apiRequest('GET', path);

      const patchPayload = {};
      if (updates.state !== undefined) patchPayload.state = updates.state;
      if (updates.parameters) {
        patchPayload.parameters = { ...(current.parameters || {}), ...updates.parameters };
      }
      if (updates.stakeholders) patchPayload.stakeholders = updates.stakeholders;

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
     * Get instances filtered by service definition (Flowable process key)
     */
    getInstancesByOffering: async function (offeringId) {
      return this.getInstances({
        serviceDefinition: window.AppConfig.serviceDefinitionUri
      });
    },
    
    /**
     * Helper: Get valid next states for current state.
     * Uses the backend process flow when available; falls back to mock STATES.
     */
    getNextStates: function (currentState) {
      const flow = window.getProcessFlow();
      if (flow) {
        const idx = flow.findIndex(s => s.key === currentState);
        if (idx >= 0 && idx < flow.length - 1) return [flow[idx + 1].key];
        return [];
      }
      const idx = window.STATES.indexOf(currentState);
      if (idx === -1 || idx >= window.STATES.length - 1) return [];
      return [window.STATES[idx + 1]];
    }
  };
})();
