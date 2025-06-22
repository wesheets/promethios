/**
 * Auto-Discovery Wizard Step
 * Automatically discovers agent capabilities from API endpoints
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as CapabilityIcon,
  Api as ApiIcon,
  Security as GovernanceIcon,
  Speed as PerformanceIcon,
  Code as ToolIcon,
  Language as ModelIcon
} from '@mui/icons-material';
import { ExtendedWizardFormData, AgentIntrospectionData } from '../types/introspection';

interface AutoDiscoveryStepProps {
  formData: ExtendedWizardFormData;
  onUpdate: (updates: Partial<ExtendedWizardFormData>) => void;
  onDiscover: (apiKey: string, baseUrl: string, provider: string) => Promise<AgentIntrospectionData | null>;
  discovering: boolean;
}

export const AutoDiscoveryStep: React.FC<AutoDiscoveryStepProps> = ({
  formData,
  onUpdate,
  onDiscover,
  discovering
}) => {
  const [discoveryComplete, setDiscoveryComplete] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [autoDiscoveryEnabled, setAutoDiscoveryEnabled] = useState(true);

  // Auto-discover when step loads if enabled
  useEffect(() => {
    if (autoDiscoveryEnabled && formData.apiKey && formData.baseUrl && formData.provider && !formData.discoveredCapabilities) {
      handleDiscover();
    }
  }, [formData.apiKey, formData.baseUrl, formData.provider, autoDiscoveryEnabled]);

  const handleDiscover = async () => {
    try {
      setDiscoveryError(null);
      const introspectionData = await onDiscover(formData.apiKey, formData.baseUrl, formData.provider);
      
      if (introspectionData) {
        onUpdate({ 
          discoveredCapabilities: introspectionData,
          // Auto-populate fields from discovery
          agentName: formData.agentName || introspectionData.agentInfo?.name || 'Discovered Agent',
          description: formData.description || introspectionData.agentInfo?.description || 'Auto-discovered agent',
          version: formData.version || introspectionData.agentInfo?.version || '1.0.0',
          tags: [...(formData.tags || []), ...(introspectionData.tags || [])]
        });
        setDiscoveryComplete(true);
      } else {
        setDiscoveryError('No capabilities could be discovered from the API endpoint');
      }
    } catch (error) {
      setDiscoveryError(error instanceof Error ? error.message : 'Discovery failed');
      setDiscoveryComplete(false);
    }
  };

  const renderDiscoveryStatus = () => {
    if (discovering) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Discovering Agent Capabilities...</AlertTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">
              Analyzing API endpoints and discovering available capabilities...
            </Typography>
          </Box>
          <LinearProgress sx={{ mt: 2 }} />
        </Alert>
      );
    }

    if (discoveryError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Discovery Failed</AlertTitle>
          {discoveryError}
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleDiscover}
            sx={{ mt: 1 }}
            size="small"
          >
            Retry Discovery
          </Button>
        </Alert>
      );
    }

    if (discoveryComplete && formData.discoveredCapabilities) {
      return (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Discovery Complete!</AlertTitle>
          Successfully discovered {Object.keys(formData.discoveredCapabilities.capabilities || {}).filter(k => 
            formData.discoveredCapabilities?.capabilities?.[k as keyof typeof formData.discoveredCapabilities.capabilities]
          ).length} capabilities and {formData.discoveredCapabilities.tools?.length || 0} tools.
        </Alert>
      );
    }

    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>Ready for Discovery</AlertTitle>
        Click "Discover Capabilities" to automatically analyze the agent's API and discover its capabilities.
      </Alert>
    );
  };

  const renderCapabilities = () => {
    if (!formData.discoveredCapabilities?.capabilities) return null;

    const capabilities = formData.discoveredCapabilities.capabilities;
    const capabilityList = [
      { key: 'canGenerateText', label: 'Text Generation', icon: <CapabilityIcon /> },
      { key: 'canGenerateCode', label: 'Code Generation', icon: <CodeIcon /> },
      { key: 'canAnalyzeData', label: 'Data Analysis', icon: <PerformanceIcon /> },
      { key: 'canGenerateImages', label: 'Image Generation', icon: <CapabilityIcon /> },
      { key: 'canProcessImages', label: 'Image Processing', icon: <CapabilityIcon /> },
      { key: 'canAccessInternet', label: 'Internet Access', icon: <ApiIcon /> },
      { key: 'supportsMultimodal', label: 'Multimodal Support', icon: <CapabilityIcon /> },
      { key: 'supportsFunctionCalling', label: 'Function Calling', icon: <ToolIcon /> },
      { key: 'supportsStreaming', label: 'Streaming Responses', icon: <PerformanceIcon /> }
    ];

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <CapabilityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Discovered Capabilities
          </Typography>
          <Grid container spacing={1}>
            {capabilityList.map(({ key, label, icon }) => {
              const hasCapability = capabilities[key as keyof typeof capabilities];
              return (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Chip
                    icon={icon}
                    label={label}
                    color={hasCapability ? 'success' : 'default'}
                    variant={hasCapability ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderTools = () => {
    if (!formData.discoveredCapabilities?.tools?.length) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ToolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Available Tools ({formData.discoveredCapabilities.tools.length})
          </Typography>
          <List dense>
            {formData.discoveredCapabilities.tools.map((tool, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <ToolIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={tool.name}
                  secondary={tool.description}
                />
                {tool.verified && (
                  <ListItemSecondaryAction>
                    <CheckIcon color="success" />
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  const renderModelInfo = () => {
    if (!formData.discoveredCapabilities?.modelInfo) return null;

    const { modelInfo } = formData.discoveredCapabilities;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <ModelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Model Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">Model Name</Typography>
              <Typography variant="body1">{modelInfo.name || 'Unknown'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">Context Length</Typography>
              <Typography variant="body1">{modelInfo.contextLength?.toLocaleString() || 'Unknown'} tokens</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">Input Cost</Typography>
              <Typography variant="body1">${modelInfo.inputCostPer1kTokens || 'Unknown'} per 1K tokens</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">Output Cost</Typography>
              <Typography variant="body1">${modelInfo.outputCostPer1kTokens || 'Unknown'} per 1K tokens</Typography>
            </Grid>
            {modelInfo.supportedLanguages && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Supported Languages</Typography>
                <Box sx={{ mt: 1 }}>
                  {modelInfo.supportedLanguages.map((lang, index) => (
                    <Chip key={index} label={lang} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderGovernanceCompatibility = () => {
    if (!formData.discoveredCapabilities?.governanceCompatibility) return null;

    const { governanceCompatibility } = formData.discoveredCapabilities;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <GovernanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Governance Compatibility
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemIcon>
                {governanceCompatibility.supportsAuditLogging ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Audit Logging" secondary="Tracks all interactions for compliance" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {governanceCompatibility.supportsPolicyEnforcement ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Policy Enforcement" secondary="Can enforce governance policies" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {governanceCompatibility.supportsContentFiltering ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Content Filtering" secondary="Can filter inappropriate content" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {governanceCompatibility.supportsRateLimiting ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Rate Limiting" secondary="Supports usage rate limiting" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Auto-Discovery
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Automatically discover your agent's capabilities, tools, and governance compatibility.
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={autoDiscoveryEnabled}
            onChange={(e) => setAutoDiscoveryEnabled(e.target.checked)}
          />
        }
        label="Enable automatic discovery"
        sx={{ mb: 2 }}
      />

      {renderDiscoveryStatus()}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleDiscover}
          disabled={discovering || !formData.apiKey || !formData.baseUrl}
          startIcon={discovering ? <CircularProgress size={20} /> : <RefreshIcon />}
        >
          {discovering ? 'Discovering...' : 'Discover Capabilities'}
        </Button>
        
        {discoveryComplete && (
          <Button
            variant="outlined"
            onClick={handleDiscover}
            startIcon={<RefreshIcon />}
          >
            Re-discover
          </Button>
        )}
      </Box>

      {formData.discoveredCapabilities && (
        <Box>
          {renderCapabilities()}
          {renderTools()}
          {renderModelInfo()}
          {renderGovernanceCompatibility()}
        </Box>
      )}

      {!formData.discoveredCapabilities && !discovering && (
        <Alert severity="info">
          <AlertTitle>Manual Configuration Available</AlertTitle>
          If auto-discovery fails, you can manually configure the agent capabilities in the next steps.
        </Alert>
      )}
    </Box>
  );
};

