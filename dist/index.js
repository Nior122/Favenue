// server/index.ts
import express2 from "express";
import path4 from "path";

// server/staticRoutes.ts
import { createServer } from "http";

// server/fileStorage.ts
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { nanoid } from "nanoid";
var DATA_DIR = path.join(process.cwd(), "data");
if (!fsSync.existsSync(DATA_DIR)) {
  fsSync.mkdirSync(DATA_DIR, { recursive: true });
}
var fileStorage = {
  // User operations (for authentication)
  async getUser(id) {
    try {
      const usersPath = path.join(process.cwd(), "data", "users.json");
      let users = [];
      try {
        const usersData = await fs.readFile(usersPath, "utf-8");
        users = JSON.parse(usersData);
      } catch {
      }
      return users.find((u) => u.id === id);
    } catch (error) {
      console.error("Error getting user:", error);
      return void 0;
    }
  },
  async upsertUser(userData) {
    try {
      const usersPath = path.join(process.cwd(), "data", "users.json");
      let users = [];
      try {
        const usersData = await fs.readFile(usersPath, "utf-8");
        users = JSON.parse(usersData);
      } catch {
      }
      const now = /* @__PURE__ */ new Date();
      const existingIndex = users.findIndex((u) => u.id === userData.id);
      const user = {
        id: userData.id || nanoid(),
        email: userData.email || "",
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profilePictureUrl || null,
        isAdmin: userData.isAdmin || false,
        createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : now,
        updatedAt: now
      };
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      await fs.mkdir(path.dirname(usersPath), { recursive: true });
      await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  },
  // Profile operations
  async getProfiles(filters) {
    const allProfiles = await this.getAllProfiles();
    let filteredProfiles = allProfiles;
    if (filters?.category) {
      filteredProfiles = filteredProfiles.filter((p) => p.category === filters.category);
    }
    if (filters?.location) {
      filteredProfiles = filteredProfiles.filter(
        (p) => p.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProfiles = filteredProfiles.filter(
        (p) => p.name.toLowerCase().includes(searchTerm) || p.title.toLowerCase().includes(searchTerm) || p.description && p.description.toLowerCase().includes(searchTerm)
      );
    }
    const offset = filters?.offset || 0;
    if (filters?.limit) {
      filteredProfiles = filteredProfiles.slice(offset, offset + filters.limit);
    } else if (offset > 0) {
      filteredProfiles = filteredProfiles.slice(offset);
    }
    return filteredProfiles;
  },
  async getAllProfiles() {
    try {
      console.log("\u{1F4C2} Loading profiles from data folder...");
      const dataDir = path.join(process.cwd(), "data");
      const entries = await fs.readdir(dataDir, { withFileTypes: true });
      const profileDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
      const result = await Promise.all(profileDirs.map(async (profileId) => {
        try {
          const profileDir = path.join(dataDir, profileId);
          const profileFile = path.join(profileDir, "profile.json");
          let profileData;
          try {
            const profileContent = await fs.readFile(profileFile, "utf-8");
            profileData = JSON.parse(profileContent);
          } catch {
            const files2 = await fs.readdir(profileDir).catch(() => []);
            const postFiles2 = files2.filter((file) => file.endsWith(".json") && file !== "profile.json");
            const posts = await Promise.all(
              postFiles2.map(async (file) => {
                try {
                  const postData = await fs.readFile(path.join(profileDir, file), "utf-8");
                  return JSON.parse(postData);
                } catch {
                  return null;
                }
              })
            );
            profileData = {
              name: profileId,
              title: "Content Creator",
              category: "General",
              description: `Content from ${profileId}`,
              profilePictureUrl: posts[0]?.imageUrl || "",
              coverPhotoUrl: "",
              rating: "4.5",
              reviewCount: "100",
              likesCount: "1000",
              viewsCount: "10000",
              subscribersCount: "500",
              tags: [],
              isActive: true
            };
          }
          const files = await fs.readdir(profileDir).catch(() => []);
          const postFiles = files.filter((file) => file.endsWith(".json") && file !== "profile.json");
          const images = await Promise.all(
            postFiles.map(async (file, index) => {
              try {
                const postData = await fs.readFile(path.join(profileDir, file), "utf-8");
                const post = JSON.parse(postData);
                let videoUrl = post.videoUrl;
                let thumbnailUrl = post.thumbnailUrl;
                if (!videoUrl && post.embedCode && post.contentType === "video") {
                  console.log(`\u{1F3A5} Extracting video URLs for post ${file}:`, post.embedCode);
                  const srcMatch = post.embedCode.match(/src='([^']+)'/);
                  const posterMatch = post.embedCode.match(/poster='([^']+)'/);
                  if (srcMatch) {
                    videoUrl = srcMatch[1];
                    console.log(`\u2705 Extracted video URL: ${videoUrl}`);
                  }
                  if (posterMatch) {
                    thumbnailUrl = posterMatch[1];
                    console.log(`\u2705 Extracted thumbnail URL: ${thumbnailUrl}`);
                  }
                  if (!srcMatch) {
                    console.log(`\u274C Could not extract video URL from embedCode`);
                  }
                }
                return {
                  id: file.replace(".json", ""),
                  profileId,
                  imageUrl: post.imageUrl,
                  videoUrl,
                  thumbnailUrl,
                  contentType: post.contentType || "image",
                  embedCode: post.embedCode,
                  title: post.title || "",
                  description: post.description || "",
                  tags: post.tags || [],
                  isMainImage: index === 0,
                  order: (index + 1).toString(),
                  createdAt: (/* @__PURE__ */ new Date()).toISOString()
                };
              } catch (error) {
                console.warn(`\u26A0\uFE0F Error reading post file ${file}:`, error);
                return null;
              }
            })
          );
          return {
            id: profileId,
            ...profileData,
            mediaCount: postFiles.length.toString(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            images: images.filter(Boolean)
          };
        } catch (error) {
          console.warn(`\u26A0\uFE0F Error loading profile ${profileId}:`, error);
          return null;
        }
      }));
      const profiles = result.filter(Boolean);
      console.log(`\u2705 Loaded ${profiles.length} profiles from data folders`);
      return profiles;
    } catch (error) {
      console.error("\u274C Error loading profiles:", error);
      return [];
    }
  },
  async getProfile(id, userId) {
    try {
      const allProfiles = await this.getAllProfiles();
      const profile = allProfiles.find((p) => p.id === id);
      if (!profile) return void 0;
      if (userId) {
        profile.isFavorited = await this.isFavorited(userId, id);
      }
      return profile;
    } catch (error) {
      console.error(`\u274C Error loading profile ${id}:`, error);
      return void 0;
    }
  },
  // Profile management methods
  async addProfile(profileData) {
    return this.createProfile(profileData);
  },
  async addPost(profileId, postData) {
    try {
      const postId = nanoid();
      const postDir = path.join(process.cwd(), "data", profileId);
      const postFile = path.join(postDir, `post-${postId}.json`);
      await fs.mkdir(postDir, { recursive: true });
      const post = {
        id: postId,
        profileId,
        title: postData.title || "",
        description: postData.description || "",
        imageUrl: postData.imageUrl || "",
        tags: postData.tags || [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await fs.writeFile(postFile, JSON.stringify(post, null, 2));
      return post;
    } catch (error) {
      console.error("Error adding post:", error);
      throw error;
    }
  },
  async deletePost(profileId, postId) {
    try {
      const postFile = path.join(process.cwd(), "data", profileId, `post-${postId}.json`);
      await fs.unlink(postFile);
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  },
  async clearProfilePosts(profileId) {
    try {
      const postDir = path.join(process.cwd(), "data", profileId);
      try {
        const files = await fs.readdir(postDir);
        const postFiles = files.filter((file) => file.startsWith("post-") && file.endsWith(".json"));
        console.log(`\u{1F5D1}\uFE0F Clearing ${postFiles.length} existing posts for profile: ${profileId}`);
        for (const file of postFiles) {
          await fs.unlink(path.join(postDir, file));
        }
      } catch (error) {
        console.log(`\u{1F4C1} Profile directory doesn't exist yet: ${profileId}`);
      }
    } catch (error) {
      console.error("Error clearing profile posts:", error);
      throw error;
    }
  },
  // Profile management operations (for admin)
  async createProfile(profileData) {
    try {
      const profileId = nanoid();
      const now = /* @__PURE__ */ new Date();
      const profile = {
        id: profileId,
        name: profileData.name,
        title: profileData.title,
        category: profileData.category,
        location: profileData.location || null,
        description: profileData.description || null,
        profilePictureUrl: profileData.profilePictureUrl || null,
        coverPhotoUrl: profileData.coverPhotoUrl || null,
        rating: profileData.rating || "0.0",
        reviewCount: profileData.reviewCount || "0",
        likesCount: profileData.likesCount || "0",
        mediaCount: profileData.mediaCount || "0",
        viewsCount: profileData.viewsCount || "0",
        subscribersCount: profileData.subscribersCount || "0",
        tags: profileData.tags || null,
        isActive: profileData.isActive ?? true,
        createdAt: now,
        updatedAt: now
      };
      const profileDir = path.join(process.cwd(), "data", profileId);
      await fs.mkdir(profileDir, { recursive: true });
      const profileFile = path.join(profileDir, "profile.json");
      await fs.writeFile(profileFile, JSON.stringify({
        name: profile.name,
        title: profile.title,
        category: profile.category,
        location: profile.location,
        description: profile.description,
        profilePictureUrl: profile.profilePictureUrl,
        coverPhotoUrl: profile.coverPhotoUrl,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
        likesCount: profile.likesCount,
        viewsCount: profile.viewsCount,
        subscribersCount: profile.subscribersCount,
        tags: profile.tags,
        isActive: profile.isActive
      }, null, 2));
      return profile;
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  },
  async updateProfile(id, profileData) {
    try {
      const existing = await this.getProfile(id);
      if (!existing) return void 0;
      const profileDir = path.join(process.cwd(), "data", id);
      const profileFile = path.join(profileDir, "profile.json");
      const currentData = JSON.parse(await fs.readFile(profileFile, "utf-8"));
      const updatedData = { ...currentData, ...profileData };
      await fs.writeFile(profileFile, JSON.stringify(updatedData, null, 2));
      return {
        ...existing,
        ...profileData,
        updatedAt: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      return void 0;
    }
  },
  async deleteProfile(id) {
    try {
      const profileDir = path.join(process.cwd(), "data", id);
      const profileFile = path.join(profileDir, "profile.json");
      const currentData = JSON.parse(await fs.readFile(profileFile, "utf-8"));
      currentData.isActive = false;
      await fs.writeFile(profileFile, JSON.stringify(currentData, null, 2));
      return true;
    } catch (error) {
      console.error("Error deleting profile:", error);
      return false;
    }
  },
  // Profile image operations (stub implementations)
  async addProfileImage(imageData) {
    const image = {
      id: nanoid(),
      profileId: imageData.profileId,
      imageUrl: imageData.imageUrl || null,
      videoUrl: imageData.videoUrl || null,
      thumbnailUrl: imageData.thumbnailUrl || null,
      contentType: imageData.contentType || "image",
      embedCode: imageData.embedCode || null,
      title: imageData.title || null,
      description: imageData.description || null,
      tags: imageData.tags || null,
      order: imageData.order || "0",
      isMainImage: imageData.isMainImage || false,
      createdAt: /* @__PURE__ */ new Date()
    };
    return image;
  },
  async getProfileImages(profileId) {
    const profile = await this.getProfile(profileId);
    return profile?.images || [];
  },
  async deleteProfileImage(id) {
    return false;
  },
  async updateProfileImage(id, imageData) {
    return void 0;
  },
  // Favorite operations (stub implementations using JSON files)
  async toggleFavorite(userId, profileId) {
    try {
      const favoritesPath = path.join(process.cwd(), "data", "favorites.json");
      let favorites = [];
      try {
        const favoritesData = await fs.readFile(favoritesPath, "utf-8");
        favorites = JSON.parse(favoritesData);
      } catch {
      }
      const existingIndex = favorites.findIndex((f) => f.userId === userId && f.profileId === profileId);
      if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
        await fs.writeFile(favoritesPath, JSON.stringify(favorites, null, 2));
        return false;
      } else {
        favorites.push({
          userId,
          profileId,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        await fs.mkdir(path.dirname(favoritesPath), { recursive: true });
        await fs.writeFile(favoritesPath, JSON.stringify(favorites, null, 2));
        return true;
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      return false;
    }
  },
  async getUserFavorites(userId) {
    try {
      const favoritesPath = path.join(process.cwd(), "data", "favorites.json");
      let favorites = [];
      try {
        const favoritesData = await fs.readFile(favoritesPath, "utf-8");
        favorites = JSON.parse(favoritesData);
      } catch {
        return [];
      }
      const userFavorites = favorites.filter((f) => f.userId === userId);
      const profiles = [];
      for (const fav of userFavorites) {
        const profile = await this.getProfile(fav.profileId, userId);
        if (profile) {
          profiles.push({ ...profile, isFavorited: true });
        }
      }
      return profiles;
    } catch (error) {
      console.error("Error getting user favorites:", error);
      return [];
    }
  },
  async isFavorited(userId, profileId) {
    try {
      const favoritesPath = path.join(process.cwd(), "data", "favorites.json");
      const favoritesData = await fs.readFile(favoritesPath, "utf-8");
      const favorites = JSON.parse(favoritesData);
      return favorites.some((f) => f.userId === userId && f.profileId === profileId);
    } catch {
      return false;
    }
  }
};

// server/scraper.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { nanoid as nanoid2 } from "nanoid";
async function scrapeMediaUrls(url) {
  try {
    console.log(`\u{1F50D} Scraping media from: ${url}`);
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 3e4
    });
    const $ = cheerio.load(response.data);
    const mediaItems = [];
    $('img[src*="img.coomer.st/thumbnail"]').each((_, element) => {
      const $el = $(element);
      let imageUrl = $el.attr("src");
      if (imageUrl) {
        const fullImageUrl = imageUrl.replace("/thumbnail/", "/");
        const filename = fullImageUrl.split("/").pop()?.split("?")[0] || `image-${nanoid2()}.jpg`;
        mediaItems.push({
          url: fullImageUrl,
          type: "image",
          filename
        });
      }
    });
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
    imageSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element);
        let imageUrl = $el.attr("src") || $el.attr("data-src") || $el.attr("href");
        if (imageUrl) {
          if (imageUrl.startsWith("//")) {
            imageUrl = "https:" + imageUrl;
          } else if (imageUrl.startsWith("/")) {
            const baseUrl = new URL(url);
            imageUrl = baseUrl.origin + imageUrl;
          }
          if ((imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")) && !mediaItems.some((item) => item.url === imageUrl)) {
            const filename = imageUrl.split("/").pop()?.split("?")[0] || `image-${nanoid2()}.jpg`;
            mediaItems.push({
              url: imageUrl,
              type: "image",
              filename
            });
          }
        }
      });
    });
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
    videoSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element);
        let videoUrl = $el.attr("src") || $el.attr("href");
        if (videoUrl) {
          if (videoUrl.startsWith("//")) {
            videoUrl = "https:" + videoUrl;
          } else if (videoUrl.startsWith("/")) {
            const baseUrl = new URL(url);
            videoUrl = baseUrl.origin + videoUrl;
          }
          if (videoUrl.includes(".mp4") || videoUrl.includes(".webm")) {
            const filename = videoUrl.split("/").pop()?.split("?")[0] || `video-${nanoid2()}.mp4`;
            mediaItems.push({
              url: videoUrl,
              type: "video",
              filename
            });
          }
        }
      });
    });
    const uniqueMedia = mediaItems.filter(
      (item, index, self) => index === self.findIndex((t) => t.url === item.url)
    );
    console.log(`\u{1F4F8} Found ${uniqueMedia.filter((m) => m.type === "image").length} images`);
    console.log(`\u{1F3A5} Found ${uniqueMedia.filter((m) => m.type === "video").length} videos`);
    return uniqueMedia;
  } catch (error) {
    console.error("\u274C Scraping failed:", error);
    throw new Error(`Failed to scrape media: ${error}`);
  }
}
async function createPostsFromMedia(profileId, mediaItems) {
  console.log(`\u{1F4DD} Creating ${mediaItems.length} posts for profile: ${profileId}`);
  const fs3 = await import("fs");
  const path5 = await import("path");
  const profileDir = path5.join(process.cwd(), "data", profileId);
  if (!fs3.existsSync(profileDir)) {
    fs3.mkdirSync(profileDir, { recursive: true });
  }
  mediaItems.forEach((media, index) => {
    const postNumber = String(index + 1).padStart(3, "0");
    const postData = {
      title: `${media.type === "image" ? "\u{1F4F8}" : "\u{1F3A5}"} Exclusive Content ${postNumber}`,
      description: `Premium ${media.type} content exclusively for you! \u2728`,
      imageUrl: media.url,
      tags: [media.type, "exclusive", "premium"],
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 50) + 10,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const filename = `data/${profileId}/post-${postNumber}.json`;
    writeFileSync(filename, JSON.stringify(postData, null, 2));
  });
  console.log(`\u2705 Created ${mediaItems.length} posts for ${profileId}`);
}

// server/staticRoutes.ts
import axios2 from "axios";
function registerRoutes(app2) {
  app2.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await fileStorage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });
  app2.get("/api/profiles/:id", async (req, res) => {
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
  app2.get("/api/auth/user", async (req, res) => {
    res.status(401).json({ message: "Unauthorized" });
  });
  app2.options("/api/video-proxy", (req, res) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Range, Content-Length, Content-Type"
    });
    res.status(204).send();
  });
  app2.get("/api/video-proxy", async (req, res) => {
    try {
      const videoUrl = req.query.url;
      if (!videoUrl) {
        return res.status(400).json({ error: "Video URL is required" });
      }
      if (!videoUrl.includes("video.twimg.com")) {
        return res.status(403).json({ error: "Only Twitter video URLs are allowed" });
      }
      console.log(`\u{1F3A5} Proxying video: ${videoUrl}`);
      const range = req.headers.range;
      const response = await axios2({
        method: "GET",
        url: videoUrl,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Referer": "https://twitter.com/",
          "Accept": "video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "identity",
          "Sec-Fetch-Dest": "video",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site",
          ...range && { "Range": range }
        },
        timeout: 3e4,
        maxRedirects: 5
      });
      res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Range, Content-Length, Content-Type",
        "Content-Type": response.headers["content-type"] || "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600"
        // Cache for 1 hour
      });
      if (response.headers["content-length"]) {
        res.set("Content-Length", response.headers["content-length"]);
      }
      if (response.status === 206) {
        res.status(206);
        if (response.headers["content-range"]) {
          res.set("Content-Range", response.headers["content-range"]);
        }
      }
      response.data.pipe(res);
    } catch (error) {
      const videoUrl = req.query.url;
      console.error("\u274C Error proxying video:", {
        videoUrl,
        error: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        headers: error?.response?.headers,
        stack: error?.stack
      });
      res.status(500).json({
        error: "Failed to proxy video",
        details: error?.message || "Unknown error",
        videoUrl
      });
    }
  });
  app2.options("/api/image-proxy", (req, res) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Content-Length"
    });
    res.status(204).send();
  });
  app2.get("/api/image-proxy", async (req, res) => {
    const imageUrl = req.query.url;
    try {
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }
      console.log(`\u{1F5BC}\uFE0F Proxying image: ${imageUrl}`);
      const response = await axios2({
        method: "GET",
        url: imageUrl,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://twitter.com/"
        }
      });
      res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Content-Length",
        "Content-Type": response.headers["content-type"] || "image/jpeg",
        "Cache-Control": "public, max-age=3600"
        // Cache for 1 hour
      });
      if (response.headers["content-length"]) {
        res.set("Content-Length", response.headers["content-length"]);
      }
      response.data.pipe(res);
    } catch (error) {
      console.error("\u274C Error proxying image:", {
        imageUrl: imageUrl || "undefined",
        error: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        headers: error?.response?.headers,
        stack: error?.stack
      });
      res.status(500).json({
        error: "Failed to proxy image",
        details: error?.message || "Unknown error",
        imageUrl: imageUrl || "undefined"
      });
    }
  });
  app2.post("/api/profiles", async (req, res) => {
    try {
      const profile = await fileStorage.addProfile(req.body);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });
  app2.post("/api/profiles/:profileId/posts", async (req, res) => {
    try {
      const { profileId } = req.params;
      const post = await fileStorage.addPost(profileId, req.body);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  app2.delete("/api/profiles/:profileId/posts/:postId", async (req, res) => {
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
  app2.post("/api/scrape-media", async (req, res) => {
    try {
      const { url, profileId } = req.body;
      if (!url || !profileId) {
        return res.status(400).json({ message: "URL and profileId are required" });
      }
      console.log(`\u{1F680} Starting media scraping for profile: ${profileId}`);
      await fileStorage.clearProfilePosts(profileId);
      const mediaItems = await scrapeMediaUrls(url);
      if (mediaItems.length === 0) {
        return res.status(404).json({ message: "No media found on the specified URL" });
      }
      await createPostsFromMedia(profileId, mediaItems);
      res.json({
        message: `Successfully scraped and uploaded ${mediaItems.length} media items`,
        count: mediaItems.length,
        images: mediaItems.filter((m) => m.type === "image").length,
        videos: mediaItems.filter((m) => m.type === "video").length
      });
    } catch (error) {
      console.error("Error scraping media:", error);
      res.status(500).json({ message: `Failed to scrape media: ${error}` });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-select"],
          utils: ["clsx", "tailwind-merge", "class-variance-authority"]
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid as nanoid3 } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid3()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  console.log("\u{1F4C1} Using file-based storage (no database needed)");
  const server = registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (process.env.NODE_ENV === "production") {
    app.use(express2.static(path4.join(__dirname, "../dist/public")));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path4.join(__dirname, "../dist/public/index.html"));
      }
    });
  } else {
    await setupVite(app, server);
  }
  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port: PORT,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${PORT}`);
  });
})();
