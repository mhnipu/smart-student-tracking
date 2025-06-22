# Environment Setup Guide

## Quick Fix for Infinite Loading Issue

The infinite loading issue is caused by missing Supabase configuration. Follow these steps to fix it:

### Step 1: Create .env file
Create a new file called `.env` in the project root directory (same level as `package.json`)

### Step 2: Add Supabase Configuration
Add the following content to your `.env` file:

```
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Get Your Supabase Credentials
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Replace the placeholder values in your `.env` file

### Step 4: Restart the Development Server
After creating the `.env` file, restart your development server:

```bash
npm run dev
```

### Example .env file:
```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0NzI5MCwiZXhwIjoxOTUyMTIzMjkwfQ.example
```

### Need Help?
- Check the `SUPABASE_SETUP.md` file for detailed setup instructions
- Make sure your Supabase project is active (not paused)
- Verify your internet connection

This should resolve the infinite loading issue and allow the application to connect to your Supabase backend. 