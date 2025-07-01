/**
 * Contextual Status Widget
 * 
 * Shows relevant status information and actions based on the current page context.
 * Provides deep integration between Deploy, Integrations, Data Management, and Governance pages.
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
  AlertTitle,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  ExpandMore,
  CloudUpload,
  Integration,
  Storage,
  Security,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Launch,
  Settings,
  Timeline,
  Speed,
  Shield,
  MonitorHeart,
  Api,
  Cloud,
  DataUsage,
  Notifications,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { enhancedDeploymentService } from '../../modules/agent-wrapping/services/EnhancedDeploymentService';
import { deployedAgentDataProcessor } from '../../services/DeployedAgentDataProcessor';

interface ContextualData {
  pageType: 'deploy' | 'integrations' | 'data-management' | 'governance';
  primaryMetrics: MetricItem[];
  statusItems: StatusItem[];
  actionItems: ActionItem[];
  relatedPages: RelatedPage[];
  alerts: AlertItem[];
}

interface MetricItem {
  id: string;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'error';
  tooltip: string;
  icon: React.ReactNode;
}

interface StatusItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  progress?: number;
  details?: string[];
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  disabled?: boolean;
}

interface RelatedPage {
  id: string;
  title: string;
  description: string;
  path: string;
  relevance: string;
  icon: React.ReactNode;
  badge?: string;
}

interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  actionText?: string;
  actionPath?: string;
}

const ContextualStatusWidget: React.FC = () => {
  const [contextualData, setContextualData] = useState<ContextualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | false>(false);

  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    loadContextualData();
  }, [currentUser, location.pathname]);

  const loadContextualData = async () => {
    if (!currentUser) {
      setContextualData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const pageType = getPageType(location.pathname);
      const data = await generateContextualData(pageType);
      setContextualData(data);
    } catch (error) {
      console.error('Failed to load contextual data:', error);
      setContextualData(null);
    } finally {
      setLoading(false);
    }
  };

  const getPageType = (pathname: string): ContextualData['pageType'] => {
    if (pathname.includes('/deploy')) return 'deploy';
    if (pathname.includes('/integrations')) return 'integrations';
    if (pathname.includes('/data-management')) return 'data-management';
    if (pathname.includes('/governance')) return 'governance';
    return 'deploy'; // Default
  };

  const generateContextualData = async (pageType: ContextualData['pageType']): Promise<ContextualData> => {
    // Load base data
    const deployments = await enhancedDeploymentService.listRealDeployments(currentUser!.uid);
    const processedData = await deployedAgentDataProcessor.getUserProcessedData(currentUser!.uid);

    switch (pageType) {
      case 'deploy':
        return generateDeployPageContext(deployments, processedData);
      case 'integrations':
        return generateIntegrationsPageContext(deployments, processedData);
      case 'data-management':
        return generateDataManagementPageContext(deployments, processedData);
      case 'governance':
        return generateGovernancePageContext(deployments, processedData);
      default:
        return generateDeployPageContext(deployments, processedData);
    }
  };

  const generateDeployPageContext = (deployments: any[], processedData: any[]): ContextualData => {
    const activeDeployments = deployments.filter(d => d.status === 'deployed');
    const healthyAgents = processedData.filter(d => d.health.status === 'healthy');
    const criticalAgents = processedData.filter(d => d.health.status === 'critical');

    return {
      pageType: 'deploy',
      primaryMetrics: [
        {
          id: 'total-deployments',
          label: 'Total Deployments',
          value: deployments.length,
          status: deployments.length > 0 ? 'good' : 'warning',
          tooltip: 'Total number of deployed agents across all environments',
          icon: <CloudUpload />
        },
        {
          id: 'active-deployments',
          label: 'Active',
          value: activeDeployments.length,
          status: activeDeployments.length > 0 ? 'good' : 'warning',
          tooltip: 'Currently running and responsive deployments',
          icon: <CheckCircle />
        },
        {
          id: 'healthy-agents',
          label: 'Healthy',
          value: healthyAgents.length,
          status: healthyAgents.length === deployments.length ? 'good' : 'warning',
          tooltip: 'Agents with good health scores and no critical issues',
          icon: <MonitorHeart />
        },
        {
          id: 'critical-agents',
          label: 'Critical Issues',
          value: criticalAgents.length,
          status: criticalAgents.length === 0 ? 'good' : 'error',
          tooltip: 'Agents requiring immediate attention',
          icon: <Warning />
        }
      ],
      statusItems: deployments.slice(0, 3).map(deployment => ({
        id: deployment.deploymentId,
        title: `Agent ${deployment.deploymentId.split('-').pop()}`,
        description: `${deployment.status} • ${deployment.reportingStatus} reporting`,
        status: deployment.status === 'deployed' ? 'active' : 'error',
        details: [
          `Health: ${deployment.metrics?.healthStatus || 'Unknown'}`,
          `Last heartbeat: ${deployment.lastHeartbeat ? new Date(deployment.lastHeartbeat).toLocaleTimeString() : 'Never'}`,
          `Violations: ${deployment.violationsReported || 0}`
        ]
      })),
      actionItems: [
        {
          id: 'deploy-new',
          title: 'Deploy New Agent',
          description: 'Create and deploy a new governed agent',
          action: () => {/* Open deployment wizard */},
          priority: 'high',
          icon: <CloudUpload />,
          disabled: false
        },
        {
          id: 'configure-integrations',
          title: 'Configure Integrations',
          description: 'Set up cloud providers for easier deployment',
          action: () => {/* Navigate to integrations */},
          priority: 'medium',
          icon: <Integration />
        }
      ],
      relatedPages: [
        {
          id: 'integrations',
          title: 'Cloud Integrations',
          description: 'Configure AWS, GCP, Azure for direct deployment',
          path: '/settings/integrations',
          relevance: 'Simplify deployment process',
          icon: <Integration />,
          badge: deployments.length === 0 ? 'Setup Required' : undefined
        },
        {
          id: 'governance',
          title: 'Governance Overview',
          description: 'Monitor deployed agent governance metrics',
          path: '/governance/overview',
          relevance: 'View real-time governance data',
          icon: <Security />,
          badge: criticalAgents.length > 0 ? `${criticalAgents.length} Alert${criticalAgents.length === 1 ? '' : 's'}` : undefined
        }
      ],
      alerts: criticalAgents.length > 0 ? [
        {
          id: 'critical-agents',
          title: 'Critical Agent Issues',
          message: `${criticalAgents.length} agent${criticalAgents.length === 1 ? '' : 's'} require immediate attention`,
          severity: 'error',
          actionText: 'View Governance Dashboard',
          actionPath: '/governance/overview'
        }
      ] : []
    };
  };

  const generateIntegrationsPageContext = (deployments: any[], processedData: any[]): ContextualData => {
    // Mock integration data - would come from real integration service
    const configuredIntegrations = 2;
    const activeIntegrations = 1;
    const deploymentsUsingIntegrations = deployments.filter(d => d.deploymentMethod?.type === 'integration').length;

    return {
      pageType: 'integrations',
      primaryMetrics: [
        {
          id: 'configured-integrations',
          label: 'Configured',
          value: configuredIntegrations,
          status: configuredIntegrations > 0 ? 'good' : 'warning',
          tooltip: 'Number of cloud provider integrations configured',
          icon: <Integration />
        },
        {
          id: 'active-integrations',
          label: 'Active',
          value: activeIntegrations,
          status: activeIntegrations > 0 ? 'good' : 'warning',
          tooltip: 'Currently active and functional integrations',
          icon: <CheckCircle />
        },
        {
          id: 'deployments-using',
          label: 'Deployments Using',
          value: deploymentsUsingIntegrations,
          status: 'good',
          tooltip: 'Number of deployments using cloud integrations',
          icon: <CloudUpload />
        }
      ],
      statusItems: [
        {
          id: 'aws-integration',
          title: 'AWS Integration',
          description: 'Amazon Web Services deployment integration',
          status: 'active',
          progress: 100,
          details: ['Configured', 'Active', `${deploymentsUsingIntegrations} deployments using`]
        },
        {
          id: 'gcp-integration',
          title: 'GCP Integration',
          description: 'Google Cloud Platform deployment integration',
          status: 'inactive',
          progress: 0,
          details: ['Not configured', 'Setup required']
        }
      ],
      actionItems: [
        {
          id: 'setup-gcp',
          title: 'Setup GCP Integration',
          description: 'Configure Google Cloud Platform for deployment',
          action: () => {/* Open GCP setup */},
          priority: 'medium',
          icon: <Cloud />
        },
        {
          id: 'test-integrations',
          title: 'Test Integrations',
          description: 'Verify all configured integrations are working',
          action: () => {/* Run integration tests */},
          priority: 'low',
          icon: <Assessment />
        }
      ],
      relatedPages: [
        {
          id: 'deploy',
          title: 'Agent Deployments',
          description: 'Deploy agents using configured integrations',
          path: '/agents/deploy',
          relevance: 'Use integrations for deployment',
          icon: <CloudUpload />,
          badge: deployments.length === 0 ? 'No Deployments' : `${deployments.length} Deployed`
        },
        {
          id: 'data-management',
          title: 'Data Management',
          description: 'Configure data flow from integrated deployments',
          path: '/settings/data-management',
          relevance: 'Manage integration data flow',
          icon: <Storage />
        }
      ],
      alerts: configuredIntegrations === 0 ? [
        {
          id: 'no-integrations',
          title: 'No Integrations Configured',
          message: 'Set up cloud provider integrations to simplify deployment',
          severity: 'info',
          actionText: 'Configure AWS',
          actionPath: '/settings/integrations#aws'
        }
      ] : []
    };
  };

  const generateDataManagementPageContext = (deployments: any[], processedData: any[]): ContextualData => {
    const staleData = processedData.filter(d => d.dataQuality.freshness === 'stale').length;
    const offlineAgents = processedData.filter(d => d.dataQuality.freshness === 'offline').length;
    const totalDataPoints = processedData.reduce((sum, d) => sum + (d.metricsReceived || 0), 0);

    return {
      pageType: 'data-management',
      primaryMetrics: [
        {
          id: 'data-sources',
          label: 'Data Sources',
          value: deployments.length,
          status: deployments.length > 0 ? 'good' : 'warning',
          tooltip: 'Number of deployed agents reporting data',
          icon: <DataUsage />
        },
        {
          id: 'data-freshness',
          label: 'Fresh Data',
          value: processedData.length - staleData - offlineAgents,
          status: staleData === 0 ? 'good' : 'warning',
          tooltip: 'Agents with recent data (< 5 minutes old)',
          icon: <Speed />
        },
        {
          id: 'total-metrics',
          label: 'Total Metrics',
          value: totalDataPoints,
          status: 'good',
          tooltip: 'Total data points collected from all agents',
          icon: <Assessment />
        },
        {
          id: 'data-issues',
          label: 'Data Issues',
          value: staleData + offlineAgents,
          status: staleData + offlineAgents === 0 ? 'good' : 'error',
          tooltip: 'Agents with stale or missing data',
          icon: <Warning />
        }
      ],
      statusItems: [
        {
          id: 'data-collection',
          title: 'Data Collection',
          description: 'Real-time metrics collection from deployed agents',
          status: deployments.length > 0 ? 'active' : 'inactive',
          progress: deployments.length > 0 ? 85 : 0,
          details: [
            `${deployments.length} agents reporting`,
            `${totalDataPoints} metrics collected`,
            `${processedData.length - staleData} agents with fresh data`
          ]
        },
        {
          id: 'data-retention',
          title: 'Data Retention',
          description: 'Automated data lifecycle management',
          status: 'active',
          progress: 100,
          details: ['7 days real-time logs', '90 days historical data', '1 year archived data']
        }
      ],
      actionItems: [
        {
          id: 'export-data',
          title: 'Export Data',
          description: 'Download governance and metrics data',
          action: () => {/* Open export dialog */},
          priority: 'medium',
          icon: <Launch />
        },
        {
          id: 'configure-retention',
          title: 'Configure Retention',
          description: 'Adjust data retention policies',
          action: () => {/* Open retention settings */},
          priority: 'low',
          icon: <Settings />
        }
      ],
      relatedPages: [
        {
          id: 'governance',
          title: 'Governance Dashboard',
          description: 'View processed governance metrics and trends',
          path: '/governance/overview',
          relevance: 'Analyze collected data',
          icon: <Security />,
          badge: processedData.length > 0 ? 'Live Data' : 'No Data'
        },
        {
          id: 'deploy',
          title: 'Agent Deployments',
          description: 'Manage agents that provide data',
          path: '/agents/deploy',
          relevance: 'Data source management',
          icon: <CloudUpload />,
          badge: staleData > 0 ? `${staleData} Stale` : undefined
        }
      ],
      alerts: offlineAgents > 0 ? [
        {
          id: 'offline-agents',
          title: 'Offline Agents Detected',
          message: `${offlineAgents} agent${offlineAgents === 1 ? '' : 's'} stopped reporting data`,
          severity: 'warning',
          actionText: 'Check Deployments',
          actionPath: '/agents/deploy'
        }
      ] : []
    };
  };

  const generateGovernancePageContext = (deployments: any[], processedData: any[]): ContextualData => {
    const avgTrustScore = processedData.length > 0 
      ? Math.round(processedData.reduce((sum, d) => sum + d.metrics.trustScore, 0) / processedData.length)
      : 0;
    const totalViolations = processedData.reduce((sum, d) => sum + d.violations.total, 0);
    const criticalViolations = processedData.reduce((sum, d) => sum + d.violations.critical, 0);
    const avgComplianceRate = processedData.length > 0
      ? Math.round(processedData.reduce((sum, d) => sum + d.metrics.complianceRate, 0) / processedData.length)
      : 100;

    return {
      pageType: 'governance',
      primaryMetrics: [
        {
          id: 'avg-trust-score',
          label: 'Avg Trust Score',
          value: `${avgTrustScore}%`,
          status: avgTrustScore >= 80 ? 'good' : avgTrustScore >= 60 ? 'warning' : 'error',
          tooltip: 'Average trust score across all deployed agents',
          icon: <Shield />
        },
        {
          id: 'compliance-rate',
          label: 'Compliance Rate',
          value: `${avgComplianceRate}%`,
          status: avgComplianceRate >= 95 ? 'good' : avgComplianceRate >= 85 ? 'warning' : 'error',
          tooltip: 'Overall policy compliance rate',
          icon: <Security />
        },
        {
          id: 'total-violations',
          label: 'Total Violations',
          value: totalViolations,
          status: totalViolations === 0 ? 'good' : 'warning',
          tooltip: 'Total policy violations across all agents',
          icon: <Warning />
        },
        {
          id: 'critical-violations',
          label: 'Critical',
          value: criticalViolations,
          status: criticalViolations === 0 ? 'good' : 'error',
          tooltip: 'Critical violations requiring immediate attention',
          icon: <Error />
        }
      ],
      statusItems: processedData.slice(0, 3).map(data => ({
        id: data.agentId,
        title: `Agent ${data.agentId.split('-').pop()}`,
        description: `Trust: ${data.metrics.trustScore}% • Compliance: ${data.metrics.complianceRate}%`,
        status: data.health.status === 'healthy' ? 'active' : 'error',
        details: [
          `Health: ${data.health.status}`,
          `Violations: ${data.violations.total}`,
          `Data freshness: ${data.dataQuality.freshness}`
        ]
      })),
      actionItems: [
        {
          id: 'review-violations',
          title: 'Review Violations',
          description: 'Investigate and address policy violations',
          action: () => {/* Navigate to violations page */},
          priority: criticalViolations > 0 ? 'high' : 'medium',
          icon: <Assessment />,
          disabled: totalViolations === 0
        },
        {
          id: 'update-policies',
          title: 'Update Policies',
          description: 'Review and modify governance policies',
          action: () => {/* Navigate to policies page */},
          priority: 'medium',
          icon: <Settings />
        }
      ],
      relatedPages: [
        {
          id: 'deploy',
          title: 'Agent Deployments',
          description: 'Manage agents providing governance data',
          path: '/agents/deploy',
          relevance: 'Source of governance metrics',
          icon: <CloudUpload />,
          badge: processedData.length > 0 ? `${processedData.length} Monitored` : 'No Data'
        },
        {
          id: 'data-management',
          title: 'Data Management',
          description: 'Configure governance data collection and retention',
          path: '/settings/data-management',
          relevance: 'Governance data pipeline',
          icon: <Storage />
        }
      ],
      alerts: criticalViolations > 0 ? [
        {
          id: 'critical-violations',
          title: 'Critical Violations Detected',
          message: `${criticalViolations} critical violation${criticalViolations === 1 ? '' : 's'} require immediate attention`,
          severity: 'error',
          actionText: 'View Violations',
          actionPath: '/governance/violations'
        }
      ] : avgTrustScore < 70 ? [
        {
          id: 'low-trust',
          title: 'Low Trust Scores',
          message: 'Average trust score is below recommended threshold',
          severity: 'warning',
          actionText: 'Review Policies',
          actionPath: '/governance/policies'
        }
      ] : []
    };
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': case 'active': return '#10b981';
      case 'warning': case 'pending': return '#f59e0b';
      case 'error': case 'inactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': case 'active': return <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />;
      case 'warning': case 'pending': return <Warning sx={{ color: '#f59e0b', fontSize: 16 }} />;
      case 'error': case 'inactive': return <Error sx={{ color: '#ef4444', fontSize: 16 }} />;
      default: return <Info sx={{ color: '#6b7280', fontSize: 16 }} />;
    }
  };

  if (loading) {
    return (
      <Card sx={{ 
        backgroundColor: '#2d3748', 
        border: '1px solid #4a5568',
        borderRadius: '12px'
      }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ color: '#a0aec0', mt: 2 }}>
            Loading contextual data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!contextualData) {
    return null;
  }

  return (
    <Card sx={{ 
      backgroundColor: '#2d3748', 
      border: '1px solid #4a5568',
      borderRadius: '12px'
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, textTransform: 'capitalize' }}>
            {contextualData.pageType.replace('-', ' ')} Status
          </Typography>
          <IconButton 
            size="small" 
            onClick={loadContextualData}
            sx={{ color: '#a0aec0' }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>

        {/* Alerts */}
        {contextualData.alerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {contextualData.alerts.map((alert) => (
              <Alert 
                key={alert.id}
                severity={alert.severity}
                sx={{ 
                  mb: 1,
                  backgroundColor: alert.severity === 'error' ? '#7f1d1d' : 
                                  alert.severity === 'warning' ? '#78350f' : '#1e3a8a',
                  color: 'white'
                }}
                action={
                  alert.actionText && alert.actionPath ? (
                    <Button 
                      color="inherit" 
                      size="small"
                      onClick={() => window.location.href = alert.actionPath!}
                    >
                      {alert.actionText}
                    </Button>
                  ) : undefined
                }
              >
                <AlertTitle>{alert.title}</AlertTitle>
                {alert.message}
              </Alert>
            ))}
          </Box>
        )}

        {/* Primary Metrics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#a0aec0', mb: 2 }}>
            Key Metrics
          </Typography>
          <Grid container spacing={2}>
            {contextualData.primaryMetrics.map((metric) => (
              <Grid item xs={6} sm={3} key={metric.id}>
                <Tooltip title={metric.tooltip}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#374151', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: `1px solid ${getStatusColor(metric.status)}20`
                  }}>
                    <Box sx={{ color: getStatusColor(metric.status), mb: 1 }}>
                      {metric.icon}
                    </Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      {metric.label}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Accordions */}
        {contextualData.statusItems.length > 0 && (
          <Accordion 
            expanded={expanded === 'status'} 
            onChange={handleAccordionChange('status')}
            sx={{ backgroundColor: '#374151', color: 'white', mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="subtitle2">Status Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {contextualData.statusItems.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemIcon>
                      {getStatusIcon(item.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {item.description}
                          </Typography>
                          {item.progress !== undefined && (
                            <LinearProgress 
                              variant="determinate" 
                              value={item.progress} 
                              sx={{ mt: 1, backgroundColor: '#4a5568' }}
                            />
                          )}
                          {item.details && (
                            <Box sx={{ mt: 1 }}>
                              {item.details.map((detail, index) => (
                                <Typography key={index} variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                  • {detail}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                      sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {contextualData.actionItems.length > 0 && (
          <Accordion 
            expanded={expanded === 'actions'} 
            onChange={handleAccordionChange('actions')}
            sx={{ backgroundColor: '#374151', color: 'white', mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="subtitle2">Recommended Actions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {contextualData.actionItems.map((action) => (
                  <Button
                    key={action.id}
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={action.action}
                    disabled={action.disabled}
                    sx={{
                      justifyContent: 'flex-start',
                      borderColor: action.priority === 'high' ? '#ef4444' : 
                                  action.priority === 'medium' ? '#f59e0b' : '#3b82f6',
                      color: 'white',
                      '&:hover': { backgroundColor: '#4b5563' },
                    }}
                  >
                    <Box sx={{ textAlign: 'left', flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        {action.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {contextualData.relatedPages.length > 0 && (
          <Accordion 
            expanded={expanded === 'related'} 
            onChange={handleAccordionChange('related')}
            sx={{ backgroundColor: '#374151', color: 'white' }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="subtitle2">Related Pages</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {contextualData.relatedPages.map((page) => (
                  <ListItem 
                    key={page.id}
                    button
                    onClick={() => window.location.href = page.path}
                  >
                    <ListItemIcon>
                      {page.badge ? (
                        <Badge badgeContent={page.badge} color="error">
                          {page.icon}
                        </Badge>
                      ) : (
                        page.icon
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={page.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {page.description}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {page.relevance}
                          </Typography>
                        </Box>
                      }
                      sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                    />
                    <Launch sx={{ color: '#a0aec0' }} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default ContextualStatusWidget;

