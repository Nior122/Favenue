#!/usr/bin/env node

// This script ensures the database is properly seeded in production deployments
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function runCommand(command, args, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function setupProduction() {
  try {
    console.log('🔧 Setting up production database...');
    
    // Push database schema
    console.log('📊 Pushing database schema...');
    await runCommand('npm', ['run', 'db:push']);
    
    console.log('✅ Production setup complete!');
  } catch (error) {
    console.error('❌ Production setup failed:', error.message);
    process.exit(1);
  }
}

setupProduction();