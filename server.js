// Simple Express server for Replit
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 5000;

// Handle CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Make environment variables available to client-side
app.get('/api/config', (req, res) => {
  // Only expose the API key format, not the actual key
  const apiKeyHint = process.env.OPENAI_API_KEY 
    ? `${process.env.OPENAI_API_KEY.substring(0, 3)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` 
    : null;
    
  res.json({
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    apiKeyHint,
    model: process.env.OPENAI_MODEL || 'gpt-4o'
  });
});

// Proxy for OpenAI API requests to avoid CORS issues
app.use(express.json());

app.post('/api/openai', async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    return res.json(data);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`OpenAI API key configured: ${!!process.env.OPENAI_API_KEY}`);
});