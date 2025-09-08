// Vercel serverless function for profiles using file storage
import fs from 'fs';
import path from 'path';

// File storage functions for Vercel
async function getProfiles() {
  try {
    console.log('📂 Loading profiles from data folder...');
    
    // Get all profile folders from data directory
    const dataDir = path.join(process.cwd(), 'data');
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log('⚠️ Data directory not found at:', dataDir);
      console.log('📁 Current working directory:', process.cwd());
      console.log('📂 Available files:', fs.readdirSync(process.cwd()));
      return getDemoProfiles();
    }
    
    const entries = fs.readdirSync(dataDir, { withFileTypes: true });
    const profileDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    const profiles = [];
    
    for (const profileId of profileDirs) {
      try {
        const profileDir = path.join(dataDir, profileId);
        
        // Load profile info
        const profileFile = path.join(profileDir, 'profile.json');
        let profileData;
        try {
          const profileContent = fs.readFileSync(profileFile, 'utf-8');
          profileData = JSON.parse(profileContent);
        } catch {
          // Fallback to default structure if no profile.json
          profileData = { 
            name: profileId,
            title: "Content Creator",
            category: "General",
            description: `Content from ${profileId}`,
            profilePictureUrl: "",
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
        const posts = await getProfilePosts(profileId);
        const images = posts.map((post, index) => ({
          id: post.id || `${profileId}-${index + 1}`,
          profileId: profileId,
          imageUrl: post.imageUrl,
          title: post.title || '',
          description: post.description || '',
          isMainImage: index === 0,
          order: (index + 1).toString(),
          createdAt: post.createdAt || new Date().toISOString()
        }));
        
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

async function getProfilePosts(profileId) {
  try {
    const profileDir = path.join(process.cwd(), 'data', profileId);
    
    // Check if directory exists
    if (!fs.existsSync(profileDir)) {
      return [];
    }
    
    const files = fs.readdirSync(profileDir);
    const postFiles = files.filter(file => file.endsWith('.json') && file !== 'profile.json');
    
    const posts = [];
    
    for (const file of postFiles) {
      try {
        const filePath = path.join(profileDir, file);
        const postData = fs.readFileSync(filePath, 'utf-8');
        const post = JSON.parse(postData);
        posts.push(post);
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

// Demo profiles for Vercel deployment when data directory is not available
function getDemoProfiles() {
  return [
    {
      id: "demo-creator-1",
      name: "Demo Creator",
      title: "Content Creator",
      category: "Demo",
      description: "This is a demo profile for Vercel deployment",
      profilePictureUrl: "https://via.placeholder.com/300x400",
      coverPhotoUrl: "https://via.placeholder.com/800x400",
      rating: "4.5",
      reviewCount: "100",
      likesCount: "1000",
      viewsCount: "10000",
      subscribersCount: "500",
      tags: ["Demo", "Sample"],
      isActive: true,
      mediaCount: "3",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [
        {
          id: "demo-1",
          profileId: "demo-creator-1",
          imageUrl: "https://via.placeholder.com/400x600",
          title: "Demo Image 1",
          description: "Demo content",
          isMainImage: true,
          order: "1",
          createdAt: new Date().toISOString()
        },
        {
          id: "demo-2", 
          profileId: "demo-creator-1",
          imageUrl: "https://via.placeholder.com/400x600",
          title: "Demo Image 2",
          description: "Demo content",
          isMainImage: false,
          order: "2",
          createdAt: new Date().toISOString()
        },
        {
          id: "demo-3",
          profileId: "demo-creator-1", 
          imageUrl: "https://via.placeholder.com/400x600",
          title: "Demo Image 3",
          description: "Demo content",
          isMainImage: false,
          order: "3",
          createdAt: new Date().toISOString()
        }
      ]
    }
  ];
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