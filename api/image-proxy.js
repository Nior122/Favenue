export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Only allow Twitter image URLs for security
    if (!imageUrl.includes('pbs.twimg.com')) {
      return res.status(403).json({ error: "Only Twitter image URLs are allowed" });
    }

    console.log(`🖼️ Proxying image: ${imageUrl}`);

    // Fetch the image from Twitter using native fetch
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://twitter.com/',
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: "Failed to fetch image" });
    }

    // Get the response as an array buffer for Vercel compatibility
    const imageBuffer = await response.arrayBuffer();
    const imageData = Buffer.from(imageBuffer);

    // Set appropriate headers for image
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('Content-Length', imageData.length);

    // Send the image data
    res.send(imageData);

  } catch (error) {
    console.error("Error proxying image:", error);
    res.status(500).json({ error: "Failed to proxy image" });
  }
}