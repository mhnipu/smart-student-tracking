# Database Troubleshooting Guide

This guide helps you troubleshoot and fix common database issues in the Smart Student Tracking application.

## Common Errors and Solutions

### 1. JWT Expired Error

**Error Message:**
```
Database connection failed: JWT expired. Please check your Supabase connection and run the migration scripts.
```

**Solution:**
1. Update your `.env` file with fresh API credentials
2. Make sure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
3. Restart your development server

### 2. Missing Column Errors

**Error Message:**
```
Could not find the 'last_study_date' column of 'users' in the schema cache
```

**Solution:**
Run the database fix script:
```bash
# For Windows
powershell -ExecutionPolicy Bypass -File .\supabase\scripts\fix_database.ps1

# For Mac/Linux
./supabase/scripts/fix_database.sh
```

### 3. Study Timer Error - Test Type Violation

**Error Message:**
```
null value in column "test_type" of relation "study_sessions" violates not-null constraint
```

**Solution:**
Run the database fix script as shown above. This will make the `test_type` column nullable with a default value of 'study'.

### 4. Database Connection Issues

**Error Message:**
```
Error connecting to database
```

**Troubleshooting Steps:**
1. Check if your Supabase project is active (not paused)
2. Verify your API credentials
3. Check your network connection
4. Try accessing the Supabase dashboard directly

## Running Migrations Manually

If the automated fix scripts don't work, you can run SQL manually:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the SQL from `supabase/migrations/custom_migrations/20250702200000_combined_fixes.sql`
5. Run the query

## Advanced Troubleshooting

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Look at the network tab to see the failed API requests
3. Verify that your database schema matches the expected structure
4. Make sure your Supabase instance has the correct tables and columns

## Getting Help

If you need additional help:
- Open an issue in the project repository
- Check the Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
- Join the Supabase Discord community 