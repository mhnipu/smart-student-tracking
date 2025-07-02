# PowerShell script to run database migrations

Write-Host "Running database migrations..." -ForegroundColor Cyan

# Check if .env file exists
if (Test-Path .env) {
    # Load environment variables from .env file
    Get-Content .env | ForEach-Object {
        if ($_ -match "^\s*([^#].*?)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            # Remove quotes if present
            $value = $value -replace '^"(.*)"$', '$1'
            $value = $value -replace "^'(.*)'$", '$1'
            [Environment]::SetEnvironmentVariable($name, $value)
        }
    }
    Write-Host "Loaded environment variables from .env file" -ForegroundColor Green
} else {
    Write-Host "No .env file found. Make sure you have set your environment variables." -ForegroundColor Yellow
    Write-Host "Create a .env file with SUPABASE_URL and SUPABASE_KEY or set them manually." -ForegroundColor Yellow
    
    # If VITE_ variables exist, try to use them for SUPABASE variables
    if ($env:VITE_SUPABASE_URL -and $env:VITE_SUPABASE_ANON_KEY) {
        Write-Host "Using VITE_ environment variables as fallback..." -ForegroundColor Yellow
        $env:SUPABASE_URL = $env:VITE_SUPABASE_URL
        $env:SUPABASE_KEY = $env:VITE_SUPABASE_ANON_KEY
    } else {
        exit 1
    }
}

# Check if required environment variables are set
if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_KEY) {
    Write-Host "SUPABASE_URL and SUPABASE_KEY must be set in environment or .env file" -ForegroundColor Red
    exit 1
}

# Print connection info (without showing the full key)
$keyPreview = $env:SUPABASE_KEY.Substring(0, 5) + "..." + $env:SUPABASE_KEY.Substring($env:SUPABASE_KEY.Length - 5, 5)
Write-Host "Using Supabase URL: $($env:SUPABASE_URL)" -ForegroundColor Gray
Write-Host "Using Supabase Key: $keyPreview" -ForegroundColor Gray

# Function to run SQL file
function Run-SQL-File {
    param (
        [string]$filePath,
        [string]$description
    )
    
    if (Test-Path $filePath) {
        Write-Host "`nRunning migration: $description" -ForegroundColor Cyan
        Write-Host "File: $filePath" -ForegroundColor Gray
        
        $sqlContent = Get-Content -Path $filePath -Raw
        $headers = @{
            "apikey" = $env:SUPABASE_KEY
            "Authorization" = "Bearer $($env:SUPABASE_KEY)"
            "Content-Type" = "application/json"
        }

        try {
            $response = Invoke-RestMethod -Uri "$($env:SUPABASE_URL)/rest/v1/rpc/pgexecute" -Method POST -Headers $headers -Body (@{
                query = $sqlContent
            } | ConvertTo-Json -Depth 10)
            
            Write-Host "Migration successful." -ForegroundColor Green
        }
        catch {
            Write-Host "Migration failed: $_" -ForegroundColor Red
            Write-Host $_.Exception.Response.StatusCode.value__
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                Write-Host $responseBody -ForegroundColor Red
            }
        }
    } else {
        Write-Host "File not found: $filePath" -ForegroundColor Red
    }
}

# Run the combined fixes migration
Run-SQL-File -filePath "..\..\supabase\migrations\custom_migrations\20250702200000_combined_fixes.sql" -description "Combined Database Fixes"

Write-Host "`nMigration process completed." -ForegroundColor Green 