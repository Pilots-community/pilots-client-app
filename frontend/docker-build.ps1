# Docker Build and Run Script for Frontend
# Usage:
#   .\docker-build.ps1              # Build and run locally on port 8080
#   .\docker-build.ps1 -PushToACR   # Build and push to Azure Container Registry

param(
    [string]$ImageName = "pilots-frontend",
    [string]$Tag = "latest",
    [int]$Port = 8080,
    [switch]$PushToACR,
    [string]$ACRName = "",
    [switch]$SkipRun
)

# Build the Docker image
Write-Host "Building Docker image: $ImageName:$Tag" -ForegroundColor Cyan
docker build -t ${ImageName}:${Tag} .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Docker image built successfully!" -ForegroundColor Green

# Push to Azure Container Registry if requested
if ($PushToACR) {
    if ([string]::IsNullOrWhiteSpace($ACRName)) {
        Write-Host "Error: ACRName is required when using -PushToACR" -ForegroundColor Red
        Write-Host "Usage: .\docker-build.ps1 -PushToACR -ACRName 'myregistry'" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Logging into Azure Container Registry: $ACRName" -ForegroundColor Cyan
    az acr login --name $ACRName

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ACR login failed!" -ForegroundColor Red
        exit 1
    }

    $AcrImageName = "${ACRName}.azurecr.io/${ImageName}:${Tag}"
    Write-Host "Tagging image for ACR: $AcrImageName" -ForegroundColor Cyan
    docker tag ${ImageName}:${Tag} $AcrImageName

    Write-Host "Pushing to ACR: $AcrImageName" -ForegroundColor Cyan
    docker push $AcrImageName

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed to ACR!" -ForegroundColor Green
        Write-Host "Image: $AcrImageName" -ForegroundColor Cyan
    } else {
        Write-Host "ACR push failed!" -ForegroundColor Red
        exit 1
    }
}

# Run the container locally if not skipped
if (-not $SkipRun -and -not $PushToACR) {
    Write-Host "`nStarting container on port $Port..." -ForegroundColor Cyan
    
    # Stop and remove existing container if running
    docker rm -f $ImageName 2>$null
    
    docker run -d `
        --name $ImageName `
        -p ${Port}:80 `
        ${ImageName}:${Tag}

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Container running successfully!" -ForegroundColor Green
        Write-Host "  Access the app at: http://localhost:$Port" -ForegroundColor Cyan
        Write-Host "`nUseful commands:" -ForegroundColor Yellow
        Write-Host "  View logs:    docker logs -f $ImageName" -ForegroundColor Gray
        Write-Host "  Stop:         docker stop $ImageName" -ForegroundColor Gray
        Write-Host "  Remove:       docker rm -f $ImageName" -ForegroundColor Gray
    } else {
        Write-Host "Failed to start container!" -ForegroundColor Red
        exit 1
    }
}
