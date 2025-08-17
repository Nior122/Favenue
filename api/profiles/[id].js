// Vercel serverless function for single profile using file storage
import fs from 'fs';
import path from 'path';

async function getProfile(id) {
  try {
    const profileDir = path.join(process.cwd(), 'data', id);
    
    // Check if profile directory exists
    if (!fs.existsSync(profileDir)) {
      return null;
    }
    
    // Load profile info
    const profileFile = path.join(profileDir, 'profile.json');
    let profileData;
    try {
      const profileContent = fs.readFileSync(profileFile, 'utf-8');
      profileData = JSON.parse(profileContent);
    } catch {
      // Fallback to default structure if no profile.json
      profileData = { 
        name: id,
        title: "Content Creator",
        category: "General",
        description: `Content from ${id}`,
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
    
    // Read posts for this profile
    const posts = await getProfilePosts(id);
    const images = posts.map((post, index) => ({
      id: post.id || `${id}-${index + 1}`,
      profileId: id,
      imageUrl: post.imageUrl,
      title: post.title || '',
      description: post.description || '',
      isMainImage: index === 0,
      order: (index + 1).toString(),
      createdAt: post.createdAt || new Date().toISOString()
    }));
    
    return {
      id,
      ...profileData,
      mediaCount: posts.length.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images
    };
  } catch (error) {
    console.error('Error reading profile:', error);
    return null;
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const profile = await getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      return res.status(200).json(profile);
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