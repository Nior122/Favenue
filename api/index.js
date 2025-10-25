// Vercel serverless function wrapper for Express backend
import express from 'express';
import { dbStorage } from '../dist/dbStorage.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// API Routes
app.get('/api/profiles', async (req, res) => {
  try {
    const { category, location, search, limit, offset } = req.query;
    const profiles = await dbStorage.getProfiles({
      category: category,
      location: location,
      search: search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await dbStorage.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/api/auth/user', async (req, res) => {
  // Return unauthorized for serverless deployment (no session support)
  return res.status(401).json({ message: 'Unauthorized' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Export for Vercel
export default app;
