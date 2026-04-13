# Azure Storage Static Website Deployment
# No Node.js, Docker, or build step required!
param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "weighing-app-rg",

    [Parameter(Mandatory=$false)]
    [string]$Location = "westeurope"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Container Weighing Control Center App ===" -ForegroundColor Cyan
Write-Host "Deploying to Azure Storage Static Website..." -ForegroundColor Green
Write-Host "No build step required!`n" -ForegroundColor Gray

# ── Check Azure CLI ──
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI not found. Install with: winget install Microsoft.AzureCLI"
    exit 1
}

# ── Login check ──
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Logging in to Azure..." -ForegroundColor Yellow
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "Subscription: $($account.name)" -ForegroundColor Cyan

# ── Create Resource Group ──
Write-Host "`n[1/4] Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location --output none

# ── Create Storage Account ──
$storageAccountName = "weighingapp$(Get-Random -Minimum 10000 -Maximum 99999)"
Write-Host "[2/4] Creating storage account: $storageAccountName" -ForegroundColor Yellow
az storage account create `
    --name $storageAccountName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku Standard_LRS `
    --kind StorageV2 `
    --output none

# ── Enable Static Website ──
Write-Host "[3/4] Enabling static website hosting..." -ForegroundColor Yellow
az storage blob service-properties update `
    --account-name $storageAccountName `
    --static-website `
    --index-document index.html `
    --404-document index.html `
    --output none

# ── Upload Files ──
Write-Host "[4/4] Uploading files..." -ForegroundColor Yellow

# Upload HTML
az storage blob upload `
    --account-name $storageAccountName `
    --container-name '$web' `
    --name "index.html" `
    --file "index.html" `
    --content-type "text/html" `
    --overwrite `
    --output none

# Upload CSS
az storage blob upload `
    --account-name $storageAccountName `
    --container-name '$web' `
    --name "css/styles.css" `
    --file "css/styles.css" `
    --content-type "text/css" `
    --overwrite `
    --output none

# Upload JS files
az storage blob upload `
    --account-name $storageAccountName `
    --container-name '$web' `
    --name "js/models.js" `
    --file "js/models.js" `
    --content-type "application/javascript" `
    --overwrite `
    --output none

az storage blob upload `
    --account-name $storageAccountName `
    --container-name '$web' `
    --name "js/services.js" `
    --file "js/services.js" `
    --content-type "application/javascript" `
    --overwrite `
    --output none

# ── Get URL ──
$webUrl = az storage account show `
    --name $storageAccountName `
    --resource-group $ResourceGroupName `
    --query "primaryEndpoints.web" `
    --output tsv

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`n  URL: $webUrl" -ForegroundColor Yellow
Write-Host "`n  Storage Account: $storageAccountName" -ForegroundColor Gray
Write-Host "  Resource Group:  $ResourceGroupName" -ForegroundColor Gray
Write-Host "  Cost: ~`$0.20/month" -ForegroundColor Gray
Write-Host "`n  To update later:" -ForegroundColor Cyan
Write-Host "  .\deploy.ps1 -ResourceGroupName $ResourceGroupName" -ForegroundColor Gray
Write-Host "`n  To delete all resources:" -ForegroundColor Cyan
Write-Host "  az group delete --name $ResourceGroupName --yes" -ForegroundColor Gray
Write-Host ""

# Save config for redeployment
@{
    storageAccountName = $storageAccountName
    resourceGroupName = $ResourceGroupName
    url = $webUrl
} | ConvertTo-Json | Set-Content -Path ".azure-deploy.json"
Write-Host "Config saved to .azure-deploy.json" -ForegroundColor Gray
