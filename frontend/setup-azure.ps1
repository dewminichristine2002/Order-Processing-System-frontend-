# Azure Static Web Apps Deployment Script
# This script automates the creation of Azure Static Web App resources

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$AppName,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo,  # Format: owner/repo
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "main"
)

# Color output functions
function Write-Success {
    Write-Host $args -ForegroundColor Green
}

function Write-Error-Custom {
    Write-Host $args -ForegroundColor Red
}

function Write-Info {
    Write-Host $args -ForegroundColor Cyan
}

Write-Info "========================================"
Write-Info "Azure Static Web Apps Setup"
Write-Info "========================================"

# Check if Azure CLI is installed
Write-Info "Checking Azure CLI..."
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "Azure CLI not found. Please install it from https://aka.ms/azcli"
    exit 1
}

# Login to Azure
Write-Info "Please login to Azure..."
az login

# Create resource group if it doesn't exist
Write-Info "Creating/checking resource group: $ResourceGroupName"
az group create --name $ResourceGroupName --location $Location

# Create Static Web App
Write-Info "Creating Static Web App: $AppName"
$deploymentToken = az staticwebapp create `
    --name $AppName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --source "https://github.com/$GitHubRepo" `
    --branch $Branch `
    --login-with-github `
    --github-access-token $GitHubToken `
    --app-location "frontend" `
    --output-location "build" `
    --build-properties apiBuildCommand="npm run build" `
    --query "properties.repositoryToken" `
    --output tsv

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Static Web App created successfully!"
    Write-Info "Deployment Token: $deploymentToken"
    Write-Info ""
    Write-Success "Next Steps:"
    Write-Info "1. Go to GitHub repo: https://github.com/$GitHubRepo/settings/secrets/actions"
    Write-Info "2. Add secret 'AZURE_STATIC_WEB_APPS_API_TOKEN' with value: $deploymentToken"
    Write-Info "3. Push code to $Branch branch to trigger deployment"
    Write-Info ""
    Write-Info "View your app at: https://$($AppName).azurestaticapps.net"
} else {
    Write-Error-Custom "Failed to create Static Web App"
    exit 1
}

Write-Success "========================================"
Write-Success "Setup Complete!"
Write-Success "========================================"
