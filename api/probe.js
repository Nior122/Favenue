export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'missing url parameter' });
    }

    console.log(`🔍 Probing URL: ${url}`);

    // Test HEAD request to the URL
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': 'https://twitter.com/',
      }
    });

    // Collect headers
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const result = {
      url: url,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: headers,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    };

    console.log(`✅ Probe result:`, result);

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Probe error:', error);
    
    const errorResult = {
      url: req.query.url,
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json(errorResult);
  }
}