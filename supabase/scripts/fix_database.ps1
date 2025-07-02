# Easy database fix script for beginners
# This script runs the combined fixes migration to resolve common issues

Write-Host "===== Smart Student Tracking - Easy Database Fix =====" -ForegroundColor Cyan
Write-Host "This script will fix common database issues." -ForegroundColor White
Write-Host "Running this is safe and won't affect your existing data." -ForegroundColor White
Write-Host ""

# Check for VITE environment variables in .env file
if (Test-Path .env) {
    Write-Host "Found .env file, loading environment variables..." -ForegroundColor Green
    
    # Load from .env file
    Get-Content .env | ForEach-Object {
        if ($_ -match "^\s*(VITE_SUPABASE_URL)=(.*)$") {
            $env:SUPABASE_URL = $matches[2] -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
            Write-Host "✓ Found Supabase URL" -ForegroundColor Green
        }
        if ($_ -match "^\s*(VITE_SUPABASE_ANON_KEY)=(.*)$") {
            $env:SUPABASE_KEY = $matches[2] -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
            Write-Host "✓ Found Supabase Key" -ForegroundColor Green
        }
    }
}

# If needed vars aren't set, prompt user
if (-not $env:SUPABASE_URL) {
    Write-Host "Supabase URL not found in environment variables." -ForegroundColor Yellow
    $env:SUPABASE_URL = Read-Host "Please enter your Supabase URL (https://xxx.supabase.co)"
}

if (-not $env:SUPABASE_KEY) {
    Write-Host "Supabase Key not found in environment variables." -ForegroundColor Yellow
    $env:SUPABASE_KEY = Read-Host "Please enter your Supabase anon key (eyJh...)"
}

# Run the migration
$sqlFilePath = "..\..\supabase\migrations\custom_migrations\20250702200000_combined_fixes.sql"

if (-not (Test-Path $sqlFilePath)) {
    Write-Host "Error: Migration file not found at: $sqlFilePath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Applying database fixes..." -ForegroundColor Cyan

$sqlContent = Get-Content -Path $sqlFilePath -Raw
$headers = @{
    "apikey" = $env:SUPABASE_KEY
    "Authorization" = "Bearer $($env:SUPABASE_KEY)"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$($env:SUPABASE_URL)/rest/v1/rpc/pgexecute" -Method POST -Headers $headers -Body (@{
        query = $sqlContent
    } | ConvertTo-Json -Depth 10)
    
    Write-Host ""
    Write-Host "✓ Database fixes completed successfully!" -ForegroundColor Green
    Write-Host "✓ Fixed study_sessions.test_type constraint" -ForegroundColor Green  
    Write-Host "✓ Added last_study_date to users table" -ForegroundColor Green
    Write-Host "✓ Updated marks table constraints" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "You can now restart your application and everything should work correctly." -ForegroundColor White
}
catch {
    Write-Host "Error applying fixes: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Please check your Supabase credentials and try again." -ForegroundColor Yellow
    exit 1
} 