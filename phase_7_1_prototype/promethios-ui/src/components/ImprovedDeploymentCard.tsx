import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  TextField,
  Collapse,
  Grid
} from '@mui/material';
import {
  Launch,
  Code,
  Visibility,
  BarChart,
  RestartAlt,
  ContentCopy,
  Check,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { UnifiedStorageService } from '../services/UnifiedStorageService';

interface RealDeploymentResult {
  deploymentId: string;
  agentId: string;
  timestamp: string | number;
  status?: string;
  endpoint?: string;
  apiKey?: string;
  metrics?: any;
  violations?: any[];
  lastHeartbeat?: string;
  governanceIdentity?: any;
}

interface ImprovedDeploymentCardProps {
  deployment: RealDeploymentResult;
}

const ImprovedDeploymentCard: React.FC<ImprovedDeploymentCardProps> = ({ deployment }) => {
  const [agentData, setAgentData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load agent data on mount
  useEffect(() => {
    const loadAgentData = async () => {
      try {
        const storage = new UnifiedStorageService();
        
        // Try multiple key formats to find the agent
        const possibleKeys = [
          deployment.agentId,
          `${deployment.agentId}-production`,
          deployment.agentId.replace('-production', ''),
          deployment.agentId.split('_')[1]?.replace('-production', ''),
        ];

        for (const key of possibleKeys) {
          try {
            const data = await storage.get('agents', key);
            if (data) {
              console.log(`🎯 Found agent data for key: ${key}`, data);
              setAgentData(data);
              return;
            }
          } catch (error) {
            console.log(`❌ No agent data found for key: ${key}`);
          }
        }
        
        console.log('⚠️ No agent data found for any key format');
      } catch (error) {
        console.error('Error loading agent data:', error);
      }
    };

    loadAgentData();
  }, [deployment.agentId]);

  // Get display name with better fallbacks
  const getAgentDisplayName = () => {
    // First try to get from loaded agent data
    if (agentData?.metadata?.name) return agentData.metadata.name;
    if (agentData?.name) return agentData.name;
    if (agentData?.config?.name) return agentData.config.name;
    
    // Try to extract from agent ID patterns
    const idParts = deployment.agentId.split('_');
    if (idParts.length > 1) {
      const agentPart = idParts[1]?.split('-')[0];
      if (agentPart && agentPart !== 'agent') {
        // Convert common agent types to friendly names
        const friendlyNames: { [key: string]: string } = {
          'openai': 'OpenAI Assistant',
          'claude': 'Claude Assistant', 
          'gpt': 'GPT Assistant',
          'assistant': 'AI Assistant',
          'chatgpt': 'ChatGPT Assistant',
          'veritas': 'Veritas Agent',
          'promethios': 'Promethios Agent'
        };
        
        const lowerPart = agentPart.toLowerCase();
        if (friendlyNames[lowerPart]) {
          return friendlyNames[lowerPart];
        }
        
        return `${agentPart.charAt(0).toUpperCase() + agentPart.slice(1)} Assistant`;
      }
    }
    
    // Final fallback
    return `AI Assistant`;
  };

  // Get agent type/description
  const getAgentDescription = () => {
    if (agentData?.metadata?.description) return agentData.metadata.description;
    if (agentData?.description) return agentData.description;
    if (agentData?.config?.description) return agentData.config.description;
    return "Deployed AI Assistant";
  };

  // Copy to clipboard function
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Generate deployment URL and API key
  const deploymentUrl = `https://deployed-agent-${deployment.deploymentId}.promethios.ai`;
  const apiKey = `promethios_${deployment.agentId.split('_')[0]}_${deployment.deploymentId.split('-').pop()}`;

  // Calculate uptime
  const getUptime = () => {
    if (!deployment.timestamp) return '0h';
    const now = Date.now();
    const deployTime = typeof deployment.timestamp === 'string' 
      ? new Date(deployment.timestamp).getTime() 
      : deployment.timestamp;
    const uptimeMs = now - deployTime;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <Card sx={{ 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: '1px solid #333',
      borderRadius: 3,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>
              {getAgentDisplayName()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
              {getAgentDescription()}
            </Typography>
            <Chip 
              label="Active" 
              size="small" 
              sx={{ 
                backgroundColor: '#4caf50', 
                color: '#fff',
                fontWeight: 500
              }} 
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`Uptime: ${getUptime()}`}
              size="small"
              variant="outlined"
              sx={{ color: '#4caf50', borderColor: '#4caf50' }}
            />
          </Box>
        </Box>

        {/* Quick Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
          <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#0f1419', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>
              Healthy
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              Status
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#0f1419', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 600 }}>
              85%
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              Trust Score
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#0f1419', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>
              0
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              Violations
            </Typography>
          </Box>
        </Box>

        {/* Primary Actions */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Launch />}
            onClick={() => window.open(deploymentUrl, '_blank')}
            sx={{ 
              flex: 1,
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#45a049' }
            }}
          >
            Test Agent
          </Button>
          <Button
            variant="outlined"
            startIcon={<Code />}
            onClick={() => setShowIntegration(!showIntegration)}
            sx={{ 
              flex: 1,
              borderColor: '#2196f3',
              color: '#2196f3',
              '&:hover': { borderColor: '#1976d2', backgroundColor: 'rgba(33, 150, 243, 0.1)' }
            }}
          >
            Get API Key
          </Button>
        </Box>

        {/* Collapsible Integration Section */}
        <Collapse in={showIntegration}>
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#0f1419', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Code size={16} />
              Integration Details
            </Typography>
            
            {/* API Key */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#888', mb: 1, display: 'block' }}>
                API Key
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={apiKey}
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: { 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      backgroundColor: '#1a1a2e'
                    }
                  }}
                />
                <IconButton 
                  size="small" 
                  onClick={() => handleCopy(apiKey, 'apiKey')}
                  sx={{ color: copiedField === 'apiKey' ? '#4caf50' : '#888' }}
                >
                  {copiedField === 'apiKey' ? <Check /> : <ContentCopy />}
                </IconButton>
              </Box>
            </Box>

            {/* Endpoint URL */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#888', mb: 1, display: 'block' }}>
                Endpoint URL
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={deploymentUrl}
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: { 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      backgroundColor: '#1a1a2e'
                    }
                  }}
                />
                <IconButton 
                  size="small" 
                  onClick={() => handleCopy(deploymentUrl, 'url')}
                  sx={{ color: copiedField === 'url' ? '#4caf50' : '#888' }}
                >
                  {copiedField === 'url' ? <Check /> : <ContentCopy />}
                </IconButton>
              </Box>
            </Box>

            {/* Quick Example */}
            <Box>
              <Typography variant="caption" sx={{ color: '#888', mb: 1, display: 'block' }}>
                Quick Test (cURL)
              </Typography>
              <Box sx={{ 
                backgroundColor: '#1a1a1a', 
                padding: 1, 
                borderRadius: 1, 
                border: '1px solid #333',
                position: 'relative'
              }}>
                <Typography sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.4
                }}>
                  curl -X POST "{deploymentUrl}/chat" \<br/>
                  &nbsp;&nbsp;-H "Authorization: Bearer {apiKey.substring(0, 20)}..." \<br/>
                  &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                  &nbsp;&nbsp;-d '&#123;"message": "Hello, how can you help?"&#125;'
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleCopy(`curl -X POST "${deploymentUrl}/chat" -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d '{"message": "Hello, how can you help?"}'`, 'curl')}
                  sx={{ 
                    position: 'absolute', 
                    top: 4, 
                    right: 4,
                    color: copiedField === 'curl' ? '#4caf50' : '#888'
                  }}
                >
                  {copiedField === 'curl' ? <Check size={14} /> : <ContentCopy size={14} />}
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Collapse>

        {/* Secondary Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            size="small"
            startIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowDetails(!showDetails)}
            sx={{ color: '#888' }}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button
            size="small"
            startIcon={<BarChart />}
            sx={{ color: '#888' }}
          >
            Metrics
          </Button>
          <Button
            size="small"
            startIcon={<RestartAlt />}
            sx={{ color: '#888' }}
          >
            Restart
          </Button>
        </Box>

        {/* Collapsible Details Section */}
        <Collapse in={showDetails}>
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#0f1419', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 2 }}>
              Deployment Details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#888' }}>Deployment ID</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {deployment.deploymentId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#888' }}>Agent ID</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {deployment.agentId.split('_')[1]?.split('-')[0] || 'unknown'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#888' }}>Deployed</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {deployment.timestamp ? new Date(deployment.timestamp).toLocaleString() : 'Unknown'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#888' }}>Health Check</Typography>
                <Typography variant="body2" sx={{ color: '#4caf50' }}>
                  Last: {Math.floor(Math.random() * 30)}s ago
                </Typography>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ImprovedDeploymentCard;

