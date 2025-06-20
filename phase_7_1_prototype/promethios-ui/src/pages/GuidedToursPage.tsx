import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Search,
  PlayArrow,
  CheckCircle,
  Schedule,
  Person,
  Star,
  FilterList,
  Close,
  Refresh,
  TrendingUp,
  Security,
  Settings,
  Dashboard,
  Group,
  Policy,
  Assessment
} from '@mui/icons-material';

interface Tour {
  id: string;
  title: string;
  description: string;
  category: 'onboarding' | 'governance' | 'agents' | 'trust' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  steps: number;
  completed: boolean;
  progress: number; // 0-100
  rating: number;
  enrolledUsers: number;
  lastUpdated: string;
  prerequisites?: string[];
  learningObjectives: string[];
  icon: React.ReactNode;
}

interface TourCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const GuidedToursPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showTourDialog, setShowTourDialog] = useState<boolean>(false);

  const categories: TourCategory[] = [
    {
      id: 'all',
      name: 'All Tours',
      description: 'Browse all available guided tours',
      icon: <Dashboard />,
      color: '#3b82f6'
    },
    {
      id: 'onboarding',
      name: 'Getting Started',
      description: 'Essential tours for new users',
      icon: <Person />,
      color: '#10b981'
    },
    {
      id: 'governance',
      name: 'Governance',
      description: 'Policy management and compliance',
      icon: <Policy />,
      color: '#8b5cf6'
    },
    {
      id: 'agents',
      name: 'Agent Management',
      description: 'Creating and managing AI agents',
      icon: <Group />,
      color: '#f59e0b'
    },
    {
      id: 'trust',
      name: 'Trust & Security',
      description: 'Trust metrics and security features',
      icon: <Security />,
      color: '#ef4444'
    },
    {
      id: 'advanced',
      name: 'Advanced Features',
      description: 'Power user features and integrations',
      icon: <TrendingUp />,
      color: '#06b6d4'
    }
  ];

  const tours: Tour[] = [
    {
      id: 'welcome-tour',
      title: 'Welcome to Promethios',
      description: 'Navigate the main dashboard, understand the navigation structure, and get oriented with the core sections of the platform.',
      category: 'onboarding',
      difficulty: 'beginner',
      estimatedDuration: 10,
      steps: 6,
      completed: true,
      progress: 100,
      rating: 4.8,
      enrolledUsers: 1247,
      lastUpdated: '2025-06-15',
      learningObjectives: [
        'Navigate the main dashboard and sidebar',
        'Understand the four core sections: Agents, Governance, Trust Metrics, Settings',
        'Access the Observer Agent for contextual help',
        'Use the top navigation for user management'
      ],
      icon: <Person />
    },
    {
      id: 'agent-wrapping-tour',
      title: 'Agent Wrapping Workflow',
      description: 'Learn how to wrap existing AI agents with governance controls using our step-by-step wrapping interface.',
      category: 'agents',
      difficulty: 'beginner',
      estimatedDuration: 20,
      steps: 10,
      completed: false,
      progress: 60,
      rating: 4.9,
      enrolledUsers: 892,
      lastUpdated: '2025-06-18',
      prerequisites: ['welcome-tour'],
      learningObjectives: [
        'Access the Agent Wrapping page from the Agents section',
        'Configure agent parameters and governance settings',
        'Set up monitoring and compliance rules',
        'Deploy wrapped agents with proper oversight'
      ],
      icon: <Group />
    },
    {
      id: 'governance-policies-tour',
      title: 'Creating Governance Policies',
      description: 'Master the policy creation workflow using our governance interface to enforce compliance across your agent ecosystem.',
      category: 'governance',
      difficulty: 'intermediate',
      estimatedDuration: 25,
      steps: 12,
      completed: false,
      progress: 0,
      rating: 4.7,
      enrolledUsers: 634,
      lastUpdated: '2025-06-20',
      prerequisites: ['welcome-tour', 'agent-wrapping-tour'],
      learningObjectives: [
        'Navigate to Governance > Policies section',
        'Create custom governance policies using templates',
        'Configure policy enforcement rules and thresholds',
        'Monitor policy violations in the Violations dashboard'
      ],
      icon: <Policy />
    },
    {
      id: 'trust-metrics-tour',
      title: 'Understanding Trust Metrics',
      description: 'Explore the Trust Metrics system including trust scoring, boundaries configuration, and attestation management.',
      category: 'trust',
      difficulty: 'intermediate',
      estimatedDuration: 30,
      steps: 15,
      completed: false,
      progress: 25,
      rating: 4.6,
      enrolledUsers: 456,
      lastUpdated: '2025-06-19',
      prerequisites: ['governance-policies-tour'],
      learningObjectives: [
        'Navigate the Trust Metrics Overview dashboard',
        'Understand the four trust dimensions: Competence, Reliability, Honesty, Transparency',
        'Configure trust boundaries and thresholds',
        'Manage attestation chains and verification processes'
      ],
      icon: <Security />
    },
    {
      id: 'settings-configuration-tour',
      title: 'Platform Settings & Configuration',
      description: 'Complete tour of all settings pages including user profile, preferences, organization setup, and integrations.',
      category: 'advanced',
      difficulty: 'beginner',
      estimatedDuration: 18,
      steps: 8,
      completed: false,
      progress: 0,
      rating: 4.5,
      enrolledUsers: 234,
      lastUpdated: '2025-06-17',
      prerequisites: ['welcome-tour'],
      learningObjectives: [
        'Configure user profile and security settings',
        'Customize UI preferences and notifications',
        'Set up organization and team management',
        'Connect external integrations and manage API keys'
      ],
      icon: <Settings />
    },
    {
      id: 'registry-deployment-tour',
      title: 'Agent Registry & Deployment',
      description: 'Learn how to browse the agent registry, deploy agents from templates, and manage your deployed agent ecosystem.',
      category: 'agents',
      difficulty: 'intermediate',
      estimatedDuration: 22,
      steps: 11,
      completed: false,
      progress: 0,
      rating: 4.4,
      enrolledUsers: 178,
      lastUpdated: '2025-06-16',
      prerequisites: ['agent-wrapping-tour'],
      learningObjectives: [
        'Browse the Agent Registry for pre-built solutions',
        'Deploy agents using the Deploy interface',
        'Monitor deployed agents in My Agents section',
        'Use the Template Library for quick agent creation'
      ],
      icon: <Assessment />
    }
  ];

  const filteredTours = tours.filter(tour => {
    const matchesCategory = selectedCategory === 'all' || tour.category === selectedCategory;
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tour.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6b7280';
  };

  const handleStartTour = (tour: Tour) => {
    setSelectedTour(tour);
    setShowTourDialog(true);
  };

  const handleContinueTour = (tour: Tour) => {
    // In a real implementation, this would resume the tour from the last step
    console.log(`Continuing tour: ${tour.title} from step ${Math.floor(tour.progress / 100 * tour.steps)}`);
    setShowTourDialog(false);
  };

  const handleRestartTour = (tour: Tour) => {
    // In a real implementation, this would restart the tour from the beginning
    console.log(`Restarting tour: ${tour.title}`);
    setShowTourDialog(false);
  };

  const completedTours = tours.filter(tour => tour.completed).length;
  const inProgressTours = tours.filter(tour => tour.progress > 0 && !tour.completed).length;
  const totalProgress = tours.reduce((sum, tour) => sum + tour.progress, 0) / tours.length;

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Guided Tours
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
          Interactive tutorials to help you master Promethios features and AI governance concepts
        </Typography>

        {/* Progress Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ color: '#10b981', mr: 2 }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Completed Tours
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                  {completedTours}
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  of {tours.length} total tours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ color: '#f59e0b', mr: 2 }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    In Progress
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                  {inProgressTours}
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  tours started
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ color: '#3b82f6', mr: 2 }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Overall Progress
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                  {Math.round(totalProgress)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={totalProgress} 
                  sx={{ 
                    mt: 1,
                    backgroundColor: '#4a5568',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search tours..."
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

      {/* Tours Grid */}
      <Grid container spacing={3}>
        {filteredTours.map((tour) => (
          <Grid item xs={12} md={6} lg={4} key={tour.id}>
            <Card 
              sx={{ 
                backgroundColor: '#2d3748', 
                border: '1px solid #4a5568',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: getCategoryColor(tour.category),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px rgba(${getCategoryColor(tour.category).replace('#', '')}, 0.15)`
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Tour Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: getCategoryColor(tour.category), 
                      mr: 2,
                      width: 48,
                      height: 48
                    }}
                  >
                    {tour.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                      {tour.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={tour.difficulty}
                        size="small"
                        sx={{
                          backgroundColor: getDifficultyColor(tour.difficulty),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Chip
                        label={`${tour.estimatedDuration} min`}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                      />
                      <Chip
                        label={`${tour.steps} steps`}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Description */}
                <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
                  {tour.description}
                </Typography>

                {/* Progress */}
                {tour.progress > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        {tour.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={tour.progress}
                      sx={{
                        backgroundColor: '#4a5568',
                        '& .MuiLinearProgress-bar': { 
                          backgroundColor: tour.completed ? '#10b981' : getCategoryColor(tour.category)
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Star sx={{ color: '#f59e0b', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      {tour.rating}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    {tour.enrolledUsers} enrolled
                  </Typography>
                </Box>

                {/* Prerequisites */}
                {tour.prerequisites && tour.prerequisites.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Prerequisites:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {tour.prerequisites.map((prereq) => (
                        <Chip
                          key={prereq}
                          label={tours.find(t => t.id === prereq)?.title || prereq}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>

              {/* Action Button */}
              <Box sx={{ p: 2, pt: 0 }}>
                {tour.completed ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => handleStartTour(tour)}
                    sx={{
                      borderColor: '#10b981',
                      color: '#10b981',
                      '&:hover': { borderColor: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                    }}
                  >
                    Review Tour
                  </Button>
                ) : tour.progress > 0 ? (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => handleStartTour(tour)}
                    sx={{
                      backgroundColor: getCategoryColor(tour.category),
                      '&:hover': { backgroundColor: getCategoryColor(tour.category) + 'dd' }
                    }}
                  >
                    Continue Tour
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => handleStartTour(tour)}
                    sx={{
                      backgroundColor: '#3b82f6',
                      '&:hover': { backgroundColor: '#2563eb' }
                    }}
                  >
                    Start Tour
                  </Button>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tour Details Dialog */}
      <Dialog
        open={showTourDialog}
        onClose={() => setShowTourDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        {selectedTour && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    backgroundColor: getCategoryColor(selectedTour.category), 
                    mr: 2 
                  }}
                >
                  {selectedTour.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    {selectedTour.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    {selectedTour.estimatedDuration} minutes • {selectedTour.steps} steps
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setShowTourDialog(false)} sx={{ color: '#a0aec0' }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
                {selectedTour.description}
              </Typography>

              {selectedTour.progress > 0 && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3, 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    color: '#3b82f6',
                    '& .MuiAlert-icon': { color: '#3b82f6' }
                  }}
                >
                  You have completed {Math.floor(selectedTour.progress / 100 * selectedTour.steps)} of {selectedTour.steps} steps ({selectedTour.progress}%)
                </Alert>
              )}

              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Learning Objectives
              </Typography>
              <List>
                {selectedTour.learningObjectives.map((objective, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: '#3b82f6', width: 24, height: 24 }}>
                        <Typography variant="caption" sx={{ color: 'white' }}>
                          {index + 1}
                        </Typography>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={objective}
                      primaryTypographyProps={{ color: '#a0aec0' }}
                    />
                  </ListItem>
                ))}
              </List>

              {selectedTour.prerequisites && selectedTour.prerequisites.length > 0 && (
                <>
                  <Divider sx={{ borderColor: '#4a5568', my: 3 }} />
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Prerequisites
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedTour.prerequisites.map((prereq) => {
                      const prereqTour = tours.find(t => t.id === prereq);
                      return (
                        <Chip
                          key={prereq}
                          label={prereqTour?.title || prereq}
                          size="small"
                          color={prereqTour?.completed ? 'success' : 'default'}
                          variant={prereqTour?.completed ? 'filled' : 'outlined'}
                          sx={{ 
                            borderColor: prereqTour?.completed ? '#10b981' : '#4a5568', 
                            color: prereqTour?.completed ? 'white' : '#a0aec0' 
                          }}
                        />
                      );
                    })}
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowTourDialog(false)} sx={{ color: '#a0aec0' }}>
                Cancel
              </Button>
              {selectedTour.completed ? (
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={() => handleRestartTour(selectedTour)}
                  sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                >
                  Restart Tour
                </Button>
              ) : selectedTour.progress > 0 ? (
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handleContinueTour(selectedTour)}
                  sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
                >
                  Continue from Step {Math.floor(selectedTour.progress / 100 * selectedTour.steps) + 1}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handleContinueTour(selectedTour)}
                  sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
                >
                  Start Tour
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default GuidedToursPage;

