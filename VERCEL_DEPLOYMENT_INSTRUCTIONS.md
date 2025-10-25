# Vercel Deployment Instructions - File-Based Storage Fix

## Problem Solved
This fix ensures that your `data/` folder (containing profile information and media) is properly accessible when deployed to Vercel, even though you're using file-based storage instead of a database.

## Changes Made

### 1. Updated `vercel.json`
- Configured proper serverless function deployment
- Added `includeFiles: "data/**"` to ONLY the profiles endpoints (not all API functions) to avoid duplicating data
- Fixed SPA fallback route to `/index.html` (not `/dist/public/index.html`) since Vercel serves from outputDirectory root
- Set up correct routing for API endpoints and static files

### 2. Updated `.vercelignore`
- Removed `dist/` from ignore list (was blocking built frontend)
- Added explicit note that `data/` folder MUST NOT be ignored
- Cleaned up unnecessary exclusions

### 3. Fixed ESM Compatibility in Serverless Functions
- Added ESM-safe `__dirname` replacement in `api/profiles.js` and `api/profiles/[id].js`
- Used `fileURLToPath(import.meta.url)` to properly resolve file paths in Node ESM modules
- This fixes the critical issue where `__dirname` was undefined in ESM mode, preventing data folder access

### 4. File Path Resolution
- Serverless functions have robust path resolution that tries multiple strategies
- These functions will automatically find the `data/` folder in Vercel's serverless environment

## Deployment Steps

### Step 1: Ensure Data Folder is in Git
```bash
# Check if data folder is tracked
git status data/

# If not tracked, add it
git add data/

# Commit the data folder
git commit -m "Add data folder for Vercel deployment"
```

### Step 2: Push to GitHub
```bash
git push origin main
```

### Step 3: Deploy to Vercel
1. Go to your Vercel dashboard
2. Import your GitHub repository (or redeploy if already connected)
3. Vercel will automatically use the `vercel.json` configuration
4. The build command will run: `npm run build`
5. The data folder will be included with your serverless functions

### Step 4: Verify Deployment
After deployment, test these URLs:
- `https://your-app.vercel.app/` - Should show the frontend
- `https://your-app.vercel.app/api/profiles` - Should return all profiles
- `https://your-app.vercel.app/api/profiles/belledelphine` - Should return a specific profile

## How It Works

### Local Development (Replit)
- Runs Express server from `server/index.ts`
- Reads data from `data/` folder using file system
- Serves on port 5000

### Production (Vercel)
- Uses serverless functions in `api/` folder
- `vercel.json` includes the `data/` folder with each serverless function
- Frontend is served as static files from `dist/public`
- API requests are routed to serverless functions

## Configuration Files

### `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "installCommand": "npm install",
  "functions": {
    "api/profiles.js": {
      "includeFiles": "data/**"
    },
    "api/profiles/[id].js": {
      "includeFiles": "data/**"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Important Changes**:
- The SPA fallback route uses `/index.html` (not `/dist/public/index.html`) because Vercel serves files from the outputDirectory root at runtime
- The dynamic route `api/profiles/[id].js` is **explicitly referenced** instead of using a wildcard pattern - this is critical for Vercel to properly bundle the data folder with the dynamic route function

### `.vercelignore`
- Excludes development files
- Excludes node_modules
- **Does NOT exclude data/** (critical!)

## Troubleshooting

### If profiles don't show up:
1. Check Vercel deployment logs for errors
2. Verify the data folder was included in the deployment
3. Check function logs in Vercel dashboard:
   - Look for "Found data directory at:" messages
   - Look for "Loaded X profiles" messages

### If you see "Could not find data directory":
1. Ensure `data/` is committed to git
2. Ensure `.vercelignore` does NOT include `data/`
3. Check that `vercel.json` has `"includeFiles": "data/**"`

### To view logs in Vercel:
1. Go to your deployment in Vercel dashboard
2. Click on "Functions" tab
3. Click on any function (e.g., `api/profiles.js`)
4. View the logs to see what paths were tried

## Data Folder Structure
```
data/
├── belledelphine/
│   ├── profile.json
│   ├── post-001.json
│   ├── post-002.json
│   └── ...
├── hannahowo/
│   ├── profile.json
│   └── ...
└── [other-profiles]/
```

## Important Notes

1. **File Size Limits**: Vercel has a 50MB limit per serverless function deployment. If your `data/` folder is very large, you may need to migrate to a database.

2. **Read-Only**: Files in Vercel serverless functions are read-only. You cannot write new profiles or modify existing ones in production.

3. **Cold Starts**: First request to a serverless function may be slower as Vercel initializes it. Subsequent requests will be faster.

4. **Alternative: Database Migration**: For better scalability and to enable write operations, consider migrating to PostgreSQL using the existing Drizzle ORM setup.

## Success Indicators

✅ Vercel build completes successfully
✅ Frontend loads at your Vercel URL
✅ `/api/profiles` returns JSON with all profiles
✅ Individual profile pages load correctly
✅ Images and videos display properly

## Next Steps

After successful deployment:
1. Test all functionality thoroughly
2. Monitor Vercel function logs for any errors
3. Consider migrating to PostgreSQL for better performance and scalability
