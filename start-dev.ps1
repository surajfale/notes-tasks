# Start Development Servers
# This script starts the frontend (SvelteKit) and backend (Node.js) in separate windows

$projectRoot = $PSScriptRoot

# Start Backend in new window
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; npm run dev" -WindowStyle Normal

# Start Frontend in new window
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm run dev" -WindowStyle Normal

Write-Host "✓ Started backend and frontend in separate windows" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
