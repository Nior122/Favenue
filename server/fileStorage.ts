import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { ProfileWithImages, User, UpsertUser, Profile, InsertProfile, ProfileImage, InsertProfileImage } from '@shared/schema';
import { nanoid } from 'nanoid';
import { IStorage } from './storage';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fsSync.existsSync(DATA_DIR)) {
  fsSync.mkdirSync(DATA_DIR, { recursive: true });
}

export const fileStorage: IStorage = {
  // User operations (for authentication)
  async getUser(id: string): Promise<User | undefined> {
    try {
      const usersPath = path.join(process.cwd(), 'data', 'users.json');
      let users: User[] = [];

      try {
        const usersData = await fs.readFile(usersPath, 'utf-8');
        users = JSON.parse(usersData);
      } catch {
        // File doesn't exist yet
      }

      return users.find(u => u.id === id);
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  },

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const usersPath = path.join(process.cwd(), 'data', 'users.json');
      let users: User[] = [];

      try {
        const usersData = await fs.readFile(usersPath, 'utf-8');
        users = JSON.parse(usersData);
      } catch {
        // File doesn't exist yet, will create
      }

      const now = new Date();
      const existingIndex = users.findIndex(u => u.id === userData.id);

      const user: User = {
        id: userData.id || nanoid(),
        email: userData.email || '',
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profilePictureUrl || null,
        isAdmin: userData.isAdmin || false,
        createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : now,
        updatedAt: now,
      };

      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }

      // Ensure data directory exists
      await fs.mkdir(path.dirname(usersPath), { recursive: true });
      await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  },
  // Profile operations
  async getProfiles(filters?: {
    category?: string;
    location?: string;
    search?: string;
    limit?: number;
    offset?: number;
    userId?: string;
  }): Promise<ProfileWithImages[]> {
    // Use the existing getAllProfiles logic with filtering
    const allProfiles = await this.getAllProfiles();

    let filteredProfiles = allProfiles;

    // Apply filters
    if (filters?.category) {
      filteredProfiles = filteredProfiles.filter((p: any) => p.category === filters.category);
    }

    if (filters?.location) {
      filteredProfiles = filteredProfiles.filter((p: any) =>
        p.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProfiles = filteredProfiles.filter((p: any) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.title.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination
    const offset = filters?.offset || 0;
    if (filters?.limit) {
      filteredProfiles = filteredProfiles.slice(offset, offset + filters.limit);
    } else if (offset > 0) {
      filteredProfiles = filteredProfiles.slice(offset);
    }

    return filteredProfiles;
  },

  async getAllProfiles(): Promise<ProfileWithImages[]> {
    try {
      console.log('📂 Loading profiles from data folder...');

      // Get all profile folders
      const dataDir = path.join(process.cwd(), 'data');
      const entries = await fs.readdir(dataDir, { withFileTypes: true });
      const profileDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      const result = await Promise.all(profileDirs.map(async (profileId) => {
        try {
          const profileDir = path.join(dataDir, profileId);

          // Load profile info
          const profileFile = path.join(profileDir, 'profile.json');
          let profileData;
          try {
            const profileContent = await fs.readFile(profileFile, 'utf-8');
            profileData = JSON.parse(profileContent);
          } catch {
            // Load post files to get the first image for profilePictureUrl
            const files = await fs.readdir(profileDir).catch(() => []);
            const postFiles = files.filter(file => file.endsWith('.json') && file !== 'profile.json');
            const posts = await Promise.all(
              postFiles.map(async (file) => {
                try {
                  const postData = await fs.readFile(path.join(profileDir, file), 'utf-8');
                  return JSON.parse(postData);
                } catch {
                  return null;
                }
              })
            );

            // Fallback to default structure if no profile.json
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

          // Load post files
          const files = await fs.readdir(profileDir).catch(() => []);
          const postFiles = files.filter(file => file.endsWith('.json') && file !== 'profile.json');

          const images = await Promise.all(
            postFiles.map(async (file, index) => {
              try {
                const postData = await fs.readFile(path.join(profileDir, file), 'utf-8');
                const post = JSON.parse(postData);

                // Handle video URL and thumbnail extraction
                let videoUrl = post.videoUrl;
                let thumbnailUrl = post.thumbnailUrl;

                // Extract from embedCode if video fields are missing
                if (!videoUrl && post.embedCode && post.contentType === 'video') {
                  const srcMatch = post.embedCode.match(/src='([^']+)'/);
                  const posterMatch = post.embedCode.match(/poster='([^']+)'/);
                  if (srcMatch) videoUrl = srcMatch[1];
                  if (posterMatch) thumbnailUrl = posterMatch[1];
                }

                return {
                  id: file.replace('.json', ''),
                  profileId: profileId,
                  imageUrl: post.imageUrl,
                  videoUrl: videoUrl,
                  thumbnailUrl: thumbnailUrl,
                  contentType: post.contentType || 'image',
                  embedCode: post.embedCode,
                  title: post.title || '',
                  description: post.description || '',
                  tags: post.tags || [],
                  isMainImage: index === 0,
                  order: (index + 1).toString(),
                  createdAt: new Date().toISOString()
                };
              } catch (error) {
                console.warn(`⚠️ Error reading post file ${file}:`, error);
                return null;
              }
            })
          );

          return {
            id: profileId,
            ...profileData,
            mediaCount: postFiles.length.toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            images: images.filter(Boolean)
          };
        } catch (error) {
          console.warn(`⚠️ Error loading profile ${profileId}:`, error);
          return null;
        }
      }));

      const profiles = result.filter(Boolean);
      console.log(`✅ Loaded ${profiles.length} profiles from data folders`);
      return profiles;

    } catch (error) {
      console.error('❌ Error loading profiles:', error);
      return [];
    }
  },

  async getProfile(id: string, userId?: string): Promise<ProfileWithImages | undefined> {
    try {
      const allProfiles = await this.getAllProfiles();
      const profile = allProfiles.find((p: any) => p.id === id);
      if (!profile) return undefined;

      // Add favorite status if userId provided
      if (userId) {
        profile.isFavorited = await this.isFavorited(userId, id);
      }

      return profile;
    } catch (error) {
      console.error(`❌ Error loading profile ${id}:`, error);
      return undefined;
    }
  },

  // Profile management methods
  async addProfile(profileData: any): Promise<Profile> {
    return this.createProfile(profileData);
  },

  async addPost(profileId: string, postData: any): Promise<any> {
    try {
      const postId = nanoid();
      const postDir = path.join(process.cwd(), 'data', profileId);
      const postFile = path.join(postDir, `post-${postId}.json`);

      // Ensure profile directory exists
      await fs.mkdir(postDir, { recursive: true });

      const post = {
        id: postId,
        profileId,
        title: postData.title || '',
        description: postData.description || '',
        imageUrl: postData.imageUrl || '',
        tags: postData.tags || [],
        createdAt: new Date().toISOString()
      };

      await fs.writeFile(postFile, JSON.stringify(post, null, 2));
      return post;
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  },

  async deletePost(profileId: string, postId: string): Promise<boolean> {
    try {
      const postFile = path.join(process.cwd(), 'data', profileId, `post-${postId}.json`);
      await fs.unlink(postFile);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  },

  async clearProfilePosts(profileId: string): Promise<void> {
    try {
      const postDir = path.join(process.cwd(), 'data', profileId);

      // Read directory and delete all post files
      try {
        const files = await fs.readdir(postDir);
        const postFiles = files.filter(file => file.startsWith('post-') && file.endsWith('.json'));

        console.log(`🗑️ Clearing ${postFiles.length} existing posts for profile: ${profileId}`);

        for (const file of postFiles) {
          await fs.unlink(path.join(postDir, file));
        }
      } catch (error) {
        // Directory might not exist, which is fine
        console.log(`📁 Profile directory doesn't exist yet: ${profileId}`);
      }
    } catch (error) {
      console.error('Error clearing profile posts:', error);
      throw error;
    }
  },

  // Profile management operations (for admin)
  async createProfile(profileData: InsertProfile): Promise<Profile> {
    try {
      const profileId = nanoid();
      const now = new Date();

      const profile: Profile = {
        id: profileId,
        name: profileData.name,
        title: profileData.title,
        category: profileData.category,
        location: profileData.location || null,
        description: profileData.description || null,
        profilePictureUrl: profileData.profilePictureUrl || null,
        coverPhotoUrl: profileData.coverPhotoUrl || null,
        rating: profileData.rating || '0.0',
        reviewCount: profileData.reviewCount || '0',
        likesCount: profileData.likesCount || '0',
        mediaCount: profileData.mediaCount || '0',
        viewsCount: profileData.viewsCount || '0',
        subscribersCount: profileData.subscribersCount || '0',
        tags: profileData.tags || null,
        isActive: profileData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };

      // Create profile directory and file
      const profileDir = path.join(process.cwd(), 'data', profileId);
      await fs.mkdir(profileDir, { recursive: true });

      const profileFile = path.join(profileDir, 'profile.json');
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
      console.error('Error creating profile:', error);
      throw error;
    }
  },

  async updateProfile(id: string, profileData: Partial<InsertProfile>): Promise<Profile | undefined> {
    try {
      const existing = await this.getProfile(id);
      if (!existing) return undefined;

      const profileDir = path.join(process.cwd(), 'data', id);
      const profileFile = path.join(profileDir, 'profile.json');

      const currentData = JSON.parse(await fs.readFile(profileFile, 'utf-8'));
      const updatedData = { ...currentData, ...profileData };

      await fs.writeFile(profileFile, JSON.stringify(updatedData, null, 2));

      return {
        ...existing,
        ...profileData,
        updatedAt: new Date(),
      } as Profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      return undefined;
    }
  },

  async deleteProfile(id: string): Promise<boolean> {
    try {
      const profileDir = path.join(process.cwd(), 'data', id);
      const profileFile = path.join(profileDir, 'profile.json');

      const currentData = JSON.parse(await fs.readFile(profileFile, 'utf-8'));
      currentData.isActive = false;

      await fs.writeFile(profileFile, JSON.stringify(currentData, null, 2));
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  },

  // Profile image operations (stub implementations)
  async addProfileImage(imageData: InsertProfileImage): Promise<ProfileImage> {
    // This would create a new post file in the profile directory
    const image: ProfileImage = {
      id: nanoid(),
      profileId: imageData.profileId,
      imageUrl: imageData.imageUrl || null,
      videoUrl: imageData.videoUrl || null,
      thumbnailUrl: imageData.thumbnailUrl || null,
      contentType: imageData.contentType || 'image',
      embedCode: imageData.embedCode || null,
      title: imageData.title || null,
      description: imageData.description || null,
      tags: imageData.tags || null,
      order: imageData.order || '0',
      isMainImage: imageData.isMainImage || false,
      createdAt: new Date(),
    };
    return image;
  },

  async getProfileImages(profileId: string): Promise<ProfileImage[]> {
    const profile = await this.getProfile(profileId);
    return profile?.images || [];
  },

  async deleteProfileImage(id: string): Promise<boolean> {
    return false; // Stub implementation
  },

  async updateProfileImage(id: string, imageData: Partial<InsertProfileImage>): Promise<ProfileImage | undefined> {
    return undefined; // Stub implementation
  },

  // Favorite operations (stub implementations using JSON files)
  async toggleFavorite(userId: string, profileId: string): Promise<boolean> {
    try {
      const favoritesPath = path.join(process.cwd(), 'data', 'favorites.json');
      let favorites: { userId: string; profileId: string; createdAt: string }[] = [];

      try {
        const favoritesData = await fs.readFile(favoritesPath, 'utf-8');
        favorites = JSON.parse(favoritesData);
      } catch {
        // File doesn't exist yet
      }

      const existingIndex = favorites.findIndex(f => f.userId === userId && f.profileId === profileId);

      if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
        await fs.writeFile(favoritesPath, JSON.stringify(favorites, null, 2));
        return false;
      } else {
        favorites.push({
          userId,
          profileId,
          createdAt: new Date().toISOString()
        });
        await fs.mkdir(path.dirname(favoritesPath), { recursive: true });
        await fs.writeFile(favoritesPath, JSON.stringify(favorites, null, 2));
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  },

  async getUserFavorites(userId: string): Promise<ProfileWithImages[]> {
    try {
      const favoritesPath = path.join(process.cwd(), 'data', 'favorites.json');
      let favorites: { userId: string; profileId: string; createdAt: string }[] = [];

      try {
        const favoritesData = await fs.readFile(favoritesPath, 'utf-8');
        favorites = JSON.parse(favoritesData);
      } catch {
        return [];
      }

      const userFavorites = favorites.filter(f => f.userId === userId);
      const profiles: ProfileWithImages[] = [];

      for (const fav of userFavorites) {
        const profile = await this.getProfile(fav.profileId, userId);
        if (profile) {
          profiles.push({ ...profile, isFavorited: true });
        }
      }

      return profiles;
    } catch (error) {
      console.error('Error getting user favorites:', error);
      return [];
    }
  },

  async isFavorited(userId: string, profileId: string): Promise<boolean> {
    try {
      const favoritesPath = path.join(process.cwd(), 'data', 'favorites.json');
      const favoritesData = await fs.readFile(favoritesPath, 'utf-8');
      const favorites = JSON.parse(favoritesData);
      return favorites.some((f: any) => f.userId === userId && f.profileId === profileId);
    } catch {
      return false;
    }
  }
};