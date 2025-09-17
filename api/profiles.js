// Vercel serverless function for profiles using file storage
import fs from 'fs';
import path from 'path';

// File storage functions for Vercel
async function getProfiles() {
  try {
    console.log('📂 Loading profiles from data folder...');
    
    // Get all profile folders from data directory
    let dataBaseDir = path.join(process.cwd(), 'data');
    console.log('📁 Looking for data directory at:', dataBaseDir);
    console.log('📂 Current working directory contents:', fs.readdirSync(process.cwd()));
    
    let entries;
    try {
      entries = fs.readdirSync(dataBaseDir, { withFileTypes: true });
    } catch (error) {
      console.error('❌ Failed to read data directory:', error);
      console.log('📂 Trying alternative data paths...');
      // Try alternative paths for Vercel deployment
      const altPaths = [
        path.join(__dirname, '../data'),
        path.join(__dirname, 'data'),
        './data'
      ];
      
      let foundPath = null;
      for (const altPath of altPaths) {
        try {
          console.log('🔍 Trying path:', altPath);
          entries = fs.readdirSync(altPath, { withFileTypes: true });
          foundPath = altPath;
          console.log('✅ Found data directory at:', altPath);
          break;
        } catch (e) {
          console.log('❌ Path not found:', altPath);
        }
      }
      
      if (!entries) {
        console.error('❌ Could not find data directory in any location');
        return [];
      }
      
      // Update dataBaseDir to the found path
      if (foundPath) {
        dataBaseDir = foundPath;
      }
    }
    
    const profileDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    console.log(`📋 Found ${profileDirs.length} profile directories:`, profileDirs.slice(0, 5));
    
    const profiles = [];
    
    for (const profileId of profileDirs) {
      try {
        const profileDir = path.join(dataBaseDir, profileId);
        
        // Load profile info
        const profileFile = path.join(profileDir, 'profile.json');
        let profileData;
        try {
          const profileContent = fs.readFileSync(profileFile, 'utf-8');
          profileData = JSON.parse(profileContent);
        } catch {
          // Generate fallback profile data using first post image
          const posts = await getProfilePosts(profileId, dataBaseDir);
          profileData = { 
            name: profileId,
            title: "Content Creator",
            category: "General",
            description: `Content from ${profileId}`,
            profilePictureUrl: posts[0]?.imageUrl || "",
            coverPhotoUrl: "",
            rating: "4.5",
            reviewCount: "100",
            likesCount: "1000",
            viewsCount: "10000",
            subscribersCount: "500",
            tags: [],
            isActive: true
          };
        }
        
        // Load posts for this profile
        const posts = await getProfilePosts(profileId, dataBaseDir);
        const images = posts.map((post, index) => {
          // Handle video URL and thumbnail extraction like the Express server
          let videoUrl = post.videoUrl;
          let thumbnailUrl = post.thumbnailUrl;

          // Extract from embedCode if video fields are missing
          if (!videoUrl && post.embedCode && post.contentType === 'video') {
            console.log(`🎥 Extracting video URLs for post ${post.id || index}:`, post.embedCode.substring(0, 100) + '...');
            const srcMatch = post.embedCode.match(/src=['"]([^'"]+)['"]/);
            const posterMatch = post.embedCode.match(/poster=['"]([^'"]+)['"]/);
            if (srcMatch) {
              videoUrl = srcMatch[1];
              console.log(`✅ Extracted video URL: ${videoUrl}`);
            }
            if (posterMatch) {
              thumbnailUrl = posterMatch[1];
              console.log(`✅ Extracted thumbnail URL: ${thumbnailUrl}`);
            }
          }

          return {
            id: post.id || `${profileId}-${index + 1}`,
            profileId: profileId,
            imageUrl: post.imageUrl,
            videoUrl: videoUrl,
            thumbnailUrl: thumbnailUrl,
            contentType: post.contentType || 'image',
            embedCode: post.embedCode,
            title: post.title || '',
            description: post.description || '',
            tags: post.tags || [],
            isMainImage: index === 0,
            order: (index + 1).toString(),
            createdAt: post.createdAt || new Date().toISOString()
          };
        });
        
        profiles.push({
          id: profileId,
          ...profileData,
          mediaCount: posts.length.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          images
        });
      } catch (error) {
        console.warn(`⚠️ Error loading profile ${profileId}:`, error);
      }
    }
    
    console.log(`✅ Loaded ${profiles.length} profiles from data folders`);
    return profiles;
  } catch (error) {
    console.error('❌ Error loading profiles:', error);
    return [];
  }
}

async function getProfilePosts(profileId, dataBaseDir = null) {
  try {
    const baseDir = dataBaseDir || path.join(process.cwd(), 'data');
    const profileDir = path.join(baseDir, profileId);
    
    let files;
    try {
      files = fs.readdirSync(profileDir);
    } catch (error) {
      console.warn(`⚠️ Profile directory not found: ${profileDir}`);
      return [];
    }
    
    const postFiles = files.filter(file => file.endsWith('.json') && file !== 'profile.json');
    console.log(`📄 Found ${postFiles.length} post files for ${profileId}`);
    
    const posts = [];
    
    for (const file of postFiles) {
      try {
        const filePath = path.join(profileDir, file);
        const postData = fs.readFileSync(filePath, 'utf-8');
        const post = JSON.parse(postData);
        posts.push({
          id: file.replace('.json', ''),
          ...post
        });
      } catch (error) {
        console.warn(`⚠️ Error reading post file ${file}:`, error);
      }
    }
    
    return posts;
  } catch (error) {
    console.error(`Error reading posts for profile ${profileId}:`, error);
    return [];
  }
}


export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const profiles = await getProfiles();
      return res.status(200).json(profiles);
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
}