// ============================================================
// API Service Wrapper - Switches between Mock and Real Backend
// ============================================================

window.API = (function() {
  /**
   * Get the active API service based on configuration
   */
  function getActiveService() {
    if (window.AppConfig.demoMode) {
      console.log('🎭 Running in DEMO mode with mock data');
      return window.ApiService; // Mock service from services.js
    } else {
      console.log('🔗 Running in PRODUCTION mode with real backend');
      return window.BackendApiService; // Real backend service
    }
  }
  
  // Expose unified API interface
  return {
    getOfferings: function(...args) {
      return getActiveService().getOfferings(...args);
    },
    
    getOffering: function(...args) {
      return getActiveService().getOffering(...args);
    },
    
    createInstance: function(...args) {
      return getActiveService().createInstance(...args);
    },
    
    getInstances: function(...args) {
      return getActiveService().getInstances(...args);
    },
    
    getInstance: function(...args) {
      return getActiveService().getInstance(...args);
    },
    
    patchInstance: function(...args) {
      return getActiveService().patchInstance(...args);
    },
    
    deleteInstance: function(...args) {
      return getActiveService().deleteInstance(...args);
    },
    
    getInstancesByOffering: function(...args) {
      return getActiveService().getInstancesByOffering(...args);
    },
    
    getNextStates: function(...args) {
      return getActiveService().getNextStates(...args);
    },
    
    // Helper to switch modes at runtime
    setDemoMode: function(enabled) {
      window.AppConfig.demoMode = enabled;
      console.log(`Switched to ${enabled ? 'DEMO' : 'PRODUCTION'} mode`);
    },
    
    // Get current mode
    isDemoMode: function() {
      return window.AppConfig.demoMode;
    }
  };
})();
