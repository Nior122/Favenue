import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

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
      message: 'Database not configured'
    });
  }

  const { id } = req.query;

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });

    if (req.method === 'GET') {
      // Get single profile with images
      const result = await db.execute(`
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
        WHERE p.id = $1 AND p.is_active = true
        GROUP BY p.id
      `, [id]);

      await pool.end();
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    await pool.end();
    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
}