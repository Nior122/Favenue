# Production Database Setup for Vercel Deployment

## The Issue
Your Vercel deployment is showing an empty app because it doesn't have access to your Replit database. Vercel deployments need their own production database.

## Option 1: Quick Setup with Neon (Recommended)

### Step 1: Create a Neon Database
1. Go to [neon.tech](https://neon.tech) and sign up for free
2. Create a new project/database
3. Copy your connection string (starts with `postgresql://`)

### Step 2: Add Database URL to Vercel
1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add a new variable:
   - Name: `DATABASE_URL`
   - Value: Your Neon connection string
   - Make sure to check "Production" environment

### Step 3: Update Build Command
In your `vercel.json`, change the buildCommand to:
```json
{
  "version": 2,
  "buildCommand": "npm run db:push && node scripts/seed-standalone.js && vite build",
  "outputDirectory": "dist/public"
}
```

### Step 4: Redeploy
Push changes to GitHub and redeploy. Your app will automatically:
- Set up the database schema
- Seed all profile and image data
- Deploy the working app

## Option 2: Use Vercel Postgres

### Step 1: Add Vercel Postgres
1. In your Vercel project dashboard
2. Go to Storage tab
3. Create a new Postgres database
4. This automatically adds DATABASE_URL to your environment

### Step 2: Same steps 3-4 from Option 1

## Current Status
- ✅ Frontend deploys successfully on Vercel
- ✅ Database seeding scripts are ready
- ⚠️ Need production database connection
- ⚠️ Need DATABASE_URL environment variable in Vercel

## After Setup
Once you complete either option, your Vercel deployment will have:
- The bigtittygothegg profile with all 68 images
- Full functionality matching your Replit version
- Fast, production-ready database