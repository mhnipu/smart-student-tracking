# Database Migrations Guide

This directory contains database migrations for the Smart Student Tracking application.

## Directory Structure

- `/migrations/` - Core migrations that set up the initial database schema
- `/migrations/custom_migrations/` - Custom migrations for fixes and enhancements

## Important Migrations

1. **20250618063939_fragrant_dune.sql** - Initial database setup
2. **20250622150000_recreate_study_sessions.sql** - Recreates the study sessions table with proper schema
3. **20250702200000_combined_fixes.sql** - Combined fixes for common issues:
   - Makes study_sessions.test_type nullable with a default value
   - Adds last_study_date column to users table
   - Updates the marks constraint

## How to Run Migrations

### Option 1: Using the Migration Scripts (Recommended)

#### For Windows Users:

1. Open PowerShell
2. Navigate to your project directory
3. Run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\run_migration.ps1
   ```

#### For Mac/Linux Users:

1. Open Terminal
2. Navigate to your project directory
3. Run:
   ```bash
   chmod +x run_migration.sh
   ./run_migration.sh
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the migration SQL content
4. Paste into a new SQL query and run

## Common Issues and Solutions

### JWT Expired Error

If you see "JWT expired" errors:
1. Make sure your .env file has up-to-date credentials
2. Update both VITE_SUPABASE_* and SUPABASE_* variables

### Missing Columns

If your application reports missing columns:
1. Run the combined_fixes migration
2. Restart your application

## Development Workflow

When making schema changes:
1. Create a new migration file in `/migrations/custom_migrations/`
2. Use timestamp naming: `YYYYMMDDHHMMSS_descriptive_name.sql`
3. Add your SQL with proper error handling
4. Update the README if necessary
5. Test thoroughly before deploying 