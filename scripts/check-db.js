#!/usr/bin/env node

// Check if DATABASE_URL is available for database operations
if (!process.env.DATABASE_URL) {
  console.log("⚠️ DATABASE_URL not found - skipping database operations");
  console.log("✅ Building frontend only");
  process.exit(0);
}

console.log("✅ DATABASE_URL found - proceeding with database setup");
process.exit(0);