import fs from 'fs-extra';
import path from 'path';

async function prepareVercelBuild() {
  try {
    console.log('🚀 Preparing Vercel build...');
    
    // 1. Copy data folder to api directory so it gets bundled with serverless functions
    const sourceDataDir = path.join(process.cwd(), 'data');
    const apiDataDir = path.join(process.cwd(), 'api', 'data');
    
    if (fs.existsSync(sourceDataDir)) {
      console.log('📁 Copying data folder to api directory...');
      await fs.copy(sourceDataDir, apiDataDir);
      console.log(`✅ Copied ${sourceDataDir} to ${apiDataDir}`);
    } else {
      console.warn('⚠️ Data folder not found at', sourceDataDir);
    }
    
    // 2. Also copy to dist for the main Express server
    const distDataDir = path.join(process.cwd(), 'dist', 'data');
    if (fs.existsSync(sourceDataDir)) {
      console.log('📁 Copying data folder to dist directory...');
      await fs.copy(sourceDataDir, distDataDir);
      console.log(`✅ Copied ${sourceDataDir} to ${distDataDir}`);
    }
    
    console.log('✅ Vercel build preparation complete');
  } catch (error) {
    console.error('❌ Error preparing Vercel build:', error);
    process.exit(1);
  }
}

prepareVercelBuild();
