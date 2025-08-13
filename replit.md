# replit.md

## Overview

CreatorHub is a full-stack web application redesigned as an adult content creator platform inspired by OnlyFans/Fanvenue aesthetics. It serves as a premium directory where users can discover exclusive content creators across various categories. The application features a dark-themed React frontend with adult content platform styling, Node.js/Express backend, PostgreSQL database integration via Drizzle ORM, and Replit authentication for user management.

**Latest Update (August 13, 2025)**: Successfully completed migration from Replit Agent to standard Replit environment. Resolved DATABASE_URL configuration issue by pushing database schema via Drizzle. All PostgreSQL tables properly created and seeded. Application running cleanly on port 5000 with proper database connections and API endpoints responding. Migration completed with client/server separation maintained and security best practices followed. Enhanced bigtittygothegg profile from 37 to 68 total gallery images (added 31 new JPEG images) with sexy gothic-themed captions organized into posts. Fixed critical Vercel deployment issue by updating vercel.json configuration to properly serve React frontend instead of raw JavaScript server code. **Fixed Vercel data loss issue**: Created standalone seeding script that runs during Vercel deployment to ensure profile and image data is properly seeded in production database. Updated build process to automatically seed data during deployment.

**Deployment Status**: Fixed Vercel deployment configuration issue where raw server code was displaying instead of React frontend. Updated vercel.json with proper build and routing configuration. **Database Setup Required**: Frontend deploys successfully but requires production database setup for full functionality. Created comprehensive production setup guide (PRODUCTION_SETUP.md) with step-by-step instructions for Neon or Vercel Postgres. Database seeding scripts ready to populate production database with all profile and image data. User needs to set up production database and add DATABASE_URL to Vercel environment variables.

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

### Database Design
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Well-structured relational design with proper foreign key relationships
- **Key Tables**:
  - `users`: User authentication and profile information
  - `profiles`: Professional profiles with categories, ratings, and metadata
  - `profile_images`: Image gallery system with foreign key relationships
  - `user_favorites`: Many-to-many relationship for user favorites
  - `sessions`: Session storage for authentication persistence

### Authentication & Authorization
- **Provider**: Replit Auth using OpenID Connect (OIDC)
- **Session Strategy**: Server-side sessions with secure HTTP-only cookies
- **Security**: CSRF protection, secure cookie configuration, and proper session management
- **User Management**: Automatic user creation/updates on successful authentication
- **Admin System**: Role-based access control with admin-only routes
- **Admin Panel**: Full CRUD operations for profile management, user analytics dashboard
- **User Dashboard**: Personal favorites management, activity tracking, and account overview
- **Test Admin**: Created admin@creatorhub.test user for testing admin functionality

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