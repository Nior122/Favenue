import type { Express } from "express";
import { createServer, type Server } from "http";
import { fileStorage } from "./fileStorage";
import { scrapeMediaUrls, createPostsFromMedia } from "./scraper";

export function registerRoutes(app: Express): Server {
  // Profile routes - now using file storage
  app.get('/api/profiles', async (req, res) => {
    try {
      const profiles = await fileStorage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.get('/api/profiles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await fileStorage.getProfile(id);
      
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

  // Admin routes for managing content via GitHub
  app.post('/api/profiles', async (req, res) => {
    try {
      const profile = await fileStorage.addProfile(req.body);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.post('/api/profiles/:profileId/posts', async (req, res) => {
    try {
      const { profileId } = req.params;
      const post = await fileStorage.addPost(profileId, req.body);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/profiles/:profileId/posts/:postId', async (req, res) => {
    try {
      const { profileId, postId } = req.params;
      const success = await fileStorage.deletePost(profileId, postId);
      
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
      await fileStorage.clearProfilePosts(profileId);
      
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