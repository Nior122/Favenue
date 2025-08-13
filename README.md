# CreatorHub

A full-stack web application redesigned as an adult content creator platform inspired by OnlyFans/Fanvenue aesthetics. It serves as a premium directory where users can discover exclusive content creators across various categories.

## Tech Stack

- **Frontend**: React 18 with TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Node.js with Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth using OpenID Connect

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment

### Vercel Deployment Setup

1. **Environment Variables** (Required)
   Add these in your Vercel Dashboard → Settings → Environment Variables for both Preview and Production:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   NODE_ENV=production
   ```

2. **Build Settings**
   - Build Command: `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
   - Output Directory: `dist/public`
   - Install Command: `npm ci`

### Database Setup Options

#### Option 1: Neon Database (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create new database project
3. Copy connection string to Vercel environment variables

#### Option 2: Vercel Postgres
1. In Vercel Dashboard → Storage → Create Database
2. Select PostgreSQL
3. DATABASE_URL will be automatically added to environment variables

### CI/CD with GitHub Actions

Database migrations and seeding run automatically via GitHub Actions on push to main branch.

**Required Repository Secrets:**
- `DATABASE_URL`: Your production database connection string

**Manual Database Operations:**
```bash
# Run migrations
npm run db:push

# Seed database
node scripts/seed-standalone.js

# Full setup
npm ci
DATABASE_URL="postgresql://..." npm run db:push
DATABASE_URL="postgresql://..." node scripts/seed-standalone.js
npm run build
```

### Alternative Build Command (if DB operations must run during build)
⚠️ **Not recommended** - Use only if CI/CD approach fails

Build Command: `npm ci && npm run db:push && node scripts/seed-standalone.js && vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`

**Requirements:**
- DATABASE_URL environment variable must be available during build
- Network access to database from Vercel build environment
- Proper error handling for build failures

### Verification Steps

**Local Testing:**
```bash
npm ci
DATABASE_URL="postgresql://user:pass@host:port/db" npm run db:push
DATABASE_URL="postgresql://user:pass@host:port/db" node scripts/seed-standalone.js
npm run build
```

**Successful Vercel Build Log Should Show:**
```
✓ Installing dependencies...
✓ Building application...
✓ Compiled successfully
✓ Build completed
```

**Successful GitHub Actions Log Should Show:**
```
✓ Install dependencies
✓ Generate Drizzle types  
✓ Run database migrations
✓ Seed database
✓ Verify build still works
```

## Project Structure

```
├── client/src/          # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── scripts/             # Database seeding scripts
└── .github/workflows/   # CI/CD pipelines
```

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables:
- `users` - User authentication and profiles
- `profiles` - Creator profiles and metadata
- `profile_images` - Image gallery system
- `user_favorites` - User favorite relationships
- `sessions` - Session storage

## Features

- Dark-themed React frontend with adult content platform styling
- PostgreSQL database integration via Drizzle ORM
- Replit authentication for user management
- Admin panel with CRUD operations
- User dashboard with favorites management
- Responsive design with shadcn/ui components