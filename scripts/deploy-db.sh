#!/bin/bash

# Deploy database schema to Railway/Supabase
# This script runs Prisma migrations on the production database

echo "🚀 Deploying database schema to Railway..."
echo ""
echo "This will create the User, Memory, and Conversation tables in your Supabase database."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if logged in
echo "Checking Railway login status..."
railway whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Railway."
    echo ""
    echo "Login with:"
    echo "  railway login"
    echo ""
    exit 1
fi

echo "✅ Railway CLI is ready"
echo ""
echo "Running database migrations..."
echo ""

# Run migrations on Railway
railway run npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema deployed successfully!"
    echo ""
    echo "Your Supabase database now has:"
    echo "  - User table (with consent fields)"
    echo "  - Memory table"
    echo "  - Conversation table"
    echo ""
    echo "You can now use the app! 🎉"
else
    echo ""
    echo "❌ Migration failed. Check the error above."
    echo ""
    echo "Common issues:"
    echo "  - DATABASE_URL not set in Railway variables"
    echo "  - Database connection string is incorrect"
    echo "  - Network issues"
fi

