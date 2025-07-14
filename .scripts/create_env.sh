#!/bin/sh

# This script expects EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables

if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
  echo "Error: EXPO_PUBLIC_SUPABASE_URL environment variable is not set."
  exit 1
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Error: EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is not set."
  exit 1
fi

# Write to .env in the project root
cat <<EOF > .env
EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY
EOF

echo ".env file created with Supabase credentials." 