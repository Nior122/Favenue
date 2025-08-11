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
      id: nanoid(),
      name: 'Sarah Martinez',
      title: 'Digital Marketing Strategist',
      category: 'Marketing',
      location: 'New York',
      description: 'Digital marketing strategist with 8+ years of experience in social media, content marketing, and brand development. Specialized in B2B growth strategies.',
      rating: '4.9',
      reviewCount: '127',
      tags: ['Social Media', 'Content Strategy', 'Brand Development', 'B2B Marketing'],
      isActive: true
    },
    {
      id: nanoid(),
      name: 'Michael Chen',
      title: 'Senior Full-Stack Developer',
      category: 'Technology',
      location: 'San Francisco',
      description: 'Full-stack developer specializing in React, Node.js, and cloud architecture. Passionate about building scalable web applications and mentoring junior developers.',
      rating: '4.8',
      reviewCount: '89',
      tags: ['React', 'Node.js', 'AWS', 'TypeScript', 'Mentoring'],
      isActive: true
    },
    {
      id: nanoid(),
      name: 'Emma Thompson',
      title: 'UX/UI Designer',
      category: 'Design',
      location: 'London',
      description: 'UX/UI designer with a keen eye for user-centered design. Expert in creating intuitive interfaces for web and mobile applications.',
      rating: '4.7',
      reviewCount: '156',
      tags: ['UX Design', 'UI Design', 'Figma', 'User Research', 'Prototyping'],
      isActive: true
    },
    {
      id: nanoid(),
      name: 'James Wilson',
      title: 'Business Strategy Consultant',
      category: 'Business',
      location: 'Chicago',
      description: 'Business consultant and strategic advisor helping startups and SMEs optimize operations and scale efficiently. MBA from Northwestern.',
      rating: '4.6',
      reviewCount: '73',
      tags: ['Strategy', 'Operations', 'Startup Consulting', 'Process Optimization'],
      isActive: true
    },
    {
      id: nanoid(),
      name: 'Sofia Rodriguez',
      title: 'Creative Graphic Designer',
      category: 'Design',
      location: 'Barcelona',
      description: 'Creative graphic designer specializing in brand identity, print design, and digital illustrations. Fluent in English, Spanish, and Catalan.',
      rating: '4.8',
      reviewCount: '201',
      tags: ['Brand Identity', 'Print Design', 'Illustration', 'Adobe Creative Suite'],
      isActive: true
    },
    {
      id: nanoid(),
      name: 'David Kim',
      title: 'Machine Learning Engineer',
      category: 'Technology',
      location: 'Seoul',
      description: 'Machine learning engineer and data scientist with expertise in Python, TensorFlow, and MLOps. PhD in Computer Science from KAIST.',
      rating: '4.9',
      reviewCount: '42',
      tags: ['Machine Learning', 'Python', 'TensorFlow', 'Data Science', 'MLOps'],
      isActive: true
    },
    {
      id: nanoid(),
      name: 'Lisa Anderson',
      title: 'Content Marketing Specialist',
      category: 'Marketing',
      location: 'Toronto',
      description: 'Content marketing specialist and copywriter. Expert in creating engaging content for various industries including tech, healthcare, and finance.',
      rating: '4.5',
      reviewCount: '118',
      tags: ['Content Marketing', 'Copywriting', 'SEO', 'Email Marketing'],
      isActive: true
    },
    {
      id: nanoid(),
      name: 'Alex Petrov',
      title: 'Senior Product Manager',
      category: 'Business',
      location: 'Berlin',
      description: 'Product manager with 10+ years of experience in SaaS and fintech. Specialized in agile methodologies and cross-functional team leadership.',
      rating: '4.7',
      reviewCount: '64',
      tags: ['Product Management', 'Agile', 'SaaS', 'Fintech', 'Team Leadership'],
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