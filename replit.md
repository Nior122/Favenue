# replit.md

## Overview

CreatorHub is a full-stack web application redesigned as an adult content creator platform inspired by OnlyFans/Fanvenue aesthetics. It serves as a premium directory where users can discover exclusive content creators across various categories. The application features a dark-themed React frontend with adult content platform styling, Node.js/Express backend, PostgreSQL database integration via Drizzle ORM, and Replit authentication for user management.

**Latest Update (August 18, 2025)**: **EBONYGIRLFRIEND PROFILE COMPLETED**: Successfully created complete ebonygirlfriend profile with 50 posts featuring sexy captions and emojis ("Sultry Sunday Vibes 🔥", "Bedroom Eyes 👀", "Midnight Temptation 🌙", "Dangerous Curves Ahead ⚠️", etc.). Used valid JPEG image URLs from provided attachment files. Profile includes profile picture, cover photo, and comprehensive gallery with seductive titles, enticing descriptions with emojis, and relevant tags. Profile appears in auto-shuffle rotation and loads successfully via API endpoints. Application now has 6 total profiles with ebonygirlfriend appearing in the rotation.

**Deployment Status**: **FIXED Vercel Build Issues**: Created comprehensive PR to resolve database-related build failures. Separated DB operations from build process with GitHub Actions CI/CD pipeline. Updated Vercel configuration to only run build commands. Created complete deployment documentation with step-by-step setup guides. Database seeding and migrations now handled via automated CI/CD workflow. Vercel builds will succeed with proper environment variable configuration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design with structured route handling
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple

### Content Management System
- **Storage**: File-based JSON storage in `/data` directory
- **No Database**: Removed PostgreSQL completely - no hosting costs
- **GitHub Workflow**: Content managed by editing JSON files in repository
- **Key Files**:
  - `data/[profileId]/profile.json`: Individual profile data
  - `data/[profileId]/post-*.json`: Individual post JSON files per profile
  - **Structure**: Each post has title, description, imageUrl, tags, and metadata
- **Deployment**: Static files deploy automatically with Vercel
- **API Endpoints**: Both local and Vercel deployment support `/api/profiles` and `/api/profiles/[id]`

### Content Management
- **File-Based**: All content stored in JSON files committed to GitHub
- **Manual Upload**: Posts added by creating JSON files in `data/posts/[profileId]/` directory
- **No Authentication**: Simplified for static deployment (no user accounts needed)
- **GitHub Workflow**: Edit files → Commit → Automatic Vercel deployment
- **Scripts**: Helper scripts for local development (`scripts/add-post.js`, `scripts/add-profile.js`)
- **Version Control**: Full content history tracked in Git

### File Structure
- **Monorepo Layout**: Organized into `client/`, `server/`, and `shared/` directories
- **Shared Types**: Common schemas and TypeScript definitions in `shared/`
- **Client Code**: React application in `client/src/` with component organization
- **Server Code**: Express application in `server/` with modular route handling

### Build & Deployment
- **Development**: Hot module replacement with Vite dev server
- **Production**: Static asset building with server-side rendering support
- **Environment**: Environment-based configuration with proper secret management

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### Authentication
- **Replit Identity**: OIDC-based authentication system
- **OpenID Client**: Standards-compliant authentication flow implementation

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Consistent icon library for UI elements

### Development Tools
- **TypeScript**: Static type checking across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration