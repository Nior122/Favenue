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
import { eq, and, desc, ilike, or } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
    let conditions = [eq(profiles.isActive, true)];

    if (filters?.category) {
      conditions.push(eq(profiles.category, filters.category));
    }

    if (filters?.location) {
      conditions.push(ilike(profiles.location, `%${filters.location}%`));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(profiles.name, `%${filters.search}%`),
          ilike(profiles.title, `%${filters.search}%`),
          ilike(profiles.description, `%${filters.search}%`)
        )
      );
    }

    let query = db
      .select()
      .from(profiles)
      .leftJoin(profileImages, eq(profiles.id, profileImages.profileId))
      .where(and(...conditions))
      .orderBy(desc(profiles.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    // Group results by profile
    const profileMap = new Map<string, ProfileWithImages>();
    
    for (const row of results) {
      const profile = row.profiles;
      const image = row.profile_images;

      if (!profileMap.has(profile.id)) {
        profileMap.set(profile.id, {
          ...profile,
          images: [],
          isFavorited: false,
        });
      }

      if (image) {
        profileMap.get(profile.id)!.images.push(image);
      }
    }

    const profilesWithImages = Array.from(profileMap.values());

    // Check if profiles are favorited by the user
    if (filters?.userId && profilesWithImages.length > 0) {
      const profileIds = profilesWithImages.map(p => p.id);
      const favorites = await db
        .select()
        .from(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, filters.userId),
          )
        );

      const favoritedIds = new Set(favorites.map(f => f.profileId));
      profilesWithImages.forEach(profile => {
        profile.isFavorited = favoritedIds.has(profile.id);
      });
    }

    // Sort images by order and set main image first
    profilesWithImages.forEach(profile => {
      profile.images.sort((a, b) => {
        if (a.isMainImage && !b.isMainImage) return -1;
        if (!a.isMainImage && b.isMainImage) return 1;
        return parseInt(a.order || '0') - parseInt(b.order || '0');
      });
    });

    return profilesWithImages;
  }

  async getProfile(id: string, userId?: string): Promise<ProfileWithImages | undefined> {
    const profile = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.isActive, true)))
      .limit(1);

    if (!profile.length) return undefined;

    const images = await this.getProfileImages(id);
    let isFavorited = false;

    if (userId) {
      isFavorited = await this.isFavorited(userId, id);
    }

    return {
      ...profile[0],
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
    return profile;
  }

  async deleteProfile(id: string): Promise<boolean> {
    const result = await db
      .update(profiles)
      .set({ isActive: false })
      .where(eq(profiles.id, id));
    return result.rowCount! > 0;
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
      .orderBy(desc(profileImages.isMainImage), profileImages.order);
    
    return images;
  }

  async deleteProfileImage(id: string): Promise<boolean> {
    const result = await db
      .delete(profileImages)
      .where(eq(profileImages.id, id));
    return result.rowCount! > 0;
  }

  // Favorite operations
  async toggleFavorite(userId: string, profileId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.profileId, profileId)
        )
      );

    if (existing.length > 0) {
      // Remove favorite
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.profileId, profileId)
          )
        );
      return false;
    } else {
      // Add favorite
      await db
        .insert(userFavorites)
        .values({ userId, profileId });
      return true;
    }
  }

  async getUserFavorites(userId: string): Promise<ProfileWithImages[]> {
    const results = await db
      .select()
      .from(userFavorites)
      .leftJoin(profiles, eq(userFavorites.profileId, profiles.id))
      .leftJoin(profileImages, eq(profiles.id, profileImages.profileId))
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(profiles.isActive, true)
        )
      );

    // Group results by profile
    const profileMap = new Map<string, ProfileWithImages>();
    
    for (const row of results) {
      if (!row.profiles) continue;
      
      const profile = row.profiles;
      const image = row.profile_images;

      if (!profileMap.has(profile.id)) {
        profileMap.set(profile.id, {
          ...profile,
          images: [],
          isFavorited: true,
        });
      }

      if (image) {
        profileMap.get(profile.id)!.images.push(image);
      }
    }

    const profilesWithImages = Array.from(profileMap.values());

    // Sort images by order and set main image first
    profilesWithImages.forEach(profile => {
      profile.images.sort((a, b) => {
        if (a.isMainImage && !b.isMainImage) return -1;
        if (!a.isMainImage && b.isMainImage) return 1;
        return parseInt(a.order || '0') - parseInt(b.order || '0');
      });
    });

    return profilesWithImages;
  }

  async isFavorited(userId: string, profileId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.profileId, profileId)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
