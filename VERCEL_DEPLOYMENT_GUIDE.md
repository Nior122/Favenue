# Vercel Deployment Guide

## Quick Setup Checklist

### 1. Environment Variables (CRITICAL)
Add these in Vercel Dashboard → Settings → Environment Variables:

**Production Environment:**
```
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

**Preview Environment:**
```
DATABASE_URL=postgresql://username:password@host:port/database_preview
NODE_ENV=preview
```

### 2. Build Configuration
**Vercel Dashboard → Settings → General:**
- Build Command: `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
- Output Directory: `dist/public`
- Install Command: `npm ci`

### 3. Database Setup
Choose one option:

**Option A: Neon Database (Free)**
1. Go to [neon.tech](https://neon.tech)
2. Create project
3. Copy connection string to DATABASE_URL

**Option B: Vercel Postgres**
1. Vercel Dashboard → Storage → Create Database
2. Select PostgreSQL
3. DATABASE_URL auto-configured

### 4. Repository Secrets (GitHub)
Add to GitHub repository → Settings → Secrets:
```
DATABASE_URL=your_production_database_url
```

## Troubleshooting

### Build Fails with "DATABASE_URL not found"
- ✅ Verify environment variables are set in Vercel
- ✅ Check both Production and Preview environments
- ✅ Ensure DATABASE_URL format: `postgresql://user:pass@host:port/db`

### "drizzle-kit push" fails during build
- ❌ **Don't run DB operations during Vercel build**
- ✅ Use GitHub Actions for DB migrations
- ✅ Vercel should only run: `vite build`

### No data showing in deployed app
- ✅ Database seeding runs via GitHub Actions
- ✅ Check CI/CD logs for seeding success
- ✅ Verify DATABASE_URL points to correct database

## Expected Log Output

**Successful Vercel Build:**
```
[09:42:15.123] Running "vite build"
[09:42:16.456] ✓ built in 1.2s
[09:42:16.789] ✓ Build completed in 42s
```

**Successful GitHub Actions:**
```
✓ Setup Node.js 20
✓ Install dependencies  
✓ Generate Drizzle types
✓ Run database migrations (1 table created)
✓ Seed database (68 images seeded)
✓ Verify build still works
```