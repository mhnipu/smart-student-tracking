# Supabase Integration Guide

This document provides an overview of how Supabase is integrated with the Smart Student Tracking application.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Database Schema](#database-schema)
3. [Authentication](#authentication)
4. [Edge Functions](#edge-functions)
5. [Migrations](#migrations)
6. [Troubleshooting](#troubleshooting)

## Setup and Configuration

The Smart Student Tracking application uses Supabase as its backend service. To set up your own instance:

1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your API URL and anon key
4. Add them to your `.env` file:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project-id.supabase.co  # Used for migrations
SUPABASE_KEY=your-service-role-key                # Used for migrations
```

## Database Schema

Our database schema includes the following main tables:

- `users` - User profiles and settings
- `subjects` - Academic subjects
- `marks` - Assessment marks and scores
- `study_sessions` - Tracked study time and sessions
- `goals` - Academic goals and targets
- `ai_insights` - AI-generated insights and recommendations

For the complete database schema, see the migration files in `supabase/migrations/`.

## Authentication

We use Supabase Auth for user authentication with the following features:

- Email/password authentication
- JWT-based session management
- Row-level security policies for data protection
- Role-based access control

## Edge Functions

We deploy Edge Functions for features that require server-side processing:

- `/generate-insights` - Generates AI-powered insights for students

Edge Functions are located in the `supabase/functions/` directory.

## Migrations

Database migrations are managed through:

1. SQL migration files in `supabase/migrations/`
2. Custom migrations in `supabase/migrations/custom_migrations/`

To run migrations, use the scripts in the `scripts/` directory:

```bash
# Windows
.\scripts\run_migration.ps1

# Mac/Linux
./scripts/run_migration.sh
```

## Troubleshooting

For common database issues and solutions, see:

- [Database Troubleshooting Guide](../supabase/docs/DATABASE_TROUBLESHOOTING.md)

To fix common issues quickly, run:

```bash
# Windows
.\scripts\fix_database.ps1

# Mac/Linux
./scripts/fix_database.sh
```

For more detailed information on the database structure, see the [migration README](../supabase/migrations/README.md). 