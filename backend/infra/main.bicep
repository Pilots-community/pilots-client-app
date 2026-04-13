// Main Bicep file for deploying the Weighing App Mock Backend to Azure App Service
// This template creates all necessary resources including App Service, Application Insights, and Managed Identity

targetScope = 'resourceGroup'

// ===== PARAMETERS =====
@minLength(1)
@maxLength(64)
@description('Name of the environment (e.g., dev, prod). Used for resource naming.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string = resourceGroup().location

@description('App Service Plan SKU - defaults to B1 (Basic) for cost-effectiveness')
param appServicePlanSku string = 'B1'

@description('Node.js runtime version')
param nodeVersion string = '18-lts'

// ===== VARIABLES =====
// Generate unique token for resource naming following Azure best practices
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location, environmentName)

// Resource names following the pattern: az{resourcePrefix}{resourceToken}
var logAnalyticsName = 'azlog${resourceToken}'
var appInsightsName = 'azai${resourceToken}'
var managedIdentityName = 'azid${resourceToken}'
var appServicePlanName = 'azasp${resourceToken}'
var appServiceName = 'azapp${resourceToken}'

// Tags for resource organization
var tags = {
  Environment: environmentName
  Application: 'weighing-app-mock-backend'
  ManagedBy: 'azd'
}

// ===== LOG ANALYTICS WORKSPACE =====
// Required for Application Insights
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ===== APPLICATION INSIGHTS =====
// Monitoring and diagnostics for the App Service
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ===== USER-ASSIGNED MANAGED IDENTITY =====
// Used for secure access to Azure resources without credentials
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
  tags: tags
}

// ===== APP SERVICE PLAN =====
// Hosting plan for the App Service (Linux-based for Node.js)
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true  // Must be true for Linux plans
  }
}

// ===== APP SERVICE =====
// Node.js Express application hosting
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: appServiceName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      alwaysOn: appServicePlanSku != 'F1' && appServicePlanSku != 'D1' // Always On not available in Free tier
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      // CORS configuration - allows all origins (already configured in code)
      cors: {
        allowedOrigins: ['*']
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'PORT'
          value: '8080'  // Azure App Service expects app to listen on port 8080
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: nodeVersion
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
    }
  }
}

// ===== DIAGNOSTIC SETTINGS =====
// Logging configuration for the App Service
resource appServiceDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${appServiceName}-diagnostics'
  scope: appService
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// ===== OUTPUTS =====
@description('The name of the App Service')
output appServiceName string = appService.name

@description('The default hostname of the App Service')
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'

@description('The resource ID of the App Service')
output appServiceId string = appService.id

@description('The name of the resource group')
output resourceGroupName string = resourceGroup().name

@description('Application Insights connection string')
output appInsightsConnectionString string = appInsights.properties.ConnectionString

@description('Managed Identity Client ID')
output managedIdentityClientId string = managedIdentity.properties.clientId
