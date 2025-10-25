import type { Express } from "express";
import { createServer, type Server } from "http";
import { fileStorage } from "./fileStorage";
import { dbStorage } from "./dbStorage";
import { scrapeMediaUrls, createPostsFromMedia } from "./scraper";
import axios from "axios";

// Use database storage in production (Vercel), file storage in development (Replit)
const isProduction = process.env.NODE_ENV === "production" || !process.env.REPL_ID;
const USE_DATABASE = process.env.USE_DATABASE === 'true' || isProduction;
const storage = USE_DATABASE ? dbStorage : fileStorage;

console.log(`📊 Storage in routes: ${USE_DATABASE ? 'DATABASE' : 'FILE-BASED'} (isProduction: ${isProduction}, USE_DATABASE: ${process.env.USE_DATABASE})`);

export function registerRoutes(app: Express): Server {
  // Profile routes - uses database in production, file storage in development
  app.get('/api/profiles', async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.get('/api/profiles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Auth routes - simplified for static deployment
  app.get('/api/auth/user', async (req, res) => {
    // Return unauthorized for static deployment
    res.status(401).json({ message: "Unauthorized" });
  });

  // Video proxy endpoint to handle CORS issues with Twitter videos
  app.options("/api/video-proxy", (req, res) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
    });
    res.status(204).send();
  });

  app.get("/api/video-proxy", async (req, res) => {
    try {
      const videoUrl = req.query.url as string;
      
      if (!videoUrl) {
        return res.status(400).json({ error: "Video URL is required" });
      }

      // Only allow Twitter video URLs for security
      if (!videoUrl.includes('video.twimg.com')) {
        return res.status(403).json({ error: "Only Twitter video URLs are allowed" });
      }

      console.log(`🎥 Proxying video: ${videoUrl}`);

      // Handle range requests for video seeking
      const range = req.headers.range;
      
      // Fetch the video from Twitter with more comprehensive headers
      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Referer': 'https://twitter.com/',
          'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
          'Sec-Fetch-Dest': 'video',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          ...(range && { 'Range': range })
        },
        timeout: 30000,
        maxRedirects: 5
      });

      // Set CORS headers
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
        'Content-Type': response.headers['content-type'] || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      });

      // Set content length if available
      if (response.headers['content-length']) {
        res.set('Content-Length', response.headers['content-length']);
      }

      // Handle partial content responses for range requests
      if (response.status === 206) {
        res.status(206);
        if (response.headers['content-range']) {
          res.set('Content-Range', response.headers['content-range']);
        }
      }

      // Pipe the video data to the response
      response.data.pipe(res);

    } catch (error: any) {
      const videoUrl = req.query.url as string;
      console.error("❌ Error proxying video:", {
        videoUrl: videoUrl,
        error: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        headers: error?.response?.headers,
        stack: error?.stack
      });
      res.status(500).json({ 
        error: "Failed to proxy video", 
        details: error?.message || 'Unknown error',
        videoUrl: videoUrl 
      });
    }
  });

  // Image proxy endpoint to handle CORS issues with external images
  app.options("/api/image-proxy", (req, res) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Length',
    });
    res.status(204).send();
  });

  app.get("/api/image-proxy", async (req, res) => {
    const imageUrl = req.query.url as string;
    
    try {
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      console.log(`🖼️ Proxying image: ${imageUrl}`);

      // Fetch the image
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://twitter.com/',
        }
      });

      // Set CORS and appropriate headers
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Content-Length',
        'Content-Type': response.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      });

      // Set content length if available
      if (response.headers['content-length']) {
        res.set('Content-Length', response.headers['content-length']);
      }

      // Pipe the image data to the response
      response.data.pipe(res);

    } catch (error: any) {
      console.error("❌ Error proxying image:", {
        imageUrl: imageUrl || 'undefined',
        error: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        headers: error?.response?.headers,
        stack: error?.stack
      });
      res.status(500).json({ 
        error: "Failed to proxy image", 
        details: error?.message || 'Unknown error',
        imageUrl: imageUrl || 'undefined'
      });
    }
  });

  // Admin routes for managing content via GitHub
  app.post('/api/profiles', async (req, res) => {
    try {
      const profile = await storage.addProfile(req.body);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.post('/api/profiles/:profileId/posts', async (req, res) => {
    try {
      const { profileId } = req.params;
      const post = await storage.addPost(profileId, req.body);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/profiles/:profileId/posts/:postId', async (req, res) => {
    try {
      const { profileId, postId } = req.params;
      const success = await storage.deletePost(profileId, postId);
      
      if (success) {
        res.json({ message: "Post deleted successfully" });
      } else {
        res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Media scraping route
  app.post('/api/scrape-media', async (req, res) => {
    try {
      const { url, profileId } = req.body;
      
      if (!url || !profileId) {
        return res.status(400).json({ message: "URL and profileId are required" });
      }

      console.log(`🚀 Starting media scraping for profile: ${profileId}`);
      
      // Clear existing posts for this profile first
      await storage.clearProfilePosts(profileId);
      
      // Scrape media URLs
      const mediaItems = await scrapeMediaUrls(url);
      
      if (mediaItems.length === 0) {
        return res.status(404).json({ message: "No media found on the specified URL" });
      }

      // Create posts from scraped media
      await createPostsFromMedia(profileId, mediaItems);
      
      res.json({ 
        message: `Successfully scraped and uploaded ${mediaItems.length} media items`,
        count: mediaItems.length,
        images: mediaItems.filter(m => m.type === 'image').length,
        videos: mediaItems.filter(m => m.type === 'video').length
      });

    } catch (error) {
      console.error("Error scraping media:", error);
      res.status(500).json({ message: `Failed to scrape media: ${error}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}