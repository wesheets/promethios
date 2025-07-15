# Deployed Agent Chat Interface: Implementation

## 🎯 **Key Design Principle: Always-On Governance**

Deployed agents are already wrapped in governance, so the chat interface should always display live governance metrics without any toggle controls.

## 🛠️ **Phase 1: Extend Existing Chat Interface**

### **1.1 Modify ChatInterface Component**

```typescript
// /components/chat/ChatInterface.tsx - Add deployed agent mode
interface ChatInterfaceProps {
  mode?: 'test' | 'deployed-agent';
  preSelectedAgent?: DeploymentResult;
  hideAgentSelector?: boolean;
  deploymentId?: string;
  showApiInstructions?: boolean;
  // Remove: governanceToggle (always on for deployed agents)
}

const ChatInterface = ({ 
  mode = 'test',
  preSelectedAgent,
  hideAgentSelector = false,
  deploymentId,
  showApiInstructions = false 
}: ChatInterfaceProps) => {
  
  // Governance is always enabled for deployed agents
  const governanceEnabled = mode === 'deployed-agent' ? true : governanceToggle;
  
  // Agent selection logic
  useEffect(() => {
    if (mode === 'deployed-agent' && preSelectedAgent) {
      setSelectedAgent(preSelectedAgent);
      // Skip loading test agents
    } else {
      loadTestAgents();
    }
  }, [mode, preSelectedAgent]);
  
  // Message sending logic
  const sendMessage = async (message: string) => {
    if (mode === 'deployed-agent') {
      // Send to deployed agent API with governance always enabled
      return await deployedAgentAPI.chat(deploymentId, message);
    } else {
      // Existing test agent logic
      return await testAgentAPI.chat(selectedAgent.id, message, governanceEnabled);
    }
  };
  
  return (
    <div className="chat-interface">
      {/* Deployed agent header */}
      {mode === 'deployed-agent' ? (
        <DeployedAgentHeader deployment={preSelectedAgent} />
      ) : (
        <TestAgentHeader />
      )}
      
      {/* Conditional agent selector */}
      {!hideAgentSelector && (
        <AgentSelector 
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
        />
      )}
      
      {/* Chat area */}
      <ChatArea messages={messages} />
      
      {/* Governance metrics - always visible for deployed agents */}
      <GovernanceMetricsPanel 
        agent={selectedAgent} 
        governanceEnabled={governanceEnabled}
        mode={mode}
      />
      
      {/* API instructions for deployed agents */}
      {showApiInstructions && (
        <ApiInstructionsPanel deployment={preSelectedAgent} />
      )}
    </div>
  );
};
```

### **1.2 Create Deployed Agent Header**

```typescript
// /components/deployed-agents/DeployedAgentHeader.tsx
interface DeployedAgentHeaderProps {
  deployment: DeploymentResult;
}

const DeployedAgentHeader = ({ deployment }: DeployedAgentHeaderProps) => {
  const [status, setStatus] = useState('loading');
  const [uptime, setUptime] = useState('');
  
  useEffect(() => {
    // Load deployment status
    loadDeploymentStatus();
    
    // Update uptime every minute
    const interval = setInterval(updateUptime, 60000);
    return () => clearInterval(interval);
  }, [deployment.deploymentId]);
  
  return (
    <div className="deployed-agent-header">
      <div className="agent-info">
        <h2>🚀 Deployed Agent: {deployment.agentName || 'AI Assistant'}</h2>
        <div className="status-bar">
          <StatusIndicator status={status} />
          <span>Uptime: {uptime}</span>
          <span>API: {deployment.apiKey.substring(0, 20)}...</span>
          <span>🛡️ Governance: Always Active</span>
        </div>
      </div>
    </div>
  );
};
```

### **1.3 Create Deployment Route**

```typescript
// /pages/ui/deployed-agents/[deploymentId]/chat.tsx
import { ChatInterface } from '../../../../components/chat/ChatInterface';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { EnhancedDeploymentService } from '../../../../modules/agent-wrapping/services/EnhancedDeploymentService';

const DeployedAgentChatPage = () => {
  const router = useRouter();
  const { deploymentId } = router.query;
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (deploymentId) {
      loadDeployment(deploymentId as string);
    }
  }, [deploymentId]);
  
  const loadDeployment = async (id: string) => {
    try {
      const deploymentService = new EnhancedDeploymentService();
      const deploymentData = await deploymentService.getRealDeploymentStatus(id);
      setDeployment(deploymentData);
    } catch (error) {
      console.error('Failed to load deployment:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading deployed agent...</div>;
  }
  
  if (!deployment) {
    return <div className="error">Deployed agent not found</div>;
  }
  
  return (
    <div className="deployed-agent-chat-page">
      <ChatInterface 
        mode="deployed-agent"
        preSelectedAgent={deployment}
        hideAgentSelector={true}
        deploymentId={deploymentId as string}
        showApiInstructions={true}
      />
    </div>
  );
};

export default DeployedAgentChatPage;
```

## 📚 **Phase 2: API Instructions Panel**

### **2.1 Create API Instructions Component**

```typescript
// /components/deployed-agents/ApiInstructionsPanel.tsx
interface ApiInstructionsPanelProps {
  deployment: DeploymentResult;
}

const ApiInstructionsPanel = ({ deployment }: ApiInstructionsPanelProps) => {
  const apiKey = deployment.apiKey;
  const endpoint = `${process.env.NEXT_PUBLIC_API_BASE}/api/deployed/${deployment.deploymentId}/chat`;
  
  const [copiedItem, setCopiedItem] = useState('');
  
  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(''), 2000);
  };
  
  const curlExample = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can you help me?",
    "include_governance": true
  }'`;
  
  const pythonExample = `import requests

# Deployed Agent API Configuration
API_KEY = "${apiKey}"
ENDPOINT = "${endpoint}"

def chat_with_deployed_agent(message):
    response = requests.post(
        ENDPOINT,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "message": message,
            "include_governance": True
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"Agent: {result['response']}")
        print(f"Trust Score: {result['governance']['trustScore']}%")
        print(f"Compliance: {result['governance']['complianceRate']}%")
        return result
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# Example usage
chat_with_deployed_agent("Hello, how can you help me?")`;

  const nodeExample = `const axios = require('axios');

// Deployed Agent API Configuration
const API_KEY = '${apiKey}';
const ENDPOINT = '${endpoint}';

async function chatWithDeployedAgent(message) {
  try {
    const response = await axios.post(ENDPOINT, {
      message: message,
      include_governance: true
    }, {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data;
    console.log(\`Agent: \${result.response}\`);
    console.log(\`Trust Score: \${result.governance.trustScore}%\`);
    console.log(\`Compliance: \${result.governance.complianceRate}%\`);
    return result;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Example usage
chatWithDeployedAgent('Hello, how can you help me?');`;

  const responseFormat = {
    "response": "Hello! I'm your AI assistant. I can help you with various tasks including answering questions, providing information, and assisting with analysis.",
    "timestamp": "2024-01-15T10:30:00Z",
    "governance": {
      "trustScore": 89.2,
      "complianceRate": 94.8,
      "responseTime": 1.4,
      "sessionIntegrity": 91.6,
      "policyViolations": 0,
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "metadata": {
      "deploymentId": deployment.deploymentId,
      "agentId": deployment.agentId,
      "conversationId": "conv_1234567890",
      "messageId": "msg_0987654321"
    }
  };
  
  return (
    <div className="api-instructions-panel">
      <div className="panel-header">
        <h3>🔑 API Integration</h3>
        <p>Integrate this deployed agent into your applications</p>
      </div>
      
      {/* API Key Section */}
      <div className="api-section">
        <h4>API Key</h4>
        <div className="api-key-container">
          <code className="api-key">{apiKey}</code>
          <button 
            onClick={() => copyToClipboard(apiKey, 'apiKey')}
            className={`copy-btn ${copiedItem === 'apiKey' ? 'copied' : ''}`}
          >
            {copiedItem === 'apiKey' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      
      {/* Endpoint Section */}
      <div className="api-section">
        <h4>Endpoint</h4>
        <div className="endpoint-container">
          <code className="endpoint">{endpoint}</code>
          <button 
            onClick={() => copyToClipboard(endpoint, 'endpoint')}
            className={`copy-btn ${copiedItem === 'endpoint' ? 'copied' : ''}`}
          >
            {copiedItem === 'endpoint' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      
      {/* Examples Section */}
      <div className="api-section">
        <h4>📋 Code Examples</h4>
        
        {/* cURL Example */}
        <div className="example-container">
          <div className="example-header">
            <h5>cURL</h5>
            <button 
              onClick={() => copyToClipboard(curlExample, 'curl')}
              className={`copy-btn ${copiedItem === 'curl' ? 'copied' : ''}`}
            >
              {copiedItem === 'curl' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre><code>{curlExample}</code></pre>
        </div>
        
        {/* Python Example */}
        <div className="example-container">
          <div className="example-header">
            <h5>Python</h5>
            <button 
              onClick={() => copyToClipboard(pythonExample, 'python')}
              className={`copy-btn ${copiedItem === 'python' ? 'copied' : ''}`}
            >
              {copiedItem === 'python' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre><code>{pythonExample}</code></pre>
        </div>
        
        {/* Node.js Example */}
        <div className="example-container">
          <div className="example-header">
            <h5>Node.js</h5>
            <button 
              onClick={() => copyToClipboard(nodeExample, 'node')}
              className={`copy-btn ${copiedItem === 'node' ? 'copied' : ''}`}
            >
              {copiedItem === 'node' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre><code>{nodeExample}</code></pre>
        </div>
      </div>
      
      {/* Response Format Section */}
      <div className="api-section">
        <h4>📤 Response Format</h4>
        <div className="response-format">
          <p>All responses include governance metrics since deployed agents have governance always enabled:</p>
          <pre><code>{JSON.stringify(responseFormat, null, 2)}</code></pre>
        </div>
      </div>
      
      {/* Important Notes */}
      <div className="api-section">
        <h4>⚠️ Important Notes</h4>
        <ul>
          <li><strong>Governance Always Active:</strong> All responses include live governance metrics</li>
          <li><strong>Rate Limiting:</strong> 100 requests per minute per API key</li>
          <li><strong>Authentication:</strong> Include Bearer token in Authorization header</li>
          <li><strong>HTTPS Only:</strong> All requests must use HTTPS</li>
          <li><strong>Response Time:</strong> Typical response time is 1-3 seconds</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiInstructionsPanel;
```

This implementation provides comprehensive API documentation with always-on governance, removing any governance toggle since deployed agents are pre-wrapped with governance functionality.

