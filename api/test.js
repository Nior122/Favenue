export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ 
    message: 'Dynamic API is working!', 
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless'
  });
}