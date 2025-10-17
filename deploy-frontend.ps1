# Deploy Frontend to Netlify
# Usage: .\deploy-frontend.ps1 https://your-backend-url.up.railway.app

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl
)

$ApiUrl = "$BackendUrl/api"

Write-Host "Building Flutter web app..." -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow

cd frontend

# Build for production
flutter build web --release --dart-define=API_BASE_URL=$ApiUrl --dart-define=DEVELOPMENT=false

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful! ✅" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://app.netlify.com/drop" -ForegroundColor White
    Write-Host "2. Drag the 'frontend/build/web' folder to deploy" -ForegroundColor White
    Write-Host "`nOr use Netlify CLI:" -ForegroundColor Cyan
    Write-Host "   npm install -g netlify-cli" -ForegroundColor White
    Write-Host "   netlify deploy --prod --dir=build/web" -ForegroundColor White
} else {
    Write-Host "`nBuild failed! ❌" -ForegroundColor Red
    exit 1
}

cd ..
