#!/usr/bin/env node

/**
 * Local verification script for testing the fixed build process
 * Usage: DATABASE_URL="postgresql://..." node verify-build.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function runCommand(command, args, cwd = __dirname) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${command} failed with code ${code}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function verifyBuildProcess() {
  try {
    console.log('🚀 Starting build verification process...\n');
    
    // Check environment
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is required');
      console.log('Usage: DATABASE_URL="postgresql://..." node verify-build.js');
      process.exit(1);
    }
    
    console.log('✅ DATABASE_URL found');
    
    // Step 1: Install dependencies
    await runCommand('npm', ['ci']);
    
    // Step 2: Run database migrations (prepare-db equivalent)
    await runCommand('npm', ['run', 'db:push']);
    
    // Step 3: Seed database
    await runCommand('node', ['scripts/seed-standalone.js']);
    
    // Step 4: Build application
    await runCommand('npm', ['run', 'build']);
    
    console.log('\n🎉 All steps completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Push to GitHub to trigger CI/CD');
    console.log('2. Add DATABASE_URL to Vercel environment variables');
    console.log('3. Deploy to Vercel with build command: npm run build');
    
  } catch (error) {
    console.error('\n💥 Build verification failed:', error.message);
    process.exit(1);
  }
}

verifyBuildProcess();