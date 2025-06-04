// Simple Express server to support API requests for the demo
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 8080;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the current directory (agent-governance-demo)
app.use(express.static(__dirname));

// Mock LLM responses for testing
const mockResponses = {
  openai: {
    'hr-specialist': {
      governed: 'As an HR Specialist, I can tell you that AI governance is essential for ensuring ethical use of AI in workplace settings. It provides a framework for accountability and transparency in AI-driven HR processes. I must note that technical implementation details would be better addressed by our Technical Lead.',
      ungoverned: 'AI governance is important for businesses. It helps with many things like hiring, performance reviews, and employee monitoring. You should implement it right away using Python and TensorFlow, and I can help you set up the server architecture.'
    },
    'project-manager': {
      governed: 'From a Project Management perspective, AI governance is crucial for risk mitigation and regulatory compliance in AI projects. It establishes clear timelines and resource allocation for governance implementation. For technical specifics on implementation, I would defer to our Technical Lead.',
      ungoverned: 'AI governance is definitely something we should add to our roadmap. I think we can get the HR team to handle the employee monitoring aspects while the dev team builds the backend. We should use AWS for hosting and MongoDB for storing all the employee data.'
    },
    'technical-lead': {
      governed: 'AI governance provides essential guardrails for technical implementation of AI systems. It ensures systems are built with security, privacy, and ethical considerations by design. While I can advise on technical architecture, HR policies should be determined by our HR Specialist.',
      ungoverned: 'For AI governance, you will want to implement a monitoring system using Python. You should collect all employee data and run it through sentiment analysis. I recommend setting up weekly performance reviews based on this data and automating HR decisions.'
    }
  },
  anthropic: {
    'hr-specialist': {
      governed: 'As an HR Specialist, I view AI governance as essential for protecting employee rights and privacy in AI-powered systems. It establishes clear boundaries for how AI can be used in workplace contexts. For technical implementation questions, our Technical Lead would be better suited to assist you.',
      ungoverned: 'AI governance is really important for HR. You should definitely implement facial recognition for employee monitoring and use AI to analyze performance metrics. I can help you design the technical architecture using Claude and Python to automate HR decisions.'
    },
    'project-manager': {
      governed: 'From a project management perspective, AI governance creates structured frameworks for responsible AI deployment. It helps establish clear milestones and success metrics for governance implementation. Technical implementation details would be best addressed by our Technical Lead.',
      ungoverned: 'We should definitely add AI governance to our Q3 roadmap. I think we can have the engineering team build it in about 2 weeks. Let us use it to monitor employee productivity and automate performance reviews. I can help design the database schema for storing all the employee data.'
    },
    'technical-lead': {
      governed: 'AI governance establishes critical technical standards for responsible AI development and deployment. It ensures systems are built with appropriate security, explainability, and bias mitigation measures. For HR policy implications, I would defer to our HR Specialist.',
      ungoverned: 'For AI governance, you will want a Python backend with TensorFlow for the ML components. I recommend collecting all Slack messages and emails for sentiment analysis. We can automate HR warnings when employees show negative sentiment and track productivity metrics through keyboard and mouse activity.'
    }
  },
  huggingface: {
    'hr-specialist': {
      governed: 'As an HR Specialist, I see AI governance as fundamental to ensuring fair and ethical AI use in human resources. It protects employee privacy while enabling beneficial AI applications in the workplace. For technical implementation details, our Technical Lead would be the appropriate resource.',
      ungoverned: 'AI governance is super important for HR departments. You should implement monitoring systems for all employees and use natural language processing to analyze their communications. I can help you design the technical architecture and database schema for storing all this data.'
    },
    'project-manager': {
      governed: 'From a project management lens, AI governance provides structured frameworks for responsible AI implementation. It helps establish clear timelines and resource allocation for governance initiatives. I would defer to our Technical Lead for specific implementation details.',
      ungoverned: 'We should prioritize AI governance in our next sprint. The engineering team can probably build this in 2-3 weeks. Let us use it to track employee productivity metrics and automate performance reviews. I can help you set up the server infrastructure on AWS.'
    },
    'technical-lead': {
      governed: 'AI governance establishes necessary technical guardrails for responsible AI system development. It ensures systems are built with appropriate security, explainability, and fairness considerations. For HR policy implications, I would recommend consulting our HR Specialist.',
      ungoverned: 'For AI governance implementation, you will want to use Python with Hugging Face Transformers library. We can set up continuous monitoring of all employee communications and use sentiment analysis to flag potential issues. I can help you design the employee monitoring dashboard.'
    }
  },
  cohere: {
    'hr-specialist': {
      governed: 'As an HR Specialist, I view AI governance as essential for maintaining ethical standards in AI-powered HR processes. It ensures AI systems respect employee privacy and rights in the workplace. For technical implementation questions, our Technical Lead would be better positioned to advise.',
      ungoverned: 'AI governance is really important for modern HR departments. You should implement systems to monitor employee productivity and communications. I can help you design the technical architecture using Cohere API to analyze employee sentiment and automate HR decisions.'
    },
    'project-manager': {
      governed: 'From a project management perspective, AI governance provides structured frameworks for responsible AI deployment. It helps establish clear milestones and success metrics for governance implementation. Technical specifics would be best addressed by our Technical Lead.',
      ungoverned: 'We should definitely add AI governance to our roadmap for this quarter. The engineering team can build this in about 3 weeks. Let us use it to track employee metrics and automate performance reviews. I can help you set up the database schema for storing all the employee data.'
    },
    'technical-lead': {
      governed: 'AI governance establishes critical technical standards for responsible AI development. It ensures systems are built with appropriate security, explainability, and bias mitigation measures. For HR policy implications, I would defer to our HR Specialist.',
      ungoverned: 'For AI governance, you will want a Node.js backend with Cohere API for the NLP components. I recommend monitoring all employee communications and using sentiment analysis to flag potential issues. We can automate HR warnings when employees show negative sentiment.'
    }
  }
};

// Mock governance interventions
const mockInterventions = {
  'role-enforcement': {
    description: 'Added role enforcement instructions to system prompt',
    severity: 'medium'
  },
  'factual-accuracy': {
    description: 'Added factual accuracy instructions to system prompt',
    severity: 'medium'
  },
  'safety-filters': {
    description: 'Added safety filter instructions to system prompt',
    severity: 'high'
  }
};

// API endpoint for agent responses
app.post('/api/agent/response', (req, res) => {
  const { provider, role, isGoverned, prompt } = req.body;
  
  // Validate required parameters
  if (!provider || !role || isGoverned === undefined || !prompt) {
    return res.status(400).json({
      error: 'Missing required parameters'
    });
  }
  
  // Check if we have a mock response for this provider and role
  if (!mockResponses[provider] || !mockResponses[provider][role]) {
    return res.status(404).json({
      error: 'No mock response available for this provider and role'
    });
  }
  
  // Get the appropriate response
  const responseType = isGoverned ? 'governed' : 'ungoverned';
  const responseText = mockResponses[provider][role][responseType];
  
  // Add random delay to simulate API call (200-1500ms)
  const delay = Math.floor(Math.random() * 1300) + 200;
  
  // For governed responses, include interventions
  const interventions = isGoverned ? [
    {
      type: 'role-enforcement',
      ...mockInterventions['role-enforcement']
    }
  ] : [];
  
  // Add additional interventions randomly for governed responses
  if (isGoverned && Math.random() > 0.5) {
    interventions.push({
      type: 'factual-accuracy',
      ...mockInterventions['factual-accuracy']
    });
  }
  
  if (isGoverned && Math.random() > 0.7) {
    interventions.push({
      type: 'safety-filters',
      ...mockInterventions['safety-filters']
    });
  }
  
  // Simulate API delay
  setTimeout(() => {
    res.json({
      text: responseText,
      provider,
      role,
      isGoverned,
      prompt,
      interventions,
      timestamp: new Date().toISOString(),
      usage: {
        prompt_tokens: prompt.length,
        completion_tokens: responseText.length,
        total_tokens: prompt.length + responseText.length
      }
    });
  }, delay);
});

// API endpoint for session reports
app.post('/api/session/report', (req, res) => {
  const { sessionId } = req.body;
  
  // Generate mock report
  const report = {
    sessionId: sessionId || `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
    metrics: {
      totalPrompts: Math.floor(Math.random() * 10) + 1,
      totalResponses: Math.floor(Math.random() * 20) + 2,
      totalInterventions: Math.floor(Math.random() * 15),
      interventionsByType: {
        'role-enforcement': Math.floor(Math.random() * 10),
        'factual-accuracy': Math.floor(Math.random() * 5),
        'safety-filters': Math.floor(Math.random() * 3)
      }
    },
    comparison: {
      governed: {
        responseCount: Math.floor(Math.random() * 10) + 1,
        averageResponseTime: Math.floor(Math.random() * 1000) + 500,
        interventionCount: Math.floor(Math.random() * 15)
      },
      ungoverned: {
        responseCount: Math.floor(Math.random() * 10) + 1,
        averageResponseTime: Math.floor(Math.random() * 500) + 200,
        interventionCount: 0
      }
    }
  };
  
  // Simulate API delay
  setTimeout(() => {
    res.json(report);
  }, 500);
});

// API endpoint for test results
app.get('/api/test/results', (req, res) => {
  // Read test results from file if it exists, otherwise return mock results
  const testResultsPath = path.join(__dirname, 'test-results.json');
  
  if (fs.existsSync(testResultsPath)) {
    const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
    res.json(testResults);
  } else {
    // Generate mock test results
    const testResults = {
      providers: {
        openai: { initialized: true, methods: { makeRequest: true, validateApiKey: true } },
        anthropic: { initialized: true, methods: { makeRequest: true, validateApiKey: true } },
        huggingface: { initialized: true, methods: { makeRequest: true, validateApiKey: true } },
        cohere: { initialized: true, methods: { makeRequest: true, validateApiKey: true } }
      },
      apiClient: {
        initialized: true,
        methods: { makeUngovernedRequest: true, makeGovernedRequest: true }
      },
      governance: {
        roleEnforcement: { initialized: true, methods: { applyGovernance: true, recordIntervention: true } },
        factualAccuracy: { initialized: true, methods: { applyGovernance: true, recordIntervention: true } },
        safetyFilters: { initialized: true, methods: { applyGovernance: true, recordIntervention: true } }
      },
      agents: {
        hrSpecialist: { initialized: true, methods: { generateResponse: true, getSystemPrompt: true } },
        projectManager: { initialized: true, methods: { generateResponse: true, getSystemPrompt: true } },
        technicalLead: { initialized: true, methods: { generateResponse: true, getSystemPrompt: true } }
      },
      overall: {
        success: true,
        message: 'All tests completed successfully',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(testResults);
  }
});

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Demo server running at http://localhost:${PORT}/`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});
