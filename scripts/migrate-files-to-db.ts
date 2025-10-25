import fs from 'fs/promises';
import path from 'path';
import { dbStorage } from '../server/dbStorage';
import { nanoid } from 'nanoid';

const DATA_DIR = path.join(process.cwd(), 'data');

interface ProfileData {
  name: string;
  title: string;
  category: string;
  location?: string;
  description?: string;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  rating?: string;
  reviewCount?: string;
  likesCount?: string;
  viewsCount?: string;
  subscribersCount?: string;
  tags?: string[];
  isActive?: boolean;
}

interface PostData {
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  contentType?: string;
  embedCode?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

async function migrateProfilesToDatabase() {
  try {
    console.log('🚀 Starting migration from file system to database...\n');

    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    const profileDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    console.log(`📂 Found ${profileDirs.length} profile directories\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const profileId of profileDirs) {
      try {
        const profileDir = path.join(DATA_DIR, profileId);
        
        const profileFile = path.join(profileDir, 'profile.json');
        let profileData: ProfileData;
        
        try {
          const profileContent = await fs.readFile(profileFile, 'utf-8');
          profileData = JSON.parse(profileContent);
        } catch {
          console.log(`⚠️  No profile.json for ${profileId}, using defaults`);
          profileData = {
            name: profileId,
            title: "Content Creator",
            category: "General",
            description: `Content from ${profileId}`,
          };
        }

        console.log(`\n📝 Migrating profile: ${profileId}`);

        const profile = await dbStorage.createProfile({
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
          mediaCount: '0',
          viewsCount: profileData.viewsCount || '0',
          subscribersCount: profileData.subscribersCount || '0',
          tags: profileData.tags || null,
          isActive: profileData.isActive !== false,
        });

        console.log(`   ✅ Profile created with ID: ${profile.id}`);

        const files = await fs.readdir(profileDir);
        const postFiles = files.filter(file => file.endsWith('.json') && file !== 'profile.json');
        
        console.log(`   📄 Found ${postFiles.length} post files`);

        for (const [index, file] of postFiles.entries()) {
          try {
            const postPath = path.join(profileDir, file);
            const postContent = await fs.readFile(postPath, 'utf-8');
            const postData: PostData = JSON.parse(postContent);

            let videoUrl = postData.videoUrl;
            let thumbnailUrl = postData.thumbnailUrl;

            if (postData.embedCode && postData.embedCode.includes('video.twimg.com')) {
              const videoMatch = postData.embedCode.match(/https:\/\/video\.twimg\.com\/[^"'\s]+/);
              if (videoMatch) {
                videoUrl = videoMatch[0];
                thumbnailUrl = postData.imageUrl;
              }
            }

            await dbStorage.addProfileImage({
              profileId: profile.id,
              imageUrl: postData.imageUrl || '',
              videoUrl: videoUrl || null,
              thumbnailUrl: thumbnailUrl || null,
              contentType: postData.contentType || (videoUrl ? 'video' : 'image'),
              embedCode: postData.embedCode || null,
              title: postData.title || '',
              description: postData.description || '',
              tags: postData.tags || null,
              isMainImage: index === 0,
              order: (index + 1).toString(),
            });
          } catch (error) {
            console.log(`      ⚠️  Error importing post ${file}:`, error);
          }
        }
        await dbStorage.updateProfile(profile.id, {
          mediaCount: postFiles.length.toString(),
        });

        console.log(`   ✅ Imported ${postFiles.length} posts`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating profile ${profileId}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✨ Migration Complete!`);
    console.log(`   ✅ Success: ${successCount} profiles`);
    console.log(`   ❌ Errors: ${errorCount} profiles`);
    console.log(`\n` + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateProfilesToDatabase()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
