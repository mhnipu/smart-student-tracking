# PowerShell script to run the migration for recreating the study_sessions table
Write-Host "Running migration to recreate study_sessions table..." -ForegroundColor Green

# Check if supabase CLI is installed
$supabaseInstalled = $null
try {
    $supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
} catch {
    # Command not found
}

if ($null -eq $supabaseInstalled) {
    Write-Host "Error: Supabase CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "You can install it using: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists and load it
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#].*?)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value)
        }
    }
} else {
    Write-Host "Warning: .env file not found. Make sure your Supabase credentials are set up." -ForegroundColor Yellow
}

# Run the migration
try {
    Write-Host "Applying migration to recreate study_sessions table..." -ForegroundColor Cyan
    supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error: Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "Error: Failed to run migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Study sessions table has been recreated with the correct schema." -ForegroundColor Green
Write-Host "You can now use the study timer functionality." -ForegroundColor Green 