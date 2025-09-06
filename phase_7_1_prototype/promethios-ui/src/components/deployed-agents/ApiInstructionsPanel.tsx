import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  ContentCopy, 
  Code, 
  Security, 
  Speed,
  CheckCircle
} from '@mui/icons-material';

interface ApiInstructionsPanelProps {
  deployment: any; // Will be replaced with proper type
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ApiInstructionsPanel: React.FC<ApiInstructionsPanelProps> = ({ deployment }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedItem, setCopiedItem] = useState('');

  const apiKey = deployment.apiKey;
  const endpoint = `${import.meta.env.NEXT_PUBLIC_API_BASE || 'https://promethios-phase-7-1-api.onrender.com'}/api/deployed/${deployment.deploymentId}/chat`;
  
  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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

  const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => (
    <Paper sx={{ 
      backgroundColor: '#1a202c', 
      p: 2, 
      position: 'relative',
      border: '1px solid #4a5568'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1 
      }}>
        <Typography variant="caption" sx={{ color: '#a0aec0', textTransform: 'uppercase' }}>
          {language}
        </Typography>
        <Button
          size="small"
          startIcon={<ContentCopy />}
          onClick={() => copyToClipboard(code, language)}
          sx={{ 
            color: copiedItem === language ? '#48bb78' : '#a0aec0',
            minWidth: 'auto'
          }}
        >
          {copiedItem === language ? 'Copied!' : 'Copy'}
        </Button>
      </Box>
      <pre style={{ 
        margin: 0, 
        color: 'white', 
        fontSize: '0.875rem',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {code}
      </pre>
    </Paper>
  );

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#2d3748'
    }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #4a5568' }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          🔑 API Integration
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 0.5 }}>
          Integrate this deployed agent into your applications
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ 
          borderBottom: '1px solid #4a5568',
          '& .MuiTab-root': { 
            color: '#a0aec0',
            '&.Mui-selected': { color: '#63b3ed' }
          }
        }}
      >
        <Tab label="Quick Start" />
        <Tab label="Examples" />
        <Tab label="Response" />
        <Tab label="Limits" />
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={activeTab} index={0}>
          {/* Quick Start */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* API Key */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                API Key
              </Typography>
              <Paper sx={{ 
                backgroundColor: '#1a202c', 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #4a5568'
              }}>
                <Typography sx={{ 
                  color: 'white', 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  wordBreak: 'break-all'
                }}>
                  {apiKey}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopy />}
                  onClick={() => copyToClipboard(apiKey, 'apiKey')}
                  sx={{ 
                    color: copiedItem === 'apiKey' ? '#48bb78' : '#a0aec0',
                    ml: 1
                  }}
                >
                  {copiedItem === 'apiKey' ? 'Copied!' : 'Copy'}
                </Button>
              </Paper>
            </Box>

            {/* Endpoint */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Endpoint
              </Typography>
              <Paper sx={{ 
                backgroundColor: '#1a202c', 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #4a5568'
              }}>
                <Typography sx={{ 
                  color: 'white', 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  wordBreak: 'break-all'
                }}>
                  {endpoint}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopy />}
                  onClick={() => copyToClipboard(endpoint, 'endpoint')}
                  sx={{ 
                    color: copiedItem === 'endpoint' ? '#48bb78' : '#a0aec0',
                    ml: 1
                  }}
                >
                  {copiedItem === 'endpoint' ? 'Copied!' : 'Copy'}
                </Button>
              </Paper>
            </Box>

            {/* Quick cURL */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Quick Test
              </Typography>
              <CodeBlock code={curlExample} language="curl" />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Examples */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <CodeBlock code={pythonExample} language="python" />
            <CodeBlock code={nodeExample} language="javascript" />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Response Format */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
              Response Format
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              All responses include governance metrics since deployed agents have governance always enabled.
            </Alert>
            <CodeBlock 
              code={JSON.stringify(responseFormat, null, 2)} 
              language="json" 
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {/* Rate Limits & Info */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
              Rate Limits & Guidelines
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Speed sx={{ color: '#63b3ed' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Rate Limiting"
                  secondary="100 requests per minute per API key"
                  primaryTypographyProps={{ color: 'white' }}
                  secondaryTypographyProps={{ color: '#a0aec0' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Security sx={{ color: '#48bb78' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Authentication"
                  secondary="Include Bearer token in Authorization header"
                  primaryTypographyProps={{ color: 'white' }}
                  secondaryTypographyProps={{ color: '#a0aec0' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#48bb78' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="HTTPS Only"
                  secondary="All requests must use HTTPS"
                  primaryTypographyProps={{ color: 'white' }}
                  secondaryTypographyProps={{ color: '#a0aec0' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Code sx={{ color: '#ed8936' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Response Time"
                  secondary="Typical response time is 1-3 seconds"
                  primaryTypographyProps={{ color: 'white' }}
                  secondaryTypographyProps={{ color: '#a0aec0' }}
                />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Governance Always Active:</strong> All responses include live governance metrics. 
              This deployed agent is pre-wrapped with governance functionality.
            </Alert>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default ApiInstructionsPanel;

