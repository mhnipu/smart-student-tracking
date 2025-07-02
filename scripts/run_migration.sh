#!/bin/bash
# Convenience script for running database migrations
# This script redirects to the actual implementation in the supabase/scripts directory

echo -e "\033[0;36mRunning the database migration script...\033[0m"
echo -e "\033[0;90mFor more details on database management, see supabase/docs/DATABASE_TROUBLESHOOTING.md\033[0m"
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TARGET_SCRIPT="$SCRIPT_DIR/../supabase/scripts/run_migration.sh"

# Check if the target script exists
if [ -f "$TARGET_SCRIPT" ]; then
    # Make sure the target script is executable
    chmod +x "$TARGET_SCRIPT"
    # Execute the target script
    "$TARGET_SCRIPT"
else
    echo -e "\033[0;31mError: Could not find the migration script at: $TARGET_SCRIPT\033[0m"
    echo -e "\033[0;31mPlease make sure you are running this script from the project root directory.\033[0m"
    exit 1
fi 