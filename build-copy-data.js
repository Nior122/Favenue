import fs from 'fs-extra';
import path from 'path';

async function copyDataFolder() {
  try {
    console.log('📁 Copying data folder to build output...');
    const sourceDir = path.join(process.cwd(), 'data');
    const destDir = path.join(process.cwd(), 'dist', 'data');
    
    if (fs.existsSync(sourceDir)) {
      await fs.copy(sourceDir, destDir);
      console.log('✅ Data folder copied successfully');
    } else {
      console.warn('⚠️ Data folder not found, skipping copy');
    }
  } catch (error) {
    console.error('❌ Error copying data folder:', error);
    process.exit(1);
  }
}

copyDataFolder();