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
    let formattedMessages;
    if (provider === 'anthropic') {
      // Properly format system and user messages for Anthropic
      formattedMessages = req.body.messages.map(msg => ({
        role: msg.role === 'system' ? 'assistant' : 'user',
        content: msg.content
      }));
    } else {
      formattedMessages = req.body.messages;
    }

    // Add structured context to the prompt
    const requestBody = provider === 'anthropic' ? {
      model: req.body.model.replace('claude-3-', 'claude-3-'),
      messages: [{
        role: 'system',
        content: "You are an expert problem-solving assistant that carefully considers all provided context including stakeholders, root causes, and impact assessments to generate unique solutions and insights."
      }, ...formattedMessages.map(msg => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
      }))],
      max_tokens: req.body.max_tokens || 4000,
      temperature: 0.7
    } : {
      model: req.body.model || 'gpt-4',
      messages: formattedMessages,
      temperature: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
      max_tokens: req.body.max_tokens || 4000
    };

    console.log('Making API request with:', {
      url: apiUrl,
      model: requestBody.model,
      contextLength: JSON.stringify(requestBody).length
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      
      // If Anthropic fails due to credits, fallback to OpenAI
      if (provider === 'anthropic' && data.error?.message?.includes('credit balance')) {
        console.log('Falling back to OpenAI GPT-4...');
        req.body.provider = 'openai';
        req.body.model = 'gpt-4';
        return await handleAPIRequest(req, res);
      }
      
      return res.status(response.status).json({
        error: data.error || 'API request failed',
        detail: data.error?.message || data.error?.type || 'Unknown error'
      });
    }
    
    // Transform Anthropic response to match OpenAI format
    if (provider === 'anthropic' && data.content) {
      return res.json({
        choices: [{
          message: {
            content: data.content
          }
        }]
      });
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