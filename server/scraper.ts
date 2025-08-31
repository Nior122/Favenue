import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { nanoid } from 'nanoid';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  filename: string;
}

export async function scrapeMediaUrls(url: string): Promise<MediaItem[]> {
  try {
    console.log(`🔍 Scraping media from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    const mediaItems: MediaItem[] = [];

    // For coomer.st specifically, look for thumbnail images
    $('img[src*="img.coomer.st/thumbnail"]').each((_, element) => {
      const $el = $(element);
      let imageUrl = $el.attr('src');
      
      if (imageUrl) {
        // Convert thumbnail URL to full-size image URL
        const fullImageUrl = imageUrl.replace('/thumbnail/', '/');
        const filename = fullImageUrl.split('/').pop()?.split('?')[0] || `image-${nanoid()}.jpg`;
        
        mediaItems.push({
          url: fullImageUrl,
          type: 'image',
          filename
        });
      }
    });

    // Also look for general image patterns
    const imageSelectors = [
      'img[src*=".jpg"]',
      'img[src*=".jpeg"]', 
      'img[data-src*=".jpg"]',
      'img[data-src*=".jpeg"]',
      'a[href*=".jpg"]',
      'a[href*=".jpeg"]',
      '[src*=".jpg"]',
      '[src*=".jpeg"]',
      '[href*=".jpg"]',
      '[href*=".jpeg"]'
    ];

    imageSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $el = $(element);
        let imageUrl = $el.attr('src') || $el.attr('data-src') || $el.attr('href');
        
        if (imageUrl) {
          // Handle relative URLs
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            const baseUrl = new URL(url);
            imageUrl = baseUrl.origin + imageUrl;
          }
          
          // Validate it's a JPEG and not already added
          if ((imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')) && 
              !mediaItems.some(item => item.url === imageUrl)) {
            const filename = imageUrl.split('/').pop()?.split('?')[0] || `image-${nanoid()}.jpg`;
            mediaItems.push({
              url: imageUrl,
              type: 'image',
              filename
            });
          }
        }
      });
    });

    // Look for video URLs
    const videoSelectors = [
      'video[src*=".mp4"]',
      'source[src*=".mp4"]',
      'a[href*=".mp4"]',
      'video[src*=".webm"]', 
      'source[src*=".webm"]',
      'a[href*=".webm"]',
      '[src*=".mp4"]',
      '[href*=".mp4"]',
      '[src*=".webm"]',
      '[href*=".webm"]'
    ];

    videoSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $el = $(element);
        let videoUrl = $el.attr('src') || $el.attr('href');
        
        if (videoUrl) {
          // Handle relative URLs
          if (videoUrl.startsWith('//')) {
            videoUrl = 'https:' + videoUrl;
          } else if (videoUrl.startsWith('/')) {
            const baseUrl = new URL(url);
            videoUrl = baseUrl.origin + videoUrl;
          }
          
          if (videoUrl.includes('.mp4') || videoUrl.includes('.webm')) {
            const filename = videoUrl.split('/').pop()?.split('?')[0] || `video-${nanoid()}.mp4`;
            mediaItems.push({
              url: videoUrl,
              type: 'video', 
              filename
            });
          }
        }
      });
    });

    // Remove duplicates
    const uniqueMedia = mediaItems.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    );

    console.log(`📸 Found ${uniqueMedia.filter(m => m.type === 'image').length} images`);
    console.log(`🎥 Found ${uniqueMedia.filter(m => m.type === 'video').length} videos`);

    return uniqueMedia;

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    throw new Error(`Failed to scrape media: ${error}`);
  }
}

export async function createPostsFromMedia(profileId: string, mediaItems: MediaItem[]): Promise<void> {
  console.log(`📝 Creating ${mediaItems.length} posts for profile: ${profileId}`);

  // Ensure the profile directory exists
  const fs = await import('fs');
  const path = await import('path');
  const profileDir = path.join(process.cwd(), 'data', profileId);
  
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  // Create posts from media items
  mediaItems.forEach((media, index) => {
    const postNumber = String(index + 1).padStart(3, '0');
    const postData = {
      title: `${media.type === 'image' ? '📸' : '🎥'} Exclusive Content ${postNumber}`,
      description: `Premium ${media.type} content exclusively for you! ✨`,
      imageUrl: media.url,
      tags: [media.type, "exclusive", "premium"],
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 50) + 10,
      timestamp: new Date().toISOString()
    };

    const filename = `data/${profileId}/post-${postNumber}.json`;
    writeFileSync(filename, JSON.stringify(postData, null, 2));
  });

  console.log(`✅ Created ${mediaItems.length} posts for ${profileId}`);
}