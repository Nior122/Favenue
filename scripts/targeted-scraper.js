import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

class TargetedScraper {
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

  // Extract media from HTML using the specific structure found
  extractMediaFromHtml($, pageUrl) {
    const items = [];
    
    console.log('🔍 Extracting media from HTML using targeted selectors...');
    
    // Target the specific structure: .thumb elements with .thumb__img
    $('.thumb').each((i, el) => {
      const $thumb = $(el);
      const $img = $thumb.find('.thumb__img');
      const $link = $thumb.find('.thumb__link');
      
      if ($img.length > 0) {
        const src = $img.attr('src');
        const alt = $img.attr('alt') || $img.attr('title');
        const linkTitle = $link.attr('title');
        
        if (src && src.includes('pbs.twimg.com')) {
          // Clean up the URL - remove the :small suffix for higher quality
          const cleanUrl = src.replace(':small', ':large').replace('https:///', 'https://');
          
          // Use the best available caption
          let caption = linkTitle || alt || null;
          if (caption) {
            // Clean up caption - remove truncation and URLs
            caption = caption.replace(/\.\.\.$/, '').replace(/https:\/\/t\.co\/\w+$/, '').trim();
          }
          
          // Determine content type
          const isVideo = $thumb.attr('data-isvideo') === '1' || $thumb.find('.thumb__video_icon').length > 0;
          const contentType = isVideo ? 'video' : 'image';
          
          items.push({
            url: cleanUrl,
            type: contentType,
            caption: caption
          });
        }
      }
    });

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
      console.log('🚀 Starting targeted scraper...');
      
      // Fetch first page
      const firstPageHtml = await this.fetchPage(1);
      if (!firstPageHtml) {
        throw new Error('Failed to fetch first page');
      }
      
      const $ = cheerio.load(firstPageHtml);
      
      // Extract items from first page
      const firstPageItems = this.extractMediaFromHtml($, `${this.baseUrl}?page=1`);
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
          const pageItems = this.extractMediaFromHtml(page$, `${this.baseUrl}?page=${pageNum}`);
          this.allItems = [...this.allItems, ...pageItems];
          this.pagesVisited++;
          
          console.log(`✅ Page ${pageNum}: Found ${pageItems.length} items`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
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
      mediaUrls.push(`${item.url} – ${caption}`);
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
    return {
      source_url: `${this.baseUrl}?page=1`,
      pages_visited: this.pagesVisited,
      items_scraped: this.itemsScraped,
      items_uploaded: this.itemsUploaded,
      failed_uploads: this.failedUploads,
      file_saved: "media_urls.txt",
      notes: this.failedUploads.length > 0 ? `${this.failedUploads.length} items failed to upload` : "All items processed successfully"
    };
  }
}

// Run the scraper
async function main() {
  const startUrl = process.argv[2];
  const profileId = process.argv[3];
  
  if (!startUrl || !profileId) {
    console.error('Usage: node targeted-scraper.js <startUrl> <profileId>');
    process.exit(1);
  }
  
  const scraper = new TargetedScraper(startUrl, profileId);
  
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