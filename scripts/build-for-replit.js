
#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function buildForReplit() {
  try {
    console.log('🚀 Building CreatorHub for Replit deployment...');
    
    // Build the frontend with Vite
    console.log('📦 Building frontend...');
    await execAsync('npm run build');
    
    // Verify build output
    const distPublic = 'dist/public';
    const indexPath = path.join(distPublic, 'index.html');
    
    try {
      await fs.access(indexPath);
      console.log('✅ Frontend build successful');
    } catch (error) {
      console.error('❌ Frontend build failed - index.html not found');
      throw error;
    }
    
    // Build server for production
    console.log('🖥️ Building server...');
    await execAsync('npx tsc server/index.ts --outDir dist/server --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --resolveJsonModule');
    
    console.log('🎉 Build completed successfully!');
    console.log('📁 Frontend: dist/public/');
    console.log('⚡ Server: dist/server/');
    console.log('🚀 Ready for Replit deployment!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildForReplit();
