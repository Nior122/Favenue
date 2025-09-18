# CreatorHub - Replit Project Setup

## Overview
CreatorHub is a full-stack web application designed as an adult content creator platform. It features a React frontend with Express backend, using file-based storage for profile data.

## Recent Changes
- **September 18, 2025**: Successfully imported and configured for Replit environment
  - Fixed workflow configuration with webview output type on port 5000
  - Verified frontend/backend integration works correctly
  - Set up autoscale deployment configuration
  - Application uses file-based storage (no database setup required)

## Project Architecture
- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Storage**: File-based JSON storage (data/ directory)
- **Authentication**: Replit Auth with OpenID Connect integration
- **Build System**: Vite for frontend, esbuild for backend production builds

## Key Configuration
- **Development Server**: Port 5000 (0.0.0.0 binding for Replit compatibility)
- **Workflow**: "Start application" runs `npm run dev` with webview output
- **Host Settings**: Already configured to allow all hosts for Replit proxy
- **Storage**: Uses existing data/ directory with JSON files for profiles
- **Deployment**: Autoscale target with build/start commands configured

## File Structure
```
├── client/src/          # React frontend components and pages
├── server/              # Express backend with API routes
├── shared/              # Shared types and schemas
├── data/                # JSON data files for profiles
├── api/                 # API endpoint handlers
└── attached_assets/     # Static assets
```

## Development Notes
- Application successfully loads 29+ profiles from data/ folder
- API endpoints working correctly (cached responses for performance)
- Frontend properly configured for Replit iframe environment
- No database setup required - uses file-based storage
- All dependencies installed and working

## User Preferences
- Follow existing project patterns and file structure
- Maintain the adult content platform aesthetic
- Use existing shadcn/ui components and Tailwind styling
- Keep file-based storage approach unless explicitly requested otherwise