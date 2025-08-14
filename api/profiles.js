// Vercel serverless function for profiles using file storage
import fs from 'fs';
import path from 'path';

// File storage functions for Vercel
async function getProfiles() {
  try {
    // Read profiles from data directory
    const profilesPath = path.join(process.cwd(), 'data', 'profiles.json');
    const profilesData = fs.readFileSync(profilesPath, 'utf-8');
    const profiles = JSON.parse(profilesData);
    
    // Read posts for each profile
    const profilesWithImages = [];
    
    for (const profile of profiles) {
      const posts = await getProfilePosts(profile.id);
      const images = posts.map(post => ({
        id: post.id,
        profileId: post.profileId,
        imageUrl: post.imageUrl,
        isMainImage: post.isMainImage,
        order: post.order.toString(),
        createdAt: new Date(post.createdAt)
      }));
      
      profilesWithImages.push({
        ...profile,
        images
      });
    }
    
    return profilesWithImages;
  } catch (error) {
    console.error('Error reading profiles:', error);
    return [];
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