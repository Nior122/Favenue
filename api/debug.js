// Debug endpoint to help diagnose Vercel deployment issues
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    console.log('🔍 Debug endpoint called');
    
    // Test different path resolution strategies
    const possiblePaths = [
      path.join(process.cwd(), 'data'),
      path.resolve('./data'),
      path.join(__dirname, '../data'),
      path.join(__dirname, '../../data'),
      './data'
    ];
    
    const debug = {
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      dirname: __dirname,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
      paths: {},
      eboniespublicness: null
    };
    
    // Test each path
    for (const tryPath of possiblePaths) {
      try {
        const files = fs.readdirSync(tryPath);
        debug.paths[tryPath] = {
          exists: true,
          files: files.slice(0, 10), // First 10 files/dirs
          isDirectory: fs.statSync(tryPath).isDirectory()
        };
        
        // If we find data directory, check for eboniespublicness
        if (files.includes('eboniespublicness')) {
          const profilePath = path.join(tryPath, 'eboniespublicness');
          try {
            const profileFiles = fs.readdirSync(profilePath);
            debug.eboniespublicness = {
              path: profilePath,
              files: profileFiles.slice(0, 5),
              hasProfile: profileFiles.includes('profile.json')
            };
            
            // Try to read profile.json
            if (profileFiles.includes('profile.json')) {
              try {
                const profileData = fs.readFileSync(path.join(profilePath, 'profile.json'), 'utf-8');
                debug.eboniespublicness.profile = JSON.parse(profileData);
              } catch (e) {
                debug.eboniespublicness.profileError = e.message;
              }
            }
          } catch (e) {
            debug.eboniespublicness = { error: e.message };
          }
        }
      } catch (e) {
        debug.paths[tryPath] = {
          exists: false,
          error: e.message
        };
      }
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(debug);
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({
      error: 'Debug endpoint failed',
      message: error.message,
      stack: error.stack
    });
  }
}