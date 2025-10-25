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
import { IStorage } from "./storage";

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.getUser(userData.id!);
    
    if (existing) {
      const updated = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, userData.id!))
        .returning();
      return updated[0];
    }

    const inserted = await db.insert(users).values({
      id: userData.id || nanoid(),
      email: userData.email || '',
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      isAdmin: userData.isAdmin || false,
    }).returning();
    
    return inserted[0];
  }

  async getProfiles(filters?: {
    category?: string;
    location?: string;
    search?: string;
    limit?: number;
    offset?: number;
    userId?: string;
  }): Promise<ProfileWithImages[]> {
    const conditions = [eq(profiles.isActive, true)];

    if (filters?.category) {
      conditions.push(eq(profiles.category, filters.category));
    }

    if (filters?.location) {
      conditions.push(ilike(profiles.location!, `%${filters.location}%`));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        sql`${profiles.name} ILIKE ${searchTerm} OR ${profiles.title} ILIKE ${searchTerm} OR ${profiles.description} ILIKE ${searchTerm}`
      );
    }

    let query = db.select().from(profiles).where(and(...conditions));

    if (filters?.limit) {
      query = query.limit(filters.limit).offset(filters.offset || 0) as any;
    }

    const profilesList = await query;

    const profilesWithImages: ProfileWithImages[] = await Promise.all(
      profilesList.map(async (profile) => {
        const images = await this.getProfileImages(profile.id);
        const isFavorited = filters?.userId
          ? await this.isFavorited(filters.userId, profile.id)
          : false;

        return {
          ...profile,
          images,
          isFavorited,
        };
      })
    );

    return profilesWithImages;
  }

  async getAllProfiles(): Promise<ProfileWithImages[]> {
    return this.getProfiles();
  }

  async getProfile(id: string, userId?: string): Promise<ProfileWithImages | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    
    if (!result[0]) {
      return undefined;
    }

    const profile = result[0];
    const images = await this.getProfileImages(id);
    const isFavorited = userId ? await this.isFavorited(userId, id) : false;

    return {
      ...profile,
      images,
      isFavorited,
    };
  }

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const inserted = await db.insert(profiles).values(profileData).returning();
    return inserted[0];
  }

  async updateProfile(id: string, profileData: Partial<InsertProfile>): Promise<Profile | undefined> {
    const updated = await db
      .update(profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    
    return updated[0];
  }

  async deleteProfile(id: string): Promise<boolean> {
    const deleted = await db.delete(profiles).where(eq(profiles.id, id)).returning();
    return deleted.length > 0;
  }

  async addProfile(profileData: any): Promise<Profile> {
    return this.createProfile(profileData);
  }

  async addPost(profileId: string, postData: any): Promise<any> {
    const image = await this.addProfileImage({
      profileId,
      imageUrl: postData.imageUrl || '',
      videoUrl: postData.videoUrl || null,
      thumbnailUrl: postData.thumbnailUrl || null,
      contentType: postData.contentType || 'image',
      embedCode: postData.embedCode || null,
      title: postData.title || '',
      description: postData.description || '',
      tags: postData.tags || null,
      order: postData.order || '0',
      isMainImage: postData.isMainImage || false,
    });
    return { id: image.id, profileId, ...postData };
  }

  async deletePost(profileId: string, postId: string): Promise<boolean> {
    return this.deleteProfileImage(postId);
  }

  async clearProfilePosts(profileId: string): Promise<void> {
    await db.delete(profileImages).where(eq(profileImages.profileId, profileId));
  }

  async addProfileImage(imageData: InsertProfileImage): Promise<ProfileImage> {
    const inserted = await db.insert(profileImages).values(imageData).returning();
    return inserted[0];
  }

  async getProfileImages(profileId: string): Promise<ProfileImage[]> {
    return db.select().from(profileImages).where(eq(profileImages.profileId, profileId));
  }

  async deleteProfileImage(id: string): Promise<boolean> {
    const deleted = await db.delete(profileImages).where(eq(profileImages.id, id)).returning();
    return deleted.length > 0;
  }

  async updateProfileImage(id: string, imageData: Partial<InsertProfileImage>): Promise<ProfileImage | undefined> {
    const updated = await db
      .update(profileImages)
      .set(imageData)
      .where(eq(profileImages.id, id))
      .returning();
    
    return updated[0];
  }

  async toggleFavorite(userId: string, profileId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.profileId, profileId)))
      .limit(1);

    if (existing[0]) {
      await db
        .delete(userFavorites)
        .where(and(eq(userFavorites.userId, userId), eq(userFavorites.profileId, profileId)));
      return false;
    }

    await db.insert(userFavorites).values({
      userId,
      profileId,
    });
    return true;
  }

  async getUserFavorites(userId: string): Promise<ProfileWithImages[]> {
    const favorites = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));

    const profileIds = favorites.map((f) => f.profileId);
    
    const favoriteProfiles = await Promise.all(
      profileIds.map((id) => this.getProfile(id, userId))
    );

    return favoriteProfiles.filter((p): p is ProfileWithImages => p !== undefined);
  }

  async isFavorited(userId: string, profileId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.profileId, profileId)))
      .limit(1);

    return result.length > 0;
  }
}

export const dbStorage = new DbStorage();
