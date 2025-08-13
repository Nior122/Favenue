#!/usr/bin/env node

// Build script for Vercel deployment
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function build() {
  try {
    console.log('🏗️  Building CreatorHub for production...');
    
    // Build the frontend with Vite
    console.log('📦 Building frontend...');
    await execAsync('npx vite build', { stdio: 'inherit' });
    
    // Ensure dist/public exists and has index.html
    const distPublic = 'dist/public';
    const indexPath = path.join(distPublic, 'index.html');
    
    try {
      await fs.access(indexPath);
      console.log('✅ Frontend build successful - index.html found');
    } catch (error) {
      console.error('❌ Frontend build failed - index.html not found');
      process.exit(1);
    }
    
    // Build the server for Vercel serverless functions
    console.log('🖥️  Building server...');
    await execAsync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server', { stdio: 'inherit' });
    
    console.log('🎉 Build completed successfully!');
    console.log('📁 Frontend built to: dist/public/');
    console.log('⚡ Server built to: dist/server/');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();