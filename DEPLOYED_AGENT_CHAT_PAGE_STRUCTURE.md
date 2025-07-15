# Deployed Agent Chat Page: Structure & Layout

## 🎯 **Page Layout Structure**

The deployed agent chat page will follow the existing Promethios layout pattern with the left sidebar navigation and top header.

## 📐 **Layout Components**

### **Existing Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ HeaderNavigation (Top Bar)                                  │
├─────────────────┬───────────────────────────────────────────┤
│ Collapsible     │ Main Content Area                         │
│ Navigation      │ (Deployed Agent Chat Interface)           │
│ (Left Sidebar)  │                                           │
│                 │                                           │
│ - Dashboard     │ ┌─────────────────────────────────────┐   │
│ - Agents        │ │ Deployed Agent: AI Assistant        │   │
│ - Chat          │ │ Status: ✅ Healthy | API: prometh... │   │
│ - Deploy        │ ├─────────────────────────────────────┤   │
│ - Governance    │ │                                     │   │
│ - etc...        │ │ Chat Interface + Governance Metrics │   │
│                 │ │                                     │   │
│                 │ │ [Chat Area]    [API Instructions]   │   │
│                 │ │                                     │   │
│                 │ └─────────────────────────────────────┘   │
└─────────────────┴───────────────────────────────────────────┘
```

## 🛠️ **Implementation**

### **1. Create Deployed Agent Chat Page**

```typescript
// /pages/ui/deployed-agents/[deploymentId]/chat.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Alert } from '@mui/material';
import { EnhancedDeploymentService } from '../../../../modules/agent-wrapping/services/EnhancedDeploymentService';
import { ChatContainer } from '../../../../modules/chat/components/ChatContainer';
import { ApiInstructionsPanel } from '../../../../components/deployed-agents/ApiInstructionsPanel';
import { DeployedAgentHeader } from '../../../../components/deployed-agents/DeployedAgentHeader';

const DeployedAgentChatPage: React.FC = () => {
  const router = useRouter();
  const { deploymentId } = router.query;
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (deploymentId) {
      loadDeployment(deploymentId as string);
    }
  }, [deploymentId]);

  const loadDeployment = async (id: string) => {
    try {
      setLoading(true);
      const deploymentService = new EnhancedDeploymentService();
      const deploymentData = await deploymentService.getRealDeploymentStatus(id);
      
      if (!deploymentData) {
        setError('Deployed agent not found');
        return;
      }
      
      setDeployment(deploymentData);
    } catch (error) {
      console.error('Failed to load deployment:', error);
      setError('Failed to load deployed agent');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        height: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a202c',
        color: 'white'
      }}>
        <Typography variant="h6">Loading deployed agent...</Typography>
      </Box>
    );
  }

  // Error state
  if (error || !deployment) {
    return (
      <Box sx={{ 
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a202c',
        color: 'white',
        p: 3
      }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Deployed agent not found'}
        </Alert>
        <Typography variant="body1">
          The deployed agent you're looking for doesn't exist or has been removed.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', // Account for header
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a202c',
      overflow: 'hidden'
    }}>
      {/* Deployed Agent Header */}
      <DeployedAgentHeader deployment={deployment} />
      
      {/* Main Chat Interface */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Chat Area (Left 60%) */}
        <Box sx={{ 
          flex: '0 0 60%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #2d3748'
        }}>
          <ChatContainer 
            height="100%"
            mode="deployed-agent"
            deploymentId={deploymentId as string}
            deployment={deployment}
            governanceEnabled={true} // Always enabled for deployed agents
            hideAgentSelector={true}
          />
        </Box>
        
        {/* API Instructions Panel (Right 40%) */}
        <Box sx={{ 
          flex: '0 0 40%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#2d3748'
        }}>
          <ApiInstructionsPanel deployment={deployment} />
        </Box>
      </Box>
    </Box>
  );
};

export default DeployedAgentChatPage;
```

### **2. Create Deployed Agent Header Component**

```typescript
// /components/deployed-agents/DeployedAgentHeader.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Refresh,
  Launch,
  ContentCopy
} from '@mui/icons-material';

interface DeployedAgentHeaderProps {
  deployment: any; // Replace with proper type
}

const DeployedAgentHeader: React.FC<DeployedAgentHeaderProps> = ({ deployment }) => {
  const [status, setStatus] = useState('healthy');
  const [uptime, setUptime] = useState('');
  const [lastActivity, setLastActivity] = useState('');

  useEffect(() => {
    // Calculate uptime
    const deployedAt = new Date(deployment.timestamp);
    const now = new Date();
    const uptimeMs = now.getTime() - deployedAt.getTime();
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    setUptime(`${hours}h ${minutes}m`);
    
    // Update every minute
    const interval = setInterval(() => {
      const newUptimeMs = Date.now() - deployedAt.getTime();
      const newHours = Math.floor(newUptimeMs / (1000 * 60 * 60));
      const newMinutes = Math.floor((newUptimeMs % (1000 * 60 * 60)) / (1000 * 60));
      setUptime(`${newHours}h ${newMinutes}m`);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [deployment.timestamp]);

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle sx={{ color: '#48bb78' }} />;
      case 'degraded':
        return <Warning sx={{ color: '#ed8936' }} />;
      case 'offline':
        return <Error sx={{ color: '#f56565' }} />;
      default:
        return <CheckCircle sx={{ color: '#48bb78' }} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return '#48bb78';
      case 'degraded':
        return '#ed8936';
      case 'offline':
        return '#f56565';
      default:
        return '#48bb78';
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(deployment.apiKey);
    // Could add a toast notification here
  };

  const openDeploymentUrl = () => {
    if (deployment.url) {
      window.open(deployment.url, '_blank');
    }
  };

  return (
    <Box sx={{
      backgroundColor: '#2d3748',
      borderBottom: '1px solid #4a5568',
      p: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left side - Agent info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            🚀 {deployment.agentName || 'Deployed Agent'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getStatusIcon()}
              <Typography variant="body2" sx={{ color: getStatusColor(), fontWeight: 500 }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Uptime: {uptime}
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              🛡️ Governance: Always Active
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right side - Actions and info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* API Key */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            API:
          </Typography>
          <Chip 
            label={`${deployment.apiKey.substring(0, 20)}...`}
            size="small"
            sx={{ 
              backgroundColor: '#4a5568',
              color: 'white',
              fontFamily: 'monospace'
            }}
          />
          <Tooltip title="Copy API Key">
            <IconButton size="small" onClick={copyApiKey} sx={{ color: '#a0aec0' }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Deployment URL */}
        {deployment.url && (
          <Tooltip title="Open Deployment URL">
            <IconButton size="small" onClick={openDeploymentUrl} sx={{ color: '#a0aec0' }}>
              <Launch fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Refresh Status */}
        <Tooltip title="Refresh Status">
          <IconButton size="small" sx={{ color: '#a0aec0' }}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DeployedAgentHeader;
```

## 🎯 **How the Page Works**

### **Navigation Flow:**
1. **User clicks "Test Agent"** on deployment card
2. **Opens new page** at `/ui/deployed-agents/{deploymentId}/chat`
3. **Uses existing layout** with left sidebar navigation intact
4. **Shows deployed agent chat** in main content area

### **Layout Features:**
- ✅ **Left Sidebar Navigation** - All existing nav links remain accessible
- ✅ **Top Header** - User profile, notifications, etc.
- ✅ **Main Content Area** - Deployed agent chat interface
- ✅ **Responsive Design** - Adapts to sidebar collapse/expand
- ✅ **Consistent Styling** - Matches existing Promethios theme

### **Content Layout:**
- **Left 60%**: Chat interface with governance metrics
- **Right 40%**: API documentation and instructions
- **Top Header**: Agent status, uptime, API key, actions

### **Key Benefits:**
1. **Familiar Navigation** - Users can still access all Promethios features
2. **Consistent Experience** - Same layout as other pages
3. **Easy Navigation** - Can switch between deployed agent and other features
4. **Professional Appearance** - Integrated into main application

The page will feel like a natural part of the Promethios application while providing the specialized deployed agent functionality!

