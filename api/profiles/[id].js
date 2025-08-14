// Vercel serverless function for single profile using file storage
import fs from 'fs';
import path from 'path';

async function getProfile(id) {
  try {
    // Read profiles from data directory
    const profilesPath = path.join(process.cwd(), 'data', 'profiles.json');
    const profilesData = fs.readFileSync(profilesPath, 'utf-8');
    const profiles = JSON.parse(profilesData);
    
    const profile = profiles.find(p => p.id === id);
    if (!profile) return null;
    
    // Read posts for this profile
    const posts = await getProfilePosts(id);
    const images = posts.map(post => ({
      id: post.id,
      profileId: post.profileId,
      imageUrl: post.imageUrl,
      isMainImage: post.isMainImage,
      order: post.order.toString(),
      createdAt: new Date(post.createdAt)
    }));
    
    return {
      ...profile,
      images
    };
  } catch (error) {
    console.error('Error reading profile:', error);
    return null;
  }
}

async function getProfilePosts(profileId) {
  try {
    const postsDir = path.join(process.cwd(), 'data', 'posts', profileId);
    
    // Check if directory exists
    if (!fs.existsSync(postsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(postsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const posts = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(postsDir, file);
      const postData = fs.readFileSync(filePath, 'utf-8');
      const post = JSON.parse(postData);
      posts.push(post);
    }
    
    // Sort by order
    return posts.sort((a, b) => a.order - b.order);
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