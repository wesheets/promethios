/**
 * UI component for the Governance Visualization Dashboard.
 * 
 * This module provides a React-based UI component for visualizing governance state,
 * trust metrics, and health reports in an interactive dashboard.
 */

import React, { useState, useEffect } from 'react';
import { 
    Container, Grid, Paper, Typography, Box, 
    Tabs, Tab, CircularProgress, Button, 
    Card, CardContent, CardHeader, Divider 
} from '@material-ui/core';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, 
    ResponsiveContainer, XAxis, YAxis, Tooltip, 
    Legend, CartesianGrid, Cell 
} from 'recharts';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    header: {
        marginBottom: theme.spacing(3),
    },
    tabPanel: {
        padding: theme.spacing(2),
    },
    chart: {
        height: 300,
        marginBottom: theme.spacing(2),
    },
    card: {
        marginBottom: theme.spacing(2),
    },
    summaryCard: {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
    },
    warningCard: {
        backgroundColor: theme.palette.warning.light,
        color: theme.palette.warning.contrastText,
    },
    criticalCard: {
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.contrastText,
    },
    infoCard: {
        backgroundColor: theme.palette.info.light,
        color: theme.palette.info.contrastText,
    },
    successCard: {
        backgroundColor: theme.palette.success.light,
        color: theme.palette.success.contrastText,
    },
    divider: {
        margin: theme.spacing(2, 0),
    },
    button: {
        margin: theme.spacing(1),
    },
}));

// Tab Panel component
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`governance-tabpanel-${index}`}
            aria-labelledby={`governance-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Main Dashboard Component
function GovernanceVisualizationDashboard({ apiClient }) {
    const classes = useStyles();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [governanceState, setGovernanceState] = useState(null);
    const [trustMetrics, setTrustMetrics] = useState(null);
    const [healthReport, setHealthReport] = useState(null);
    const [timeRange, setTimeRange] = useState('weekly');
    
    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    
    // Handle time range change
    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
        fetchTrustMetricsHistory(range);
    };
    
    // Fetch governance state data
    const fetchGovernanceState = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getGovernanceStateVisualization();
            setGovernanceState(data.visualization_data.governance_state);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch governance state data');
            setLoading(false);
        }
    };
    
    // Fetch trust metrics data
    const fetchTrustMetrics = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getTrustMetricsVisualization();
            setTrustMetrics(data.visualization_data.trust_metrics);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch trust metrics data');
            setLoading(false);
        }
    };
    
    // Fetch trust metrics history data
    const fetchTrustMetricsHistory = async (range) => {
        try {
            setLoading(true);
            const data = await apiClient.getTrustMetricsHistoryVisualization(range);
            setTrustMetrics(prevState => ({
                ...prevState,
                history: data.visualization_data.time_series
            }));
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch trust metrics history data');
            setLoading(false);
        }
    };
    
    // Fetch health report data
    const fetchHealthReport = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getHealthReport();
            setHealthReport(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch health report data');
            setLoading(false);
        }
    };
    
    // Fetch all data on component mount
    useEffect(() => {
        const fetchAllData = async () => {
            await Promise.all([
                fetchGovernanceState(),
                fetchTrustMetrics(),
                fetchHealthReport()
            ]);
            
            // Also fetch trust metrics history with default time range
            fetchTrustMetricsHistory(timeRange);
        };
        
        fetchAllData();
        
        // Set up refresh interval (every 5 minutes)
        const intervalId = setInterval(() => {
            fetchAllData();
        }, 5 * 60 * 1000);
        
        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, []);
    
    // Render loading state
    if (loading && !governanceState && !trustMetrics && !healthReport) {
        return (
            <Container className={classes.root}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress />
                    <Typography variant="h6" style={{ marginLeft: 16 }}>
                        Loading Governance Visualization Dashboard...
                    </Typography>
                </Box>
            </Container>
        );
    }
    
    // Render error state
    if (error) {
        return (
            <Container className={classes.root}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <Typography variant="h6" color="error">
                        {error}
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => window.location.reload()}
                        className={classes.button}
                    >
                        Retry
                    </Button>
                </Box>
            </Container>
        );
    }
    
    // Prepare colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
    
    return (
        <Container className={classes.root}>
            <Typography variant="h4" className={classes.header}>
                Governance Visualization Dashboard
            </Typography>
            
            {/* Summary Cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card className={`${classes.card} ${classes.summaryCard}`}>
                        <CardContent>
                            <Typography variant="h6">Overall Governance Health</Typography>
                            <Typography variant="h3">
                                {healthReport?.summary?.overall_health 
                                    ? `${(healthReport.summary.overall_health * 100).toFixed(1)}%` 
                                    : 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card className={`${classes.card} ${classes.infoCard}`}>
                        <CardContent>
                            <Typography variant="h6">Policy Compliance</Typography>
                            <Typography variant="h3">
                                {healthReport?.sections?.compliance?.overall_compliance 
                                    ? `${(healthReport.sections.compliance.overall_compliance * 100).toFixed(1)}%` 
                                    : 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card className={`${classes.card} ${classes.successCard}`}>
                        <CardContent>
                            <Typography variant="h6">Trust Score</Typography>
                            <Typography variant="h3">
                                {trustMetrics?.trust_scores?.average 
                                    ? `${(trustMetrics.trust_scores.average * 100).toFixed(1)}%` 
                                    : 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card className={`${classes.card} ${classes.warningCard}`}>
                        <CardContent>
                            <Typography variant="h6">Critical Issues</Typography>
                            <Typography variant="h3">
                                {healthReport?.sections?.issues?.critical_count || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            
            <Divider className={classes.divider} />
            
            {/* Tabs for different visualizations */}
            <Paper className={classes.paper}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    centered
                >
                    <Tab label="Governance State" />
                    <Tab label="Trust Metrics" />
                    <Tab label="Health Report" />
                </Tabs>
                
                {/* Governance State Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* Policy Compliance Chart */}
                        <Grid item xs={12} md={6}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Policy Compliance</Typography>
                                <div className={classes.chart}>
                                    {governanceState?.policy_compliance && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={governanceState.policy_compliance.data.map((value, index) => ({
                                                    name: `Policy ${index + 1}`,
                                                    value: value
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                                <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                                <Legend />
                                                <Bar dataKey="value" name="Compliance Rate" fill="#0088FE">
                                                    {governanceState.policy_compliance.data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                        
                        {/* Requirement Status Chart */}
                        <Grid item xs={12} md={6}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Requirement Status</Typography>
                                <div className={classes.chart}>
                                    {governanceState?.requirement_status && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Compliant', value: governanceState.requirement_status.compliant_count },
                                                        { name: 'Non-Compliant', value: governanceState.requirement_status.non_compliant_count }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#00C49F" />
                                                    <Cell fill="#FF8042" />
                                                </Pie>
                                                <Tooltip formatter={(value) => value} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                        
                        {/* Boundary Integrity Chart */}
                        <Grid item xs={12}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Boundary Integrity</Typography>
                                <div className={classes.chart}>
                                    {governanceState?.boundary_integrity && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={governanceState.boundary_integrity.data.map((value, index) => ({
                                                    name: `Boundary ${index + 1}`,
                                                    value: value
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                                <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                                <Legend />
                                                <Bar dataKey="value" name="Integrity Level" fill="#8884d8">
                                                    {governanceState.boundary_integrity.data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>
                
                {/* Trust Metrics Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box mb={2}>
                        <Typography variant="subtitle1">Time Range:</Typography>
                        <Button 
                            variant={timeRange === 'daily' ? 'contained' : 'outlined'} 
                            color="primary" 
                            onClick={() => handleTimeRangeChange('daily')}
                            className={classes.button}
                        >
                            Daily
                        </Button>
                        <Button 
                            variant={timeRange === 'weekly' ? 'contained' : 'outlined'} 
                            color="primary" 
                            onClick={() => handleTimeRangeChange('weekly')}
                            className={classes.button}
                        >
                            Weekly
                        </Button>
                        <Button 
                            variant={timeRange === 'monthly' ? 'contained' : 'outlined'} 
                            color="primary" 
                            onClick={() => handleTimeRangeChange('monthly')}
                            className={classes.button}
                        >
                            Monthly
                        </Button>
                    </Box>
                    
                    <Grid container spacing={3}>
                        {/* Attestation Validity Chart */}
                        <Grid item xs={12} md={6}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Attestation Validity</Typography>
                                <div className={classes.chart}>
                                    {trustMetrics?.attestation_validity && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={trustMetrics.attestation_validity.data.map((value, index) => ({
                                                    name: `Attestation ${index + 1}`,
                                                    value: value
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                                <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                                <Legend />
                                                <Bar dataKey="value" name="Validity" fill="#0088FE">
                                                    {trustMetrics.attestation_validity.data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                        
                        {/* Trust Scores Chart */}
                        <Grid item xs={12} md={6}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Trust Scores</Typography>
                                <div className={classes.chart}>
                                    {trustMetrics?.trust_scores && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={trustMetrics.trust_scores.data.map((value, index) => ({
                                                    name: `Component ${index + 1}`,
                                                    value: value
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                                <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                                <Legend />
                                                <Bar dataKey="value" name="Trust Score" fill="#00C49F">
                                                    {trustMetrics.trust_scores.data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                        
                        {/* Trust Metrics History Chart */}
                        <Grid item xs={12}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Trust Metrics History</Typography>
                                <div className={classes.chart}>
                                    {trustMetrics?.history && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={trustMetrics.history.labels.map((label, index) => ({
                                                    name: label,
                                                    attestation: trustMetrics.history.datasets[0].data[index],
                                                    trust: trustMetrics.history.datasets[1].data[index]
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                                <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="attestation" 
                                                    name="Attestation Validity" 
                                                    stroke="#0088FE" 
                                                    activeDot={{ r: 8 }} 
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="trust" 
                                                    name="Trust Score" 
                                                    stroke="#00C49F" 
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>
                
                {/* Health Report Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        {/* Health Report Summary */}
                        <Grid item xs={12}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Health Report Summary</Typography>
                                <Box p={2}>
                                    <Typography variant="subtitle1">
                                        Report Generated: {healthReport?.metadata?.timestamp 
                                            ? new Date(healthReport.metadata.timestamp).toLocaleString() 
                                            : 'N/A'}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        Report Type: {healthReport?.metadata?.report_type || 'N/A'}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        Overall Health: {healthReport?.summary?.overall_health 
                                            ? `${(healthReport.summary.overall_health * 100).toFixed(1)}%` 
                                            : 'N/A'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                        
                        {/* Issues Summary */}
                        <Grid item xs={12} md={6}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Issues Summary</Typography>
                                <div className={classes.chart}>
                                    {healthReport?.sections?.issues && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Critical', value: healthReport.sections.issues.critical_count },
                                                        { name: 'Warning', value: healthReport.sections.issues.warning_count },
                                                        { name: 'Info', value: healthReport.sections.issues.info_count }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#FF8042" />
                                                    <Cell fill="#FFBB28" />
                                                    <Cell fill="#0088FE" />
                                                </Pie>
                                                <Tooltip formatter={(value) => value} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                        
                        {/* Compliance Categories */}
                        <Grid item xs={12} md={6}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Compliance Categories</Typography>
                                <div className={classes.chart}>
                                    {healthReport?.sections?.compliance?.categories && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={healthReport.sections.compliance.categories.map((category) => ({
                                                    name: category.name,
                                                    value: category.compliance_rate
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                                <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                                <Legend />
                                                <Bar dataKey="value" name="Compliance Rate" fill="#8884d8">
                                                    {healthReport.sections.compliance.categories.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                        
                        {/* Critical Issues List */}
                        <Grid item xs={12}>
                            <Paper className={classes.paper}>
                                <Typography variant="h6">Critical Issues</Typography>
                                <Box p={2}>
                                    {healthReport?.sections?.issues?.issues
                                        .filter(issue => issue.severity === 'critical')
                                        .map((issue, index) => (
                                            <Card key={index} className={`${classes.card} ${classes.criticalCard}`}>
                                                <CardContent>
                                                    <Typography variant="h6">{issue.title}</Typography>
                                                    <Typography variant="body2">{issue.description}</Typography>
                                                    <Typography variant="caption">
                                                        Affected Components: {issue.affected_components.join(', ')}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    {healthReport?.sections?.issues?.issues
                                        .filter(issue => issue.severity === 'critical').length === 0 && (
                                        <Typography variant="body1">No critical issues found.</Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>
        </Container>
    );
}

export default GovernanceVisualizationDashboard;
