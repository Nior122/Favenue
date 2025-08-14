#!/usr/bin/env node

/**
 * Script to add a new post to a profile
 * Usage: node scripts/add-post.js <profileId> <title> <imageUrl> [description] [tags]
 */

import fs from 'fs/promises';
import path from 'path';

async function addPost() {
  const [, , profileId, title, imageUrl, description = '', tagsStr = ''] = process.argv;
  
  if (!profileId || !title || !imageUrl) {
    console.error('Usage: node scripts/add-post.js <profileId> <title> <imageUrl> [description] [tags]');
    console.error('Example: node scripts/add-post.js bigtittygothegg "New Gothic Look" "https://example.com/image.jpg" "Stunning gothic style" "gothic,style"');
    process.exit(1);
  }

  const postsDir = path.join('./data/posts', profileId);
  
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(postsDir, { recursive: true });
    
    // Get existing posts to determine next order
    const files = await fs.readdir(postsDir);
    const existingPosts = files.filter(f => f.endsWith('.json'));
    const nextOrder = existingPosts.length + 1;
    const postId = `post-${nextOrder.toString().padStart(3, '0')}`;
    
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
    
    const post = {
      id: postId,
      profileId,
      title,
      description,
      imageUrl,
      isMainImage: nextOrder === 1,
      order: nextOrder,
      createdAt: new Date().toISOString(),
      tags
    };
    
    const postFile = path.join(postsDir, `${postId}.json`);
    await fs.writeFile(postFile, JSON.stringify(post, null, 2));
    
    // Update profile media count
    const profilesFile = './data/profiles.json';
    const profilesData = await fs.readFile(profilesFile, 'utf-8');
    const profiles = JSON.parse(profilesData);
    
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex !== -1) {
      profiles[profileIndex].mediaCount = nextOrder.toString();
      profiles[profileIndex].updatedAt = new Date().toISOString();
      await fs.writeFile(profilesFile, JSON.stringify(profiles, null, 2));
    }
    
    console.log(`✅ Created post: ${postId} for profile: ${profileId}`);
    console.log(`📁 File: ${postFile}`);
    
  } catch (error) {
    console.error('❌ Error creating post:', error);
    process.exit(1);
  }
}

addPost();