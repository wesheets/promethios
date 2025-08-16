/**
 * Simplified Knowledge Viewer
 * 
 * User-friendly starter version of the AI Knowledge Management System.
 * Focuses on Research and Documents with progressive disclosure to avoid
 * overwhelming users initially.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Alert,
  Collapse,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as DocumentIcon,
  Science as ResearchIcon,
  Analytics as AnalyticsIcon,
  Psychology as InsightIcon,
  Build as ToolIcon,
  School as LearningIcon,
  Groups as CollaborationIcon,
  Palette as CreativeIcon,
  People as RelationshipIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  GetApp as LoadIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lightbulb as TipIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Import repository components
import { ResearchRepositoryViewer } from '../research/ResearchRepositoryViewer';
import { DocumentsRepositoryViewer } from '../documents/DocumentsRepositoryViewer';
import { AnalysisInsightsViewer } from '../analysis/AnalysisInsightsViewer';
import { ProblemSolvingWorkflowsViewer } from '../workflows/ProblemSolvingWorkflowsViewer';
import { LearningAdaptationViewer } from '../learning/LearningAdaptationViewer';
import { CollaborativeWorkViewer } from '../collaboration/CollaborativeWorkViewer';
import { CreativeProcessesViewer } from '../creative/CreativeProcessesViewer';
import { RelationshipContextViewer } from '../relationship/RelationshipContextViewer';

interface SimplifiedKnowledgeViewerProps {
  agentId: string;
  onContentLoad?: (content: any) => void;
  onShare?: (content: any) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`knowledge-tabpanel-${index}`}
      aria-labelledby={`knowledge-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
}

// User experience levels
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

// Repository configuration for each experience level
const REPOSITORY_CONFIG = {
  beginner: {
    tabs: [
      { id: 'research', label: 'Research', icon: ResearchIcon, description: 'What we\'ve researched together' },
      { id: 'documents', label: 'Documents', icon: DocumentIcon, description: 'What we\'ve created together' }
    ],
    features: {
      advancedSearch: false,
      analytics: false,
      governance: false,
      collaboration: false
    }
  },
  intermediate: {
    tabs: [
      { id: 'research', label: 'Research', icon: ResearchIcon, description: 'Research and findings' },
      { id: 'documents', label: 'Documents', icon: DocumentIcon, description: 'Created content and files' },
      { id: 'analysis', label: 'Analysis', icon: AnalyticsIcon, description: 'Data analysis and insights' },
      { id: 'workflows', label: 'Problem Solving', icon: ToolIcon, description: 'Solutions and workflows' }
    ],
    features: {
      advancedSearch: true,
      analytics: true,
      governance: false,
      collaboration: false
    }
  },
  advanced: {
    tabs: [
      { id: 'research', label: 'Research', icon: ResearchIcon, description: 'Research repository' },
      { id: 'documents', label: 'Documents', icon: DocumentIcon, description: 'Document artifacts' },
      { id: 'analysis', label: 'Analysis', icon: AnalyticsIcon, description: 'Analysis & insights' },
      { id: 'workflows', label: 'Problem Solving', icon: ToolIcon, description: 'Problem-solving workflows' },
      { id: 'learning', label: 'Learning', icon: LearningIcon, description: 'Learning & adaptation' },
      { id: 'collaboration', label: 'Collaboration', icon: CollaborationIcon, description: 'Collaborative work' },
      { id: 'creative', label: 'Creative', icon: CreativeIcon, description: 'Creative processes' },
      { id: 'relationship', label: 'Relationship', icon: RelationshipIcon, description: 'Relationship & context' }
    ],
    features: {
      advancedSearch: true,
      analytics: true,
      governance: true,
      collaboration: true
    }
  }
};

export const SimplifiedKnowledgeViewer: React.FC<SimplifiedKnowledgeViewerProps> = ({
  agentId,
  onContentLoad,
  onShare
}) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Get current configuration
  const currentConfig = REPOSITORY_CONFIG[experienceLevel];

  // Handle experience level change
  const handleExperienceLevelChange = (newLevel: ExperienceLevel) => {
    setExperienceLevel(newLevel);
    setActiveTab(0); // Reset to first tab
    setShowLevelSelector(false);
    
    // Show onboarding for new features
    if (newLevel !== 'beginner') {
      setShowOnboarding(true);
      setOnboardingStep(0);
    }
  };

  // Onboarding content
  const getOnboardingContent = () => {
    switch (experienceLevel) {
      case 'beginner':
        return {
          title: 'Welcome to AI Knowledge Management!',
          steps: [
            {
              title: 'Research Repository',
              description: 'All the research we do together is automatically saved here. Click any research to continue where we left off.',
              icon: ResearchIcon
            },
            {
              title: 'Documents Repository', 
              description: 'Everything we create - documents, code, images, videos - is saved here. Click any document to load it back into our conversation.',
              icon: DocumentIcon
            }
          ]
        };
      case 'intermediate':
        return {
          title: 'More Powerful Features Unlocked!',
          steps: [
            {
              title: 'Analysis & Insights',
              description: 'All data analysis, comparisons, and insights are now captured and reusable.',
              icon: AnalyticsIcon
            },
            {
              title: 'Problem Solving',
              description: 'Debugging sessions, decision trees, and solution architectures are preserved.',
              icon: ToolIcon
            }
          ]
        };
      case 'advanced':
        return {
          title: 'Full AI Knowledge Management System!',
          steps: [
            {
              title: 'Learning & Adaptation',
              description: 'Track how I learn your preferences and adapt to your working style.',
              icon: LearningIcon
            },
            {
              title: 'Collaborative Work',
              description: 'Multi-step projects and iterative work are managed across sessions.',
              icon: CollaborationIcon
            },
            {
              title: 'Creative Processes',
              description: 'Brainstorming, design iterations, and creative frameworks are captured.',
              icon: CreativeIcon
            },
            {
              title: 'Relationship & Context',
              description: 'Our working relationship and project context evolve over time.',
              icon: RelationshipIcon
            }
          ]
        };
    }
  };

  // Render onboarding dialog
  const renderOnboarding = () => {
    const content = getOnboardingContent();
    const currentStep = content.steps[onboardingStep];

    return (
      <Dialog 
        open={showOnboarding} 
        onClose={() => setShowOnboarding(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <TipIcon color="primary" />
            {content.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" mb={3}>
            <currentStep.icon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {currentStep.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {currentStep.description}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="center" gap={1} mb={2}>
            {content.steps.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === onboardingStep ? 'primary.main' : 'grey.300'
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOnboarding(false)}>
            Skip
          </Button>
          {onboardingStep > 0 && (
            <Button onClick={() => setOnboardingStep(onboardingStep - 1)}>
              Previous
            </Button>
          )}
          {onboardingStep < content.steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={() => setOnboardingStep(onboardingStep + 1)}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={() => setShowOnboarding(false)}
            >
              Get Started
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  // Render experience level selector
  const renderLevelSelector = () => (
    <Collapse in={showLevelSelector}>
      <Box sx={{ p: 2, backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Choose Your Experience Level
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: experienceLevel === 'beginner' ? 2 : 1,
                borderColor: experienceLevel === 'beginner' ? 'primary.main' : 'divider'
              }}
              onClick={() => handleExperienceLevelChange('beginner')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <StarIcon color="primary" />
                  <Typography variant="h6">Beginner</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Simple interface focusing on research and documents. Perfect for getting started.
                </Typography>
                <Box mt={2}>
                  <Chip label="Research" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Documents" size="small" sx={{ mr: 1, mb: 1 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: experienceLevel === 'intermediate' ? 2 : 1,
                borderColor: experienceLevel === 'intermediate' ? 'primary.main' : 'divider'
              }}
              onClick={() => handleExperienceLevelChange('intermediate')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6">Intermediate</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Adds analysis and problem-solving capabilities. Great for regular users.
                </Typography>
                <Box mt={2}>
                  <Chip label="Research" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Documents" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Analysis" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Problem Solving" size="small" sx={{ mr: 1, mb: 1 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: experienceLevel === 'advanced' ? 2 : 1,
                borderColor: experienceLevel === 'advanced' ? 'primary.main' : 'divider'
              }}
              onClick={() => handleExperienceLevelChange('advanced')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <SettingsIcon color="primary" />
                  <Typography variant="h6">Advanced</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Full AI Knowledge Management System with all repositories and features.
                </Typography>
                <Box mt={2}>
                  <Chip label="All 8 Repositories" size="small" color="primary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Collapse>
  );

  // Render repository content
  const renderRepositoryContent = (tabId: string) => {
    const commonProps = {
      agentId,
      onContentLoad,
      onShare
    };

    switch (tabId) {
      case 'research':
        return <ResearchRepositoryViewer {...commonProps} />;
      case 'documents':
        return <DocumentsRepositoryViewer {...commonProps} />;
      case 'analysis':
        return <AnalysisInsightsViewer {...commonProps} />;
      case 'workflows':
        return <ProblemSolvingWorkflowsViewer {...commonProps} />;
      case 'learning':
        return <LearningAdaptationViewer {...commonProps} />;
      case 'collaboration':
        return <CollaborativeWorkViewer {...commonProps} />;
      case 'creative':
        return <CreativeProcessesViewer {...commonProps} />;
      case 'relationship':
        return <RelationshipContextViewer {...commonProps} />;
      default:
        return (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Repository not available
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom>
              AI Knowledge Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {experienceLevel === 'beginner' && 'Simple view - Research and Documents'}
              {experienceLevel === 'intermediate' && 'Intermediate view - Research, Documents, Analysis, Problem Solving'}
              {experienceLevel === 'advanced' && 'Advanced view - Full Knowledge Management System'}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TipIcon />}
              onClick={() => setShowOnboarding(true)}
            >
              Help
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={showLevelSelector ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowLevelSelector(!showLevelSelector)}
            >
              {experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Experience Level Selector */}
      {renderLevelSelector()}

      {/* Quick Stats */}
      {experienceLevel !== 'beginner' && (
        <Box sx={{ p: 2, backgroundColor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">12</Typography>
                <Typography variant="caption">Research Items</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">8</Typography>
                <Typography variant="caption">Documents</Typography>
              </Box>
            </Grid>
            {experienceLevel === 'intermediate' && (
              <>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">5</Typography>
                    <Typography variant="caption">Analyses</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">3</Typography>
                    <Typography variant="caption">Workflows</Typography>
                  </Box>
                </Grid>
              </>
            )}
            {experienceLevel === 'advanced' && (
              <>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">15</Typography>
                    <Typography variant="caption">Total Items</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">92%</Typography>
                    <Typography variant="caption">Quality Score</Typography>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {currentConfig.tabs.map((tab, index) => (
            <Tab 
              key={tab.id}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <tab.icon />
                  {tab.label}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {currentConfig.tabs.map((tab, index) => (
          <TabPanel key={tab.id} value={activeTab} index={index}>
            {renderRepositoryContent(tab.id)}
          </TabPanel>
        ))}
      </Box>

      {/* Onboarding Dialog */}
      {renderOnboarding()}

      {/* Upgrade Prompt for Beginners */}
      {experienceLevel === 'beginner' && (
        <Box sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUpIcon />
              <Typography variant="body2">
                Ready for more? Unlock Analysis and Problem-Solving features!
              </Typography>
            </Box>
            <Button 
              size="small" 
              variant="contained" 
              color="secondary"
              onClick={() => handleExperienceLevelChange('intermediate')}
            >
              Upgrade
            </Button>
          </Box>
        </Box>
      )}

      {/* Upgrade Prompt for Intermediate */}
      {experienceLevel === 'intermediate' && (
        <Box sx={{ p: 2, backgroundColor: 'secondary.light', color: 'secondary.contrastText' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <SettingsIcon />
              <Typography variant="body2">
                Want the full experience? Unlock all 8 repositories and advanced features!
              </Typography>
            </Box>
            <Button 
              size="small" 
              variant="contained" 
              color="primary"
              onClick={() => handleExperienceLevelChange('advanced')}
            >
              Go Advanced
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

