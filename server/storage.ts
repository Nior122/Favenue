import {
  users,
  profiles,
  profileImages,
  userFavorites,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type ProfileImage,
  type InsertProfileImage,
  type UserFavorite,
  type InsertUserFavorite,
  type ProfileWithImages,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Profile operations
  getProfiles(filters?: { category?: string; location?: string; search?: string; limit?: number; offset?: number }): Promise<ProfileWithImages[]>;
  getProfile(id: string, userId?: string): Promise<ProfileWithImages | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: string): Promise<boolean>;

  // Profile image operations
  addProfileImage(image: InsertProfileImage): Promise<ProfileImage>;
  getProfileImages(profileId: string): Promise<ProfileImage[]>;
  deleteProfileImage(id: string): Promise<boolean>;

  // Favorite operations
  toggleFavorite(userId: string, profileId: string): Promise<boolean>;
  getUserFavorites(userId: string): Promise<ProfileWithImages[]>;
  isFavorited(userId: string, profileId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private profiles = new Map<string, Profile>();
  private profileImages = new Map<string, ProfileImage>();
  private userFavorites = new Map<string, UserFavorite>();

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const existingUser = this.users.get(userData.id!);
    
    const user: User = {
      ...userData,
      id: userData.id || nanoid(),
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    } as User;
    
    this.users.set(user.id, user);
    return user;
  }

  // Profile operations
  async getProfiles(filters?: { 
    category?: string; 
    location?: string; 
    search?: string; 
    limit?: number; 
    offset?: number;
    userId?: string;
  }): Promise<ProfileWithImages[]> {
    let profilesArray = Array.from(this.profiles.values())
      .filter(p => p.isActive)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Apply filters
    if (filters?.category) {
      profilesArray = profilesArray.filter(p => p.category === filters.category);
    }

    if (filters?.location) {
      profilesArray = profilesArray.filter(p => 
        p.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      profilesArray = profilesArray.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.title.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination
    const offset = filters?.offset || 0;
    if (filters?.limit) {
      profilesArray = profilesArray.slice(offset, offset + filters.limit);
    } else if (offset > 0) {
      profilesArray = profilesArray.slice(offset);
    }

    // Add images and favorites
    const profilesWithImages: ProfileWithImages[] = [];
    for (const profile of profilesArray) {
      const images = await this.getProfileImages(profile.id);
      const isFavorited = filters?.userId ? 
        await this.isFavorited(filters.userId, profile.id) : false;
      
      profilesWithImages.push({
        ...profile,
        images,
        isFavorited,
      });
    }

    return profilesWithImages;
  }

  async getProfile(id: string, userId?: string): Promise<ProfileWithImages | undefined> {
    const profile = this.profiles.get(id);
    if (!profile || !profile.isActive) return undefined;

    const images = await this.getProfileImages(id);
    const isFavorited = userId ? await this.isFavorited(userId, id) : false;

    return {
      ...profile,
      images,
      isFavorited,
    };
  }

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const now = new Date();
    const profile: Profile = {
      id: nanoid(),
      ...profileData,
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
    
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async updateProfile(id: string, profileData: Partial<InsertProfile>): Promise<Profile | undefined> {
    const existing = this.profiles.get(id);
    if (!existing) return undefined;

    const updated: Profile = {
      ...existing,
      ...profileData,
      updatedAt: new Date(),
    };
    
    this.profiles.set(id, updated);
    return updated;
  }

  async deleteProfile(id: string): Promise<boolean> {
    const profile = this.profiles.get(id);
    if (!profile) return false;

    const updated = { ...profile, isActive: false };
    this.profiles.set(id, updated);
    return true;
  }

  // Profile image operations
  async addProfileImage(imageData: InsertProfileImage): Promise<ProfileImage> {
    const image: ProfileImage = {
      id: nanoid(),
      ...imageData,
      order: imageData.order || '0',
      isMainImage: imageData.isMainImage || false,
      createdAt: new Date(),
    };
    
    this.profileImages.set(image.id, image);
    return image;
  }

  async getProfileImages(profileId: string): Promise<ProfileImage[]> {
    const images = Array.from(this.profileImages.values())
      .filter(img => img.profileId === profileId)
      .sort((a, b) => {
        if (a.isMainImage && !b.isMainImage) return -1;
        if (!a.isMainImage && b.isMainImage) return 1;
        return parseInt(a.order || '0') - parseInt(b.order || '0');
      });
    
    return images;
  }

  async deleteProfileImage(id: string): Promise<boolean> {
    return this.profileImages.delete(id);
  }

  // Favorite operations
  async toggleFavorite(userId: string, profileId: string): Promise<boolean> {
    const favoriteKey = `${userId}:${profileId}`;
    const existing = Array.from(this.userFavorites.values())
      .find(fav => fav.userId === userId && fav.profileId === profileId);

    if (existing) {
      this.userFavorites.delete(existing.id);
      return false;
    } else {
      const favorite: UserFavorite = {
        id: nanoid(),
        userId,
        profileId,
        createdAt: new Date(),
      };
      this.userFavorites.set(favorite.id, favorite);
      return true;
    }
  }

  async getUserFavorites(userId: string): Promise<ProfileWithImages[]> {
    const userFavs = Array.from(this.userFavorites.values())
      .filter(fav => fav.userId === userId);

    const profilesWithImages: ProfileWithImages[] = [];
    
    for (const fav of userFavs) {
      const profile = this.profiles.get(fav.profileId);
      if (profile && profile.isActive) {
        const images = await this.getProfileImages(profile.id);
        profilesWithImages.push({
          ...profile,
          images,
          isFavorited: true,
        });
      }
    }

    return profilesWithImages;
  }

  async isFavorited(userId: string, profileId: string): Promise<boolean> {
    return Array.from(this.userFavorites.values())
      .some(fav => fav.userId === userId && fav.profileId === profileId);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async getProfiles(filters?: { 
    category?: string; 
    location?: string; 
    search?: string; 
    limit?: number; 
    offset?: number;
    userId?: string;
  }): Promise<ProfileWithImages[]> {
    const query = db
      .select()
      .from(profiles)
      .where(eq(profiles.isActive, true))
      .orderBy(desc(profiles.createdAt));

    // Apply filters (simplified for demo)
    const profilesData = await query.limit(filters?.limit || 50);
    
    // Add images and favorites for each profile
    const profilesWithImages: ProfileWithImages[] = [];
    for (const profile of profilesData) {
      const images = await this.getProfileImages(profile.id);
      const isFavorited = filters?.userId ? 
        await this.isFavorited(filters.userId, profile.id) : false;
      
      profilesWithImages.push({
        ...profile,
        images,
        isFavorited,
      });
    }

    return profilesWithImages;
  }

  async getProfile(id: string, userId?: string): Promise<ProfileWithImages | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.isActive, true)));
    
    if (!profile) return undefined;

    const images = await this.getProfileImages(id);
    const isFavorited = userId ? await this.isFavorited(userId, id) : false;

    return {
      ...profile,
      images,
      isFavorited,
    };
  }

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateProfile(id: string, profileData: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return profile || undefined;
  }

  async deleteProfile(id: string): Promise<boolean> {
    const [result] = await db
      .update(profiles)
      .set({ isActive: false })
      .where(eq(profiles.id, id))
      .returning();
    return !!result;
  }

  // Profile image operations
  async addProfileImage(imageData: InsertProfileImage): Promise<ProfileImage> {
    const [image] = await db
      .insert(profileImages)
      .values(imageData)
      .returning();
    return image;
  }

  async getProfileImages(profileId: string): Promise<ProfileImage[]> {
    const images = await db
      .select()
      .from(profileImages)
      .where(eq(profileImages.profileId, profileId))
      .orderBy(profileImages.isMainImage, profileImages.order);
    return images;
  }

  async deleteProfileImage(id: string): Promise<boolean> {
    const [result] = await db
      .delete(profileImages)
      .where(eq(profileImages.id, id))
      .returning();
    return !!result;
  }

  // Favorite operations
  async toggleFavorite(userId: string, profileId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.profileId, profileId)
      ));

    if (existing) {
      await db
        .delete(userFavorites)
        .where(eq(userFavorites.id, existing.id));
      return false;
    } else {
      await db
        .insert(userFavorites)
        .values({ userId, profileId });
      return true;
    }
  }

  async getUserFavorites(userId: string): Promise<ProfileWithImages[]> {
    const favs = await db
      .select()
      .from(userFavorites)
      .leftJoin(profiles, eq(userFavorites.profileId, profiles.id))
      .where(and(
        eq(userFavorites.userId, userId),
        eq(profiles.isActive, true)
      ));

    const profilesWithImages: ProfileWithImages[] = [];
    for (const fav of favs) {
      if (fav.profiles) {
        const images = await this.getProfileImages(fav.profiles.id);
        profilesWithImages.push({
          ...fav.profiles,
          images,
          isFavorited: true,
        });
      }
    }

    return profilesWithImages;
  }

  async isFavorited(userId: string, profileId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.profileId, profileId)
      ));
    return !!result;
  }
}

export const storage = new DatabaseStorage();
