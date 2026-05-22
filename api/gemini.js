import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Add CORS headers for local development if needed, though Vercel handles this in prod
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    // Use the backend-only environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key configuration error. Please check GEMINI_API_KEY in Vercel settings.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;
    let retries = 3;
    let lastError = null;

    // Retry loop for rate limits and flakes
    while (retries > 0) {
      try {
        result = await model.generateContent(prompt);
        break; // Success
      } catch (err) {
        lastError = err;
        retries--;
        if (retries === 0) break;
        // Wait 2 seconds before retrying
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!result) {
      throw lastError;
    }

    const text = result.response.text();
    return res.status(200).json({ text });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Return a structured error
    return res.status(500).json({ 
      error: error.message || 'An unexpected error occurred during AI generation' 
    });
  }
}
