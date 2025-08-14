import fs from 'fs/promises';
import path from 'path';
import { Profile, ProfileWithImages } from '@shared/schema';

interface Post {
  id: string;
  profileId: string;
  title: string;
  description: string;
  imageUrl: string;
  isMainImage: boolean;
  order: number;
  createdAt: string;
  tags: string[];
}

export class FileStorage {
  private readonly dataDir = './data';
  private readonly profilesFile = path.join(this.dataDir, 'profiles.json');
  private readonly postsDir = path.join(this.dataDir, 'posts');

  async getProfiles(): Promise<ProfileWithImages[]> {
    try {
      const profilesData = await fs.readFile(this.profilesFile, 'utf-8');
      const profiles: Profile[] = JSON.parse(profilesData);
      
      const profilesWithImages: ProfileWithImages[] = [];
      
      for (const profile of profiles) {
        const posts = await this.getProfilePosts(profile.id);
        const images = posts.map(post => ({
          id: post.id,
          profileId: post.profileId,
          imageUrl: post.imageUrl,
          isMainImage: post.isMainImage,
          order: post.order.toString(),
          createdAt: new Date(post.createdAt)
        }));
        
        profilesWithImages.push({
          ...profile,
          images
        });
      }
      
      return profilesWithImages;
    } catch (error) {
      console.error('Error reading profiles:', error);
      return [];
    }
  }

  async getProfile(id: string): Promise<ProfileWithImages | undefined> {
    const profiles = await this.getProfiles();
    return profiles.find(profile => profile.id === id);
  }

  async getProfilePosts(profileId: string): Promise<Post[]> {
    try {
      const profilePostsDir = path.join(this.postsDir, profileId);
      const files = await fs.readdir(profilePostsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const posts: Post[] = [];
      
      for (const file of jsonFiles) {
        const filePath = path.join(profilePostsDir, file);
        const postData = await fs.readFile(filePath, 'utf-8');
        const post: Post = JSON.parse(postData);
        posts.push(post);
      }
      
      // Sort by order
      return posts.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error(`Error reading posts for profile ${profileId}:`, error);
      return [];
    }
  }

  async addProfile(profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Promise<Profile> {
    const profiles = await this.getProfiles();
    const newProfile: Profile = {
      ...profileData,
      id: profileData.name.toLowerCase().replace(/\s+/g, ''),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    profiles.push(newProfile);
    await fs.writeFile(this.profilesFile, JSON.stringify(profiles, null, 2));
    
    // Create posts directory for this profile
    const profilePostsDir = path.join(this.postsDir, newProfile.id);
    await fs.mkdir(profilePostsDir, { recursive: true });
    
    return { ...newProfile, images: [] };
  }

  async addPost(profileId: string, postData: Omit<Post, 'id' | 'profileId' | 'createdAt'>): Promise<Post> {
    const profilePostsDir = path.join(this.postsDir, profileId);
    await fs.mkdir(profilePostsDir, { recursive: true });
    
    const existingPosts = await this.getProfilePosts(profileId);
    const nextOrder = Math.max(...existingPosts.map(p => p.order), 0) + 1;
    const postId = `post-${nextOrder.toString().padStart(3, '0')}`;
    
    const newPost: Post = {
      ...postData,
      id: postId,
      profileId,
      createdAt: new Date().toISOString()
    };
    
    const postFile = path.join(profilePostsDir, `${postId}.json`);
    await fs.writeFile(postFile, JSON.stringify(newPost, null, 2));
    
    return newPost;
  }

  async deletePost(profileId: string, postId: string): Promise<boolean> {
    try {
      const postFile = path.join(this.postsDir, profileId, `${postId}.json`);
      await fs.unlink(postFile);
      return true;
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      return false;
    }
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | undefined> {
    try {
      const profilesData = await fs.readFile(this.profilesFile, 'utf-8');
      const profiles: Profile[] = JSON.parse(profilesData);
      
      const profileIndex = profiles.findIndex(p => p.id === id);
      if (profileIndex === -1) return undefined;
      
      profiles[profileIndex] = {
        ...profiles[profileIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      await fs.writeFile(this.profilesFile, JSON.stringify(profiles, null, 2));
      return profiles[profileIndex];
    } catch (error) {
      console.error('Error updating profile:', error);
      return undefined;
    }
  }
}

export const fileStorage = new FileStorage();