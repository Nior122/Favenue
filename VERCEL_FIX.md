# Vercel Deployment Fix Guide

## Problem
Profiles show locally but not on Vercel

## Solution Steps

### 1. Verify Data Folder is Committed to Git
```bash
# Check if data folder is tracked
git ls-files data/ | head -5

# If nothing shows, add it:
git add data/
git commit -m "Add data folder to git"
```

### 2. Update vercel.json (Already Done)
The vercel.json has been updated to include data folder in serverless functions.

### 3. Deploy to Vercel
```bash
# Commit the updated vercel.json
git add vercel.json VERCEL_FIX.md
git commit -m "Fix Vercel serverless function data inclusion"
git push
```

### 4. Check Vercel Deployment

#### A. Visit Debug Endpoint on Vercel
After deployment, visit:
```
https://your-vercel-url.vercel.app/api/debug
```

This will show you:
- Current working directory
- Available files
- Whether data folder is accessible
- Exact paths being checked

#### B. Check Build Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Check "Build Logs" for any errors
4. Check "Function Logs" to see runtime errors

#### C. Test API Endpoint
Visit:
```
https://your-vercel-url.vercel.app/api/profiles
```

Should return JSON array of 30 profiles.

### 5. Common Issues & Fixes

#### Issue: "data folder not found"
**Fix:** The includeFiles in vercel.json tells Vercel to bundle data folder with serverless functions.

Current configuration:
```json
{
  "functions": {
    "api/profiles.js": {
      "includeFiles": "data/**/*"
    },
    "api/profiles/*.js": {
      "includeFiles": "data/**/*"
    },
    "api/**/*.js": {
      "includeFiles": "data/**/*"
    }
  }
}
```

#### Issue: "Profiles array is empty"
**Fix:** Check that data folder was pushed to GitHub:
```bash
git status
git add data/
git commit -m "Ensure data folder is in git"
git push
```

#### Issue: "API returns 404"
**Fix:** Vercel automatically creates serverless functions from `api/` folder.
Make sure you're calling `/api/profiles` not `/api/profiles/`

### 6. Alternative: Use Environment Variable for Data
If includeFiles doesn't work, we can:
1. Upload data to Vercel Blob Storage
2. Or use a database instead of file storage

### 7. Verify on Vercel

Once deployed, your Vercel app should:
✅ Show 30 profiles on homepage
✅ Display profile images
✅ Show video thumbnails
✅ Work exactly like local version

## Debug Commands

### Check data in deployment:
```bash
# Visit this URL after deployment
https://your-vercel-url.vercel.app/api/debug
```

### Check if profiles API works:
```bash
# Visit this URL
https://your-vercel-url.vercel.app/api/profiles
```

## Next Steps

1. **Push to GitHub** - Make sure vercel.json and data folder are committed
2. **Redeploy on Vercel** - Either automatic or manual redeploy
3. **Check debug endpoint** - Visit /api/debug to see if data folder is accessible
4. **Test profiles endpoint** - Visit /api/profiles to see if profiles load
5. **Check your site** - Profiles should now display

## Need Help?

If profiles still don't show after following these steps, share:
1. Output from `/api/debug` endpoint on Vercel
2. Any errors from Vercel Function Logs
3. Output from `/api/profiles` endpoint on Vercel
