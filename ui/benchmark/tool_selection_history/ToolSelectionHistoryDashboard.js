/**
 * Tool Selection History Dashboard Component
 * 
 * Provides visualization and interaction with tool selection history data,
 * including usage patterns, recommendations, and insights.
 * 
 * @module ui/benchmark/tool_selection_history/ToolSelectionHistoryDashboard
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Tabs, 
  Tab, 
  Grid, 
  Divider,
  Button,
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import { 
  HistoryOutlined, 
  InsightsOutlined, 
  RecommendOutlined, 
  AnalyticsOutlined,
  CheckCircleOutline,
  ErrorOutline,
  HelpOutline,
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';

/**
 * Tool Selection History Dashboard Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.toolSelectionHistory - Tool Selection History module instance
 * @param {Object} props.confidenceScoring - Confidence Scoring module instance
 * @param {Object} props.prismObserver - PRISM Observer instance
 * @param {Object} props.vigilObserver - VIGIL Observer instance
 * @param {Function} props.onInsightSelected - Callback when an insight is selected
 * @param {Function} props.onToolSelected - Callback when a tool is selected
 */
const ToolSelectionHistoryDashboard = ({
  toolSelectionHistory,
  confidenceScoring,
  prismObserver,
  vigilObserver,
  onInsightSelected,
  onToolSelected
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [usagePatterns, setUsagePatterns] = useState([]);
  const [toolEfficiencyMetrics, setToolEfficiencyMetrics] = useState([]);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [overusePatterns, setOverusePatterns] = useState([]);
  const [underusePatterns, setUnderusePatterns] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);
  
  // Chart colors
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main
  ];
  
  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tool usage patterns
      const patterns = toolSelectionHistory.getToolUsagePatterns();
      setUsagePatterns(patterns);
      
      // Get tool efficiency metrics
      const metrics = toolSelectionHistory.getToolEfficiencyMetrics();
      setToolEfficiencyMetrics(metrics);
      
      // Get insights
      const insightData = toolSelectionHistory.generateInsights();
      setInsights(insightData);
      
      // Get overuse patterns
      const overuse = toolSelectionHistory.detectToolOveruse();
      setOverusePatterns(overuse);
      
      // Get underuse patterns
      const underuse = toolSelectionHistory.detectToolUnderuse();
      setUnderusePatterns(underuse);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading tool selection history data:', err);
      setError('Failed to load tool selection history data');
      setLoading(false);
    }
  }, [toolSelectionHistory]);
  
  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Set up refresh interval
    const intervalId = setInterval(loadData, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [loadData]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle tool selection
  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    if (onToolSelected) {
      onToolSelected(tool);
    }
  };
  
  // Handle insight selection
  const handleInsightSelect = (insight) => {
    setSelectedInsight(insight);
    if (onInsightSelected) {
      onInsightSelected(insight);
    }
  };
  
  // Get recommendation for current context
  const getRecommendation = useCallback(async () => {
    try {
      // Example context - in a real implementation, this would come from the current task
      const context = {
        taskType: 'search',
        intentId: 'find_information',
        parameters: { query: 'example' },
        timestamp: Date.now()
      };
      
      const recommendation = toolSelectionHistory.getToolRecommendation(context);
      setRecommendations([recommendation, ...recommendations].slice(0, 5)); // Keep last 5 recommendations
    } catch (err) {
      console.error('Error getting recommendation:', err);
    }
  }, [toolSelectionHistory, recommendations]);
  
  // Render usage patterns tab
  const renderUsagePatternsTab = () => {
    if (loading) {
      return <CircularProgress />;
    }
    
    if (error) {
      return <Typography color="error">{error}</Typography>;
    }
    
    // Prepare data for tool type distribution chart
    const toolTypeData = usagePatterns.reduce((acc, pattern) => {
      const toolType = pattern.toolType;
      const existingType = acc.find(item => item.name === toolType);
      
      if (existingType) {
        existingType.value += 1;
      } else {
        acc.push({ name: toolType, value: 1 });
      }
      
      return acc;
    }, []);
    
    // Prepare data for success rate chart
    const successRateData = usagePatterns.map(pattern => ({
      name: pattern.toolId,
      successRate: pattern.usageMetrics.successRate * 100
    })).sort((a, b) => b.successRate - a.successRate).slice(0, 10);
    
    // Prepare data for execution time chart
    const executionTimeData = usagePatterns.map(pattern => ({
      name: pattern.toolId,
      executionTime: pattern.usageMetrics.averageExecutionTime
    })).sort((a, b) => a.executionTime - b.executionTime).slice(0, 10);
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Tool Usage Patterns</Typography>
        
        <Grid container spacing={3}>
          {/* Tool Type Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Tool Type Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={toolTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {toolTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Success Rate by Tool */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Top 10 Tools by Success Rate</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={successRateData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                    />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Success Rate']} />
                    <Bar dataKey="successRate" fill={theme.palette.success.main} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Execution Time by Tool */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Top 10 Tools by Execution Time (ms)</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={executionTimeData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      label={{ value: 'Execution Time (ms)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value) => [`${value.toFixed(0)} ms`, 'Execution Time']} />
                    <Bar dataKey="executionTime" fill={theme.palette.info.main} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Tool Usage Patterns Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Tool Usage Patterns</Typography>
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={usagePatterns.map((pattern, index) => ({
                      id: index,
                      toolId: pattern.toolId,
                      toolType: pattern.toolType,
                      successRate: `${(pattern.usageMetrics.successRate * 100).toFixed(1)}%`,
                      avgExecutionTime: `${pattern.usageMetrics.averageExecutionTime.toFixed(0)} ms`,
                      sampleSize: pattern.sampleSize,
                      contextCount: pattern.contextPatterns.length
                    }))}
                    columns={[
                      { field: 'toolId', headerName: 'Tool ID', flex: 1 },
                      { field: 'toolType', headerName: 'Tool Type', flex: 1 },
                      { field: 'successRate', headerName: 'Success Rate', flex: 1 },
                      { field: 'avgExecutionTime', headerName: 'Avg. Execution Time', flex: 1 },
                      { field: 'sampleSize', headerName: 'Sample Size', flex: 1 },
                      { field: 'contextCount', headerName: 'Context Patterns', flex: 1 }
                    ]}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    onRowClick={(params) => handleToolSelect(usagePatterns[params.id])}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render insights tab
  const renderInsightsTab = () => {
    if (loading) {
      return <CircularProgress />;
    }
    
    if (error) {
      return <Typography color="error">{error}</Typography>;
    }
    
    // Group insights by category
    const insightsByCategory = insights.reduce((acc, insight) => {
      const category = insight.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(insight);
      return acc;
    }, {});
    
    // Prepare data for overuse chart
    const overuseData = overusePatterns.map(pattern => ({
      name: pattern.toolType,
      usageRate: pattern.usageRate * 100
    }));
    
    // Prepare data for underuse chart
    const underuseData = underusePatterns.map(pattern => ({
      name: pattern.toolType,
      usageRate: pattern.usageRate * 100
    }));
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Tool Usage Insights</Typography>
        
        <Grid container spacing={3}>
          {/* Overuse Patterns */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Tool Type Overuse</Typography>
                {overuseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={overuseData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis 
                        label={{ value: 'Usage Rate (%)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 100]}
                      />
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Usage Rate']} />
                      <Bar dataKey="usageRate" fill={theme.palette.warning.main} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <Typography variant="body1">No overuse patterns detected</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Underuse Patterns */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Tool Type Underuse</Typography>
                {underuseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={underuseData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis 
                        label={{ value: 'Usage Rate (%)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 100]}
                      />
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Usage Rate']} />
                      <Bar dataKey="usageRate" fill={theme.palette.info.main} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <Typography variant="body1">No underuse patterns detected</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Insights Timeline */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Recent Insights</Typography>
                <Timeline position="alternate">
                  {insights.slice(0, 5).map((insight, index) => (
                    <TimelineItem key={insight.id}>
                      <TimelineOppositeContent color="text.secondary">
                        {new Date(insight.timestamp).toLocaleString()}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot 
                          color={
                            insight.category === 'success_rate' ? 'success' :
                            insight.category === 'performance' ? 'warning' :
                            insight.category === 'alternative' ? 'info' :
                            'primary'
                          }
                        >
                          {insight.category === 'success_rate' ? <CheckCircleOutline /> :
                           insight.category === 'performance' ? <TrendingUp /> :
                           insight.category === 'alternative' ? <RecommendOutlined /> :
                           <InsightsOutlined />}
                        </TimelineDot>
                        {index < insights.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Card sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleInsightSelect(insight)}>
                          <Typography variant="subtitle2">{insight.title}</Typography>
                          <Typography variant="body2">{insight.description}</Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              size="small" 
                              label={`Confidence: ${(insight.confidence * 100).toFixed(0)}%`}
                              color={insight.confidence > 0.7 ? 'success' : 'warning'}
                            />
                          </Box>
                        </Card>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Insights by Category */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Insights by Category</Typography>
                <Grid container spacing={2}>
                  {Object.entries(insightsByCategory).map(([category, categoryInsights]) => (
                    <Grid item xs={12} md={4} key={category}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                          </Typography>
                          {categoryInsights.map(insight => (
                            <Box 
                              key={insight.id} 
                              sx={{ 
                                mb: 2, 
                                p: 1, 
                                borderLeft: `4px solid ${
                                  insight.confidence > 0.7 ? theme.palette.success.main :
                                  insight.confidence > 0.4 ? theme.palette.warning.main :
                                  theme.palette.error.main
                                }`,
                                bgcolor: 'background.paper',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleInsightSelect(insight)}
                            >
                              <Typography variant="subtitle2">{insight.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {insight.description}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render recommendations tab
  const renderRecommendationsTab = () => {
    if (loading) {
      return <CircularProgress />;
    }
    
    if (error) {
      return <Typography color="error">{error}</Typography>;
    }
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Tool Recommendations</Typography>
        
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={getRecommendation}
            startIcon={<RecommendOutlined />}
          >
            Get Recommendation for Current Context
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {/* Recent Recommendations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Recent Recommendations</Typography>
                {recommendations.length > 0 ? (
                  <Timeline>
                    {recommendations.map((recommendation, index) => (
                      <TimelineItem key={recommendation.id}>
                        <TimelineOppositeContent color="text.secondary">
                          {new Date(recommendation.timestamp).toLocaleString()}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color="primary">
                            <RecommendOutlined />
                          </TimelineDot>
                          {index < recommendations.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Card sx={{ p: 2 }}>
                            <Typography variant="subtitle2">
                              Context: {recommendation.context.taskType} / {recommendation.context.intentId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {recommendation.reasoning}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2">Recommended Tools:</Typography>
                            {recommendation.recommendations.length > 0 ? (
                              <Box sx={{ mt: 1 }}>
                                {recommendation.recommendations.map(rec => (
                                  <Box 
                                    key={rec.toolId} 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'space-between',
                                      mb: 1,
                                      p: 1,
                                      bgcolor: 'background.paper',
                                      borderRadius: 1
                                    }}
                                  >
                                    <Box>
                                      <Typography variant="body1">{rec.toolId}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {rec.reasoning}
                                      </Typography>
                                    </Box>
                                    <Chip 
                                      label={`${(rec.confidence * 100).toFixed(0)}%`}
                                      color={
                                        rec.confidence > 0.7 ? 'success' :
                                        rec.confidence > 0.4 ? 'warning' :
                                        'error'
                                      }
                                    />
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No recommendations available
                              </Typography>
                            )}
                          </Card>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                    <Typography variant="body1">No recommendations yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render efficiency metrics tab
  const renderEfficiencyMetricsTab = () => {
    if (loading) {
      return <CircularProgress />;
    }
    
    if (error) {
      return <Typography color="error">{error}</Typography>;
    }
    
    // Prepare data for efficiency comparison chart
    const efficiencyData = toolEfficiencyMetrics.map(metric => ({
      name: metric.toolId,
      successRate: metric.overallMetrics.successRate * 100,
      invocationCount: metric.overallMetrics.invocationCount
    })).sort((a, b) => b.successRate - a.successRate).slice(0, 10);
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Tool Efficiency Metrics</Typography>
        
        <Grid container spacing={3}>
          {/* Efficiency Comparison Chart */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Top 10 Tools by Efficiency</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={efficiencyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      yAxisId="left"
                      label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Invocation Count', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="successRate" 
                      name="Success Rate (%)" 
                      fill={theme.palette.success.main} 
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="invocationCount" 
                      name="Invocation Count" 
                      fill={theme.palette.primary.main} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Efficiency Metrics Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Tool Efficiency Metrics</Typography>
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={toolEfficiencyMetrics.map((metric, index) => ({
                      id: index,
                      toolId: metric.toolId,
                      invocationCount: metric.overallMetrics.invocationCount,
                      successRate: `${(metric.overallMetrics.successRate * 100).toFixed(1)}%`,
                      avgExecutionTime: `${metric.overallMetrics.averageExecutionTime.toFixed(0)} ms`,
                      contextCount: metric.contextualMetrics.length,
                      trend: metric.trends && metric.trends.length > 0 ? 
                        metric.trends[0].direction : 'stable'
                    }))}
                    columns={[
                      { field: 'toolId', headerName: 'Tool ID', flex: 1 },
                      { field: 'invocationCount', headerName: 'Invocations', flex: 1 },
                      { field: 'successRate', headerName: 'Success Rate', flex: 1 },
                      { field: 'avgExecutionTime', headerName: 'Avg. Execution Time', flex: 1 },
                      { field: 'contextCount', headerName: 'Context Metrics', flex: 1 },
                      { 
                        field: 'trend', 
                        headerName: 'Trend', 
                        flex: 1,
                        renderCell: (params) => {
                          const trend = params.value;
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {trend === 'improving' ? (
                                <TrendingUp color="success" />
                              ) : trend === 'declining' ? (
                                <TrendingDown color="error" />
                              ) : (
                                <TrendingFlat color="info" />
                              )}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {trend.charAt(0).toUpperCase() + trend.slice(1)}
                              </Typography>
                            </Box>
                          );
                        }
                      }
                    ]}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    onRowClick={(params) => handleToolSelect(toolEfficiencyMetrics[params.id])}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Usage Patterns" 
            icon={<HistoryOutlined />} 
            iconPosition="start"
          />
          <Tab 
            label="Insights" 
            icon={<InsightsOutlined />} 
            iconPosition="start"
          />
          <Tab 
            label="Recommendations" 
            icon={<RecommendOutlined />} 
            iconPosition="start"
          />
          <Tab 
            label="Efficiency Metrics" 
            icon={<AnalyticsOutlined />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      <Box sx={{ p: 2 }}>
        {activeTab === 0 && renderUsagePatternsTab()}
        {activeTab === 1 && renderInsightsTab()}
        {activeTab === 2 && renderRecommendationsTab()}
        {activeTab === 3 && renderEfficiencyMetricsTab()}
      </Box>
    </Box>
  );
};

export default ToolSelectionHistoryDashboard;
