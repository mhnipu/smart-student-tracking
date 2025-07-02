#!/bin/bash
# Easy database fix script for beginners
# This script runs the combined fixes migration to resolve common issues

echo -e "\033[0;36m===== Smart Student Tracking - Easy Database Fix =====\033[0m"
echo -e "This script will fix common database issues."
echo -e "Running this is safe and won't affect your existing data."
echo ""

# Check for VITE environment variables in .env file
if [ -f .env ]; then
  echo -e "\033[0;32mFound .env file, loading environment variables...\033[0m"
  
  # Source the .env file
  source .env
  
  # Check if we got the variables we need from the .env file
  if [ ! -z "$VITE_SUPABASE_URL" ]; then
    export SUPABASE_URL=$VITE_SUPABASE_URL
    echo -e "\033[0;32m✓ Found Supabase URL\033[0m"
  fi
  
  if [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
    export SUPABASE_KEY=$VITE_SUPABASE_ANON_KEY
    echo -e "\033[0;32m✓ Found Supabase Key\033[0m"
  fi
fi

# If needed vars aren't set, prompt user
if [ -z "$SUPABASE_URL" ]; then
  echo -e "\033[0;33mSupabase URL not found in environment variables.\033[0m"
  echo -n "Please enter your Supabase URL (https://xxx.supabase.co): "
  read SUPABASE_URL
  export SUPABASE_URL
fi

if [ -z "$SUPABASE_KEY" ]; then
  echo -e "\033[0;33mSupabase Key not found in environment variables.\033[0m"
  echo -n "Please enter your Supabase anon key (eyJh...): "
  read SUPABASE_KEY
  export SUPABASE_KEY
fi

# Run the migration
SQL_FILE_PATH="./supabase/migrations/custom_migrations/20250702200000_combined_fixes.sql"

if [ ! -f "$SQL_FILE_PATH" ]; then
  echo -e "\033[0;31mError: Migration file not found at: $SQL_FILE_PATH\033[0m"
  exit 1
fi

echo ""
echo -e "\033[0;36mApplying database fixes...\033[0m"

# Read SQL content
SQL_CONTENT=$(cat "$SQL_FILE_PATH")

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "\033[0;33mWarning: jq is not installed. Using simplified JSON formatting.\033[0m"
  # Create JSON payload without jq
  JSON_PAYLOAD="{\"query\":\"$SQL_CONTENT\"}"
else
  # Create JSON payload with jq
  JSON_PAYLOAD=$(echo "$SQL_CONTENT" | jq -Rs '{query: .}')
fi

# Run the SQL using curl
RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -X POST \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  "$SUPABASE_URL/rest/v1/rpc/pgexecute")

# Extract HTTP status and body
HTTP_STATUS=$(echo "$RESPONSE" | grep -o 'HTTP_STATUS:[0-9]\+' | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]\+//')

if [ "$HTTP_STATUS" = "200" ]; then
  echo ""
  echo -e "\033[0;32m✓ Database fixes completed successfully!\033[0m"
  echo -e "\033[0;32m✓ Fixed study_sessions.test_type constraint\033[0m"
  echo -e "\033[0;32m✓ Added last_study_date to users table\033[0m"
  echo -e "\033[0;32m✓ Updated marks table constraints\033[0m"
  
  echo ""
  echo "You can now restart your application and everything should work correctly."
else
  echo -e "\033[0;31mError applying fixes. HTTP Status: $HTTP_STATUS\033[0m"
  echo "$BODY"
  
  echo ""
  echo -e "\033[0;33mPlease check your Supabase credentials and try again.\033[0m"
  exit 1
fi 