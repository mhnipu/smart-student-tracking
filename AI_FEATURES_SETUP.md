# Smart Student Tracking - AI Features Setup

This guide explains how to set up and use the AI-powered features in the Smart Student Tracking application.

## Overview of AI Features

The Smart Student Tracking application includes AI-powered features that analyze student performance data and provide personalized insights and suggestions:

1. **Context-Aware AI Assistant**: Displays personalized suggestions and insights based on student performance data.
2. **Performance Analysis**: Analyzes trends in grades, study time, and learning patterns.
3. **Smart Suggestions**: Provides actionable recommendations to improve academic performance.
4. **Edge Function Integration**: Uses Supabase Edge Functions with OpenAI for advanced insights.

## Database Setup

First, run the migration scripts to set up the necessary database tables:

```bash
# Connect to your Supabase project's SQL Editor and run:
1. fix_study_sessions_table.sql
2. fix_rls_policies.sql
3. supabase/migrations/20250622123000_ai_features_setup.sql
```

These scripts will:
- Create/fix the `study_sessions` table schema
- Set up proper Row Level Security (RLS) policies
- Create `ai_insights` and `suggestions` tables for storing AI-generated content

## Edge Function Deployment

To deploy the AI analysis Edge Function:

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. Deploy the Edge Function:
   ```bash
   # Run the deployment script
   bash deploy_edge_functions.sh
   ```

4. Set the OpenAI API key:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_api_key
   ```

## Using the AI Features

### Context-Aware AI Assistant

The AI Assistant appears on your dashboard and provides:
- Performance insights based on your grades
- Study pattern analysis
- Subject-specific suggestions
- Learning resource recommendations

Features:
- Click "Generate New Insights" to get fresh analysis
- Dismiss or mark insights as completed
- Filter between suggestions and insights

### How the AI Works

1. **Data Collection**: The system collects data on:
   - Grades and test scores
   - Study time and patterns
   - Goals and progress
   - Subject performance

2. **Analysis Process**:
   - First tries to use the OpenAI-powered Edge Function
   - Falls back to local rule-based analysis if unavailable
   - Generates insights and suggestions
   - Saves them to the database

3. **Insight Types**:
   - Performance trends
   - Study pattern optimization
   - Goal progress tracking
   - Subject-specific recommendations

## Troubleshooting

### Edge Function Issues

If the Edge Function isn't working:
1. Check that your OpenAI API key is set correctly
2. Verify Edge Function deployment with:
   ```bash
   supabase functions list
   ```
3. Check Edge Function logs:
   ```bash
   supabase functions logs generate-insights
   ```

### Local AI Fallback

If the Edge Function fails, the system automatically falls back to local AI analysis, which:
- Works without external API calls
- Provides basic insights using rule-based analysis
- Still delivers personalized suggestions

### Database Connection Issues

If database tables aren't being found:
1. Make sure you've run all migration scripts
2. Check RLS policies are set correctly
3. Verify your user has appropriate permissions

## Demo Mode

If you're testing without a Supabase connection, the application includes a demo mode that:
- Provides sample data for all dashboard features
- Shows example AI insights and suggestions
- Allows you to test most functionality

## Customizing the AI

To modify the AI analysis logic:
1. Edit `src/lib/ai-service.ts` for the local analysis
2. Edit `supabase/functions/generate-insights/index.ts` for the Edge Function

The Edge Function uses OpenAI's API with a specially crafted system prompt that can be customized to change the tone, focus, or style of the insights. 