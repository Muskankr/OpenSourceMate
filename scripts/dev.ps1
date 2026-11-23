# PowerShell helper script for common OpenSourceMate development tasks
param (
    [Parameter(Position=0, Mandatory=$false)]
    [ValidateSet("help", "install", "install-backend", "install-frontend", "dev-frontend", "dev-backend", "docker-up", "docker-down", "docker-build", "lint", "format", "test", "test-backend", "test-frontend", "clean")]
    [string]$Task = "help"
)

function Show-Help {
    Write-Host "OpenSourceMate PowerShell Development Helper" -ForegroundColor Cyan
    Write-Host "Usage: .\scripts\dev.ps1 <command>`n"
    Write-Host "Commands:"
    Write-Host "  install         Install dependencies for both frontend and backend"
    Write-Host "  dev-frontend    Start Next.js frontend dev server (port 3000)"
    Write-Host "  dev-backend     Start FastAPI backend dev server (port 8000)"
    Write-Host "  docker-up       Start all services with docker compose"
    Write-Host "  docker-down     Stop all docker compose services"
    Write-Host "  docker-build    Build or rebuild docker compose images"
    Write-Host "  lint            Run backend (ruff) and frontend (eslint) linting"
    Write-Host "  format          Run backend (ruff) and frontend (prettier) formatting"
    Write-Host "  test            Run both backend and frontend test suites"
    Write-Host "  test-backend    Run pytest backend test suite"
    Write-Host "  test-frontend   Run Jest frontend test suite"
    Write-Host "  clean           Remove caches (.pytest_cache, __pycache__, .next)"
}

switch ($Task) {
    "install" {
        Write-Host "Installing backend dependencies..." -ForegroundColor Green
        Push-Location backend; pip install -r requirements.txt -r requirements-dev.txt; Pop-Location
        Write-Host "Installing frontend dependencies..." -ForegroundColor Green
        Push-Location frontend; npm install; Pop-Location
    }
    "install-backend" {
        Push-Location backend; pip install -r requirements.txt -r requirements-dev.txt; Pop-Location
    }
    "install-frontend" {
        Push-Location frontend; npm install; Pop-Location
    }
    "dev-frontend" {
        Push-Location frontend; npm run dev; Pop-Location
    }
    "dev-backend" {
        Push-Location backend; uvicorn app.main:app --reload --port 8000; Pop-Location
    }
    "docker-up" {
        Write-Host "Starting services with docker compose..." -ForegroundColor Green
        docker compose up
    }
    "docker-down" {
        Write-Host "Stopping docker compose services..." -ForegroundColor Green
        docker compose down
    }
    "docker-build" {
        Write-Host "Building docker compose images..." -ForegroundColor Green
        docker compose build
    }
    "lint" {
        Write-Host "Linting backend with ruff..." -ForegroundColor Green
        ruff check backend
        Write-Host "Linting frontend with eslint..." -ForegroundColor Green
        Push-Location frontend; npm run lint; Pop-Location
    }
    "format" {
        Write-Host "Formatting backend with ruff..." -ForegroundColor Green
        ruff format backend
        Write-Host "Formatting frontend with prettier..." -ForegroundColor Green
        Push-Location frontend; npm run format; Pop-Location
    }
    "test" {
        Write-Host "Running backend tests..." -ForegroundColor Green
        Push-Location backend; pytest; Pop-Location
        Write-Host "Running frontend tests..." -ForegroundColor Green
        Push-Location frontend; npm test; Pop-Location
    }
    "test-backend" {
        Push-Location backend; pytest; Pop-Location
    }
    "test-frontend" {
        Push-Location frontend; npm test; Pop-Location
    }
    "clean" {
        Get-ChildItem -Path . -Include "__pycache__", ".pytest_cache", ".next" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Write-Host "Cleaned caches." -ForegroundColor Green
    }
    Default {
        Show-Help
    }
}
