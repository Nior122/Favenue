import fs from 'fs/promises';
import path from 'path';
import { ProfileWithImages } from '@shared/schema';

export const fileStorage = {
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
            // Fallback to default structure if no profile.json
            profileData = { 
              name: profileId,
              title: "Content Creator",
              category: "General",
              description: `Content from ${profileId}`,
              profilePictureUrl: "",
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
                return {
                  id: file.replace('.json', ''),
                  profileId: profileId,
                  imageUrl: post.imageUrl,
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

  async getProfile(id: string): Promise<ProfileWithImages | null> {
    try {
      const allProfiles = await this.getAllProfiles();
      return allProfiles.find(p => p.id === id) || null;
    } catch (error) {
      console.error(`❌ Error loading profile ${id}:`, error);
      return null;
    }
  }
};