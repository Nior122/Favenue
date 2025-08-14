#!/usr/bin/env node

/**
 * Simple script to add a post to a profile in the new data structure
 * Usage: node scripts/add-post-simple.js <profileId> <title> <imageUrl> [description] [tags]
 */

import fs from 'fs/promises';
import path from 'path';

async function addPost() {
  const [, , profileId, title, imageUrl, description = '', tagsStr = ''] = process.argv;
  
  if (!profileId || !title || !imageUrl) {
    console.error('Usage: node scripts/add-post-simple.js <profileId> <title> <imageUrl> [description] [tags]');
    console.error('Example: node scripts/add-post-simple.js bigtittygothegg "New Look" "https://example.com/image.jpg" "Amazing new style" "gothic,style"');
    process.exit(1);
  }

  const profileDir = path.join('./data', profileId);
  
  try {
    // Create profile directory if it doesn't exist
    await fs.mkdir(profileDir, { recursive: true });
    
    // Get existing post files to determine next number
    const files = await fs.readdir(profileDir).catch(() => []);
    const postFiles = files.filter(f => f.endsWith('.json') && f !== 'profile.json');
    const nextNumber = postFiles.length + 1;
    const filename = `post-${nextNumber.toString().padStart(3, '0')}.json`;
    
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
    
    const post = {
      title,
      description,
      imageUrl,
      tags
    };
    
    const postFile = path.join(profileDir, filename);
    await fs.writeFile(postFile, JSON.stringify(post, null, 2));
    
    console.log(`✅ Created post: ${filename} for profile: ${profileId}`);
    console.log(`📁 File: ${postFile}`);
    console.log(`🎯 To add more posts, just create more JSON files in data/${profileId}/`);
    
  } catch (error) {
    console.error('❌ Error creating post:', error);
    process.exit(1);
  }
}

addPost();