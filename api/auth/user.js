export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // For Vercel deployment, return unauthorized since Replit Auth won't work
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}