import { storage } from './storage';
import { nanoid } from 'nanoid';

export async function seedDatabase() {
  // Check if data already exists
  const existingProfiles = await storage.getProfiles({ limit: 1 });
  if (existingProfiles.length > 0) {
    console.log('Storage already has data, skipping seed.');
    return;
  }

  console.log('Seeding storage with sample profiles...');

  // Sample profile data
  const sampleProfiles = [
    {
      name: 'Sophia Belle',
      title: 'Premium Content Creator',
      category: 'Solo',
      location: 'Miami',
      description: 'Exclusive premium content creator specializing in intimate solo performances and personalized experiences. Available for custom content and live sessions.',
      rating: '4.9',
      reviewCount: '1247',
      tags: ['Solo Performance', 'Custom Content', 'Live Sessions', 'Interactive'],
      isActive: true
    },
    {
      name: 'Isabella Rose',
      title: 'Fetish & BDSM Specialist',
      category: 'Fetish',
      location: 'Los Angeles',
      description: 'Professional dominatrix and fetish content creator. Specializing in BDSM, roleplay scenarios, and educational content about kink practices.',
      rating: '4.8',
      reviewCount: '892',
      tags: ['BDSM', 'Domination', 'Roleplay', 'Fetish Education', 'Kink'],
      isActive: true
    },
    {
      name: 'Mia & Jake',
      title: 'Couple Content Creators',
      category: 'Couples',
      location: 'Las Vegas',
      description: 'Real couple sharing authentic intimate moments and couple experiences. We create content that celebrates genuine connection and passion.',
      rating: '4.7',
      reviewCount: '1566',
      tags: ['Couples Content', 'Authentic', 'Intimate Moments', 'Real Chemistry'],
      isActive: true
    },
    {
      name: 'Alexandra Wilde',
      title: 'Cam Model & Performer',
      category: 'Cam Shows',
      location: 'New York',
      description: 'Professional cam model with interactive live shows. Known for engaging performances and building genuine connections with fans.',
      rating: '4.6',
      reviewCount: '2143',
      tags: ['Live Cam Shows', 'Interactive', 'Fan Connection', 'Performance'],
      isActive: true
    },
    {
      name: 'Luna Garcia',
      title: 'Latina Content Creator',
      category: 'Ethnic',
      location: 'Miami',
      description: 'Passionate Latina content creator bringing authentic cultural sensuality and exotic appeal to premium adult entertainment.',
      rating: '4.8',
      reviewCount: '1801',
      tags: ['Latina', 'Exotic', 'Cultural', 'Sensual', 'Passionate'],
      isActive: true
    },
    {
      name: 'Raven Black',
      title: 'Alt/Gothic Model',
      category: 'Alternative',
      location: 'Portland',
      description: 'Alternative lifestyle content creator specializing in gothic aesthetics, tattooed beauty, and alternative culture representation.',
      rating: '4.9',
      reviewCount: '756',
      tags: ['Gothic', 'Tattooed', 'Alternative', 'Unique Style', 'Subculture'],
      isActive: true
    },
    {
      name: 'Victoria Luxe',
      title: 'Luxury Lifestyle Model',
      category: 'Luxury',
      location: 'Monaco',
      description: 'High-end luxury content creator offering exclusive experiences and premium lifestyle content for discerning clientele.',
      rating: '4.5',
      reviewCount: '423',
      tags: ['Luxury', 'Exclusive', 'High-end', 'Premium Experience', 'Elite'],
      isActive: true
    },
    {
      name: 'Cherry Blush',
      title: 'Girl-Next-Door Content',
      category: 'Amateur',
      location: 'Austin',
      description: 'Sweet and authentic girl-next-door creating genuine, down-to-earth content that feels personal and intimate.',
      rating: '4.7',
      reviewCount: '1334',
      tags: ['Girl Next Door', 'Authentic', 'Sweet', 'Personal', 'Genuine'],
      isActive: true
    }
  ];

  // Insert profiles
  const createdProfiles = [];
  for (const profileData of sampleProfiles) {
    const { id, ...profileWithoutId } = profileData;
    const profile = await storage.createProfile(profileWithoutId);
    createdProfiles.push(profile);
  }

  // Sample images for profiles (using placeholder URLs)
  let imageCount = 0;
  for (const profile of createdProfiles) {
    // Add 2-4 images per profile
    const imagesPerProfile = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < imagesPerProfile; i++) {
      await storage.addProfileImage({
        profileId: profile.id,
        imageUrl: `https://picsum.photos/400/300?random=${profile.id}-${i}`,
        isMainImage: i === 0,
        order: i.toString()
      });
      imageCount++;
    }
  }

  console.log(`Seeded storage with ${createdProfiles.length} profiles and ${imageCount} images.`);
}