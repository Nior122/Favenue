import type { Express } from "express";
import { createServer, type Server } from "http";
import { fileStorage } from "./fileStorage";
import { setupAuth, isAuthenticated as replitAuth } from "./replitAuth";
import { setupProdAuth, isAuthenticated as prodAuth, isAdmin as prodAdmin } from "./prodAuth";
import { insertProfileSchema, insertProfileImageSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";

// Use different auth based on environment
const isProduction = process.env.NODE_ENV === "production" || !process.env.REPL_ID;
const isAuthenticated = isProduction ? prodAuth : replitAuth;

// Use fileStorage as the storage implementation
const storage = fileStorage;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - use different auth based on environment
  if (isProduction) {
    setupProdAuth(app);
  } else {
    await setupAuth(app);
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist, create them from claims
      if (!user) {
        const claims = req.user.claims;
        const isTestAdmin = claims.email === "admin@creatorhub.test" || 
                           claims.sub === "admin-test-user";
        
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
          isAdmin: isTestAdmin,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
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
      
      // Fetch the video from Twitter
      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://twitter.com/',
          ...(range && { 'Range': range })
        }
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

    } catch (error) {
      console.error("Error proxying video:", error);
      res.status(500).json({ error: "Failed to proxy video" });
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
    try {
      const imageUrl = req.query.url as string;
      
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

    } catch (error) {
      console.error("Error proxying image:", error);
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  // Profile routes
  app.get('/api/profiles', async (req, res) => {
    try {
      const { category, location, search, limit, offset } = req.query;
      const userId = (req.user as any)?.claims?.sub;
      
      const profiles = await storage.getProfiles({
        category: category as string,
        location: location as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        userId,
      });
      
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.get('/api/profiles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      const profile = await storage.getProfile(id, userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profiles', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.claims.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.put('/api/profiles/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.claims.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const validatedData = insertProfileSchema.partial().parse(req.body);
      const profile = await storage.updateProfile(id, validatedData);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.delete('/api/profiles/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.claims.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const success = await storage.deleteProfile(id);
      
      if (!success) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  // Admin middleware - use different admin check based on environment
  const isAdmin = isProduction ? prodAdmin : async (req: any, res: any, next: any) => {
    try {
      // First check if user is authenticated
      await isAuthenticated(req, res, () => {});
      
      // Then check if user is admin
      const user = req.user as any;
      if (!user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get user from database to check admin status
      const dbUser = await storage.getUser(user.claims.sub);
      if (!dbUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Admin routes - Require authentication and admin privileges
  app.get('/api/admin/profiles', isAdmin, async (req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching admin profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.post('/api/admin/profiles', isAdmin, async (req, res) => {
    try {
      const validatedData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.put('/api/admin/profiles/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProfileSchema.partial().parse(req.body);
      const profile = await storage.updateProfile(id, validatedData);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.delete('/api/admin/profiles/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProfile(id);
      
      if (!success) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  app.post('/api/admin/profile-images', isAdmin, async (req, res) => {
    try {
      const validatedData = insertProfileImageSchema.parse(req.body);
      const image = await storage.addProfileImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error creating profile image:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid image data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create profile image" });
    }
  });

  // Bulk delete images for a profile
  app.delete('/api/admin/profiles/:profileId/images/bulk', isAdmin, async (req, res) => {
    try {
      const { profileId } = req.params;
      const { imageIds } = req.body; // Array of image IDs to delete
      
      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        return res.status(400).json({ message: "imageIds must be a non-empty array" });
      }
      
      // Delete multiple images
      const deletePromises = imageIds.map(imageId => storage.deleteProfileImage(imageId));
      await Promise.all(deletePromises);
      
      res.json({ message: `Successfully deleted ${imageIds.length} images` });
    } catch (error) {
      console.error("Error bulk deleting images:", error);
      res.status(500).json({ message: "Failed to delete images" });
    }
  });

  // Delete single image
  app.delete('/api/admin/profile-images/:imageId', isAdmin, async (req, res) => {
    try {
      const { imageId } = req.params;
      const success = await storage.deleteProfileImage(imageId);
      
      if (!success) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Update image (e.g., change main image status or order)
  app.put('/api/admin/profile-images/:imageId', isAdmin, async (req, res) => {
    try {
      const { imageId } = req.params;
      const validatedData = insertProfileImageSchema.partial().parse(req.body);
      const image = await storage.updateProfileImage(imageId, validatedData);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      console.error("Error updating image:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid image data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update image" });
    }
  });

  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      // Calculate real stats from database
      const allProfiles = await storage.getProfiles();
      const stats = {
        totalProfiles: allProfiles.length,
        totalFavorites: 0, // Would need to implement favorites count
        totalViews: allProfiles.reduce((sum, profile) => sum + parseInt(profile.viewsCount || '0'), 0),
        totalUsers: 1, // Admin user for now
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // User routes
  app.get('/api/user/favorites', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/user/favorites/:profileId', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      const { profileId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isFavorited = await storage.toggleFavorite(userId, profileId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  app.get('/api/user/stats', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Mock user stats for now
      const stats = {
        profileViews: 25,
        interactions: 12,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Profile image routes
  app.post('/api/profiles/:id/images', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.claims.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const imageData = {
        ...req.body,
        profileId: id,
      };

      const validatedData = insertProfileImageSchema.parse(imageData);
      const image = await storage.addProfileImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error adding profile image:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid image data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add profile image" });
    }
  });

  app.delete('/api/images/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.claims.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const success = await storage.deleteProfileImage(id);
      
      if (!success) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Favorite routes
  app.post('/api/favorites/:profileId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { profileId } = req.params;
      
      const isFavorited = await storage.toggleFavorite(userId, profileId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  app.get('/api/favorites', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
