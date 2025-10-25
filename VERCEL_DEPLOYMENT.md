# Deploying CreatorHub to Vercel

This guide will help you deploy your CreatorHub application to Vercel with PostgreSQL database support.

## Prerequisites

1. A Vercel account (free tier works)
2. A Neon PostgreSQL database account (free tier works)
3. Your GitHub/GitLab repository connected to Vercel

## Step 1: Create a Neon PostgreSQL Database

1. Go to [console.neon.tech](https://console.neon.tech) and sign up/login
2. Click **Create Project**
3. Choose a project name (e.g., "creatorhub-prod")
4. Select a region close to your users
5. Click **Create Project**
6. Once created, click **Connect** button
7. Copy the connection string - it will look like:
   ```
   postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
8. Save this connection string - you'll need it!

## Step 2: Push Your Database Schema

On your local Replit environment, run:

```bash
# Add your Neon database URL to Replit Secrets
# Go to Replit Secrets tab and add:
# Key: DATABASE_URL
# Value: [paste your Neon connection string]

# Push the schema to your Neon database
npm run db:push
```

This creates all the necessary tables in your Neon database.

## Step 3: Migrate Your Data

Run the migration script to transfer all profiles from files to database:

```bash
# Make sure DATABASE_URL is set in Replit Secrets
npm run db:migrate
```

You should see output showing all your profiles being migrated. This only needs to be done once.

## Step 4: Configure Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Before deploying, go to **Environment Variables**
5. Add the following variable:
   - **Key**: `DATABASE_URL`
   - **Value**: [paste your Neon connection string]
   - **Environments**: Select Production, Preview, and Development
6. Click **Deploy**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Add environment variable
vercel env add DATABASE_URL production

# Paste your Neon connection string when prompted

# Deploy
vercel --prod
```

## Step 5: Verify Deployment

1. Once deployed, Vercel will give you a URL like `https://your-app.vercel.app`
2. Visit the URL - you should see all your profiles!
3. Try clicking on a profile - it should load correctly now

## Troubleshooting

### "Profile not found" errors
- Make sure you ran `npm run db:migrate` successfully
- Verify DATABASE_URL is set in Vercel environment variables
- Check Vercel deployment logs for errors

### Database connection errors
- Ensure your Neon connection string includes `?sslmode=require`
- Verify the database isn't paused (Neon free tier auto-pauses after inactivity)
- Check that DATABASE_URL is set for the correct environment (Production/Preview)

### Build errors
- Make sure all dependencies are in package.json
- Check that `npm run build` works locally first
- Review Vercel build logs for specific errors

## Environment Variables Summary

Only one environment variable is needed:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require` |

## Updating Your App

Once deployed:

1. Make changes in your Replit environment
2. Push to GitHub
3. Vercel automatically deploys the new version
4. Database changes require running migrations again if schema changed

## Cost

- **Vercel**: Free tier supports hobby projects
- **Neon**: Free tier includes 512MB storage, enough for most projects

## Support

If you encounter issues:
- Check [Vercel docs](https://vercel.com/docs)
- Check [Neon docs](https://neon.tech/docs)
- Review application logs in Vercel dashboard
