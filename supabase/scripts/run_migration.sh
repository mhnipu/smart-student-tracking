#!/bin/bash
# Shell script to run database migrations

echo -e "\033[0;32mRunning database migrations...\033[0m"

# Check if .env file exists
if [ -f .env ]; then
  # Load environment variables from .env file
  export $(grep -v '^#' .env | xargs)
  echo -e "\033[0;32mLoaded environment variables from .env file\033[0m"
else
  echo -e "\033[0;33mNo .env file found. Make sure you have set your environment variables.\033[0m"
  echo -e "\033[0;33mCreate a .env file with SUPABASE_URL and SUPABASE_KEY or set them manually.\033[0m"
  
  # If VITE_ variables exist, try to use them for SUPABASE variables
  if [ ! -z "$VITE_SUPABASE_URL" ] && [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "\033[0;33mUsing VITE_ environment variables as fallback...\033[0m"
    export SUPABASE_URL=$VITE_SUPABASE_URL
    export SUPABASE_KEY=$VITE_SUPABASE_ANON_KEY
  else
    exit 1
  fi
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "\033[0;31mSUPABASE_URL and SUPABASE_KEY must be set in environment or .env file\033[0m"
  exit 1
fi

# Print connection info (without showing the full key)
KEY_PREVIEW="${SUPABASE_KEY:0:5}...${SUPABASE_KEY: -5}"
echo -e "\033[0;90mUsing Supabase URL: $SUPABASE_URL\033[0m"
echo -e "\033[0;90mUsing Supabase Key: $KEY_PREVIEW\033[0m"

# Function to run SQL file
run_sql_file() {
  local file_path="$1"
  local description="$2"
  
  if [ -f "$file_path" ]; then
    echo -e "\n\033[0;36mRunning migration: $description\033[0m"
    echo -e "\033[0;90mFile: $file_path\033[0m"
    
    # Read SQL content
    local sql_content=$(cat "$file_path")
    
    # Run the SQL using curl
    response=$(curl -s -w "%{http_code}" \
      -X POST \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"query\": $(echo "$sql_content" | jq -Rs .)}" \
      "$SUPABASE_URL/rest/v1/rpc/pgexecute")
    
    http_code="${response: -3}"
    body="${response:0:${#response}-3}"
    
    if [ "$http_code" = "200" ]; then
      echo -e "\033[0;32mMigration successful.\033[0m"
    else
      echo -e "\033[0;31mMigration failed with status code $http_code\033[0m"
      echo "$body"
    fi
  else
    echo -e "\033[0;31mFile not found: $file_path\033[0m"
  fi
}

# Run the combined fixes migration
run_sql_file "../../supabase/migrations/custom_migrations/20250702200000_combined_fixes.sql" "Combined Database Fixes"

echo -e "\n\033[0;32mMigration process completed.\033[0m" 