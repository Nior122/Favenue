// Vercel serverless function for single profile using file storage
import fs from 'fs';
import path from 'path';

async function getProfile(id) {
  try {
    console.log(`📂 Loading profile: ${id}`);
    const dataDir = path.join(process.cwd(), 'data');
    const profileDir = path.join(dataDir, id);
    
    console.log(`📁 Looking for profile directory at: ${profileDir}`);
    
    // Check if profile directory exists
    let profileExists;
    try {
      fs.accessSync(profileDir);
      profileExists = true;
    } catch {
      console.log(`⚠️ Profile directory not found: ${profileDir}`);
      profileExists = false;
    }
    
    if (!profileExists) {
      return null;
    }
    
    // Load profile info
    const profileFile = path.join(profileDir, 'profile.json');
    let profileData;
    try {
      const profileContent = fs.readFileSync(profileFile, 'utf-8');
      profileData = JSON.parse(profileContent);
      console.log(`✅ Loaded profile.json for ${id}`);
    } catch (error) {
      console.log(`⚠️ No profile.json found for ${id}, generating fallback data`);
      // Generate fallback profile data using first post image
      const posts = await getProfilePosts(id);
      profileData = { 
        name: id,
        title: "Content Creator",
        category: "General",
        description: `Content from ${id}`,
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
    
    // Read posts for this profile
    const posts = await getProfilePosts(id);
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
        id: post.id || `${id}-${index + 1}`,
        profileId: id,
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
    
    const profile = {
      id,
      ...profileData,
      mediaCount: posts.length.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images
    };
    
    console.log(`✅ Successfully loaded profile ${id} with ${posts.length} posts`);
    return profile;
  } catch (error) {
    console.error(`❌ Error loading profile ${id}:`, error);
    return null;
  }
}

async function getProfilePosts(profileId) {
  try {
    const profileDir = path.join(process.cwd(), 'data', profileId);
    
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