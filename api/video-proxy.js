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

    // Add range header if present
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
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Handle partial content responses for range requests
    if (response.status === 206) {
      res.status(206);
      if (response.headers.get('content-range')) {
        res.setHeader('Content-Range', response.headers.get('content-range'));
      }
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length'));
      }
    } else {
      // For non-range requests, set content length
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length'));
      }
    }

    // Stream the video data to the response
    const reader = response.body.getReader();
    
    // Handle streaming
    const stream = new ReadableStream({
      start(controller) {
        function pump() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }
        return pump();
      }
    });

    // For Vercel, we need to convert the stream to buffer
    const videoBuffer = await response.arrayBuffer();
    const videoData = Buffer.from(videoBuffer);

    // Handle range requests properly
    if (range && response.status !== 206) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : videoData.length - 1;
      const chunksize = (end - start) + 1;
      
      res.setHeader('Content-Range', `bytes ${start}-${end}/${videoData.length}`);
      res.setHeader('Content-Length', chunksize);
      res.status(206);
      
      // Send the requested chunk
      return res.send(videoData.slice(start, end + 1));
    }

    // Send the complete video
    res.send(videoData);

  } catch (error) {
    console.error("Error proxying video:", error);
    res.status(500).json({ error: "Failed to proxy video", details: error.message });
  }
}