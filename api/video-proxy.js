import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const videoUrl = req.query.url;
    
    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL is required" });
    }

    // Only allow Twitter video URLs for security
    if (!videoUrl.includes('video.twimg.com')) {
      return res.status(403).json({ error: "Only Twitter video URLs are allowed" });
    }

    console.log(`🎥 Proxying video: ${videoUrl}`);

    // Fetch the video from Twitter
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://twitter.com/',
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: "Failed to fetch video" });
    }

    // Set appropriate headers for video streaming
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Set Content-Length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Handle range requests for video seeking
    const range = req.headers.range;
    if (range && contentLength) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : parseInt(contentLength) - 1;
      const chunksize = (end - start) + 1;
      
      res.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
      res.setHeader('Content-Length', chunksize);
      res.status(206);
    }

    // Stream the video data
    response.body.pipe(res);

  } catch (error) {
    console.error("Error proxying video:", error);
    res.status(500).json({ error: "Failed to proxy video" });
  }
}