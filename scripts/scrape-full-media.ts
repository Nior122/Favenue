import { scrapeFullResolutionUrls, saveUrlsToFile, createPostsFromUrls } from '../server/advanced-scraper';

async function scrapeAndUploadFullMedia() {
  const url = 'https://coomer.st/candfans/user/339195';
  const profileId = 'ruri';

  try {
    console.log('🚀 Starting full-resolution media scraping...');
    
    // Step 1: Scrape all full-resolution URLs
    const urls = await scrapeFullResolutionUrls(url);
    
    if (urls.length === 0) {
      console.log('❌ No full-resolution media URLs found');
      return;
    }

    console.log(`✅ Found ${urls.length} full-resolution media URLs`);

    // Step 2: Save URLs to file
    const filePath = await saveUrlsToFile(urls, profileId);
    console.log(`📁 URLs saved to: ${filePath}`);

    // Step 3: Create posts from URLs
    await createPostsFromUrls(profileId, urls);
    
    console.log(`🎉 Successfully uploaded ${urls.length} media items to profile: ${profileId}`);
    console.log(`📋 URLs file saved at: ${filePath}`);

  } catch (error) {
    console.error('❌ Error during full media scraping:', error);
  }
}

scrapeAndUploadFullMedia();