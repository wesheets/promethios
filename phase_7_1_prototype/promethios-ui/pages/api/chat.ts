import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider, model, message, agentName, agentDescription, attachments } = req.body;

    if (!provider || !message) {
      return res.status(400).json({ error: 'Provider and message are required' });
    }

    let response;
    let apiKey;

    // Get API key from environment variables
    switch (provider.toLowerCase()) {
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OpenAI API key not configured');
        }

        const openaiMessages = [
          {
            role: 'system',
            content: `You are ${agentName}. ${agentDescription}. You have access to tools and can process file attachments.`
          },
          {
            role: 'user',
            content: message
          }
        ];

        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || 'gpt-3.5-turbo',
            messages: openaiMessages,
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
        }

        const openaiData = await response.json();
        return res.status(200).json({ 
          response: openaiData.choices[0]?.message?.content || 'No response received' 
        });

      case 'anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new Error('Anthropic API key not configured');
        }

        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model || 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: `You are ${agentName}. ${agentDescription}. You have access to tools and can process file attachments.\n\nUser message: ${message}`
              }
            ]
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Anthropic API error: ${response.status} ${errorData}`);
        }

        const anthropicData = await response.json();
        return res.status(200).json({ 
          response: anthropicData.content[0]?.text || 'No response received' 
        });

      case 'cohere':
        apiKey = process.env.COHERE_API_KEY;
        if (!apiKey) {
          throw new Error('Cohere API key not configured');
        }

        response = await fetch('https://api.cohere.ai/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || 'command',
            prompt: `You are ${agentName}. ${agentDescription}.\n\nUser: ${message}\nAssistant:`,
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Cohere API error: ${response.status} ${errorData}`);
        }

        const cohereData = await response.json();
        return res.status(200).json({ 
          response: cohereData.generations[0]?.text || 'No response received' 
        });

      case 'huggingface':
        apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) {
          throw new Error('Hugging Face API key not configured');
        }

        const hfModel = model || 'microsoft/DialoGPT-medium';
        response = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            inputs: `You are ${agentName}. ${agentDescription}.\n\nUser: ${message}\nAssistant:`
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Hugging Face API error: ${response.status} ${errorData}`);
        }

        const hfData = await response.json();
        return res.status(200).json({ 
          response: hfData[0]?.generated_text || hfData.generated_text || 'No response received' 
        });

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

