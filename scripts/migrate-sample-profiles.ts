import fs from 'fs/promises';
import path from 'path';
import { dbStorage } from '../server/dbStorage';

const DATA_DIR = path.join(process.cwd(), 'data');
const SAMPLE_PROFILES = ['bigtittygothegg', 'cutie_lily', 'ebonygirlfriend', 'hannahowo', 'belledelphine'];

async function migrateSampleProfiles() {
  try {
    console.log('🚀 Migrating sample profiles to database...\n');

    for (const profileId of SAMPLE_PROFILES) {
      try {
        console.log(`📝 Migrating: ${profileId}`);
        const profileDir = path.join(DATA_DIR, profileId);
        
        const profileFile = path.join(profileDir, 'profile.json');
        const profileContent = await fs.readFile(profileFile, 'utf-8');
        const profileData = JSON.parse(profileContent);

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
          isActive: true,
        });

        const files = await fs.readdir(profileDir);
        const postFiles = files.filter(file => file.endsWith('.json') && file !== 'profile.json');
        
        for (const [index, file] of postFiles.entries()) {
          try {
            const postPath = path.join(profileDir, file);
            const postContent = await fs.readFile(postPath, 'utf-8');
            const postData = JSON.parse(postContent);

            let videoUrl = postData.videoUrl;
            let thumbnailUrl = postData.thumbnailUrl;

            // Extract video URL from embedCode if present
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
            console.log(`   ⚠️  Error importing post ${file}`);
          }
        }

        await dbStorage.updateProfile(profile.id, {
          mediaCount: postFiles.length.toString(),
        });

        console.log(`   ✅ Imported ${postFiles.length} posts\n`);

      } catch (error) {
        console.error(`   ❌ Error migrating ${profileId}:`, error);
      }
    }

    console.log('✅ Sample migration complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateSampleProfiles();
