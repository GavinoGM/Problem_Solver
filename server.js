// Simple Express server for Replit
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

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
  const provider = req.body.provider || 'openai';
  const apiKey = provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
  
  console.log('Processing request with full context:', {
    model: req.body.model,
    provider,
    hasStakeholders: req.body.messages[1].content.includes('Stakeholders:'),
    hasRootCauses: req.body.messages[1].content.includes('Root Causes:'),
    hasImpact: req.body.messages[1].content.includes('Impact Assessment:')
  });
  
  if (!apiKey) {
    return res.status(500).json({ error: `${provider.toUpperCase()} API key not configured` });
  }

  try {
    const apiUrl = provider === 'anthropic' 
      ? 'https://api.anthropic.com/v1/messages'
      : 'https://api.openai.com/v1/chat/completions';
      
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Add Anthropic specific headers
    if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    // Format messages differently for each provider
    const formattedMessages = provider === 'anthropic' ? 
      req.body.messages.map(msg => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
      })) :
      req.body.messages;

    // Add structured context to the prompt
    const requestBody = provider === 'anthropic' ? {
      model: req.body.model,
      messages: formattedMessages,
      max_tokens: req.body.max_tokens,
      temperature: 0.7
    } : {
      ...req.body,
      temperature: 0.7
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
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
  console.log(`Anthropic API key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
});