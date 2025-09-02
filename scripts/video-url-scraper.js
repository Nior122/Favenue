import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

class VideoUrlScraper {
  constructor(baseUrl, profileId) {
    this.baseUrl = baseUrl.replace(/\?page=\d+/, ''); // Remove page parameter
    this.profileId = profileId;
    this.allItems = [];
    this.pagesVisited = 0;
    this.itemsScraped = 0;
    this.itemsUploaded = 0;
    this.failedUploads = [];
    this.usedCaptions = new Set();
    
    // Add common headers to avoid blocking
    this.axiosConfig = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000
    };
  }

  // Generate unique caption for items without captions
  generateCaption() {
    const captions = [
      'Sultry vibes 🔥😏',
      'Pure temptation 💋✨',
      'Steamy moment 🌶️💫',
      'Seductive charm 😍🔥',
      'Captivating beauty 💎👑',
      'Irresistible allure 💫😏',
      'Sensual elegance 🌹💋',
      'Divine goddess 👑✨',
      'Enchanting beauty 🦋💫',
      'Flawless perfection 💎🔥',
      'Stunning goddess 👸✨',
      'Mesmerizing charm 💫😍',
      'Breathtaking beauty 🌟💋',
      'Radiant queen 👑🔥',
      'Magnetic appeal 🧲💫',
      'Pure elegance 🌹👑',
      'Dazzling beauty ✨😏',
      'Heavenly vision 👼💫',
      'Perfect moment 💎🔥',
      'Angelic beauty 👼✨',
      'Exotic allure 🌺💋',
      'Glamorous vibes ✨👑',
      'Passionate fire 🔥💫',
      'Sweet seduction 🍯😏',
      'Midnight fantasy 🌙💫',
      'Golden goddess 🌟👑',
      'Velvet dreams 💜✨',
      'Silk and satin 🎀💋',
      'Tempting tease 😈💫',
      'Beautiful chaos 🌪️✨',
      'Dreamy moment 💭💫',
      'Spellbinding charm ✨🔮',
      'Fierce goddess 🔥👑',
      'Enchanted beauty 🌙✨',
      'Pure magic 💫🌟'
    ];

    let caption;
    let attempts = 0;
    do {
      const baseCaption = captions[Math.floor(Math.random() * captions.length)];
      caption = attempts > 0 ? `${baseCaption} ${attempts + 1}` : baseCaption;
      attempts++;
    } while (this.usedCaptions.has(caption) && attempts < 100);

    this.usedCaptions.add(caption);
    return caption;
  }

  // Extract actual video URLs by finding the source links
  async extractVideoUrls(postId, $thumb) {
    const videoUrls = [];
    
    try {
      // Get the post link
      const postLink = $thumb.find('.thumb__link').attr('href');
      if (!postLink) return videoUrls;
      
      const fullPostUrl = postLink.startsWith('http') ? postLink : `https://www.twpornstars.com${postLink}`;
      console.log(`🎬 Fetching individual post: ${fullPostUrl}`);
      
      // Fetch the individual post page
      const response = await axios.get(fullPostUrl, this.axiosConfig);
      const post$ = cheerio.load(response.data);
      
      // Look for video elements and their sources
      const foundUrls = new Set();
      
      // Method 1: Look for direct video elements
      post$('video').each((i, el) => {
        const $video = post$(el);
        const src = $video.attr('src');
        if (src && this.isVideoUrl(src)) {
          foundUrls.add(src);
        }
        
        // Check source elements inside video
        $video.find('source').each((j, source) => {
          const sourceSrc = post$(source).attr('src');
          if (sourceSrc && this.isVideoUrl(sourceSrc)) {
            foundUrls.add(sourceSrc);
          }
        });
      });
      
      // Method 2: Look for Twitter video patterns in script tags
      post$('script').each((i, script) => {
        const scriptContent = post$(script).html() || '';
        
        // Look for Twitter video URLs in script content
        const twitterVideoRegex = /https:\/\/video\.twimg\.com\/[^"'\s]+\.(mp4|webm|m3u8)/gi;
        let match;
        while ((match = twitterVideoRegex.exec(scriptContent)) !== null) {
          foundUrls.add(match[0]);
        }
        
        // Look for other video patterns
        const videoUrlRegex = /https:\/\/[^"'\s]+\.(mp4|webm|m3u8|mov)[^"'\s]*/gi;
        while ((match = videoUrlRegex.exec(scriptContent)) !== null) {
          foundUrls.add(match[0]);
        }
      });
      
      // Method 3: Look for data attributes that might contain video URLs
      post$('[data-src], [data-video], [data-video-src]').each((i, el) => {
        const $el = post$(el);
        const dataSrc = $el.attr('data-src') || $el.attr('data-video') || $el.attr('data-video-src');
        if (dataSrc && this.isVideoUrl(dataSrc)) {
          foundUrls.add(dataSrc);
        }
      });
      
      // Method 4: Look for Twitter's specific video container patterns
      post$('.player-container, .video-container, .media-container').each((i, container) => {
        const $container = post$(container);
        const innerHTML = $container.html() || '';
        
        const videoUrlRegex = /https:\/\/[^"'\s]+\.(mp4|webm|m3u8)/gi;
        let match;
        while ((match = videoUrlRegex.exec(innerHTML)) !== null) {
          foundUrls.add(match[0]);
        }
      });
      
      // Convert Set to Array and filter valid URLs
      videoUrls.push(...Array.from(foundUrls).filter(url => this.isVideoUrl(url)));
      
      if (videoUrls.length > 0) {
        console.log(`✅ Found ${videoUrls.length} video URLs for post ${postId}`);
      } else {
        console.log(`⚠️  No video URLs found for post ${postId}`);
      }
      
      // Rate limiting for individual post requests
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      
    } catch (error) {
      console.error(`❌ Error fetching post ${postId}:`, error.message);
    }
    
    return videoUrls;
  }

  // Check if URL is a valid video URL
  isVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Check for video file extensions
    const videoExtensions = /\.(mp4|webm|m3u8|mpd|mov|avi|ogg|ogv)(\?|$)/i;
    if (videoExtensions.test(url)) return true;
    
    // Check for known video domains
    const videoDomains = /video\.twimg\.com|player\.twimg\.com|vimeo\.com|youtube\.com/i;
    if (videoDomains.test(url)) return true;
    
    return false;
  }

  // Extract media from HTML using the specific structure found
  async extractMediaFromHtml($, pageUrl) {
    const items = [];
    
    console.log('🔍 Extracting media from HTML using targeted selectors...');
    
    // Target the specific structure: .thumb elements with .thumb__img
    const thumbs = $('.thumb');
    console.log(`📋 Found ${thumbs.length} thumb elements`);
    
    for (let i = 0; i < thumbs.length; i++) {
      const $thumb = $(thumbs[i]);
      const $img = $thumb.find('.thumb__img');
      const $link = $thumb.find('.thumb__link');
      
      if ($img.length > 0) {
        const src = $img.attr('src');
        const alt = $img.attr('alt') || $img.attr('title');
        const linkTitle = $link.attr('title');
        const postId = $thumb.attr('data-post-id');
        
        if (src && src.includes('pbs.twimg.com')) {
          // Use the best available caption
          let caption = linkTitle || alt || null;
          if (caption) {
            // Clean up caption - remove truncation and URLs
            caption = caption.replace(/\.\.\.$/, '').replace(/https:\/\/t\.co\/\w+$/, '').trim();
          }
          
          // Determine content type
          const isVideo = $thumb.attr('data-isvideo') === '1' || $thumb.find('.thumb__video_icon').length > 0;
          
          if (isVideo) {
            console.log(`🎬 Processing video post ${postId}...`);
            
            // Try to extract actual video URLs
            const videoUrls = await this.extractVideoUrls(postId, $thumb);
            
            if (videoUrls.length > 0) {
              // Use the first (usually best quality) video URL found
              const videoUrl = videoUrls[0];
              items.push({
                url: videoUrl,
                type: 'video',
                caption: caption,
                postId: postId
              });
              console.log(`✅ Added video: ${videoUrl.substring(0, 80)}...`);
            } else {
              // Fallback: use the thumbnail but mark it as such
              const cleanUrl = src.replace(':small', ':large').replace('https:///', 'https://');
              items.push({
                url: cleanUrl,
                type: 'video',
                caption: caption,
                postId: postId,
                note: 'thumbnail_fallback'
              });
              console.log(`⚠️  Using thumbnail as fallback for video ${postId}`);
            }
          } else {
            // For images, clean up the URL
            const cleanUrl = src.replace(':small', ':large').replace('https:///', 'https://');
            items.push({
              url: cleanUrl,
              type: 'image',
              caption: caption,
              postId: postId
            });
          }
        }
      }
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`📈 Processed ${i + 1}/${thumbs.length} thumbs...`);
      }
    }

    // Deduplicate items
    const seen = new Map();
    items.forEach(item => {
      const key = item.url.split('#')[0];
      if (!seen.has(key)) {
        seen.set(key, item);
      } else {
        const existing = seen.get(key);
        if (!existing.caption && item.caption) {
          seen.set(key, item);
        }
      }
    });

    const uniqueItems = Array.from(seen.values());
    console.log(`📸 Found ${uniqueItems.length} unique media items`);
    return uniqueItems;
  }

  // Get pagination info by looking for numeric page links
  getPaginationInfo($, currentUrl) {
    console.log('🔢 Analyzing pagination...');
    
    let maxPage = 1;
    let hasNumericPages = false;
    
    // Look for pagination links and numeric patterns
    $('a').each((i, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      const text = $link.text().trim();
      
      // Check if this is a page link
      if (href && /page=(\d+)/.test(href)) {
        const match = href.match(/page=(\d+)/);
        if (match) {
          hasNumericPages = true;
          maxPage = Math.max(maxPage, parseInt(match[1]));
        }
      }
      
      // Check for numeric text that might be page numbers
      if (text && /^\d+$/.test(text)) {
        const pageNum = parseInt(text);
        if (pageNum > 0 && pageNum <= 50) { // Reasonable page limit
          hasNumericPages = true;
          maxPage = Math.max(maxPage, pageNum);
        }
      }
    });
    
    console.log(`📄 Pagination analysis: maxPage=${maxPage}, hasNumericPages=${hasNumericPages}`);
    return { maxPage, hasNumericPages };
  }

  // Fetch page content
  async fetchPage(pageNum) {
    const url = `${this.baseUrl}?page=${pageNum}`;
    console.log(`🌐 Fetching page ${pageNum}: ${url}`);
    
    try {
      const response = await axios.get(url, this.axiosConfig);
      console.log(`✅ Successfully fetched page ${pageNum} (${response.data.length} bytes)`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching page ${pageNum}:`, error.message);
      return null;
    }
  }

  // Main scraping function
  async scrape() {
    try {
      console.log('🚀 Starting video URL scraper...');
      
      // Fetch first page
      const firstPageHtml = await this.fetchPage(1);
      if (!firstPageHtml) {
        throw new Error('Failed to fetch first page');
      }
      
      const $ = cheerio.load(firstPageHtml);
      
      // Extract items from first page
      const firstPageItems = await this.extractMediaFromHtml($, `${this.baseUrl}?page=1`);
      this.allItems = [...firstPageItems];
      this.pagesVisited = 1;
      
      console.log(`✅ Page 1: Found ${firstPageItems.length} items`);
      
      // Get pagination info
      const { maxPage, hasNumericPages } = this.getPaginationInfo($, `${this.baseUrl}?page=1`);
      
      if (hasNumericPages && maxPage > 1) {
        console.log(`🔄 Found ${maxPage} pages total, scraping remaining pages...`);
        
        // Fetch remaining pages
        for (let pageNum = 2; pageNum <= maxPage; pageNum++) {
          console.log(`\n📄 Processing page ${pageNum}/${maxPage}...`);
          
          const pageHtml = await this.fetchPage(pageNum);
          if (!pageHtml) {
            console.log(`⚠️  Skipping page ${pageNum} - fetch failed`);
            continue;
          }
          
          const page$ = cheerio.load(pageHtml);
          const pageItems = await this.extractMediaFromHtml(page$, `${this.baseUrl}?page=${pageNum}`);
          this.allItems = [...this.allItems, ...pageItems];
          this.pagesVisited++;
          
          console.log(`✅ Page ${pageNum}: Found ${pageItems.length} items`);
          
          // Rate limiting between pages
          await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        }
      } else {
        console.log('📄 No pagination found or only one page detected');
      }
      
      this.itemsScraped = this.allItems.length;
      console.log(`\n🎉 Scraping completed! Found ${this.itemsScraped} total items across ${this.pagesVisited} pages`);
      
      // Process and upload
      await this.processAndUpload();
      
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw error;
    }
  }

  // Process items and upload to profile
  async processAndUpload() {
    console.log('\n📤 Processing items and creating posts...');
    
    const profileDir = path.join(process.cwd(), 'data', this.profileId);
    const mediaUrls = [];
    
    // Ensure directory exists
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    
    console.log(`📁 Processing ${this.allItems.length} items...`);
    
    // Process each item
    for (let i = 0; i < this.allItems.length; i++) {
      const item = this.allItems[i];
      const postNumber = String(i + 1).padStart(3, '0');
      
      // Assign caption
      let caption = item.caption;
      if (!caption || caption.trim() === '') {
        caption = this.generateCaption();
      } else {
        caption = caption.trim();
        // Limit caption length
        if (caption.length > 120) {
          caption = caption.substring(0, 117) + '...';
        }
      }
      
      // Create post JSON
      const postData = {
        id: `${this.profileId}-${postNumber}`,
        title: caption,
        description: caption,
        imageUrl: item.url,
        contentType: item.type,
        tags: ["Exclusive", "Premium", "EboniesPublic"],
        profileId: this.profileId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add note if this was a thumbnail fallback
      if (item.note) {
        postData.note = item.note;
      }
      
      const postPath = path.join(profileDir, `post-${postNumber}.json`);
      
      try {
        fs.writeFileSync(postPath, JSON.stringify(postData, null, 2));
        this.itemsUploaded++;
        
        if (i % 10 === 0 || i === this.allItems.length - 1) {
          console.log(`✅ Progress: ${i + 1}/${this.allItems.length} posts created`);
        }
      } catch (error) {
        console.error(`❌ Failed to create post-${postNumber}.json:`, error.message);
        this.failedUploads.push({ url: item.url, reason: error.message });
      }
      
      // Add to media URLs list
      const urlEntry = `${item.url} – ${caption}${item.note ? ' [THUMBNAIL_FALLBACK]' : ''}`;
      mediaUrls.push(urlEntry);
    }
    
    // Save media_urls.txt
    const mediaUrlsPath = path.join(profileDir, 'media_urls.txt');
    fs.writeFileSync(mediaUrlsPath, mediaUrls.join('\n'));
    console.log(`💾 Saved media_urls.txt with ${mediaUrls.length} entries`);
    
    // Update profile mediaCount
    const profilePath = path.join(profileDir, 'profile.json');
    try {
      const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
      profileData.mediaCount = this.itemsUploaded.toString();
      profileData.updatedAt = new Date().toISOString();
      fs.writeFileSync(profilePath, JSON.stringify(profileData, null, 2));
      console.log(`📊 Updated profile mediaCount to ${this.itemsUploaded}`);
    } catch (error) {
      console.error(`❌ Failed to update profile:`, error.message);
    }
  }

  // Generate final report
  getReport() {
    const videoCount = this.allItems.filter(item => item.type === 'video').length;
    const imageCount = this.allItems.filter(item => item.type === 'image').length;
    const actualVideoCount = this.allItems.filter(item => item.type === 'video' && !item.note).length;
    const thumbnailFallbackCount = this.allItems.filter(item => item.note === 'thumbnail_fallback').length;
    
    return {
      source_url: `${this.baseUrl}?page=1`,
      pages_visited: this.pagesVisited,
      items_scraped: this.itemsScraped,
      items_uploaded: this.itemsUploaded,
      content_breakdown: {
        images: imageCount,
        videos: videoCount,
        actual_videos: actualVideoCount,
        thumbnail_fallbacks: thumbnailFallbackCount
      },
      failed_uploads: this.failedUploads,
      file_saved: "media_urls.txt",
      notes: this.failedUploads.length > 0 
        ? `${this.failedUploads.length} items failed to upload` 
        : thumbnailFallbackCount > 0 
          ? `${thumbnailFallbackCount} videos fell back to thumbnails (video streams not extractable)`
          : "All items processed successfully"
    };
  }
}

// Run the scraper
async function main() {
  const startUrl = process.argv[2];
  const profileId = process.argv[3];
  
  if (!startUrl || !profileId) {
    console.error('Usage: node video-url-scraper.js <startUrl> <profileId>');
    process.exit(1);
  }
  
  const scraper = new VideoUrlScraper(startUrl, profileId);
  
  try {
    await scraper.scrape();
    const report = scraper.getReport();
    console.log('\n📋 Final Report:');
    console.log(JSON.stringify(report, null, 2));
    
    // Save report
    const reportPath = path.join(process.cwd(), 'data', profileId, 'scraping_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Scraping report saved to ${reportPath}`);
    
  } catch (error) {
    console.error('💥 Scraper failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}