#!/bin/bash
# Script to deploy Supabase Edge Functions

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI is not installed. Please install it first."
    echo "https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "Deploying Edge Functions to Supabase..."

# Deploy the generate-insights function
echo "Deploying generate-insights function..."
supabase functions deploy generate-insights --no-verify-jwt

# Copy the shared CORS module to the functions directory
echo "Setting up shared modules..."
mkdir -p .supabase/functions/_shared
cp -r supabase/functions/_shared/* .supabase/functions/_shared/

echo "Edge Functions deployment completed!"
echo ""
echo "Important: Make sure to set the OPENAI_API_KEY secret for the Edge Function to work properly."
echo "You can set it using the Supabase dashboard or with the following command:"
echo "supabase secrets set OPENAI_API_KEY=your_openai_key" 