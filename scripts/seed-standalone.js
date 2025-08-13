#!/usr/bin/env node

// Standalone seeding script for production deployments
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.log("⚠️ DATABASE_URL not found, skipping database seeding for static deployment");
  console.log("✅ Static frontend will be deployed without backend database operations");
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function seedProduction() {
  try {
    console.log('🌱 Starting production database seeding...');
    
    // Check if profiles exist
    const existingProfiles = await db.select().from(schema.profiles).limit(1);
    if (existingProfiles.length > 0) {
      console.log('✅ Database already has profiles, skipping seed');
      return;
    }

    console.log('📊 Seeding bigtittygothegg profile...');

    // Create the profile
    const [profile] = await db.insert(schema.profiles).values({
      name: 'bigtittygothegg',
      title: 'Gothic Content Creator',
      category: 'Alternative',
      location: 'United States',
      description: 'Alternative gothic content creator specializing in exclusive premium content. Known for unique aesthetic and engaging personality.',
      profilePictureUrl: 'https://img.coomer.st/icons/onlyfans/bigtittygothegg',
      coverPhotoUrl: 'https://img.coomer.st/banners/onlyfans/bigtittygothegg',
      rating: '4.8',
      reviewCount: '1524',
      likesCount: '15247',
      mediaCount: '468',
      viewsCount: '89432',
      subscribersCount: '2847',
      tags: ['Gothic', 'Alternative', 'Premium Content', 'Exclusive', 'OnlyFans'],
      isActive: true
    }).returning();

    console.log(`✅ Created profile: ${profile.name}`);

    // Add gallery images
    const galleryImages = [
      'https://img.coomer.st/thumbnail/data/04/69/0469ced3b4817cd03e47271499e5a2c364264bff856bd4b563d9b30c721200f7.jpg',
      'https://img.coomer.st/thumbnail/data/0c/cb/0ccb195d2fa5b3042247bdd6cdff727ca8361bba93bdb0942268dfef37b9b3e0.jpg',
      'https://img.coomer.st/thumbnail/data/0f/e2/0fe2d6ccf453b90603b4aaf7eaa79e1b6383654591048c8e65ec2a45029712e7.jpg',
      'https://img.coomer.st/thumbnail/data/1a/2a/1a2a825d6bd15fd751ac996034feb7e797b4f13a0cb8f5242d916387f46d7e20.jpg',
      'https://img.coomer.st/thumbnail/data/26/28/262802aa505082a318c0a7d108d13cf3bdd21cac70f71bc15dfc3788662163d6.jpg',
      'https://img.coomer.st/thumbnail/data/28/4b/284be4289d4fb795bad01cc031907d3ce958a68bbaa0c3e374211d38b3be84da.jpg',
      'https://img.coomer.st/thumbnail/data/34/9a/349ad68384d046cdd0406d79cd560e6ac6b82775e6108bb5fae36a59a726a252.jpg',
      'https://img.coomer.st/thumbnail/data/40/29/402915073952a520a6b8f586392aba283872da5d596d6a35e50752f910e2c326.jpg',
      'https://img.coomer.st/thumbnail/data/43/c9/43c9463958421a9c85c56e26fdcf2bcc3b1223db20407015528bb4d7888cd840.jpg',
      'https://img.coomer.st/thumbnail/data/44/3c/443c4163aff8edab7b3eb5e43bc7576ada3055ab92b1c4bcaeaba9b780b39f5b.jpg',
      'https://img.coomer.st/thumbnail/data/50/8f/508f176ed72f617cd8edd5cf313243c28fbcd790c9e156ee8878106dfd546f8b.jpg',
      'https://img.coomer.st/thumbnail/data/51/66/51660051ce257113706f528e3a03853d2d2415079b39de911236409903543646.jpg',
      'https://img.coomer.st/thumbnail/data/52/08/52082f335d50733ab38e68b7da0a9d7eaac7f58e518713e0aa64a6c88321e3a3.jpg',
      'https://img.coomer.st/thumbnail/data/53/6e/536e0dc7c3ce8cb9d1765dc9e810ad44dfffead080b4b42245986e071e121881.jpg',
      'https://img.coomer.st/thumbnail/data/58/56/5856c57f5513e3f8af37477c2044bdb5641c3ad421efba275a96a16e1f37c554.jpg',
      'https://img.coomer.st/thumbnail/data/5b/3c/5b3cc279f804b8c868060b530ada435840034a93fe53ea0d43ebb5de94bca8ed.jpg',
      'https://img.coomer.st/thumbnail/data/5c/3c/5c3c959de7d96d26964f7e2ed70a99dcee203d85bd4f6d2c66a2a56b3ae87411.jpg',
      'https://img.coomer.st/thumbnail/data/62/27/6227239bb3a61ce814e5040614194a45bebf0a9354f40f9daa0d7316771cfe83.jpg',
      'https://img.coomer.st/thumbnail/data/64/52/64525ab36e0a96521db7d5153390e76a25f1c4395ad2a14d6b664618f7f3155f.jpg',
      'https://img.coomer.st/thumbnail/data/66/21/6621dd1aff1f662c8685a93c506e84e71110fd4586242a5daf214869f372f5ad.jpg',
      'https://img.coomer.st/thumbnail/data/71/f4/71f40eb115732dcd6f19d19f1c1b4ee453672494aac2d926645b9e9b71a42ebd.jpg',
      'https://img.coomer.st/thumbnail/data/75/d6/75d6b59c29ae2fa7ef3b7d18c91b4ae8a6372d52098ae90e1e8bc2cd60baaf03.jpg',
      'https://img.coomer.st/thumbnail/data/7e/c2/7ec2115f359c3a274329075411e069f444d60bb743bd9ec536885fe7df5a4a25.jpg',
      'https://img.coomer.st/thumbnail/data/81/5b/815b2fcbc3c61e92bc82721c4623dae81ac5e80844097a74dfe883b75b95291b.jpg',
      'https://img.coomer.st/thumbnail/data/97/e8/97e8a92eb0cf2dac58550db29c12d9f3f1f78542980fe2cbdbc264ae91de21f1.jpg',
      'https://img.coomer.st/thumbnail/data/9c/b0/9cb04191fa0eea53dba920ee58f2cc55d5ea742f1e77cdc3a80e07840e4ed3d9.jpg',
      'https://img.coomer.st/thumbnail/data/9f/76/9f76952afd26c0841b525f4925109033189fc655d1d8a9f6c00913a77fdd720e.jpg',
      'https://img.coomer.st/thumbnail/data/a1/78/a178bae4f80d671fd326813f6a0ec914d966863d51fc836b27f7355d044b1e4b.jpg',
      'https://img.coomer.st/thumbnail/data/a3/5c/a35c052437d8f9c0b7c2dbe45eb21cbd7b2385b6ee0e932bba5de131a58e6775.jpg',
      'https://img.coomer.st/thumbnail/data/a7/c8/a7c85fd6d897b8b6d9471cc4089849b080fc498486cb2646fdd804ec787b227d.jpg',
      'https://img.coomer.st/thumbnail/data/b4/60/b460fd65069fea245928420f0d265cc54f4d6d5161880d8289e6f1f63362bd65.jpg',
      'https://img.coomer.st/thumbnail/data/ba/0a/ba0a523966b715ba193c7e1d6885eb42ddf9d5fda06850cc6b634e2a307a4c1d.jpg',
      'https://img.coomer.st/thumbnail/data/c8/bc/c8bc5892f23cd57ba310ced9fd8d584990975309ffddd9360501aabd8c6a4351.jpg',
      'https://img.coomer.st/thumbnail/data/de/72/de727f875389a322646759815eed74c437284d09158bdf739c66f4551d591519.jpg',
      'https://img.coomer.st/thumbnail/data/e4/ca/e4caf8d13fd7966f22d4c093e899addf0a7eb935d7e486550205e3837b8b1ff9.jpg',
      'https://img.coomer.st/thumbnail/data/e7/1c/e71cba541549aadf678705272641a4f35907fc31b115ae69f554f15c8a6e21bb.jpg',
      'https://img.coomer.st/thumbnail/data/eb/5f/eb5f31b9e7af8cc6f48541d5e2830fbc6199f136dcab69db05d5d8a14c08b214.jpg'
    ];

    let imageCount = 0;
    for (let i = 0; i < galleryImages.length; i++) {
      await db.insert(schema.profileImages).values({
        profileId: profile.id,
        imageUrl: galleryImages[i],
        isMainImage: i === 0,
        order: i.toString()
      });
      imageCount++;
    }

    // Create admin user
    const { eq } = await import('drizzle-orm');
    const adminExists = await db.select().from(schema.users).where(
      eq(schema.users.email, "admin@creatorhub.test")
    ).limit(1);

    if (adminExists.length === 0) {
      await db.insert(schema.users).values({
        id: "admin-test-user",
        email: "admin@creatorhub.test",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      });
      console.log('✅ Created admin user');
    }

    console.log(`✅ Successfully seeded database with 1 profile and ${imageCount} images`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    // Don't fail the build, just log the error
    console.log('⚠️ Continuing build despite seeding error');
  } finally {
    await pool.end();
  }
}

seedProduction();