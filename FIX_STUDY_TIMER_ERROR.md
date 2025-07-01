# Fix for Study Timer Error

This guide will help you fix the error that occurs when starting the study timer:
```
Error creating session: 
{code: 'PGRST204', details: null, hint: null, message: "Could not find the 'title' column of 'study_sessions' in the schema cache"}
```

## Step 1: Run the Database Migration Scripts

You need to run the migration scripts to create or update the `study_sessions` table with all required columns.

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the contents of `fix_study_sessions_table.sql` into the SQL Editor
5. Run the script by clicking the "Run" button

## Step 2: Verify the Table Structure

After running the migration script, verify that the `study_sessions` table has been created with the correct structure:

1. In the Supabase dashboard, go to the "Table Editor"
2. Look for the `study_sessions` table
3. Check that it has the following columns:
   - `id` (uuid, primary key)
   - `user_id` (uuid)
   - `title` (text)
   - `description` (text)
   - `start_time` (timestamptz)
   - `end_time` (timestamptz)
   - `duration_minutes` (integer)
   - `session_type` (text)
   - `pomodoro_count` (integer)
   - `points_earned` (integer)
   - `is_completed` (boolean)
   - `notes` (text)
   - `subject_id` (uuid)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

## Step 3: Clear Browser Cache

Sometimes the Supabase client caches schema information. Clear your browser cache:

1. Open your browser's developer tools (F12 or Ctrl+Shift+I)
2. Go to the "Application" tab
3. Select "Clear storage" on the left
4. Check "Local Storage" and "IndexedDB"
5. Click "Clear site data"
6. Refresh the page

## Step 4: Restart the Application

1. Stop your development server if it's running (Ctrl+C in the terminal)
2. Start it again with:
   ```
   npm run dev
   ```

## Alternative Solution: Modify the Study Timer Code

If you're still experiencing issues, you can modify the study-timer.tsx file to work without the 'title' column:

1. Open `src/components/dashboard/study-timer.tsx`
2. Find the `startSession` function (around line 220)
3. Modify the insert statement to remove the 'title' field:

```typescript
const { data, error } = await supabase
  .from('study_sessions')
  .insert({
    user_id: userId,
    start_time: new Date().toISOString(),
    subject_id: selectedSubject || null
    // Remove the title field
  })
  .select()
  .single();
```

## Need More Help?

If you're still experiencing issues:
1. Check the Supabase logs for more detailed error information
2. Make sure your RLS policies are set up correctly by running `fix_rls_policies.sql`
3. Verify that your user has the correct permissions to insert into the `study_sessions` table 