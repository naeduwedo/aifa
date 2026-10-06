# 一键启动：Docker 数据层 -> Go API (:8080) -> Next 前端 (:3000)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Start-Sleep -Seconds 25
  }
  Push-Location $root
  docker compose up -d
  Pop-Location
} else {
  Write-Host "docker not found - expecting Postgres/Redis to be reachable" -ForegroundColor Yellow
}

Get-Process aifa-api -ErrorAction SilentlyContinue | Stop-Process -Force
Push-Location "$root\backend"
go build -o bin\aifa-api.exe ./cmd/server
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Start-Process -FilePath "$root\backend\bin\aifa-api.exe" -WorkingDirectory "$root\backend" -WindowStyle Hidden
Pop-Location

$frontendUp = $false
try { Invoke-RestMethod "http://localhost:3000" -TimeoutSec 2 | Out-Null; $frontendUp = $true } catch {}
if (-not $frontendUp) {
  Start-Process -FilePath "cmd" -ArgumentList "/c","npm run start > %TEMP%\aifa-fe.log 2>&1" `
    -WorkingDirectory "$root\frontend" -WindowStyle Hidden
}

Start-Sleep -Seconds 2
try { Write-Host ("API   : " + (Invoke-RestMethod "http://localhost:8080/api/health").ok) -ForegroundColor Green } catch { Write-Host "API   : not up yet" -ForegroundColor Red }
try { Invoke-WebRequest "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host "Web   : http://localhost:3000" -ForegroundColor Green } catch { Write-Host "Web   : not up yet (run npm run dev in frontend/)" -ForegroundColor Red }
