/**
 * Relationship & Context Repository Viewer
 * 
 * UI component for viewing and managing user mental models, project context,
 * communication preferences, and relationship development in the Command Center.
 * Designed with progressive disclosure to avoid overwhelming users.
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
  LinearProgress,
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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Business as BusinessIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Favorite as FavoriteIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Groups as GroupsIcon,
  Settings as SettingsIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { RelationshipContextExtension } from '../../extensions/RelationshipContextExtension';
import { ChatPanelGovernanceService } from '../../services/ChatPanelGovernanceService';

interface RelationshipContextViewerProps {
  agentId: string;
  onRelationshipContextLoad?: (context: any) => void;
  onShare?: (context: any) => void;
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
      id={`relationship-context-tabpanel-${index}`}
      aria-labelledby={`relationship-context-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const RelationshipContextViewer: React.FC<RelationshipContextViewerProps> = ({
  agentId,
  onRelationshipContextLoad,
  onShare
}) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Data state
  const [mentalModels, setMentalModels] = useState<any[]>([]);
  const [projectContexts, setProjectContexts] = useState<any[]>([]);
  const [communicationPreferences, setCommunicationPreferences] = useState<any[]>([]);
  const [relationshipDevelopments, setRelationshipDevelopments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Services
  const [relationshipExtension] = useState(() => new RelationshipContextExtension());
  const [governanceService] = useState(() => new ChatPanelGovernanceService());

  // Load data on component mount
  useEffect(() => {
    loadRelationshipContextData();
  }, []);

  const loadRelationshipContextData = async () => {
    try {
      setLoading(true);
      
      // Load all relationship context data
      const searchResults = await relationshipExtension.searchRelationshipContext(agentId, {});
      
      // Separate by data type
      const models = searchResults.filter(item => item.dataType === 'user_mental_model');
      const contexts = searchResults.filter(item => item.dataType === 'project_context');
      const preferences = searchResults.filter(item => item.dataType === 'communication_preference');
      const relationships = searchResults.filter(item => item.dataType === 'relationship_development');
      
      setMentalModels(models);
      setProjectContexts(contexts);
      setCommunicationPreferences(preferences);
      setRelationshipDevelopments(relationships);
      
      // Load analytics
      const analyticsData = await relationshipExtension.getRelationshipContextAnalytics(agentId);
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Failed to load relationship context data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered data based on search and filters
  const filteredData = useMemo(() => {
    const allData = [
      ...mentalModels.map(item => ({ ...item, category: 'Mental Model' })),
      ...projectContexts.map(item => ({ ...item, category: 'Project Context' })),
      ...communicationPreferences.map(item => ({ ...item, category: 'Communication Preference' })),
      ...relationshipDevelopments.map(item => ({ ...item, category: 'Relationship Development' }))
    ];

    let filtered = allData;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (typeFilter === 'mental_model') return item.dataType === 'user_mental_model';
        if (typeFilter === 'project_context') return item.dataType === 'project_context';
        if (typeFilter === 'communication_preference') return item.dataType === 'communication_preference';
        if (typeFilter === 'relationship_development') return item.dataType === 'relationship_development';
        return true;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Complexity filter
    if (complexityFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.metadata?.complexity === complexityFilter ||
        item.complexity === complexityFilter
      );
    }

    return filtered;
  }, [mentalModels, projectContexts, communicationPreferences, relationshipDevelopments, searchQuery, typeFilter, statusFilter, complexityFilter]);

  // Tab-specific filtered data
  const tabFilteredData = useMemo(() => {
    switch (activeTab) {
      case 1: return mentalModels;
      case 2: return projectContexts;
      case 3: return communicationPreferences;
      case 4: return relationshipDevelopments;
      case 5: return analytics ? [analytics] : [];
      default: return filteredData;
    }
  }, [activeTab, mentalModels, projectContexts, communicationPreferences, relationshipDevelopments, analytics, filteredData]);

  // Handle item click - load context into chat
  const handleItemClick = async (item: any) => {
    try {
      if (onRelationshipContextLoad) {
        // Create context object for chat loading
        const context = {
          type: item.dataType,
          id: item.id,
          name: item.name,
          description: item.description,
          data: item,
          category: item.category
        };
        
        onRelationshipContextLoad(context);
      }
    } catch (error) {
      console.error('Failed to load relationship context:', error);
    }
  };

  // Handle item share
  const handleShare = async (item: any) => {
    try {
      if (onShare) {
        onShare(item);
      }
    } catch (error) {
      console.error('Failed to share relationship context:', error);
    }
  };

  // Handle view details
  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  // Get icon for data type
  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'user_mental_model': return <PsychologyIcon />;
      case 'project_context': return <BusinessIcon />;
      case 'communication_preference': return <ChatIcon />;
      case 'relationship_development': return <PeopleIcon />;
      default: return <InfoIcon />;
    }
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'developing': return 'warning';
      case 'stable': return 'success';
      case 'validated': return 'primary';
      case 'established': return 'success';
      case 'mature': return 'primary';
      case 'outdated': return 'error';
      case 'deprecated': return 'error';
      case 'declining': return 'warning';
      default: return 'default';
    }
  };

  // Get complexity color
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'very_high': return '#9c27b0';
      default: return '#757575';
    }
  };

  // Render item card
  const renderItemCard = (item: any) => (
    <Card 
      key={item.id} 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        '&:hover': { 
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
      onClick={() => handleItemClick(item)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {getDataTypeIcon(item.dataType)}
            <Typography variant="h6" component="div">
              {item.name}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip 
              label={item.status} 
              color={getStatusColor(item.status) as any}
              size="small"
            />
            {(item.metadata?.complexity || item.complexity) && (
              <Chip 
                label={item.metadata?.complexity || item.complexity}
                size="small"
                sx={{ 
                  backgroundColor: getComplexityColor(item.metadata?.complexity || item.complexity),
                  color: 'white'
                }}
              />
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {item.description}
        </Typography>

        {/* Type-specific details */}
        {item.dataType === 'user_mental_model' && (
          <Box mb={2}>
            <Typography variant="caption" display="block">
              Model Type: {item.modelType}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Box>
                <Typography variant="caption">Confidence</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.validation?.confidenceLevel || 0) * 100}
                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Completeness</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.metadata?.completeness || 0) * 100}
                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {item.dataType === 'project_context' && (
          <Box mb={2}>
            <Typography variant="caption" display="block">
              Context Type: {item.contextType}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Box>
                <Typography variant="caption">Quality</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={item.quality ? (Object.values(item.quality).reduce((a: any, b: any) => a + b, 0) / Object.values(item.quality).length) * 100 : 50}
                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Currency</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.quality?.currency || 0) * 100}
                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {item.dataType === 'communication_preference' && (
          <Box mb={2}>
            <Typography variant="caption" display="block">
              Preference Type: {item.preferenceType}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Box>
                <Typography variant="caption">Confidence</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.validation?.confidenceLevel || 0) * 100}
                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Stability</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.evolution?.stabilityScore || 0) * 100}
                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {item.dataType === 'relationship_development' && (
          <Box mb={2}>
            <Typography variant="caption" display="block">
              Relationship Type: {item.relationshipType}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Box>
                <Typography variant="caption">Trust Level</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.trust?.trustLevel || 0) * 100}
                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Quality</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.quality?.overallQuality || 0) * 100}
                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Updated: {new Date(item.updatedAt).toLocaleDateString()}
          </Typography>
          <Box>
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(item);
                }}
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(item);
                }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Render analytics dashboard
  const renderAnalytics = () => {
    if (!analytics) return <Typography>No analytics data available</Typography>;

    return (
      <Grid container spacing={3}>
        {/* Mental Model Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PsychologyIcon color="primary" />
                <Typography variant="h6">Mental Models</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4">{analytics.mentalModelMetrics.totalModels}</Typography>
                  <Typography variant="caption">Total Models</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">{analytics.mentalModelMetrics.validatedModels}</Typography>
                  <Typography variant="caption">Validated</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" mb={1}>Average Confidence</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.mentalModelMetrics.averageConfidence * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Context Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BusinessIcon color="primary" />
                <Typography variant="h6">Project Contexts</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4">{analytics.contextMetrics.totalContexts}</Typography>
                  <Typography variant="caption">Total Contexts</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">{analytics.contextMetrics.validatedContexts}</Typography>
                  <Typography variant="caption">Validated</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" mb={1}>Average Quality</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.contextMetrics.averageQuality * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Preference Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ChatIcon color="primary" />
                <Typography variant="h6">Communication Preferences</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4">{analytics.preferenceMetrics.totalPreferences}</Typography>
                  <Typography variant="caption">Total Preferences</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">{analytics.preferenceMetrics.stablePreferences}</Typography>
                  <Typography variant="caption">Stable</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" mb={1}>Average Confidence</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.preferenceMetrics.averageConfidence * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Relationship Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PeopleIcon color="primary" />
                <Typography variant="h6">Relationships</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4">{analytics.relationshipMetrics.totalRelationships}</Typography>
                  <Typography variant="caption">Total Relationships</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">{analytics.relationshipMetrics.matureRelationships}</Typography>
                  <Typography variant="caption">Mature</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" mb={1}>Average Trust Level</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.relationshipMetrics.averageTrustLevel * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Insights */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LightbulbIcon color="primary" />
                <Typography variant="h6">Insights</Typography>
              </Box>
              <List>
                {analytics.insights.map((insight: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TrendingUpIcon color="primary" />
                <Typography variant="h6">Recommendations</Typography>
              </Box>
              <List>
                {analytics.recommendations.map((recommendation: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Relationship & Context Repository
        </Typography>
        <Typography variant="body2" color="text.secondary">
          User understanding, project context, preferences, and relationships
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search relationship context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="mental_model">Mental Models</MenuItem>
                <MenuItem value="project_context">Project Context</MenuItem>
                <MenuItem value="communication_preference">Communication Preferences</MenuItem>
                <MenuItem value="relationship_development">Relationships</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="developing">Developing</MenuItem>
                <MenuItem value="stable">Stable</MenuItem>
                <MenuItem value="validated">Validated</MenuItem>
                <MenuItem value="established">Established</MenuItem>
                <MenuItem value="mature">Mature</MenuItem>
                <MenuItem value="outdated">Outdated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Complexity</InputLabel>
              <Select
                value={complexityFilter}
                label="Complexity"
                onChange={(e) => setComplexityFilter(e.target.value)}
              >
                <MenuItem value="all">All Complexity</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="very_high">Very High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              size="small"
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <InfoIcon />
                All ({filteredData.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <PsychologyIcon />
                Mental Models ({mentalModels.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <BusinessIcon />
                Project Context ({projectContexts.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <ChatIcon />
                Preferences ({communicationPreferences.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <PeopleIcon />
                Relationships ({relationshipDevelopments.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <AnalyticsIcon />
                Analytics
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <Typography>Loading relationship context...</Typography>
            </Box>
          ) : tabFilteredData.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No relationship context found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria or filters
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              {tabFilteredData.map(renderItemCard)}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 2 }}>
            {mentalModels.length === 0 ? (
              <Typography color="text.secondary">No mental models available</Typography>
            ) : (
              mentalModels.map(renderItemCard)
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 2 }}>
            {projectContexts.length === 0 ? (
              <Typography color="text.secondary">No project contexts available</Typography>
            ) : (
              projectContexts.map(renderItemCard)
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 2 }}>
            {communicationPreferences.length === 0 ? (
              <Typography color="text.secondary">No communication preferences available</Typography>
            ) : (
              communicationPreferences.map(renderItemCard)
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 2 }}>
            {relationshipDevelopments.length === 0 ? (
              <Typography color="text.secondary">No relationship developments available</Typography>
            ) : (
              relationshipDevelopments.map(renderItemCard)
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <Box sx={{ p: 2 }}>
            {renderAnalytics()}
          </Box>
        </TabPanel>
      </Box>

      {/* Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedItem?.name}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedItem.description}
              </Typography>
              
              {showAdvanced && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Advanced Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(selectedItem, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedItem) handleItemClick(selectedItem);
              setDetailsOpen(false);
            }}
          >
            Load into Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

