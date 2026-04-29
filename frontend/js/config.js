// ============================================================
// Backend API Configuration
// ============================================================

window.AppConfig = {
  // Backend API base URL
  apiBaseUrl: "http://localhost:8080",
  
  // Authentication
  auth: {
    // Demo token for testing (safe to commit - not a real credential)
    // In production, users get real tokens from /auth/token endpoint
    token: "demo-token-replace-in-production",
    
    // Set bearer token
    setToken: function(token) {
      this.token = token;
      // Store in sessionStorage for demo purposes
      sessionStorage.setItem('authToken', token);
    },
    
    // Get bearer token
    getToken: function() {
      if (!this.token) {
        this.token = sessionStorage.getItem('authToken') || "demo-token-replace-in-production";
      }
      return this.token;
    }
  },
  
  // Service Definition — must match the Flowable process definition key
  serviceDefinitionUri: "certiweightVGMProcess",

  // Demo mode - uses mock data if true
  demoMode: false
};
