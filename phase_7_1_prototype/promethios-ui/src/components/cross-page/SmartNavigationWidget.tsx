/**
 * Smart Navigation Widget
 * 
 * Provides contextual navigation between Deploy, Integrations, and Data Management pages.
 * Shows relevant actions and status across the deployment pipeline.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Launch,
  Settings,
  Storage,
  CloudUpload,
  Integration,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info,
  ArrowForward,
  Refresh,
  Notifications,
  Security,
  Speed,
  Timeline,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { enhancedDeploymentService } from '../../modules/agent-wrapping/services/EnhancedDeploymentService';
import { deployedAgentDataProcessor } from '../../services/DeployedAgentDataProcessor';

interface NavigationContext {
  currentPage: 'deploy' | 'integrations' | 'data-management' | 'governance' | 'other';
  deploymentCount: number;
  activeIntegrations: number;
  dataIssues: number;
  governanceAlerts: number;
  suggestedActions: SuggestedAction[];
}

interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  targetPage: string;
  targetPath: string;
  icon: React.ReactNode;
  actionType: 'setup' | 'configure' | 'monitor' | 'fix';
}

interface IntegrationStatus {
  provider: string;
  configured: boolean;
  active: boolean;
  deploymentsUsing: number;
}

const SmartNavigationWidget: React.FC = () => {
  const [context, setContext] = useState<NavigationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [integrationStatuses, setIntegrationStatuses] = useState<IntegrationStatus[]>([]);
  const [expanded, setExpanded] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    loadNavigationContext();
  }, [currentUser, location.pathname]);

  const loadNavigationContext = async () => {
    if (!currentUser) {
      setContext(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Determine current page
      const currentPage = getCurrentPage(location.pathname);

      // Load deployment data
      const deployments = await enhancedDeploymentService.listRealDeployments(currentUser.uid);
      
      // Load processed agent data for governance alerts
      const processedData = await deployedAgentDataProcessor.getUserProcessedData(currentUser.uid);
      
      // Count governance alerts
      const governanceAlerts = processedData.filter(data => 
        data.health.status === 'critical' || 
        data.violations.critical > 0 ||
        data.dataQuality.freshness === 'offline'
      ).length;

      // Load integration statuses
      const integrations = await loadIntegrationStatuses();
      setIntegrationStatuses(integrations);

      // Generate suggested actions
      const suggestedActions = generateSuggestedActions(
        currentPage,
        deployments.length,
        integrations,
        processedData,
        governanceAlerts
      );

      setContext({
        currentPage,
        deploymentCount: deployments.length,
        activeIntegrations: integrations.filter(i => i.active).length,
        dataIssues: processedData.filter(data => data.dataQuality.freshness === 'stale').length,
        governanceAlerts,
        suggestedActions
      });

    } catch (error) {
      console.error('Failed to load navigation context:', error);
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPage = (pathname: string): NavigationContext['currentPage'] => {
    if (pathname.includes('/deploy')) return 'deploy';
    if (pathname.includes('/integrations')) return 'integrations';
    if (pathname.includes('/data-management')) return 'data-management';
    if (pathname.includes('/governance')) return 'governance';
    return 'other';
  };

  const loadIntegrationStatuses = async (): Promise<IntegrationStatus[]> => {
    // This would integrate with your existing integrations system
    // For now, return example structure
    return [
      { provider: 'AWS', configured: true, active: true, deploymentsUsing: 2 },
      { provider: 'GCP', configured: false, active: false, deploymentsUsing: 0 },
      { provider: 'Azure', configured: true, active: false, deploymentsUsing: 0 },
    ];
  };

  const generateSuggestedActions = (
    currentPage: NavigationContext['currentPage'],
    deploymentCount: number,
    integrations: IntegrationStatus[],
    processedData: any[],
    governanceAlerts: number
  ): SuggestedAction[] => {
    const actions: SuggestedAction[] = [];

    // Page-specific suggestions
    switch (currentPage) {
      case 'deploy':
        if (deploymentCount === 0) {
          actions.push({
            id: 'first-deployment',
            title: 'Deploy Your First Agent',
            description: 'Create and deploy your first governed agent',
            priority: 'high',
            targetPage: 'Agent Wrapping',
            targetPath: '/agents/wrapping',
            icon: <CloudUpload />,
            actionType: 'setup'
          });
        }

        if (integrations.filter(i => i.configured).length === 0) {
          actions.push({
            id: 'setup-integrations',
            title: 'Configure Cloud Integrations',
            description: 'Set up AWS, GCP, or Azure for easier deployment',
            priority: 'medium',
            targetPage: 'Integrations',
            targetPath: '/settings/integrations',
            icon: <Integration />,
            actionType: 'configure'
          });
        }
        break;

      case 'integrations':
        if (deploymentCount > 0 && integrations.filter(i => i.active).length === 0) {
          actions.push({
            id: 'activate-integrations',
            title: 'Activate Configured Integrations',
            description: 'Enable integrations for your existing deployments',
            priority: 'medium',
            targetPage: 'Deploy',
            targetPath: '/agents/deploy',
            icon: <Launch />,
            actionType: 'configure'
          });
        }
        break;

      case 'data-management':
        if (processedData.length > 0) {
          actions.push({
            id: 'view-governance',
            title: 'Monitor Governance Dashboard',
            description: 'View real-time governance metrics from your deployed agents',
            priority: 'medium',
            targetPage: 'Governance Overview',
            targetPath: '/governance/overview',
            icon: <Assessment />,
            actionType: 'monitor'
          });
        }
        break;

      case 'governance':
        if (governanceAlerts > 0) {
          actions.push({
            id: 'fix-governance-issues',
            title: 'Address Governance Alerts',
            description: `${governanceAlerts} agent${governanceAlerts === 1 ? '' : 's'} need attention`,
            priority: 'high',
            targetPage: 'Deploy',
            targetPath: '/agents/deploy',
            icon: <Warning />,
            actionType: 'fix'
          });
        }
        break;
    }

    // Global suggestions
    if (governanceAlerts > 0 && currentPage !== 'governance') {
      actions.push({
        id: 'check-governance',
        title: 'Governance Alerts',
        description: `${governanceAlerts} critical issue${governanceAlerts === 1 ? '' : 's'} detected`,
        priority: 'high',
        targetPage: 'Governance Overview',
        targetPath: '/governance/overview',
        icon: <Security />,
        actionType: 'fix'
      });
    }

    return actions.slice(0, 4); // Limit to 4 suggestions
  };

  const handleActionClick = (action: SuggestedAction) => {
    navigate(action.targetPath);
  };

  const getStatusColor = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />;
      case 'warning': return <Warning sx={{ color: '#f59e0b', fontSize: 16 }} />;
      case 'error': return <Error sx={{ color: '#ef4444', fontSize: 16 }} />;
      default: return <Info sx={{ color: '#6b7280', fontSize: 16 }} />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <Card sx={{ 
        backgroundColor: '#2d3748', 
        border: '1px solid #4a5568',
        borderRadius: '12px'
      }}>
        <CardContent sx={{ p: 2, textAlign: 'center' }}>
          <CircularProgress size={24} />
        </CardContent>
      </Card>
    );
  }

  if (!context) {
    return null;
  }

  return (
    <Card sx={{ 
      backgroundColor: '#2d3748', 
      border: '1px solid #4a5568',
      borderRadius: '12px',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: '#718096',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }
    }}>
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
            Pipeline Status
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh status">
              <IconButton 
                size="small" 
                onClick={loadNavigationContext}
                sx={{ color: '#a0aec0' }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={expanded ? "Collapse" : "Expand details"}>
              <IconButton 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                sx={{ color: '#a0aec0' }}
              >
                <ArrowForward 
                  fontSize="small" 
                  sx={{ 
                    transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }} 
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Status Overview */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Tooltip title={`${context.deploymentCount} deployed agent${context.deploymentCount === 1 ? '' : 's'}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CloudUpload sx={{ fontSize: 16, color: context.deploymentCount > 0 ? '#10b981' : '#6b7280' }} />
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                {context.deploymentCount}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`${context.activeIntegrations} active integration${context.activeIntegrations === 1 ? '' : 's'}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Integration sx={{ fontSize: 16, color: context.activeIntegrations > 0 ? '#10b981' : '#6b7280' }} />
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                {context.activeIntegrations}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`${context.dataIssues} data issue${context.dataIssues === 1 ? '' : 's'}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Storage sx={{ fontSize: 16, color: context.dataIssues > 0 ? '#f59e0b' : '#10b981' }} />
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                {context.dataIssues}
              </Typography>
            </Box>
          </Tooltip>

          {context.governanceAlerts > 0 && (
            <Tooltip title={`${context.governanceAlerts} governance alert${context.governanceAlerts === 1 ? '' : 's'}`}>
              <Badge badgeContent={context.governanceAlerts} color="error">
                <Security sx={{ fontSize: 16, color: '#ef4444' }} />
              </Badge>
            </Tooltip>
          )}
        </Stack>

        {/* Suggested Actions */}
        {context.suggestedActions.length > 0 && (
          <>
            <Divider sx={{ borderColor: '#4a5568', mb: 2 }} />
            <Typography variant="caption" sx={{ color: '#a0aec0', mb: 1, display: 'block' }}>
              Suggested Actions
            </Typography>
            <Stack spacing={1}>
              {context.suggestedActions.slice(0, expanded ? 4 : 2).map((action) => (
                <Box
                  key={action.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    backgroundColor: '#374151',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#4b5563',
                      transform: 'translateX(2px)'
                    }
                  }}
                  onClick={() => handleActionClick(action)}
                >
                  <Box sx={{ color: getPriorityColor(action.priority) }}>
                    {action.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ 
                      color: 'white', 
                      fontWeight: 500,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {action.title}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#a0aec0',
                      fontSize: '0.7rem',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {action.description}
                    </Typography>
                  </Box>
                  <Chip 
                    label={action.priority}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(action.priority),
                      color: 'white',
                      fontSize: '0.6rem',
                      height: 16,
                      '& .MuiChip-label': { px: 0.5 }
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </>
        )}

        {/* Quick Navigation */}
        {expanded && (
          <>
            <Divider sx={{ borderColor: '#4a5568', my: 2 }} />
            <Typography variant="caption" sx={{ color: '#a0aec0', mb: 1, display: 'block' }}>
              Quick Navigation
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => navigate('/agents/deploy')}
                sx={{
                  borderColor: '#4a5568',
                  color: '#a0aec0',
                  fontSize: '0.7rem',
                  '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
                }}
              >
                Deploy
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Integration />}
                onClick={() => navigate('/settings/integrations')}
                sx={{
                  borderColor: '#4a5568',
                  color: '#a0aec0',
                  fontSize: '0.7rem',
                  '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
                }}
              >
                Integrations
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => navigate('/governance/overview')}
                sx={{
                  borderColor: '#4a5568',
                  color: '#a0aec0',
                  fontSize: '0.7rem',
                  '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
                }}
              >
                Governance
              </Button>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartNavigationWidget;

