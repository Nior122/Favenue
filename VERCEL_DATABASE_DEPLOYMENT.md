# Vercel Deployment Guide - Database Mode

## 🚨 Critical Issue Fixed

**Problem:** Your app uses file-based storage (`data/` directory) which **fails on Vercel** because:
- Vercel uses serverless functions with **read-only filesystem**
- The `data/` directory is not persisted between function invocations
- Result: "Profile not found" errors on production

**Solution:** Migrated to **PostgreSQL database** for production deployments.

---

## ✅ What Was Fixed

### 1. Database Storage Implementation
- Created `server/dbStorage.ts` - PostgreSQL storage layer using Drizzle ORM
- All profile and image data now persists in the database
- Automatic switching: File storage (Replit dev) ↔ Database (Vercel production)

### 2. Migration Scripts
- `scripts/migrate-files-to-db.ts` - Imports all profiles from `data/` directory to database
- `scripts/migrate-sample-profiles.ts` - Quick migration for testing (5 profiles)

### 3. Dual Storage Mode
```typescript
// Automatically uses the right storage based on environment
const USE_DATABASE = process.env.USE_DATABASE === 'true' || isProduction;
const storage = USE_DATABASE ? dbStorage : fileStorage;
```

---

## 🚀 Deployment Steps for Vercel

### Step 1: Set Up PostgreSQL Database

You need a PostgreSQL database for production. Choose one:

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel project dashboard
2. Click **Storage** → **Create Database** → **Postgres**
3. Copy the `DATABASE_URL` connection string

#### Option B: Neon (Free Tier Available)
1. Visit [neon.tech](https://neon.tech)
2. Create a free PostgreSQL database
3. Copy the connection string

#### Option C: Supabase
1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings** → **Database** → Copy connection string

### Step 2: Configure Environment Variables in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables:

```bash
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
NODE_ENV=production
```

**Important:** Make sure to add the environment variable for **all environments** (Production, Preview, Development)

### Step 3: Push Database Schema

Before deploying, push your database schema:

```bash
# On your local machine or in Replit
npm run db:push
```

This creates all the necessary tables (`profiles`, `profile_images`, `users`, etc.)

### Step 4: Migrate Your Data

Import your profile data from the `data/` directory to the database:

**Option A: Full Migration (All Profiles)**
```bash
npm run db:migrate
```
*Note: This may take several minutes due to large number of images*

**Option B: Quick Test (5 Sample Profiles)**
```bash
tsx scripts/migrate-sample-profiles.ts
```

**Option C: Manual Selection**
Edit `scripts/migrate-sample-profiles.ts` to specify which profiles to import:
```typescript
const SAMPLE_PROFILES = ['profile1', 'profile2', 'profile3'];
```

### Step 5: Verify Database Data

```bash
# Check profiles imported
psql $DATABASE_URL -c "SELECT COUNT(*) FROM profiles;"

# Check images imported  
psql $DATABASE_URL -c "SELECT COUNT(*) FROM profile_images;"
```

### Step 6: Deploy to Vercel

```bash
# Push your code to GitHub
git add .
git commit -m "Add database storage for Vercel deployment"
git push

# Vercel will automatically deploy
```

Or use Vercel CLI:
```bash
vercel --prod
```

---

## 🧪 Testing Locally with Database Mode

Test database mode on Replit before deploying:

```bash
# Run with database storage
npm run dev:db
```

This sets `USE_DATABASE=true` and uses PostgreSQL instead of file storage.

**Verify it's working:**
1. Check server logs for: `📊 Storage in routes: DATABASE`
2. Visit homepage - should show profiles from database
3. Click a profile - should load correctly with UUID in URL

---

## 📊 How Storage Mode Selection Works

```typescript
// server/staticRoutes.ts
const isProduction = process.env.NODE_ENV === "production" || !process.env.REPL_ID;
const USE_DATABASE = process.env.USE_DATABASE === 'true' || isProduction;
const storage = USE_DATABASE ? dbStorage : fileStorage;
```

**Replit Development (default):**
- `USE_DATABASE` = false
- Uses `fileStorage` (reads from `data/` directory)
- Fast iteration, no database needed

**Replit with Database Testing:**
- Set `USE_DATABASE=true`
- Uses `dbStorage` (PostgreSQL)
- Test production behavior locally

**Vercel Production:**
- `NODE_ENV=production` is automatically set
- Uses `dbStorage` (PostgreSQL)
- File system is read-only, database required

---

## 🔍 Troubleshooting

### "Profile not found" on Vercel

**Check 1: Database Connection**
```bash
# Test from Vercel function logs
SELECT COUNT(*) FROM profiles;
```

**Check 2: Environment Variables**
- Ensure `DATABASE_URL` is set in Vercel
- Verify it points to the correct database

**Check 3: Data Migration**
- Run `npm run db:migrate` to import profiles
- Verify with: `SELECT id, name FROM profiles LIMIT 5;`

### Database Schema Issues

```bash
# Force push schema (safe, no data loss)
npm run db:push --force
```

### Profile IDs Changed

After migration, profile IDs change from folder names to UUIDs:
- **Before (file storage):** `/profile/bigtittygothegg`
- **After (database):** `/profile/0da1f8bd-a6cb-4f90-976a-77a0860e0739`

The app handles both correctly via dynamic routing.

### Performance Issues

Database queries are cached for 1 minute. To adjust:

```typescript
// server/fileStorage.ts
const CACHE_DURATION = 60000; // Adjust milliseconds
```

---

## 📦 Database Schema

Your profiles are stored in PostgreSQL with this structure:

```sql
CREATE TABLE profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  profile_picture_url VARCHAR,
  cover_photo_url VARCHAR,
  rating DECIMAL(2,1),
  likes_count VARCHAR,
  media_count VARCHAR,
  views_count VARCHAR,
  subscribers_count VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profile_images (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id VARCHAR REFERENCES profiles(id) ON DELETE CASCADE,
  image_url VARCHAR,
  video_url VARCHAR,
  thumbnail_url VARCHAR,
  content_type VARCHAR DEFAULT 'image',
  title VARCHAR,
  description TEXT,
  is_main_image BOOLEAN DEFAULT false,
  "order" VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✨ Benefits of Database Storage

✅ **Works on Vercel** - No filesystem dependency  
✅ **Scalable** - Handle millions of profiles  
✅ **Fast Queries** - Indexed lookups by ID  
✅ **Relational** - Profile images linked correctly  
✅ **Backup** - Database provider handles backups  
✅ **Admin Panel** - Use Drizzle Studio: `npm run db:studio`

---

## 🎯 Next Steps

1. ✅ Push database schema: `npm run db:push`
2. ✅ Migrate your data: `npm run db:migrate`
3. ✅ Test locally: `npm run dev:db`
4. ✅ Set Vercel env vars: `DATABASE_URL`, `NODE_ENV=production`
5. ✅ Deploy to Vercel: `git push`
6. ✅ Verify production: Visit your Vercel URL and test profile pages

---

## 💡 Maintaining Both Modes

You can keep using file storage in development:

```bash
# File storage (fast, no DB needed)
npm run dev

# Database storage (test production behavior)
npm run dev:db
```

The code automatically switches based on environment!

---

## 🆘 Support

If profiles still don't load on Vercel after following this guide:

1. Check Vercel function logs for errors
2. Verify `DATABASE_URL` environment variable is set
3. Confirm database has data: `SELECT COUNT(*) FROM profiles;`
4. Check that `npm run db:push` completed successfully

**Common Issue:** If you see "relation does not exist" errors, run:
```bash
npm run db:push --force
```

This syncs your schema to the production database.
