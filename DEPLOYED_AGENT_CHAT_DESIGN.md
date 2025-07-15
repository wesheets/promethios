# Deployed Agent Chat Page Design

## 🎯 **Vision: Standalone Deployed Agent Interface**

Each deployed agent gets its own dedicated chat page that focuses exclusively on that agent, with full API documentation and deployment instructions.

## 🏗️ **Page Structure**

### **URL Pattern:**
```
/ui/deployed-agents/{deploymentId}/chat
/ui/deployed-agents/{deploymentId}/docs
```

### **Page Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🚀 Deployed Agent: AI Assistant                            │
│ Status: ✅ Healthy | Trust Score: 85% | Uptime: 2h 15m    │
├─────────────────────────────────────────────────────────────┤
│ [Chat] [API Docs] [Metrics] [Settings]                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chat Interface (Left 60%)    │  API Instructions (Right 40%) │
│  ┌─────────────────────────┐   │  ┌─────────────────────────┐ │
│  │ User: Hello             │   │  │ 🔑 API Key:             │ │
│  │ Agent: Hi! How can I    │   │  │ promethios_HSf4SI...    │ │
│  │        help you?        │   │  │                         │ │
│  │                         │   │  │ 📡 Endpoint:            │ │
│  │ [Type message...]       │   │  │ POST /api/deployed/...  │ │
│  └─────────────────────────┘   │  │                         │ │
│                                │  │ 📋 cURL Example:        │ │
│                                │  │ curl -X POST ...        │ │
│                                │  │                         │ │
│                                │  │ 🔧 SDKs:                │ │
│                                │  │ [Python] [Node.js]      │ │
│                                │  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ **Technical Implementation**

### **1. Standalone Chat Component**
```typescript
// /components/deployed-agents/DeployedAgentChat.tsx
interface DeployedAgentChatProps {
  deploymentId: string;
  deployment: DeploymentResult;
}

const DeployedAgentChat = ({ deploymentId, deployment }: DeployedAgentChatProps) => {
  const [messages, setMessages] = useState([]);
  const [apiInstructions, setApiInstructions] = useState(null);
  
  // Load deployment-specific data only
  useEffect(() => {
    loadDeploymentDetails(deploymentId);
    generateApiInstructions(deployment);
  }, [deploymentId]);
  
  // Chat only with this specific deployed agent
  const sendMessage = async (message: string) => {
    const response = await deployedAgentAPI.chat(deploymentId, message, deployment.apiKey);
    setMessages(prev => [...prev, { user: message, agent: response }]);
  };
  
  return (
    <div className="deployed-agent-chat">
      <DeploymentHeader deployment={deployment} />
      <div className="chat-container">
        <ChatInterface messages={messages} onSendMessage={sendMessage} />
        <ApiInstructions deployment={deployment} />
      </div>
    </div>
  );
};
```

### **2. API Instructions Component**
```typescript
// /components/deployed-agents/ApiInstructions.tsx
const ApiInstructions = ({ deployment }: { deployment: DeploymentResult }) => {
  const apiKey = deployment.apiKey;
  const endpoint = `${API_BASE}/deployed/${deployment.deploymentId}/chat`;
  
  const curlExample = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, how can you help me?"}'`;
  
  const pythonExample = `import requests

response = requests.post(
    "${endpoint}",
    headers={
        "Authorization": "Bearer ${apiKey}",
        "Content-Type": "application/json"
    },
    json={"message": "Hello, how can you help me?"}
)

result = response.json()
print(result["response"])`;

  return (
    <div className="api-instructions">
      <h3>🔑 API Access</h3>
      <div className="api-key">
        <label>API Key:</label>
        <code>{apiKey}</code>
        <button onClick={() => copyToClipboard(apiKey)}>Copy</button>
      </div>
      
      <div className="endpoint">
        <label>Endpoint:</label>
        <code>{endpoint}</code>
      </div>
      
      <div className="examples">
        <h4>📋 Examples</h4>
        <div className="example">
          <h5>cURL</h5>
          <pre><code>{curlExample}</code></pre>
          <button onClick={() => copyToClipboard(curlExample)}>Copy</button>
        </div>
        
        <div className="example">
          <h5>Python</h5>
          <pre><code>{pythonExample}</code></pre>
          <button onClick={() => copyToClipboard(pythonExample)}>Copy</button>
        </div>
      </div>
      
      <div className="response-format">
        <h4>📤 Response Format</h4>
        <pre><code>{JSON.stringify({
          "response": "Agent's response message",
          "timestamp": "2024-01-15T10:30:00Z",
          "trust_score": 0.85,
          "governance_metrics": {
            "policy_checks": 3,
            "violations": 0
          }
        }, null, 2)}</code></pre>
      </div>
    </div>
  );
};
```

### **3. Routing Integration**
```typescript
// Update routing to include deployed agent chat pages
// /pages/deployed-agents/[deploymentId]/chat.tsx
const DeployedAgentChatPage = () => {
  const router = useRouter();
  const { deploymentId } = router.query;
  const [deployment, setDeployment] = useState(null);
  
  useEffect(() => {
    if (deploymentId) {
      loadDeployment(deploymentId as string);
    }
  }, [deploymentId]);
  
  if (!deployment) {
    return <LoadingSpinner />;
  }
  
  return (
    <Layout>
      <DeployedAgentChat 
        deploymentId={deploymentId as string} 
        deployment={deployment} 
      />
    </Layout>
  );
};
```

## 🔗 **Integration with Deployment Cards**

### **Updated "Test Agent" Button**
```typescript
// In ImprovedDeploymentCard.tsx
const handleTestAgent = () => {
  // Navigate to standalone deployed agent chat page
  router.push(`/ui/deployed-agents/${deployment.deploymentId}/chat`);
};
```

### **Navigation Flow**
```
Deployment Page → Click "Test Agent" → Standalone Deployed Agent Chat Page
     ↓                    ↓                           ↓
Agent Scorecards    Button Click              Dedicated Chat + API Docs
```

## 📋 **Page Features**

### **Chat Tab**
- **Focus**: Only this deployed agent
- **Features**: Real-time chat, message history, typing indicators
- **Governance**: Live trust score, policy compliance indicators
- **Metrics**: Response time, interaction count

### **API Docs Tab**
- **API Key**: Copy-to-clipboard functionality
- **Endpoints**: All available endpoints for this agent
- **Examples**: cURL, Python, Node.js, JavaScript
- **Response Formats**: JSON schema and examples
- **Rate Limits**: Usage limits and quotas
- **Authentication**: Bearer token usage

### **Metrics Tab**
- **Performance**: Response times, uptime, availability
- **Usage**: Request count, unique users, peak times
- **Governance**: Trust score history, violation reports
- **Health**: System status, error rates

### **Settings Tab**
- **Configuration**: Update agent settings
- **Policies**: Modify governance policies
- **Scaling**: Adjust resource allocation
- **Access Control**: Manage API key permissions

## 🎯 **Multi-Agent System Support**

### **For Multi-Agent Deployments**
```typescript
// Support for multi-agent systems
const MultiAgentDeployedChat = ({ deploymentId, multiAgentSystem }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  
  return (
    <div className="multi-agent-deployed-chat">
      <SystemHeader system={multiAgentSystem} />
      <AgentSelector 
        agents={multiAgentSystem.agents} 
        onSelectAgent={setSelectedAgent} 
      />
      {selectedAgent && (
        <AgentChat agent={selectedAgent} systemContext={multiAgentSystem} />
      )}
      <SystemApiInstructions system={multiAgentSystem} />
    </div>
  );
};
```

## 🚀 **Implementation Priority**

### **Phase 1: Basic Standalone Chat**
1. Create `DeployedAgentChat.tsx` component
2. Add routing for `/deployed-agents/{id}/chat`
3. Update "Test Agent" button to navigate to standalone page
4. Basic chat functionality with deployed agent

### **Phase 2: API Documentation**
1. Add `ApiInstructions.tsx` component
2. Generate dynamic API examples
3. Copy-to-clipboard functionality
4. Response format documentation

### **Phase 3: Enhanced Features**
1. Add Metrics and Settings tabs
2. Multi-agent system support
3. Real-time governance indicators
4. Advanced API features

## 💡 **Key Advantages**

1. **Focused Experience**: Each deployed agent gets dedicated attention
2. **Clear Separation**: No confusion between test and deployed agents
3. **Complete Documentation**: Everything needed to use the agent
4. **Professional Interface**: Production-ready agent interaction
5. **Multi-Agent Support**: Handles both single agents and systems
6. **Developer-Friendly**: Full API documentation and examples

This design provides a professional, focused interface for each deployed agent with complete API documentation!

