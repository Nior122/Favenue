export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length, Content-Type');
    return res.status(204).end();
  }

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

    // Handle range requests for video seeking
    const range = req.headers.range;
    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Referer': 'https://twitter.com/',
      'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Sec-Fetch-Dest': 'video',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    // Add range header if present for video seeking
    if (range) {
      requestHeaders['Range'] = range;
    }

    // Fetch the video from Twitter
    const response = await fetch(videoUrl, {
      headers: requestHeaders
    });

    if (!response.ok) {
      console.error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: "Failed to fetch video" });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length, Content-Type');
    
    // Set video headers
    const contentType = response.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Copy essential headers from Twitter's response
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    // Handle partial content responses (206) for range requests
    if (response.status === 206) {
      res.status(206);
    }

    // For Vercel compatibility, convert response to buffer and send
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Handle client-side range requests if server didn't handle them
    if (range && response.status !== 206 && buffer.length > 0) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
      const chunkSize = (end - start) + 1;
      
      res.setHeader('Content-Range', `bytes ${start}-${end}/${buffer.length}`);
      res.setHeader('Content-Length', chunkSize);
      res.status(206);
      
      return res.end(buffer.slice(start, end + 1));
    }

    // Send the complete video buffer
    res.end(buffer);

  } catch (error) {
    console.error("Error proxying video:", error);
    res.status(500).json({ error: "Failed to proxy video", details: error.message });
  }
}