# Stop any running instance
Get-Process -Name "Hounded_Heart.Api" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "Starting API..." -ForegroundColor Green
dotnet run
