# CreatorHub - Replit Project Documentation

## Overview
CreatorHub is a full-stack web application designed as an adult content creator platform inspired by OnlyFans/Fanvenue aesthetics. It serves as a premium directory where users can discover exclusive content creators across various categories.

**Current State**: Successfully imported and running in Replit environment

## Tech Stack
- **Frontend**: React 18 with TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Node.js with Express.js, TypeScript
- **Storage**: File-based storage system (no database needed)
- **Development**: tsx for TypeScript execution
- **Styling**: Dark-themed UI with Tailwind CSS and shadcn components

## Project Architecture
```
├── client/src/          # React frontend
│   ├── components/      # UI components including shadcn/ui
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries and query client
│   ├── pages/          # Application pages
│   └── App.tsx         # Main application component
├── server/              # Express backend
│   ├── index.ts        # Main server entry point
│   ├── routes.ts       # API route definitions
│   ├── storage.ts      # File-based storage interface
│   ├── vite.ts         # Vite development server setup
│   └── ...            # Additional server modules
├── shared/              # Shared types and schemas
│   └── schema.ts       # Data models and validation
├── data/               # Content creator profiles and posts
└── attached_assets/    # Static assets
```

## Recent Changes (Import Setup)
- **Fixed tsx command**: Resolved development server startup issue
- **Configured Vite for Replit**: Set `allowedHosts: true` for proxy compatibility
- **Set up workflow**: Configured frontend to run on port 5000 with webview output
- **Deployment configuration**: Set up for autoscale deployment target

## Current Features
- Dark-themed React frontend with adult content platform styling
- File-based storage system loading creator profiles from data folders
- Express API server with profile endpoints
- Video content processing and thumbnail extraction
- Responsive design with shadcn/ui components
- Real-time development with Vite HMR

## Development Workflow
```bash
# Start development server (via workflow)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Configuration Notes
- **Port**: Application runs on port 5000 (required for Replit)
- **Host**: Configured for 0.0.0.0 to work with Replit's proxy
- **Storage**: Uses file-based storage, loads profiles from `data/` folder
- **Environment**: NODE_ENV=development for dev mode, production for build

## User Preferences
- No specific preferences documented yet

## Deployment Status
- **Target**: Autoscale (configured)
- **Build Command**: npm run build
- **Start Command**: npm run start
- **Ready for deployment**: Yes