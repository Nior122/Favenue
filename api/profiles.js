import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Schema definitions for serverless functions
const profilesTable = {
  id: 'id',
  name: 'name',
  title: 'title',
  category: 'category',
  location: 'location',
  description: 'description',
  profilePictureUrl: 'profile_picture_url',
  coverPhotoUrl: 'cover_photo_url',
  rating: 'rating',
  reviewCount: 'review_count',
  likesCount: 'likes_count',
  mediaCount: 'media_count',
  viewsCount: 'views_count',
  subscribersCount: 'subscribers_count',
  tags: 'tags',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const profileImagesTable = {
  id: 'id',
  profileId: 'profile_id', 
  imageUrl: 'image_url',
  isMainImage: 'is_main_image',
  order: 'order',
  createdAt: 'created_at'
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ 
      message: 'Database not configured',
      profiles: [] 
    });
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });

    if (req.method === 'GET') {
      // Get all profiles with their images
      const profiles = await db.execute(`
        SELECT 
          p.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pi.id,
                'imageUrl', pi.image_url,
                'isMainImage', pi.is_main_image,
                'order', pi."order"
              ) ORDER BY pi."order"::int
            ) FILTER (WHERE pi.id IS NOT NULL), 
            '[]'::json
          ) as images
        FROM profiles p
        LEFT JOIN profile_images pi ON p.id = pi.profile_id
        WHERE p.is_active = true
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `);

      await pool.end();
      return res.status(200).json(profiles.rows || []);
    }

    await pool.end();
    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      profiles: []
    });
  }
}