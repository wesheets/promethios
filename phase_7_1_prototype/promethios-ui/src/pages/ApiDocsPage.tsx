import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Book, Zap, Shield, Key, Globe, Copy, Check, Play, ExternalLink } from 'lucide-react';

const ApiDocsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    python: {
      quickstart: `import promethios

# Initialize the client
client = promethios.Client(
    api_key="your_api_key",
    base_url="https://api.promethios.com"
)

# Create a governance policy
policy = client.policies.create({
    "name": "Healthcare HIPAA Compliance",
    "domain": "healthcare",
    "rules": [
        {
            "type": "content_filter",
            "pattern": "PHI_DETECTION",
            "action": "block"
        }
    ]
})

# Govern an AI response
result = client.govern.validate(
    content="Patient John Doe has diabetes",
    policy_id=policy.id
)

print(f"Trust Score: {result.trust_score}")
print(f"Violations: {result.violations}")`,
      
      memory: `# Memory API - Store and retrieve governance records
memory_record = client.memory.create({
    "source": "gpt-4",
    "record_type": "response",
    "content": {
        "prompt": "What is diabetes?",
        "response": "Diabetes is a metabolic disorder...",
        "trust_score": 0.95
    },
    "metadata": {
        "user_id": "user_123",
        "session_id": "session_456"
    }
})

# Retrieve memory records
records = client.memory.list(
    limit=10,
    query="diabetes"
)`,

      policy: `# Policy API - Manage governance policies
policy = client.policies.create({
    "name": "Financial SOX Compliance",
    "description": "Ensures compliance with Sarbanes-Oxley Act",
    "domain": "financial",
    "rules": [
        {
            "type": "bias_detection",
            "threshold": 0.8,
            "action": "flag"
        },
        {
            "type": "accuracy_check",
            "sources": ["sec.gov", "finra.org"],
            "action": "verify"
        }
    ]
})

# Update policy
updated_policy = client.policies.update(
    policy_id=policy.id,
    data={"version": "2.0"}
)`
    },
    javascript: {
      quickstart: `import { PrometheiosClient } from '@promethios/sdk';

// Initialize the client
const client = new PrometheiosClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.promethios.com'
});

// Create a governance policy
const policy = await client.policies.create({
  name: 'Healthcare HIPAA Compliance',
  domain: 'healthcare',
  rules: [
    {
      type: 'content_filter',
      pattern: 'PHI_DETECTION',
      action: 'block'
    }
  ]
});

// Govern an AI response
const result = await client.govern.validate({
  content: 'Patient John Doe has diabetes',
  policyId: policy.id
});

console.log(\`Trust Score: \${result.trustScore}\`);
console.log(\`Violations: \${result.violations}\`);`,

      memory: `// Memory API - Store and retrieve governance records
const memoryRecord = await client.memory.create({
  source: 'gpt-4',
  recordType: 'response',
  content: {
    prompt: 'What is diabetes?',
    response: 'Diabetes is a metabolic disorder...',
    trustScore: 0.95
  },
  metadata: {
    userId: 'user_123',
    sessionId: 'session_456'
  }
});

// Retrieve memory records
const records = await client.memory.list({
  limit: 10,
  query: 'diabetes'
});`,

      policy: `// Policy API - Manage governance policies
const policy = await client.policies.create({
  name: 'Financial SOX Compliance',
  description: 'Ensures compliance with Sarbanes-Oxley Act',
  domain: 'financial',
  rules: [
    {
      type: 'bias_detection',
      threshold: 0.8,
      action: 'flag'
    },
    {
      type: 'accuracy_check',
      sources: ['sec.gov', 'finra.org'],
      action: 'verify'
    }
  ]
});

// Update policy
const updatedPolicy = await client.policies.update(policy.id, {
  version: '2.0'
});`
    },
    curl: {
      quickstart: `# Authentication
curl -X POST https://api.promethios.com/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "your_api_key",
    "api_secret": "your_api_secret"
  }'

# Create a governance policy
curl -X POST https://api.promethios.com/policy \\
  -H "Authorization: Bearer your_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Healthcare HIPAA Compliance",
    "domain": "healthcare",
    "rules": [
      {
        "type": "content_filter",
        "pattern": "PHI_DETECTION",
        "action": "block"
      }
    ]
  }'

# Govern an AI response
curl -X POST https://api.promethios.com/govern/validate \\
  -H "Authorization: Bearer your_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Patient John Doe has diabetes",
    "policy_id": "policy_123"
  }'`,

      memory: `# Create memory record
curl -X POST https://api.promethios.com/memory/records \\
  -H "Authorization: Bearer your_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "gpt-4",
    "record_type": "response",
    "content": {
      "prompt": "What is diabetes?",
      "response": "Diabetes is a metabolic disorder...",
      "trust_score": 0.95
    }
  }'

# Get memory records
curl -X GET "https://api.promethios.com/memory/records?limit=10&query=diabetes" \\
  -H "Authorization: Bearer your_token"`,

      policy: `# Create policy
curl -X POST https://api.promethios.com/policy \\
  -H "Authorization: Bearer your_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Financial SOX Compliance",
    "description": "Ensures compliance with Sarbanes-Oxley Act",
    "domain": "financial",
    "rules": [
      {
        "type": "bias_detection",
        "threshold": 0.8,
        "action": "flag"
      }
    ]
  }'

# Update policy
curl -X PUT https://api.promethios.com/policy/policy_123 \\
  -H "Authorization: Bearer your_token" \\
  -H "Content-Type: application/json" \\
  -d '{"version": "2.0"}'`
    }
  };

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/govern/validate',
      description: 'Validate content against governance policies',
      category: 'Core'
    },
    {
      method: 'GET',
      endpoint: '/policy',
      description: 'List governance policies',
      category: 'Policy'
    },
    {
      method: 'POST',
      endpoint: '/policy',
      description: 'Create a new governance policy',
      category: 'Policy'
    },
    {
      method: 'GET',
      endpoint: '/memory/records',
      description: 'Retrieve memory records',
      category: 'Memory'
    },
    {
      method: 'POST',
      endpoint: '/memory/records',
      description: 'Create a new memory record',
      category: 'Memory'
    },
    {
      method: 'GET',
      endpoint: '/reflection/records',
      description: 'Get reflection records',
      category: 'Reflection'
    },
    {
      method: 'GET',
      endpoint: '/trust/metrics',
      description: 'Get trust metrics and scores',
      category: 'Trust'
    },
    {
      method: 'GET',
      endpoint: '/audit/logs',
      description: 'Access audit logs',
      category: 'Audit'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'quickstart', label: 'Quick Start', icon: Zap },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'endpoints', label: 'API Reference', icon: Code },
    { id: 'sdks', label: 'SDKs & Libraries', icon: Globe },
    { id: 'compliance', label: 'Compliance', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Build with Promethios
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Integrate enterprise-grade AI governance into your applications with our comprehensive API platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                onClick={() => setActiveTab('quickstart')}
              >
                Get Started
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-300"
                onClick={() => setActiveTab('endpoints')}
              >
                API Reference
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">99.7%</div>
              <div className="text-gray-400">API Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">50ms</div>
              <div className="text-gray-400">Avg Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">1.2M+</div>
              <div className="text-gray-400">API Calls/Month</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">247</div>
              <div className="text-gray-400">Violations Prevented</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">Promethios API Platform</h2>
              <p className="text-lg text-gray-300 mb-8">
                The Promethios API provides developers with powerful tools to integrate AI governance, 
                compliance monitoring, and trust scoring into their applications. Built for enterprise 
                scale with comprehensive security and compliance features.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <Shield className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
                <p className="text-gray-400">
                  OAuth 2.0, API keys, rate limiting, and comprehensive audit logging 
                  ensure your integrations are secure and compliant.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <Zap className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Real-time Governance</h3>
                <p className="text-gray-400">
                  Validate AI responses in real-time with sub-50ms latency. 
                  Prevent violations before they reach your users.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <Globe className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Multi-Framework Support</h3>
                <p className="text-gray-400">
                  Integrate with OpenAI, Anthropic, Google, and any LLM provider. 
                  SDKs available for Python, JavaScript, and more.
                </p>
              </div>
            </div>

            {/* Pricing & Access Section */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">API Access & Pricing</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-800/50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-400 mb-2">Free Tier</h4>
                  <div className="text-2xl font-bold mb-2">$0/month</div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 1,000 API calls/month</li>
                    <li>• Basic governance policies</li>
                    <li>• Community support</li>
                    <li>• Standard trust scoring</li>
                  </ul>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg border border-blue-500">
                  <h4 className="text-lg font-semibold text-blue-400 mb-2">Pro</h4>
                  <div className="text-2xl font-bold mb-2">$99/month</div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 100,000 API calls/month</li>
                    <li>• Custom governance policies</li>
                    <li>• Priority support</li>
                    <li>• Advanced analytics</li>
                  </ul>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-2">Enterprise</h4>
                  <div className="text-2xl font-bold mb-2">Custom</div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Unlimited API calls</li>
                    <li>• On-premise deployment</li>
                    <li>• Custom model training</li>
                    <li>• Dedicated support</li>
                  </ul>
                </div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg mb-6">
                <h4 className="text-yellow-400 font-semibold mb-2">🔒 IP Protection Notice</h4>
                <p className="text-sm text-gray-300">
                  Our API provides governance results and trust scores without exposing our proprietary algorithms, 
                  training data, or model weights. Your data remains secure and our intellectual property is protected.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setActiveTab('quickstart')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                </button>
                <button className="border border-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'quickstart' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">Quick Start Guide</h2>
              <p className="text-lg text-gray-300 mb-8">
                Get up and running with the Promethios API in minutes. Follow these steps to integrate 
                AI governance into your application.
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                  Get Your API Key
                </h3>
                <p className="text-gray-300 mb-4">
                  Sign up for a Promethios account and generate your API credentials from the developer dashboard. 
                  Start with our free tier - 1,000 API calls per month with no credit card required.
                </p>
                <div className="bg-green-900/20 border border-green-600 p-3 rounded-lg mb-4">
                  <p className="text-sm text-green-400">
                    ✅ Free Tier: 1,000 API calls/month • Basic governance policies • No credit card required
                  </p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors">
                  Get Free API Key
                </button>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                  Install the SDK
                </h3>
                <div className="space-y-4">
                  <div className="flex space-x-2 mb-4">
                    {['python', 'javascript', 'curl'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-4 py-2 rounded font-medium transition-colors ${
                          selectedLanguage === lang
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {lang === 'javascript' ? 'Node.js' : lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-green-400">
                        {selectedLanguage === 'python' && 'pip install promethios'}
                        {selectedLanguage === 'javascript' && 'npm install @promethios/sdk'}
                        {selectedLanguage === 'curl' && '# No installation required - use cURL directly'}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Make Your First API Call
                </h3>
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(codeExamples[selectedLanguage].quickstart, 'quickstart')}
                    className="absolute top-4 right-4 p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                  >
                    {copiedCode === 'quickstart' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm">
                      {codeExamples[selectedLanguage].quickstart}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'authentication' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">Authentication</h2>
              <p className="text-lg text-gray-300 mb-8">
                The Promethios API uses API keys and OAuth 2.0 for secure authentication. 
                All requests must be authenticated and use HTTPS.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">API Key Authentication</h3>
                <p className="text-gray-300 mb-4">
                  Include your API key in the Authorization header of every request.
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm">
{`Authorization: Bearer your_api_key

# Example request
curl -H "Authorization: Bearer pk_live_123..." \\
     https://api.promethios.com/policy`}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">OAuth 2.0 Flow</h3>
                <p className="text-gray-300 mb-4">
                  For applications requiring user consent, use OAuth 2.0 authorization code flow.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Redirect to authorization URL</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    <span>User grants permission</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                    <span>Exchange code for access token</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-600 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">Security Best Practices</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Never expose API keys in client-side code</li>
                <li>• Use environment variables to store credentials</li>
                <li>• Rotate API keys regularly</li>
                <li>• Implement rate limiting in your applications</li>
                <li>• Monitor API usage for unusual patterns</li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-600 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-blue-400">🔒 Data & IP Protection</h3>
              <div className="space-y-3 text-gray-300">
                <p>
                  <strong>Your Data Security:</strong> All API requests are encrypted in transit (TLS 1.3) and at rest. 
                  We never store your AI prompts or responses beyond the session scope required for governance validation.
                </p>
                <p>
                  <strong>Our IP Protection:</strong> The API provides governance results without exposing our proprietary 
                  algorithms, model weights, or training data. You receive trust scores and violation flags, not our 
                  underlying intelligence.
                </p>
                <p>
                  <strong>Compliance:</strong> Our API infrastructure is SOC 2 Type II certified and complies with 
                  GDPR, HIPAA, and other major data protection regulations.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'endpoints' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">API Reference</h2>
              <p className="text-lg text-gray-300 mb-8">
                Complete reference for all Promethios API endpoints with request/response examples.
              </p>
            </div>

            <div className="grid gap-6">
              {apiEndpoints.map((endpoint, index) => (
                <div key={index} className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${
                        endpoint.method === 'GET' ? 'bg-green-600' :
                        endpoint.method === 'POST' ? 'bg-blue-600' :
                        endpoint.method === 'PUT' ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono">{endpoint.endpoint}</code>
                    </div>
                    <span className="bg-gray-700 px-3 py-1 rounded text-sm">{endpoint.category}</span>
                  </div>
                  <p className="text-gray-300 mb-4">{endpoint.description}</p>
                  <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                    <Play className="w-4 h-4" />
                    <span>Try it out</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Interactive API Explorer</h3>
              <p className="text-gray-300 mb-4">
                Test API endpoints directly from your browser with our interactive explorer.
              </p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <ExternalLink className="w-5 h-5" />
                <span>Open API Explorer</span>
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'sdks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">SDKs & Libraries</h2>
              <p className="text-lg text-gray-300 mb-8">
                Official SDKs and community libraries to integrate Promethios into your preferred development environment.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Python SDK</h3>
                    <span className="text-sm text-green-400">Official</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Full-featured Python SDK with async support and comprehensive type hints.
                </p>
                <div className="space-y-2">
                  <code className="block bg-gray-900 p-2 rounded text-sm">pip install promethios</code>
                  <div className="flex space-x-2">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">Documentation</button>
                    <button className="text-blue-400 hover:text-blue-300 text-sm">GitHub</button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Node.js SDK</h3>
                    <span className="text-sm text-green-400">Official</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  TypeScript-first SDK for Node.js with full Promise and async/await support.
                </p>
                <div className="space-y-2">
                  <code className="block bg-gray-900 p-2 rounded text-sm">npm install @promethios/sdk</code>
                  <div className="flex space-x-2">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">Documentation</button>
                    <button className="text-blue-400 hover:text-blue-300 text-sm">GitHub</button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Go SDK</h3>
                    <span className="text-sm text-yellow-400">Beta</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Lightweight Go SDK optimized for high-performance applications.
                </p>
                <div className="space-y-2">
                  <code className="block bg-gray-900 p-2 rounded text-sm">go get github.com/promethios/go-sdk</code>
                  <div className="flex space-x-2">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">Documentation</button>
                    <button className="text-blue-400 hover:text-blue-300 text-sm">GitHub</button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Java SDK</h3>
                    <span className="text-sm text-yellow-400">Coming Soon</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Enterprise-grade Java SDK with Spring Boot integration.
                </p>
                <div className="space-y-2">
                  <button className="bg-gray-700 text-gray-400 px-4 py-2 rounded text-sm cursor-not-allowed">
                    Coming Q2 2025
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">REST API</h3>
                    <span className="text-sm text-green-400">Universal</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Direct REST API access for any language or framework.
                </p>
                <div className="space-y-2">
                  <button className="text-blue-400 hover:text-blue-300 text-sm">OpenAPI Spec</button>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Postman Collection</button>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Community SDKs</h3>
                    <span className="text-sm text-blue-400">Community</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Community-maintained SDKs for additional languages and frameworks.
                </p>
                <div className="space-y-2">
                  <button className="text-blue-400 hover:text-blue-300 text-sm">View All</button>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Contribute</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'compliance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">Compliance & Security</h2>
              <p className="text-lg text-gray-300 mb-8">
                Promethios is built with enterprise security and compliance at its core, 
                supporting major regulatory frameworks and industry standards.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Compliance Frameworks</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="font-semibold">SOC 2 Type II</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="font-semibold">GDPR Compliant</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="font-semibold">HIPAA Ready</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="font-semibold">ISO 27001</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Security Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span>Zero-trust architecture</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span>Comprehensive audit logging</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span>Role-based access control</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Enterprise Security</h3>
              <p className="text-gray-300 mb-6">
                Need additional security features or compliance certifications? 
                Our enterprise plans include advanced security controls and dedicated compliance support.
              </p>
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Contact Security Team
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Build with Promethios?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers building safer AI applications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
              Get API Access
            </button>
            <button className="border border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;

