# Redeploy files to existing Azure Storage (reads config from .azure-deploy.json)
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".azure-deploy.json")) {
    Write-Error "No .azure-deploy.json found. Run deploy.ps1 first."
    exit 1
}

$config = Get-Content ".azure-deploy.json" | ConvertFrom-Json
$storageAccountName = $config.storageAccountName
$resourceGroupName = $config.resourceGroupName
$subscription = $config.subscription

Write-Host "Redeploying to $($config.url)..." -ForegroundColor Green

# Get storage account key
Write-Host "Getting storage account key..." -ForegroundColor Yellow
$accountKey = az storage account keys list `
    --account-name $storageAccountName `
    --resource-group $resourceGroupName `
    --subscription $subscription `
    --query "[0].value" `
    --output tsv

if (-not $accountKey) {
    Write-Error "Failed to get storage account key"
    exit 1
}

az storage blob upload-batch `
    --account-name $storageAccountName `
    --account-key $accountKey `
    --destination '$web' `
    --source "." `
    --pattern "*.html" `
    --content-type "text/html" `
    --overwrite `
    --output none

az storage blob upload-batch `
    --account-name $storageAccountName `
    --account-key $accountKey `
    --destination '$web' `
    --source "." `
    --pattern "css/*.css" `
    --content-type "text/css" `
    --overwrite `
    --output none

az storage blob upload-batch `
    --account-name $storageAccountName `
    --account-key $accountKey `
    --destination '$web' `
    --source "." `
    --pattern "js/*.js" `
    --content-type "application/javascript" `
    --overwrite `
    --output none

Write-Host "Done! App updated at $($config.url)" -ForegroundColor Green
