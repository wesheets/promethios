import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Breadcrumbs,
  Link,
  Divider,
  Alert
} from '@mui/material';
import {
  Search,
  ExpandMore,
  Article,
  Code,
  Settings,
  Security,
  Group,
  Policy,
  Assessment,
  Integration,
  Help,
  Launch,
  ContentCopy,
  CheckCircle,
  Warning,
  Info,
  Error as ErrorIcon,
  NavigateNext,
  Home,
  Api,
  Description,
  Build,
  CloudUpload
} from '@mui/icons-material';

interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'api-reference' | 'user-guides' | 'configuration' | 'troubleshooting';
  icon: React.ReactNode;
  content: string;
  lastUpdated: string;
  tags: string[];
  relatedSections?: string[];
}

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: string;
  responseExample?: string;
}

const DocumentationPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<DocumentationSection | null>(null);
  const [showSectionDialog, setShowSectionDialog] = useState<boolean>(false);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['Documentation']);

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: <Home /> },
    { id: 'user-guides', name: 'User Guides', icon: <Description /> },
    { id: 'api-reference', name: 'API Reference', icon: <Api /> },
    { id: 'configuration', name: 'Configuration', icon: <Settings /> },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: <Build /> }
  ];

  const documentationSections: DocumentationSection[] = [
    {
      id: 'platform-overview',
      title: 'Platform Overview',
      description: 'Introduction to Promethios and core concepts of AI governance',
      category: 'getting-started',
      icon: <Home />,
      content: `# Promethios Platform Overview

Promethios is a comprehensive AI governance platform that enables organizations to deploy, monitor, and govern AI agents with confidence. The platform provides four core areas:

## Core Sections

### 1. Agents
- **Agent Wrapping**: Transform existing AI agents with governance controls
- **My Agents**: Monitor and manage your deployed agent ecosystem  
- **Templates**: Quick-start templates for common agent types
- **Deploy**: Deploy agents with proper oversight and monitoring
- **Registry**: Browse and discover pre-built agent solutions
- **Benchmarks**: Evaluate agent performance and capabilities
- **Chat**: Interactive testing and communication with agents

### 2. Governance
- **Overview**: High-level governance metrics and health dashboard
- **Policies**: Create and manage governance policies and rules
- **Violations**: Monitor policy breaches and compliance issues
- **Reports**: Generate compliance reports and audit trails
- **Emotional Veritas**: Sentiment analysis and emotional governance

### 3. Trust Metrics
- **Overview**: Trust scoring dashboard with four dimensions
- **Boundaries**: Configure trust thresholds and safety limits
- **Attestations**: Manage verification chains and credibility records

### 4. Settings
- **User Profile**: Personal account and security settings
- **Preferences**: UI customization and notification preferences
- **Organization**: Team management and billing configuration
- **Integrations**: External system connections and API management
- **Data Management**: Export/import capabilities and data controls

## Trust Dimensions

Promethios evaluates trust across four key dimensions:
- **Competence**: Technical capability and accuracy
- **Reliability**: Consistency and dependability
- **Honesty**: Truthfulness and transparency in responses
- **Transparency**: Explainability and auditability of decisions`,
      lastUpdated: '2025-06-20',
      tags: ['overview', 'getting-started', 'platform'],
      relatedSections: ['navigation-guide', 'first-steps']
    },
    {
      id: 'navigation-guide',
      title: 'Navigation Guide',
      description: 'How to navigate the Promethios interface and access key features',
      category: 'getting-started',
      icon: <Help />,
      content: `# Navigation Guide

## Main Navigation Structure

### Sidebar Navigation
The left sidebar provides access to all major platform sections:

1. **Dashboard** - Main overview and quick actions
2. **Agents** - Complete agent lifecycle management
3. **Governance** - Policy and compliance management  
4. **Trust Metrics** - Trust scoring and verification
5. **Settings** - Platform and user configuration
6. **Help** - Documentation, tours, and support

### Top Navigation
- **Search Bar** - Global search across the platform
- **Notifications** - System alerts and updates
- **User Menu** - Profile, settings, and logout options

### Observer Agent
The Observer Agent provides contextual help and guidance throughout the platform. Look for the floating chat bubble in the bottom-right corner.

## Quick Access Patterns

### Keyboard Shortcuts
- \`Ctrl/Cmd + K\` - Open global search
- \`Ctrl/Cmd + /\` - Open help panel
- \`Ctrl/Cmd + ,\` - Open settings
- \`Esc\` - Close dialogs and panels

### Breadcrumb Navigation
Use breadcrumbs at the top of each page to understand your current location and navigate back to parent sections.`,
      lastUpdated: '2025-06-20',
      tags: ['navigation', 'interface', 'shortcuts'],
      relatedSections: ['platform-overview', 'observer-agent']
    },
    {
      id: 'agent-wrapping-guide',
      title: 'Agent Wrapping Guide',
      description: 'Step-by-step guide to wrapping existing AI agents with governance controls',
      category: 'user-guides',
      icon: <Group />,
      content: `# Agent Wrapping Guide

## Overview
Agent wrapping allows you to add governance controls to existing AI agents without modifying their core functionality.

## Step-by-Step Process

### 1. Access Agent Wrapping
Navigate to **Agents > Wrapping** from the main sidebar.

### 2. Choose Wrapping Type
- **Single Agent Wrapping**: Wrap individual agents
- **Multi-Agent Wrapping**: Wrap multiple agents simultaneously

### 3. Configure Agent Details
- **Agent Name**: Descriptive name for identification
- **Agent Type**: Select from predefined categories
- **API Endpoint**: Connection details for your existing agent
- **Authentication**: Configure API keys or authentication methods

### 4. Set Governance Policies
- **Policy Templates**: Choose from HIPAA, SOC2, or custom templates
- **Compliance Rules**: Define specific compliance requirements
- **Monitoring Level**: Set observation and logging intensity

### 5. Configure Trust Settings
- **Trust Thresholds**: Set minimum trust scores required
- **Trust Dimensions**: Configure competence, reliability, honesty, transparency weights
- **Attestation Requirements**: Define verification requirements

### 6. Deploy and Monitor
- **Deployment**: Deploy the wrapped agent to your environment
- **Monitoring**: Track performance and compliance in real-time
- **Alerts**: Configure notifications for policy violations or trust issues

## Best Practices
- Start with template policies and customize as needed
- Set conservative trust thresholds initially
- Monitor wrapped agents closely during the first week
- Regular review and adjustment of governance settings`,
      lastUpdated: '2025-06-20',
      tags: ['agents', 'wrapping', 'governance', 'deployment'],
      relatedSections: ['policy-management', 'trust-configuration']
    },
    {
      id: 'trust-api-reference',
      title: 'Trust API Reference',
      description: 'Complete API documentation for trust evaluation and management',
      category: 'api-reference',
      icon: <Api />,
      content: `# Trust API Reference

## Base URL
\`\`\`
https://api.promethios.com/v1/trust
\`\`\`

## Authentication
All API requests require authentication using API keys:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Evaluate Trust
\`POST /evaluate\`

Evaluate trust between agents or systems.

**Request Body:**
\`\`\`json
{
  "agent_id": "agent-123",
  "target_id": "agent-456", 
  "context": {
    "interaction_history": 15,
    "domain": "financial_analysis",
    "criticality": "high"
  },
  "evidence": [
    {
      "type": "past_interaction",
      "outcome": "success",
      "timestamp": "2025-05-21T14:30:00Z",
      "details": {
        "task": "data_analysis",
        "accuracy": 0.98,
        "timeliness": 0.95
      }
    }
  ],
  "trust_dimensions": ["competence", "reliability", "honesty", "transparency"]
}
\`\`\`

**Response:**
\`\`\`json
{
  "evaluation_id": "trust-789",
  "trust_scores": {
    "competence": 0.92,
    "reliability": 0.88,
    "honesty": 0.95,
    "transparency": 0.85
  },
  "aggregate_score": 0.90,
  "confidence": 0.85,
  "recommendations": [
    "Trust for standard operations",
    "Verify outputs for critical financial calculations"
  ],
  "timestamp": "2025-05-22T03:52:35Z"
}
\`\`\`

### Query Trust History
\`GET /query\`

Retrieve trust evaluation history and trends.

**Parameters:**
- \`agent_id\` (required): Agent identifier
- \`start_date\` (optional): Start date for query range
- \`end_date\` (optional): End date for query range
- \`limit\` (optional): Maximum number of results (default: 100)

### Update Trust Information
\`PUT /update\`

Update trust evaluation with new evidence.

**Request Body:**
\`\`\`json
{
  "evaluation_id": "trust-789",
  "new_evidence": [
    {
      "type": "certification",
      "issuer": "TrustAuthority",
      "level": "gold",
      "expiration": "2026-01-01T00:00:00Z"
    }
  ]
}
\`\`\``,
      lastUpdated: '2025-06-20',
      tags: ['api', 'trust', 'reference', 'endpoints'],
      relatedSections: ['policy-api-reference', 'authentication-guide']
    },
    {
      id: 'policy-api-reference',
      title: 'Policy API Reference',
      description: 'API documentation for governance policy management and enforcement',
      category: 'api-reference',
      icon: <Policy />,
      content: `# Policy API Reference

## Base URL
\`\`\`
https://api.promethios.com/v1/policy
\`\`\`

## Endpoints

### Enforce Policy
\`POST /enforce\`

Evaluate an action against governance policies.

**Request Body:**
\`\`\`json
{
  "agent_id": "agent-123",
  "task_id": "task-456",
  "action_type": "file_write",
  "action_details": {
    "path": "/home/user/sensitive_data.txt",
    "content": "This is sensitive information",
    "mode": "append"
  },
  "context": {
    "user_permission_level": "standard",
    "previous_actions": ["file_read", "network_access"],
    "environment": "production"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "policy_decision_id": "policy-123",
  "action": "deny",
  "reason": "Insufficient permissions for sensitive data access",
  "modifications": null,
  "applicable_policies": ["data-protection-policy", "file-access-policy"],
  "confidence": 0.95,
  "timestamp": "2025-05-22T03:50:15Z"
}
\`\`\`

### Query Policies
\`GET /query\`

Retrieve policy information and configurations.

**Parameters:**
- \`policy_type\` (optional): Filter by policy type
- \`agent_id\` (optional): Filter by agent
- \`active_only\` (optional): Return only active policies

### Get Policy Decision
\`GET /decision/{decision_id}\`

Retrieve details of a specific policy decision.`,
      lastUpdated: '2025-06-20',
      tags: ['api', 'policy', 'governance', 'enforcement'],
      relatedSections: ['trust-api-reference', 'policy-management']
    },
    {
      id: 'settings-configuration',
      title: 'Settings Configuration',
      description: 'Complete guide to configuring platform settings and preferences',
      category: 'configuration',
      icon: <Settings />,
      content: `# Settings Configuration

## User Profile Settings

### Personal Information
- **Name and Contact**: Update your display name, email, and phone number
- **Avatar Upload**: Upload and crop profile photos with drag & drop support
- **Location and Timezone**: Configure your location and timezone preferences
- **Bio and Roles**: Add professional bio and role information

### Security Settings
- **Password Management**: Change passwords with strength validation
- **Two-Factor Authentication**: Enable 2FA for enhanced security
- **Active Sessions**: Monitor and manage active login sessions
- **API Key Management**: Generate and manage API keys for programmatic access

### Privacy Controls
- **Profile Visibility**: Control who can see your profile information
- **Data Download**: Request and download your personal data
- **Account Deletion**: Permanently delete your account and data

## Preferences Settings

### UI & Appearance
- **Theme Selection**: Choose between light, dark, and auto themes
- **Color Schemes**: Customize primary and accent colors
- **Font Size**: Adjust text size for accessibility
- **Layout Density**: Configure compact or comfortable layouts
- **Sidebar Width**: Customize navigation sidebar width
- **Animations**: Enable or disable UI animations

### Notifications
- **Email Notifications**: Configure email notification preferences
- **Desktop Notifications**: Enable browser notifications
- **SMS Notifications**: Set up SMS alerts for critical events
- **Quiet Hours**: Define do-not-disturb time periods
- **Notification Categories**: Customize notifications by type

### Language & Region
- **Language**: Select interface language
- **Date/Time Format**: Configure date and time display formats
- **Number Format**: Set number and currency formatting
- **Timezone**: Configure timezone for scheduling and timestamps

## Organization Settings

### Company Information
- **Organization Details**: Company name, domain, industry, and size
- **Contact Information**: Billing email, admin email, and support contacts
- **Location**: Primary business location and website

### Team Management
- **Member Invitation**: Invite team members with role assignment
- **Role Management**: Define and assign user roles and permissions
- **Department Organization**: Organize team members by department
- **Access Control**: Manage user access and permissions

### Security & Compliance
- **SSO Configuration**: Set up Single Sign-On integration
- **Password Policies**: Define organization password requirements
- **Session Management**: Configure session timeout and security settings
- **Data Retention**: Set data retention policies and compliance rules

## Integration Settings

### External Systems
- **Communication Tools**: Connect Slack, Microsoft Teams, Discord
- **Productivity Platforms**: Integrate Jira, Asana, Notion, Trello
- **Development Tools**: Connect GitHub, GitLab, Jenkins, Docker Hub
- **Monitoring Systems**: Integrate Datadog, New Relic, Prometheus
- **Cloud Storage**: Connect AWS S3, Google Cloud Storage, Azure Blob

### API Management
- **API Key Generation**: Create API keys with specific permissions
- **Webhook Configuration**: Set up webhooks for real-time notifications
- **Rate Limiting**: Configure API rate limits and quotas
- **Access Logs**: Monitor API usage and access patterns

## Data Management Settings

### Export & Import
- **Data Export**: Export configurations, reports, and user data
- **Backup Creation**: Create full system backups
- **Import Validation**: Validate and import configuration files
- **Migration Tools**: Migrate data between environments

### Privacy & Compliance
- **GDPR Compliance**: Configure GDPR data subject rights
- **Data Retention**: Set automated data retention policies
- **Audit Logging**: Enable comprehensive audit trail logging
- **Compliance Reporting**: Generate compliance reports for regulations`,
      lastUpdated: '2025-06-20',
      tags: ['settings', 'configuration', 'preferences', 'organization'],
      relatedSections: ['user-management', 'security-guide']
    },
    {
      id: 'common-issues',
      title: 'Common Issues & Solutions',
      description: 'Troubleshooting guide for frequently encountered problems',
      category: 'troubleshooting',
      icon: <Build />,
      content: `# Common Issues & Solutions

## Authentication Issues

### Problem: Cannot log in to the platform
**Symptoms:** Login page shows error messages or redirects back to login

**Solutions:**
1. **Clear browser cache and cookies**
   - Chrome: Settings > Privacy > Clear browsing data
   - Firefox: Settings > Privacy > Clear Data
   - Safari: Develop > Empty Caches

2. **Check credentials**
   - Verify email address is correct
   - Ensure password is entered correctly
   - Try password reset if needed

3. **Browser compatibility**
   - Use supported browsers: Chrome 90+, Firefox 88+, Safari 14+
   - Disable browser extensions that might interfere
   - Try incognito/private browsing mode

### Problem: Two-factor authentication not working
**Solutions:**
1. **Time synchronization**
   - Ensure device time is synchronized
   - Check timezone settings
   - Try generating a new code

2. **Backup codes**
   - Use backup codes if available
   - Contact support to reset 2FA

## Agent Management Issues

### Problem: Agent wrapping fails
**Symptoms:** Error messages during agent wrapping process

**Solutions:**
1. **API connectivity**
   - Verify agent API endpoint is accessible
   - Check authentication credentials
   - Test API connection manually

2. **Configuration validation**
   - Ensure all required fields are completed
   - Verify policy templates are properly configured
   - Check trust threshold settings

3. **Network issues**
   - Verify firewall settings allow connections
   - Check proxy configuration if applicable
   - Ensure SSL certificates are valid

### Problem: Deployed agents not responding
**Solutions:**
1. **Health checks**
   - Monitor agent health status in dashboard
   - Check system resource usage
   - Verify network connectivity

2. **Log analysis**
   - Review agent logs for error messages
   - Check governance policy violations
   - Monitor trust score changes

## Trust Metrics Issues

### Problem: Trust scores not updating
**Solutions:**
1. **Data collection**
   - Verify agents are sending telemetry data
   - Check attestation chain completeness
   - Ensure evidence is being recorded

2. **Configuration review**
   - Verify trust dimension weights
   - Check boundary configurations
   - Review evaluation criteria

### Problem: False trust alerts
**Solutions:**
1. **Threshold adjustment**
   - Review and adjust trust thresholds
   - Analyze historical trust patterns
   - Consider environmental factors

2. **Evidence quality**
   - Improve evidence collection methods
   - Enhance attestation processes
   - Regular calibration of trust models

## Performance Issues

### Problem: Slow page loading
**Solutions:**
1. **Browser optimization**
   - Clear browser cache
   - Disable unnecessary extensions
   - Update to latest browser version

2. **Network diagnostics**
   - Check internet connection speed
   - Test from different networks
   - Contact IT support for network issues

3. **Platform status**
   - Check platform status page
   - Monitor system performance metrics
   - Contact support if issues persist

## Data Issues

### Problem: Missing or incorrect data
**Solutions:**
1. **Data synchronization**
   - Trigger manual data refresh
   - Check integration connections
   - Verify data source configurations

2. **Permission verification**
   - Ensure proper access permissions
   - Check role-based access controls
   - Verify organization membership

## Getting Additional Help

### Contact Support
- **Email**: support@promethios.com
- **Chat**: Use the Observer Agent for immediate assistance
- **Documentation**: Search this documentation for detailed guides
- **Community**: Join our community forum for peer support

### Escalation Process
1. **Level 1**: Self-service documentation and FAQ
2. **Level 2**: Observer Agent and chat support
3. **Level 3**: Email support with detailed issue description
4. **Level 4**: Phone support for critical issues (Enterprise plans)

### Information to Include
When contacting support, please include:
- Detailed description of the issue
- Steps to reproduce the problem
- Browser and operating system information
- Screenshots or error messages
- Account and organization information`,
      lastUpdated: '2025-06-20',
      tags: ['troubleshooting', 'issues', 'solutions', 'support'],
      relatedSections: ['authentication-guide', 'performance-optimization']
    }
  ];

  const filteredSections = documentationSections.filter(section => {
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    const matchesSearch = section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         section.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSectionClick = (section: DocumentationSection) => {
    setSelectedSection(section);
    setShowSectionDialog(true);
    setBreadcrumbs(['Documentation', section.title]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: '#a0aec0' } }}
        >
          {breadcrumbs.map((crumb, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ 
                color: index === breadcrumbs.length - 1 ? 'white' : '#a0aec0',
                cursor: index < breadcrumbs.length - 1 ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (index === 0) {
                  setBreadcrumbs(['Documentation']);
                  setShowSectionDialog(false);
                }
              }}
            >
              {crumb}
            </Typography>
          ))}
        </Breadcrumbs>

        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Documentation
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Comprehensive guides, API references, and troubleshooting resources for Promethios
        </Typography>
      </Box>

      {/* Search and Categories */}
      <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputBase-input::placeholder': { color: '#a0aec0' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Tabs
                value={selectedCategory}
                onChange={(e, newValue) => setSelectedCategory(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': { color: '#a0aec0', minWidth: 'auto' },
                  '& .Mui-selected': { color: '#3b82f6' },
                  '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
                }}
              >
                {categories.map((category) => (
                  <Tab
                    key={category.id}
                    label={category.name}
                    value={category.id}
                    icon={category.icon}
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Documentation Sections */}
      <Grid container spacing={3}>
        {filteredSections.map((section) => (
          <Grid item xs={12} md={6} lg={4} key={section.id}>
            <Card 
              sx={{ 
                backgroundColor: '#2d3748', 
                border: '1px solid #4a5568',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#3b82f6',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)'
                }
              }}
              onClick={() => handleSectionClick(section)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ 
                    backgroundColor: '#3b82f6', 
                    borderRadius: 1, 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {section.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      {section.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {section.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>

                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Last updated: {section.lastUpdated}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Section Detail Dialog */}
      <Dialog
        open={showSectionDialog}
        onClose={() => setShowSectionDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white', maxHeight: '90vh' }
        }}
      >
        {selectedSection && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  backgroundColor: '#3b82f6', 
                  borderRadius: 1, 
                  p: 1, 
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedSection.icon}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    {selectedSection.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    {selectedSection.description}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setShowSectionDialog(false)} sx={{ color: '#a0aec0' }}>
                <Launch />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {selectedSection.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Last updated: {selectedSection.lastUpdated}
                </Typography>
              </Box>

              <Box sx={{ 
                backgroundColor: '#1a202c', 
                border: '1px solid #4a5568', 
                borderRadius: 1, 
                p: 3,
                position: 'relative'
              }}>
                <IconButton
                  onClick={() => copyToClipboard(selectedSection.content)}
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    color: '#a0aec0',
                    '&:hover': { color: 'white' }
                  }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
                <Typography 
                  component="pre" 
                  sx={{ 
                    color: '#a0aec0', 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6
                  }}
                >
                  {selectedSection.content}
                </Typography>
              </Box>

              {selectedSection.relatedSections && selectedSection.relatedSections.length > 0 && (
                <>
                  <Divider sx={{ borderColor: '#4a5568', my: 3 }} />
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Related Documentation
                  </Typography>
                  <List>
                    {selectedSection.relatedSections.map((relatedId) => {
                      const relatedSection = documentationSections.find(s => s.id === relatedId);
                      return relatedSection ? (
                        <ListItem 
                          key={relatedId} 
                          sx={{ px: 0, cursor: 'pointer' }}
                          onClick={() => handleSectionClick(relatedSection)}
                        >
                          <ListItemIcon>
                            {relatedSection.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={relatedSection.title}
                            secondary={relatedSection.description}
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                      ) : null;
                    })}
                  </List>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowSectionDialog(false)} sx={{ color: '#a0aec0' }}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<ContentCopy />}
                onClick={() => copyToClipboard(selectedSection.content)}
                sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
              >
                Copy Content
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DocumentationPage;

