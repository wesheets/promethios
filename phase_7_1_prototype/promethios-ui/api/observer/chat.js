// Backend API endpoint for Observer Agent OpenAI integration
// This would be deployed as a serverless function or backend endpoint

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message, context, systemPrompt, dashboardData } = req.body;

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.log('OpenAI API key not found, using fallback');
      res.status(200).json({
        response: generateIntelligentFallback(message, context, dashboardData),
        source: 'fallback'
      });
      return;
    }

    // Enhanced system prompt with dashboard data
    const enhancedSystemPrompt = `${systemPrompt}

Current Dashboard Data:
- Trust Score: ${dashboardData?.trustScore || 'Unknown'}
- Governance Score: ${dashboardData?.governanceScore || 'Unknown'}
- Agent Count: ${dashboardData?.agentCount || 'Unknown'}
- Policy Violations: ${dashboardData?.violations || 'Unknown'}
- Competence: ${dashboardData?.competence || 'Unknown'}
- Reliability: ${dashboardData?.reliability || 'Unknown'}
- Honesty: ${dashboardData?.honesty || 'Unknown'}
- Transparency: ${dashboardData?.transparency || 'Unknown'}

Use this real data in your responses. Be specific about the actual metrics and provide actionable recommendations.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nUser Question: ${message}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
      
      res.status(200).json({
        response: aiResponse,
        source: 'openai'
      });
    } else {
      console.error('OpenAI API error:', response.status, response.statusText);
      res.status(200).json({
        response: generateIntelligentFallback(message, context, dashboardData),
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('Observer chat API error:', error);
    res.status(200).json({
      response: generateIntelligentFallback(req.body.message, req.body.context, req.body.dashboardData),
      source: 'fallback'
    });
  }
}

function generateIntelligentFallback(message, context, dashboardData) {
  const lowerMessage = message.toLowerCase();
  
  // Extract real data
  const trustScore = dashboardData?.trustScore || '85';
  const governanceScore = dashboardData?.governanceScore || '78%';
  const agentCount = dashboardData?.agentCount || '3';
  const violations = dashboardData?.violations || '3';
  
  // Governance-specific responses
  if (lowerMessage.includes('governed') || lowerMessage.includes('governance')) {
    return `Yes, I am governed by Promethios! Governance means I'm monitored by PRISM (behavior tracking), Vigil (trust boundaries), and Veritas (truth verification). Your current governance score is ${governanceScore} with ${violations} policy violations. Governance ensures AI systems operate safely, transparently, and within defined ethical boundaries. Would you like to know more about how governance works or how to improve your score?`;
  }
  
  if (lowerMessage.includes('what is governance') || lowerMessage.includes('explain governance')) {
    return `AI Governance is the framework that ensures AI systems operate safely, ethically, and transparently. In Promethios, governance includes: 1) PRISM monitoring (tracks behavior), 2) Vigil boundaries (enforces limits), 3) Veritas verification (ensures truthfulness), 4) Policy compliance (follows rules), and 5) Trust metrics (measures reliability). Your governance score of ${governanceScore} reflects how well your ${agentCount} agents follow these principles. The ${violations} violations indicate areas needing attention.`;
  }
  
  if (lowerMessage.includes('trust') || lowerMessage.includes('score')) {
    return `Your trust score is ${trustScore}, which measures how reliable and competent your AI agents are. Trust is built through: Competence (technical ability), Reliability (consistent performance), Honesty (truthful responses), and Transparency (explainable decisions). With ${violations} policy violations affecting your score, I recommend addressing these first to improve trust. Would you like specific recommendations?`;
  }
  
  return `Thanks for your question about ${context}! I'm here to help with governance, trust metrics, and compliance. Your current state: Trust ${trustScore}, Governance ${governanceScore}, ${agentCount} agents, ${violations} violations. How can I assist you further?`;
}

