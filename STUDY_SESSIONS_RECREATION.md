# Study Sessions Table Recreation

This guide explains how to recreate the study_sessions table in your Supabase database to fix the error: "Could not find the 'title' column of 'study_sessions' in the schema cache".

## What Happened?

The study_sessions table was dropped or deleted, and we need to recreate it with the proper schema that includes all necessary columns:

- `id` (Primary Key)
- `user_id` (Foreign Key to auth.users)
- `title` (Text with default 'Study Session')
- `description` (Text)
- `start_time` (Timestamp)
- `end_time` (Timestamp)
- `duration_minutes` (Integer)
- `session_type` (Text)
- `pomodoro_count` (Integer)
- `points_earned` (Integer)
- `is_completed` (Boolean)
- `notes` (Text)
- `subject_id` (Foreign Key to subjects)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## How to Fix It

### Option 1: Run the Migration Script (Recommended)

We've created a migration script that will recreate the table with all necessary columns and constraints.

#### For Windows Users:

1. Open PowerShell
2. Navigate to your project directory
3. Run the script:
   ```powershell
   .\run_migration.ps1
   ```

#### For Mac/Linux Users:

1. Open Terminal
2. Navigate to your project directory
3. Make the script executable:
   ```bash
   chmod +x run_migration.sh
   ```
4. Run the script:
   ```bash
   ./run_migration.sh
   ```

### Option 2: Run the SQL Directly in Supabase

If you prefer to run the SQL directly in the Supabase dashboard:

1. Log into your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of the file `supabase/migrations/20250622150000_recreate_study_sessions.sql`
4. Paste into the SQL Editor and run

## Verifying the Fix

After running the migration, you should be able to:

1. Use the study timer without errors
2. Create and complete study sessions
3. View your study sessions in the study session list

## Updated Components

The following components have been updated to work with the new schema:

1. `study-timer.tsx` - Now properly saves all session data including duration, points, and completion status
2. `study-session-list.tsx` - Now displays all session data from the new schema

## Troubleshooting

If you encounter any issues:

1. Check the Supabase logs for any SQL errors
2. Make sure you have the Supabase CLI installed (`npm install -g supabase`)
3. Ensure your `.env` file has the correct Supabase credentials
4. If the issue persists, you can use the fixed components in `study-timer-fixed.tsx` which work without the `title` column

## Need More Help?

If you need additional assistance, please refer to the `FIX_STUDY_TIMER_ERROR.md` document for more detailed troubleshooting steps. 