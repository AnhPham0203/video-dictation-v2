const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, target_language = 'vi', source_language = null } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!text) {
    return res.status(400).json({ error: 'Missing "text" in request body' });
  }

  if (!apiKey) {
    console.error('GOOGLE_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server configuration error: Missing API key.' });
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  try {
    const response = await axios.post(url, {
      q: text,
      target: target_language,
      ...(source_language && { source: source_language }),
      format: 'text',
    });

    const translation = response.data?.data?.translations?.[0]?.translatedText || '';
    return res.status(200).json({ translation });

  } catch (error) {
    console.error('Google Translate API error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to translate text.', 
      details: error.response?.data?.error?.message || 'Unknown error' 
    });
  }
};
