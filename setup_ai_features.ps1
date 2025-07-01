# PowerShell script to set up AI features for Smart Student Tracking

Write-Host "Smart Student Tracking - AI Features Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if the Supabase CLI is installed
function Check-SupabaseCLI {
    try {
        $supabaseVersion = supabase --version
        Write-Host "✓ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Supabase CLI not found" -ForegroundColor Red
        Write-Host "Please install the Supabase CLI by running: npm install -g supabase" -ForegroundColor Yellow
        return $false
    }
}

# Function to check if Node.js is installed
function Check-NodeJS {
    try {
        $nodeVersion = node --version
        Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Node.js not found" -ForegroundColor Red
        Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Cyan
$nodeInstalled = Check-NodeJS
$supabaseInstalled = Check-SupabaseCLI

if (-not $nodeInstalled -or -not $supabaseInstalled) {
    Write-Host "Please install the required tools and run this script again." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
Write-Host "Checking for .env file..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
}
else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "Creating sample .env file..." -ForegroundColor Yellow
    
    # Create sample .env file
    @"
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI API Key (for Edge Functions)
OPENAI_API_KEY=your_openai_api_key_here
"@ | Out-File -FilePath ".env" -Encoding utf8
    
    Write-Host "✓ Sample .env file created" -ForegroundColor Green
    Write-Host "Please edit the .env file and add your Supabase URL and anonymous key." -ForegroundColor Yellow
}

# Menu for setup options
function Show-Menu {
    Write-Host ""
    Write-Host "Setup Options:" -ForegroundColor Cyan
    Write-Host "1. Run database migration scripts" -ForegroundColor White
    Write-Host "2. Deploy Edge Functions" -ForegroundColor White
    Write-Host "3. Set up OpenAI API Key for Edge Functions" -ForegroundColor White
    Write-Host "4. Check Supabase project status" -ForegroundColor White
    Write-Host "5. Start development server" -ForegroundColor White
    Write-Host "Q. Quit" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Select an option (1-5, Q to quit)"
    return $choice
}

# Handle running database migrations
function Run-Migrations {
    Write-Host "This will run migration scripts to set up the database tables." -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to continue? (Y/N)"
    
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        Write-Host "Please log in to your Supabase project and run these scripts in the SQL Editor:" -ForegroundColor Cyan
        Write-Host "1. fix_study_sessions_table.sql" -ForegroundColor White
        Write-Host "2. fix_rls_policies.sql" -ForegroundColor White
        Write-Host "3. supabase/migrations/20250622123000_ai_features_setup.sql" -ForegroundColor White
        
        # Open the SQL files to make them easy to copy-paste
        Write-Host "Opening the SQL files for you to copy-paste..." -ForegroundColor Yellow
        Invoke-Item "fix_study_sessions_table.sql"
        Invoke-Item "fix_rls_policies.sql"
        Invoke-Item "supabase/migrations/20250622123000_ai_features_setup.sql"
        
        Write-Host "When you've run all the scripts, press Enter to continue" -ForegroundColor Cyan
        Read-Host
    }
}

# Handle deploying Edge Functions
function Deploy-EdgeFunctions {
    Write-Host "This will deploy the Edge Functions to your Supabase project." -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to continue? (Y/N)"
    
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        # Make deploy_edge_functions.sh executable and run it
        Write-Host "Deploying Edge Functions..." -ForegroundColor Cyan
        try {
            # For Windows, we'll run bash if available, otherwise show instructions
            if (Get-Command bash -ErrorAction SilentlyContinue) {
                bash deploy_edge_functions.sh
            } else {
                # If bash isn't available, provide manual instructions
                Write-Host "Could not find 'bash'. Please run the following commands manually:" -ForegroundColor Yellow
                Write-Host "supabase functions deploy generate-insights --no-verify-jwt" -ForegroundColor White
                Write-Host "mkdir -p .supabase/functions/_shared" -ForegroundColor White
                Write-Host "Copy-Item -Path 'supabase/functions/_shared/*' -Destination '.supabase/functions/_shared/' -Recurse" -ForegroundColor White
            }
        }
        catch {
            Write-Host "Error deploying Edge Functions: $_" -ForegroundColor Red
        }
    }
}

# Handle setting up OpenAI API Key
function Setup-OpenAIKey {
    Write-Host "This will set up your OpenAI API Key for Edge Functions." -ForegroundColor Yellow
    $key = Read-Host "Enter your OpenAI API Key (or press Enter to skip)"
    
    if ($key -ne "") {
        try {
            Write-Host "Setting OpenAI API Key..." -ForegroundColor Cyan
            supabase secrets set OPENAI_API_KEY="$key"
            Write-Host "✓ OpenAI API Key set successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "Error setting OpenAI API Key: $_" -ForegroundColor Red
        }
    }
}

# Handle checking Supabase project status
function Check-ProjectStatus {
    Write-Host "Checking Supabase project status..." -ForegroundColor Cyan
    
    try {
        $projectInfo = supabase status
        Write-Host $projectInfo
    }
    catch {
        Write-Host "Error checking project status: $_" -ForegroundColor Red
        Write-Host "Make sure you're linked to a Supabase project with 'supabase link'" -ForegroundColor Yellow
    }
}

# Handle starting development server
function Start-DevServer {
    Write-Host "Starting development server..." -ForegroundColor Cyan
    try {
        npm run dev
    }
    catch {
        Write-Host "Error starting development server: $_" -ForegroundColor Red
    }
}

# Main loop
$choice = $null
while ($choice -ne "Q" -and $choice -ne "q") {
    $choice = Show-Menu
    
    switch ($choice) {
        "1" { Run-Migrations }
        "2" { Deploy-EdgeFunctions }
        "3" { Setup-OpenAIKey }
        "4" { Check-ProjectStatus }
        "5" { Start-DevServer }
        "Q" { Write-Host "Exiting..." -ForegroundColor Cyan }
        "q" { Write-Host "Exiting..." -ForegroundColor Cyan }
        default { Write-Host "Invalid option, please try again." -ForegroundColor Red }
    }
}

Write-Host ""
Write-Host "Setup complete. Check AI_FEATURES_SETUP.md for more information." -ForegroundColor Green 