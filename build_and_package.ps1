<#
Build and package script (Windows PowerShell)
- Builds the React frontend
- Copies the build into backend/frontend/build
- Creates a virtualenv, installs requirements and PyInstaller
- Runs PyInstaller to create a single-file executable

Run this script from the repository root in PowerShell (as the user who will perform the build).
#>

$ErrorActionPreference = 'Stop'

$root = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
cd $root

# 1) Build frontend
Write-Host "==> Building frontend (npm)"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm not found in PATH. Install Node.js and npm before running this script." -ForegroundColor Red
    exit 1
}

Push-Location frontend
Write-Host "Running npm install..."
npm ci

Write-Host "Running npm run build..."
npm run build
Pop-Location

# 2) Copy build into backend folder so the backend can serve static files
$srcBuild = Join-Path $root "frontend\build"
$dstBuild = Join-Path $root "backend\frontend\build"

if (Test-Path $dstBuild) {
    Write-Host "Removing existing backend frontend build..."
    Remove-Item -Recurse -Force $dstBuild
}

Write-Host "Copying build => $dstBuild"
New-Item -ItemType Directory -Force -Path (Split-Path $dstBuild) | Out-Null
Copy-Item -Recurse -Force -Path $srcBuild -Destination $dstBuild

# 3) Prepare Python environment and install requirements
Write-Host "==> Preparing Python environment"
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found in PATH. Install Python 3.8+ and ensure 'python' is available in PATH." -ForegroundColor Red
    exit 1
}

$venvPath = Join-Path $root ".venv_build"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating virtual environment: $venvPath"
    python -m venv $venvPath
}

$activate = Join-Path $venvPath "Scripts\Activate.ps1"
Write-Host "Activating virtualenv"
. $activate

Write-Host "Installing backend requirements"
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt

# Ensure PyInstaller installed
if (-not (Get-Command pyinstaller -ErrorAction SilentlyContinue)) {
    Write-Host "PyInstaller not found - installing..."
    python -m pip install pyinstaller
}

# 4) Run PyInstaller
Write-Host "==> Running PyInstaller"
# Include the frontend build folder into the executable as data so the StaticFiles mount can find it at runtime
$addData = "backend\\frontend\\build;frontend/build"
# On Windows PyInstaller expects add-data in the format SOURCE;DEST
pyinstaller --noconfirm --clean --onefile --name TechInfoPlus backend\serve_pack.py --add-data $addData

Write-Host "PyInstaller finished. The exe will be in the 'dist' folder."
Write-Host "Note: Test the executable on a clean Windows machine. The target machine must have MySQL running (XAMPP) or adjust the connection settings to use SQLite if you made that change." -ForegroundColor Yellow

Write-Host "Build and packaging complete." -ForegroundColor Green
