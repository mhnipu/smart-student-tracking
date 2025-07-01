#!/bin/bash
# Bash script to run the migration for recreating the study_sessions table

echo -e "\033[0;32mRunning migration to recreate study_sessions table...\033[0m"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "\033[0;31mError: Supabase CLI not found. Please install it first.\033[0m"
    echo -e "\033[0;33mYou can install it using: npm install -g supabase\033[0m"
    exit 1
fi

# Check if .env file exists and load it
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo -e "\033[0;33mWarning: .env file not found. Make sure your Supabase credentials are set up.\033[0m"
fi

# Run the migration
echo -e "\033[0;36mApplying migration to recreate study_sessions table...\033[0m"
supabase db push

if [ $? -eq 0 ]; then
    echo -e "\033[0;32mMigration completed successfully!\033[0m"
else
    echo -e "\033[0;31mError: Migration failed with exit code $?\033[0m"
    exit $?
fi

echo -e "\033[0;32mStudy sessions table has been recreated with the correct schema.\033[0m"
echo -e "\033[0;32mYou can now use the study timer functionality.\033[0m" 