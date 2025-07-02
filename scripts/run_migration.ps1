# Convenience script for running database migrations
# This script redirects to the actual implementation in the supabase/scripts directory

Write-Host "Running the database migration script..." -ForegroundColor Cyan
Write-Host "For more details on database management, see supabase/docs/DATABASE_TROUBLESHOOTING.md" -ForegroundColor Gray
Write-Host ""

# Run the actual script from the supabase scripts directory
try {
    $scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "..\supabase\scripts\run_migration.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath
    } else {
        Write-Host "Error: Could not find the migration script at: $scriptPath" -ForegroundColor Red
        Write-Host "Please make sure you are running this script from the project root directory." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "An error occurred while running the migration script: $_" -ForegroundColor Red
    exit 1
} 