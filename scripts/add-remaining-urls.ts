import { writeFileSync, readFileSync } from 'fs';
import { createPostsFromUrls } from '../server/advanced-scraper';

async function addRemainingUrls() {
  const profileId = 'ruri';

  // Additional 10 URLs from page 2 (51-60 of 60)
  const additionalUrls = [
    'https://img.coomer.st/data/dd/9d/dd9de3b4372709a7ab717239d54e2ee5a90018aea26737a4d883e91178a1e26e.jpg',
    'https://img.coomer.st/data/19/69/19695c4813089ff174902a6cd5e898e2cebf284084a779397250ab8f76c0c5a3.jpg',
    'https://img.coomer.st/data/f3/c1/f3c1cecc51c34ee456f5aeb9cc72cf40ddde2df8cfaf6678e7a60b8a1897e3f0.jpg',
    'https://img.coomer.st/data/9b/47/9b47eae2cfb734ce71bb0c725939f1a6c06afbddd973b8da6738a4e8b3dd85cd.jpg',
    'https://img.coomer.st/data/63/7d/637dc66f3e8a7b4db809f53d2fc8befeeaa6d92868f0bae9155932a8c6259931.jpg',
    'https://img.coomer.st/data/0c/a0/0ca0830c1b523d21d48ca0bdb62f365165f43bff7ddc0ba7495f8c986d722013.jpg',
    'https://img.coomer.st/data/4a/04/4a04105e00b9c8fcc5a896ac920c67cab7bc5eb7ba784a268a4de09b58ad6609.jpg',
    'https://img.coomer.st/data/26/bb/26bb0e648c57ae7f91fc4d87c715151e5aed175e82b4cb8a4ced7d92268e45a5.jpg',
    'https://img.coomer.st/data/11/1b/111b5a2c4bc5d862467cd075e728b0a12268ed946befa86ea42c088a31eef03e.jpg',
    'https://img.coomer.st/data/7d/2b/7d2b4eb9f44a074bd733203e514d0ef0f16663703c10158cb4eae70f2e3364f2.jpg'
  ];

  try {
    console.log('🚀 Adding remaining 10 URLs to complete the set...');
    
    // Read existing URLs
    const existingUrls = readFileSync(`../data/${profileId}/urls.txt`, 'utf-8').split('\n').filter(url => url.trim());
    
    // Combine all URLs
    const allUrls = [...existingUrls, ...additionalUrls];
    
    console.log(`📸 Total URLs: ${allUrls.length} (${existingUrls.length} existing + ${additionalUrls.length} new)`);

    // Update URLs file
    const urlsContent = allUrls.join('\n');
    writeFileSync(`../data/${profileId}/urls.txt`, urlsContent);
    console.log(`💾 Updated urls.txt with all ${allUrls.length} URLs`);

    // Create posts for the new URLs (starting from post 51)
    const startNumber = existingUrls.length + 1;
    additionalUrls.forEach((url, index) => {
      const postNumber = String(startNumber + index).padStart(3, '0');
      
      const postData = {
        title: `📸 Exclusive Content ${postNumber}`,
        description: `Premium image content exclusively for you! ✨`,
        imageUrl: url,
        tags: ["image", "exclusive", "premium"],
        likes: Math.floor(Math.random() * 500) + 100,
        comments: Math.floor(Math.random() * 50) + 10,
        timestamp: new Date().toISOString()
      };

      const path = require('path');
      writeFileSync(path.join('..', 'data', profileId, `post-${postNumber}.json`), JSON.stringify(postData, null, 2));
    });

    console.log(`✅ Created ${additionalUrls.length} additional posts (${startNumber}-${startNumber + additionalUrls.length - 1})`);
    console.log(`🎉 Profile now has complete set of ${allUrls.length} media items!`);

  } catch (error) {
    console.error('❌ Error adding remaining URLs:', error);
  }
}

addRemainingUrls();