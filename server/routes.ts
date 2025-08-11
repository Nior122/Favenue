import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProfileSchema, insertProfileImageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
