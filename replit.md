# CreatorHub - Replit Environment

## Project Overview
A full-stack adult content creator platform inspired by OnlyFans/Fanvenue aesthetics. It serves as a premium directory where users can discover exclusive content creators across various categories.

## Recent Setup Changes
**October 25, 2025** - Migrated to PostgreSQL for Vercel Deployment
- Set up Neon PostgreSQL database integration
- Created migration script to transfer all 30 profiles (5,486 posts) from files to database
- Fixed migration to use folder names as profile IDs (backward compatible URLs)
- Created serverless API wrapper (api/index.js) for Vercel deployment
- Updated vercel.json for proper serverless function routing
- Tested successfully with database mode - all profiles loading correctly
- Ready for Vercel deployment with DATABASE_URL environment variable

**September 18, 2025** - Initial Replit setup
- Configured project for Replit environment
- Set up proper workflow for port 5000 with webview output
- Confirmed frontend proxy configuration allows all hosts
- Configured deployment settings for autoscale production deployment
- Verified file-based storage system working with 29 profiles loaded

## Project Architecture
- **Frontend**: React 18 with TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Node.js with Express.js, TypeScript
- **Storage**: File-based storage using JSON files in `/data` directory
- **Media**: Video/image proxy endpoints for CORS handling
- **Authentication**: Simplified for static deployment (returns 401)

## Current Configuration
- **Development Server**: npm run dev on port 5000 with 0.0.0.0 host
- **Frontend Proxy**: allowedHosts: true for Replit compatibility
- **Deployment**: Autoscale with npm run build and npm run start
- **Storage**: Uses data folder with profile and post JSON files

## Key Features Working
- Profile loading from file system (29 profiles loaded)
- Video URL extraction from Twitter content
- Image/video proxy endpoints for CORS handling
- Responsive design with dark theme
- Admin panel for content management
- Media scraping capabilities

## Development Workflow
1. `npm run dev` - Starts development server on port 5000
2. Frontend served via Vite with HMR enabled
3. Backend API routes at `/api/*`
4. Static file serving in production mode

## User Preferences
- No specific user preferences documented yet

## Notes
- Project successfully imported and running in Replit environment
- All core functionality verified working
- Ready for development and deployment