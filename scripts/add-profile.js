#!/usr/bin/env node

/**
 * Script to add a new profile
 * Usage: node scripts/add-profile.js <name> <title> <category> [location] [description]
 */

import fs from 'fs/promises';

async function addProfile() {
  const [, , name, title, category, location = '', description = ''] = process.argv;
  
  if (!name || !title || !category) {
    console.error('Usage: node scripts/add-profile.js <name> <title> <category> [location] [description]');
    console.error('Example: node scripts/add-profile.js "newcreator" "Content Creator" "Lifestyle" "United States" "Amazing content creator"');
    process.exit(1);
  }

  try {
    const profilesFile = './data/profiles.json';
    let profiles = [];
    
    try {
      const profilesData = await fs.readFile(profilesFile, 'utf-8');
      profiles = JSON.parse(profilesData);
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    const profileId = name.toLowerCase().replace(/\s+/g, '');
    
    // Check if profile already exists
    if (profiles.find(p => p.id === profileId)) {
      console.error(`❌ Profile with ID "${profileId}" already exists`);
      process.exit(1);
    }
    
    const newProfile = {
      id: profileId,
      name,
      title,
      category,
      location: location || null,
      description: description || null,
      profilePictureUrl: null,
      coverPhotoUrl: null,
      rating: "0.0",
      reviewCount: "0",
      likesCount: "0",
      mediaCount: "0",
      viewsCount: "0",
      subscribersCount: "0",
      tags: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    profiles.push(newProfile);
    await fs.writeFile(profilesFile, JSON.stringify(profiles, null, 2));
    
    // Create posts directory
    const postsDir = `./data/posts/${profileId}`;
    await fs.mkdir(postsDir, { recursive: true });
    
    console.log(`✅ Created profile: ${profileId}`);
    console.log(`📁 Posts directory: ${postsDir}`);
    
  } catch (error) {
    console.error('❌ Error creating profile:', error);
    process.exit(1);
  }
}

addProfile();