# Manual Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up or log in with GitHub/Google
4. Click "New Project"
5. Choose your organization
6. Fill in project details:
   - Name: `student-performance-tracker`
   - Database Password: (create a strong password)
   - Region: Choose closest to you
7. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Once your project is created, go to Settings → API
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Update Environment Variables

Create a `.env` file in your project root with:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** This project uses Vite, so environment variables must be prefixed with `VITE_` to be accessible in the browser.

## Step 4: Run Database Migrations

**CRITICAL:** You must run ALL migration files in chronological order for the application to work properly.

1. In your Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Run each migration file in this exact order:

### Migration 1: `20250618054827_dark_paper.sql`
Copy and paste the SQL from `supabase/migrations/20250618054827_dark_paper.sql` and click "Run"

### Migration 2: `20250618060056_floral_manor.sql`
Copy and paste the SQL from `supabase/migrations/20250618060056_floral_manor.sql` and click "Run"

### Migration 3: `20250618063939_fragrant_dune.sql`
Copy and paste the SQL from `supabase/migrations/20250618063939_fragrant_dune.sql` and click "Run"

### Migration 4: `20250118000001_enhanced_features.sql` (NEW)
Copy and paste the SQL from `supabase/migrations/20250118000001_enhanced_features.sql` and click "Run"

**Important:** The third migration contains a trigger that automatically creates user profiles when users sign up. The fourth migration adds all the new enhanced features like goals, achievements, study sessions, and notes.

## Step 5: Test the Connection

After setting up the environment variables, restart your development server:

```bash
npm run dev
```

The application should now connect to your Supabase database with all the enhanced features!

## New Features Added

### 🎯 Goals & Targets
- Set academic goals with target scores and deadlines
- Track progress towards your objectives
- Categorize goals by subject, exam, or assignment type

### 🏆 Achievement System
- Unlock achievements for various milestones
- Earn points for completing tasks and reaching goals
- Different rarity levels: Common, Rare, Epic, Legendary

### ⏱️ Study Timer
- Track study sessions with built-in timer
- Categorize sessions by type (study, review, practice, homework)
- Build study streaks and monitor total study time

### 📝 Quick Notes
- Create and manage personal study notes
- Pin important notes for quick access
- Color-coded organization system

### 📊 Enhanced Analytics
- Study streak tracking
- Total study time monitoring
- Achievement points system
- Improved performance insights

### 🔔 Smart Reminders (Coming Soon)
- Set study reminders and notifications
- Recurring reminder patterns
- Goal-based reminder system

## Step 6: Fix Existing Users (If Needed)

If you created user accounts before running all migrations, you may need to either:

**Option A: Delete and recreate your account**
1. Go to Supabase Dashboard → Authentication → Users
2. Delete your existing user account
3. Sign up again in the application

**Option B: Manually create user profile**
1. Go to Supabase Dashboard → Table Editor → users table
2. Click "Insert" → "Insert row"
3. Add your user ID (from auth.users table) and email
4. Save the row

## Troubleshooting

- Make sure your environment variables are exactly as shown above with `VITE_` prefix
- Ensure there are no extra spaces in the `.env` file
- Restart your development server after adding environment variables
- Check the browser console for any connection errors
- **If you get foreign key constraint errors:** Make sure you've run all four migration files in order
- **If marks won't save:** Your user profile might be missing from the users table (see Step 6)
- **If new features don't appear:** Ensure you've run the fourth migration file

## Next Steps

Once connected, you can:
- Create an account and sign in
- Add test marks and see analytics
- Set academic goals and track progress
- Use the study timer to log study sessions
- Unlock achievements and earn points
- Create quick notes for important reminders
- View enhanced performance charts and insights