// ============================================================
// Backend API Configuration
// ============================================================

window.AppConfig = {
  // Backend API base URL - UPDATE THIS to point to your deployed backend
  apiBaseUrl: "https://your-backend-app.azurewebsites.net",
  
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
  
  // Service Definition URI for VGM weighing service
  serviceDefinitionUri: "https://certi-weight.be/services/vgm-weighing/v1",
  
  // Demo mode - uses mock data if true
  demoMode: true // Set to false when connecting to real backend
};
