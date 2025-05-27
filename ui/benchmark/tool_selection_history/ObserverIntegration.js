/**
 * Integration module for Tool Selection History with PRISM and VIGIL observers
 * 
 * Provides integration points between the Tool Selection History module and
 * the constitutional observers (PRISM and VIGIL).
 * 
 * @module ui/benchmark/tool_selection_history/ObserverIntegration
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Divider,
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
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
  VerifiedOutlined, 
  SecurityOutlined, 
  HistoryOutlined,
  CheckCircleOutline,
  ErrorOutline,
  HelpOutline
} from '@mui/icons-material';

/**
 * Observer Integration Component for Tool Selection History
 * 
 * @param {Object} props - Component props
 * @param {Object} props.toolSelectionHistory - Tool Selection History module instance
 * @param {Object} props.prismObserver - PRISM Observer instance
 * @param {Object} props.vigilObserver - VIGIL Observer instance
 * @param {Object} props.confidenceScoring - Confidence Scoring module instance
 */
const ObserverIntegration = ({
  toolSelectionHistory,
  prismObserver,
  vigilObserver,
  confidenceScoring
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [prismVerifications, setPrismVerifications] = useState([]);
  const [vigilAssessments, setVigilAssessments] = useState([]);
  const [confidenceScores, setConfidenceScores] = useState([]);
  const [integrationStatus, setIntegrationStatus] = useState({
    prism: false,
    vigil: false,
    confidenceScoring: false
  });
  
  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check integration status
      const prismIntegrated = !!prismObserver && !!toolSelectionHistory.prismObserver;
      const vigilIntegrated = !!vigilObserver && !!toolSelectionHistory.vigilObserver;
      const confidenceScoringIntegrated = !!confidenceScoring && !!toolSelectionHistory.confidenceScoring;
      
      setIntegrationStatus({
        prism: prismIntegrated,
        vigil: vigilIntegrated,
        confidenceScoring: confidenceScoringIntegrated
      });
      
      // Get PRISM verifications if integrated
      if (prismIntegrated) {
        // In a real implementation, this would fetch actual verification data
        // For now, we'll use mock data
        const mockVerifications = [
          {
            id: 'verify-1',
            toolId: 'tool-1',
            timestamp: Date.now() - 3600000,
            confidence: 0.85,
            status: 'verified',
            source: 'belief_trace',
            details: 'Tool usage pattern verified against belief trace'
          },
          {
            id: 'verify-2',
            toolId: 'tool-2',
            timestamp: Date.now() - 7200000,
            confidence: 0.65,
            status: 'partial',
            source: 'belief_trace',
            details: 'Partial verification of tool usage pattern'
          },
          {
            id: 'verify-3',
            toolId: 'tool-3',
            timestamp: Date.now() - 10800000,
            confidence: 0.45,
            status: 'unverified',
            source: 'belief_trace',
            details: 'Unable to verify tool usage pattern'
          }
        ];
        
        setPrismVerifications(mockVerifications);
      }
      
      // Get VIGIL assessments if integrated
      if (vigilIntegrated) {
        // In a real implementation, this would fetch actual assessment data
        // For now, we'll use mock data
        const mockAssessments = [
          {
            id: 'assess-1',
            toolId: 'tool-1',
            timestamp: Date.now() - 2700000,
            trustScore: 0.88,
            status: 'trusted',
            source: 'trust_assessment',
            details: 'Tool usage pattern aligns with trust model'
          },
          {
            id: 'assess-2',
            toolId: 'tool-2',
            timestamp: Date.now() - 5400000,
            trustScore: 0.62,
            status: 'moderate',
            source: 'trust_assessment',
            details: 'Tool usage pattern partially aligns with trust model'
          },
          {
            id: 'assess-3',
            toolId: 'tool-4',
            timestamp: Date.now() - 8100000,
            trustScore: 0.35,
            status: 'untrusted',
            source: 'trust_assessment',
            details: 'Tool usage pattern does not align with trust model'
          }
        ];
        
        setVigilAssessments(mockAssessments);
      }
      
      // Get confidence scores if integrated
      if (confidenceScoringIntegrated) {
        // In a real implementation, this would fetch actual confidence data
        // For now, we'll use mock data
        const mockConfidenceScores = [
          {
            id: 'conf-1',
            toolId: 'tool-1',
            timestamp: Date.now() - 1800000,
            confidenceScore: 0.92,
            evidenceCount: 8,
            source: 'confidence_scoring',
            details: 'High confidence based on multiple evidence sources'
          },
          {
            id: 'conf-2',
            toolId: 'tool-2',
            timestamp: Date.now() - 3600000,
            confidenceScore: 0.75,
            evidenceCount: 5,
            source: 'confidence_scoring',
            details: 'Good confidence with moderate evidence'
          },
          {
            id: 'conf-3',
            toolId: 'tool-5',
            timestamp: Date.now() - 5400000,
            confidenceScore: 0.58,
            evidenceCount: 3,
            source: 'confidence_scoring',
            details: 'Moderate confidence with limited evidence'
          }
        ];
        
        setConfidenceScores(mockConfidenceScores);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading observer integration data:', err);
      setError('Failed to load observer integration data');
      setLoading(false);
    }
  }, [toolSelectionHistory, prismObserver, vigilObserver, confidenceScoring]);
  
  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Set up refresh interval
    const intervalId = setInterval(loadData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [loadData]);
  
  // Render integration status
  const renderIntegrationStatus = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Observer Integration Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: integrationStatus.prism ? 'success.light' : 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <VerifiedOutlined color={integrationStatus.prism ? 'success' : 'error'} />
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>PRISM Observer</Typography>
                  </Box>
                  <Typography variant="body2">
                    {integrationStatus.prism 
                      ? 'Successfully integrated with PRISM Observer for belief trace verification'
                      : 'Not integrated with PRISM Observer'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: integrationStatus.vigil ? 'success.light' : 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SecurityOutlined color={integrationStatus.vigil ? 'success' : 'error'} />
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>VIGIL Observer</Typography>
                  </Box>
                  <Typography variant="body2">
                    {integrationStatus.vigil 
                      ? 'Successfully integrated with VIGIL Observer for trust assessment'
                      : 'Not integrated with VIGIL Observer'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: integrationStatus.confidenceScoring ? 'success.light' : 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleOutline color={integrationStatus.confidenceScoring ? 'success' : 'error'} />
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>Confidence Scoring</Typography>
                  </Box>
                  <Typography variant="body2">
                    {integrationStatus.confidenceScoring 
                      ? 'Successfully integrated with Confidence Scoring module'
                      : 'Not integrated with Confidence Scoring module'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // Render PRISM verifications
  const renderPrismVerifications = () => {
    if (!integrationStatus.prism) {
      return (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>PRISM Verifications</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
              <Typography variant="body1" color="error">
                Not integrated with PRISM Observer
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>PRISM Verifications</Typography>
          {prismVerifications.length > 0 ? (
            <Timeline>
              {prismVerifications.map((verification, index) => (
                <TimelineItem key={verification.id}>
                  <TimelineOppositeContent color="text.secondary">
                    {new Date(verification.timestamp).toLocaleString()}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot 
                      color={
                        verification.status === 'verified' ? 'success' :
                        verification.status === 'partial' ? 'warning' :
                        'error'
                      }
                    >
                      {verification.status === 'verified' ? <CheckCircleOutline /> :
                       verification.status === 'partial' ? <HelpOutline /> :
                       <ErrorOutline />}
                    </TimelineDot>
                    {index < prismVerifications.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2">
                        Tool: {verification.toolId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {verification.details}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          size="small" 
                          label={`Confidence: ${(verification.confidence * 100).toFixed(0)}%`}
                          color={
                            verification.confidence > 0.7 ? 'success' :
                            verification.confidence > 0.4 ? 'warning' :
                            'error'
                          }
                        />
                        <Chip 
                          size="small" 
                          sx={{ ml: 1 }}
                          label={verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                          color={
                            verification.status === 'verified' ? 'success' :
                            verification.status === 'partial' ? 'warning' :
                            'error'
                          }
                        />
                      </Box>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
              <Typography variant="body1">No verifications available</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Render VIGIL assessments
  const renderVigilAssessments = () => {
    if (!integrationStatus.vigil) {
      return (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>VIGIL Trust Assessments</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
              <Typography variant="body1" color="error">
                Not integrated with VIGIL Observer
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>VIGIL Trust Assessments</Typography>
          {vigilAssessments.length > 0 ? (
            <Timeline>
              {vigilAssessments.map((assessment, index) => (
                <TimelineItem key={assessment.id}>
                  <TimelineOppositeContent color="text.secondary">
                    {new Date(assessment.timestamp).toLocaleString()}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot 
                      color={
                        assessment.status === 'trusted' ? 'success' :
                        assessment.status === 'moderate' ? 'warning' :
                        'error'
                      }
                    >
                      <SecurityOutlined />
                    </TimelineDot>
                    {index < vigilAssessments.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2">
                        Tool: {assessment.toolId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {assessment.details}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          size="small" 
                          label={`Trust Score: ${(assessment.trustScore * 100).toFixed(0)}%`}
                          color={
                            assessment.trustScore > 0.7 ? 'success' :
                            assessment.trustScore > 0.4 ? 'warning' :
                            'error'
                          }
                        />
                        <Chip 
                          size="small" 
                          sx={{ ml: 1 }}
                          label={assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                          color={
                            assessment.status === 'trusted' ? 'success' :
                            assessment.status === 'moderate' ? 'warning' :
                            'error'
                          }
                        />
                      </Box>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
              <Typography variant="body1">No assessments available</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Render confidence scores
  const renderConfidenceScores = () => {
    if (!integrationStatus.confidenceScoring) {
      return (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Confidence Scores</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
              <Typography variant="body1" color="error">
                Not integrated with Confidence Scoring module
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Confidence Scores</Typography>
          {confidenceScores.length > 0 ? (
            <Timeline>
              {confidenceScores.map((score, index) => (
                <TimelineItem key={score.id}>
                  <TimelineOppositeContent color="text.secondary">
                    {new Date(score.timestamp).toLocaleString()}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot 
                      color={
                        score.confidenceScore > 0.7 ? 'success' :
                        score.confidenceScore > 0.4 ? 'warning' :
                        'error'
                      }
                    >
                      <CheckCircleOutline />
                    </TimelineDot>
                    {index < confidenceScores.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2">
                        Tool: {score.toolId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {score.details}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          size="small" 
                          label={`Confidence: ${(score.confidenceScore * 100).toFixed(0)}%`}
                          color={
                            score.confidenceScore > 0.7 ? 'success' :
                            score.confidenceScore > 0.4 ? 'warning' :
                            'error'
                          }
                        />
                        <Chip 
                          size="small" 
                          sx={{ ml: 1 }}
                          label={`Evidence: ${score.evidenceCount}`}
                          color="primary"
                        />
                      </Box>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
              <Typography variant="body1">No confidence scores available</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Observer Integration</Typography>
      
      {renderIntegrationStatus()}
      {renderPrismVerifications()}
      {renderVigilAssessments()}
      {renderConfidenceScores()}
    </Box>
  );
};

export default ObserverIntegration;
