import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { nanoid } from 'nanoid';

interface FullMediaItem {
  url: string;
  type: 'image' | 'video';
  filename: string;
}

export async function scrapeFullResolutionUrls(url: string): Promise<string[]> {
  try {
    console.log(`🔍 Scraping full-resolution media from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    const mediaUrls = new Set<string>();

    // Method 1: Extract from thumbnail links - follow href to get full resolution
    $('a[href*="/post/"]').each((_, element) => {
      const $link = $(element);
      const postUrl = $link.attr('href');
      
      if (postUrl) {
        // For coomer.st, the post page contains the full resolution image
        // We can try to extract the direct image URL from the thumbnail src
        const $img = $link.find('img[src*="thumbnail"]');
        if ($img.length > 0) {
          const thumbnailSrc = $img.attr('src');
          if (thumbnailSrc) {
            // Convert thumbnail URL to full-size: remove /thumbnail/ from path
            const fullImageUrl = thumbnailSrc.replace('/thumbnail/', '/');
            mediaUrls.add(fullImageUrl);
          }
        }
      }
    });

    // Method 2: Look for direct image links
    $('img[src*="img.coomer.st"]').each((_, element) => {
      const $img = $(element);
      let src = $img.attr('src') || $img.attr('data-src');
      
      if (src && !src.includes('thumbnail')) {
        // This is already a full-size image
        mediaUrls.add(src);
      }
    });

    // Method 3: Look for video elements
    $('video[src], source[src]').each((_, element) => {
      const $el = $(element);
      const src = $el.attr('src');
      
      if (src && (src.includes('.mp4') || src.includes('.webm'))) {
        mediaUrls.add(src);
      }
    });

    // Method 4: Extract from any data attributes that might contain media URLs
    $('[data-src*=".jpg"], [data-src*=".jpeg"], [data-src*=".png"], [data-src*=".webp"], [data-src*=".mp4"], [data-src*=".webm"]').each((_, element) => {
      const $el = $(element);
      const dataSrc = $el.attr('data-src');
      
      if (dataSrc && !dataSrc.includes('thumbnail')) {
        mediaUrls.add(dataSrc);
      }
    });

    // Convert to array and filter out any invalid URLs
    const urlArray = Array.from(mediaUrls).filter(url => {
      return url.startsWith('http') && 
             (url.includes('.jpg') || url.includes('.jpeg') || 
              url.includes('.png') || url.includes('.webp') || 
              url.includes('.mp4') || url.includes('.webm'));
    });

    console.log(`📸 Found ${urlArray.filter(url => url.match(/\.(jpg|jpeg|png|webp)$/i)).length} images`);
    console.log(`🎥 Found ${urlArray.filter(url => url.match(/\.(mp4|webm)$/i)).length} videos`);
    console.log(`📋 Total URLs: ${urlArray.length}`);

    return urlArray;

  } catch (error) {
    console.error('❌ Advanced scraping failed:', error);
    throw new Error(`Failed to scrape full-resolution media: ${error}`);
  }
}

export async function saveUrlsToFile(urls: string[], profileId: string): Promise<string> {
  const urlsContent = urls.join('\n');
  const filePath = `data/${profileId}/urls.txt`;
  
  writeFileSync(filePath, urlsContent);
  console.log(`💾 Saved ${urls.length} URLs to ${filePath}`);
  
  return filePath;
}

export async function createPostsFromUrls(profileId: string, urls: string[]): Promise<void> {
  console.log(`📝 Creating posts from ${urls.length} URLs for profile: ${profileId}`);

  // Ensure the profile directory exists
  const fs = await import('fs');
  const path = await import('path');
  const profileDir = path.join(process.cwd(), 'data', profileId);
  
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  // Create posts from URLs
  urls.forEach((url, index) => {
    const postNumber = String(index + 1).padStart(3, '0');
    const isVideo = url.match(/\.(mp4|webm)$/i);
    
    const postData = {
      title: `${isVideo ? '🎥' : '📸'} Exclusive Content ${postNumber}`,
      description: `Premium ${isVideo ? 'video' : 'image'} content exclusively for you! ✨`,
      imageUrl: url,
      tags: [isVideo ? "video" : "image", "exclusive", "premium"],
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 50) + 10,
      timestamp: new Date().toISOString()
    };

    const filename = path.join(profileDir, `post-${postNumber}.json`);
    writeFileSync(filename, JSON.stringify(postData, null, 2));
  });

  console.log(`✅ Created ${urls.length} posts for ${profileId}`);
}