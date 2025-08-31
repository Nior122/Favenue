import { scrapeMediaUrls, createPostsFromMedia } from '../server/scraper';

async function scrapeAndUpload() {
  const url = 'https://coomer.st/candfans/user/339195';
  const profileId = 'ruri';

  try {
    console.log('🚀 Starting media scraping process...');
    
    // Scrape media URLs from the website
    const mediaItems = await scrapeMediaUrls(url);
    
    if (mediaItems.length === 0) {
      console.log('❌ No media found on the specified URL');
      return;
    }

    console.log(`✅ Found ${mediaItems.length} media items:`);
    console.log(`📸 Images: ${mediaItems.filter(m => m.type === 'image').length}`);
    console.log(`🎥 Videos: ${mediaItems.filter(m => m.type === 'video').length}`);

    // Create posts from scraped media
    await createPostsFromMedia(profileId, mediaItems);
    
    console.log(`🎉 Successfully uploaded ${mediaItems.length} media items to profile: ${profileId}`);

  } catch (error) {
    console.error('❌ Error during scraping and upload:', error);
  }
}

scrapeAndUpload();