# Start Development Servers
# This script starts the frontend (Flutter) and backend (Node.js) in separate windows

$projectRoot = $PSScriptRoot

# Start Backend in new window
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; npm run dev" -WindowStyle Normal

# Start Frontend in new window
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; flutter run -d chrome" -WindowStyle Normal

Write-Host "✓ Started backend and frontend in separate windows" -ForegroundColor Green
