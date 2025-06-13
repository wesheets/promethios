/**
 * ConversationWrappingPrompt.tsx
 * 
 * Component that appears after successful multi-agent conversations
 * to offer formal wrapping of the tested configuration
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Chip,
  Grid,
  LinearProgress,
  Alert,
  AlertTitle,
  Stack,
  Divider,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  AutoAwesome,
  TrendingUp,
  Speed,
  Security,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Warning,
  Info,
  Rocket,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MultiAgentConversation } from '../../chat/services/AdHocMultiAgentService';
import { adHocToFormalBridge, WrappingRecommendation } from '../services/AdHocToFormalBridge';
import { Agent } from '../../chat/types';

interface ConversationWrappingPromptProps {
  conversation: MultiAgentConversation;
  agents: Agent[];
  onDismiss: () => void;
}

const ConversationWrappingPrompt: React.FC<ConversationWrappingPromptProps> = ({
  conversation,
  agents,
  onDismiss
}) => {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<WrappingRecommendation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    // Analyze the conversation
    const analyzeConversation = async () => {
      setIsAnalyzing(true);
      
      // Simulate analysis time for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const wrappingRecommendation = adHocToFormalBridge.generateWrappingRecommendation(conversation);
      setRecommendation(wrappingRecommendation);
      setIsAnalyzing(false);
    };

    analyzeConversation();
  }, [conversation]);

  const handleWrapSystem = () => {
    if (!recommendation) return;

    // Convert analysis to system config and navigate to wizard
    const systemConfig = adHocToFormalBridge.convertToSystemConfig(recommendation.analysis, agents);
    
    // Store the configuration in sessionStorage for the wizard to pick up
    sessionStorage.setItem('adHocSystemConfig', JSON.stringify({
      ...systemConfig,
      originalConversationId: conversation.id,
      analysisData: recommendation.analysis
    }));

    // Navigate to multi-agent wrapping wizard
    navigate('/ui/agents/multi-wrapping?fromAdHoc=true');
  };

  const getRecommendationColor = (isRecommended: boolean) => {
    return isRecommended ? 'success' : 'warning';
  };

  const getRecommendationIcon = (isRecommended: boolean) => {
    return isRecommended ? <CheckCircle /> : <Warning />;
  };

  if (isAnalyzing) {
    return (
      <Card sx={{ mt: 2, border: 2, borderColor: 'primary.main' }}>
        <CardContent>
          <Box textAlign="center" py={3}>
            <AutoAwesome sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analyzing Multi-Agent Conversation
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Evaluating coordination patterns and agent performance...
            </Typography>
            <LinearProgress sx={{ width: '60%', mx: 'auto' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return null;
  }

  return (
    <Card sx={{ mt: 2, border: 2, borderColor: getRecommendationColor(recommendation.isRecommended) + '.main' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {getRecommendationIcon(recommendation.isRecommended)}
          <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
            {recommendation.isRecommended ? 'Ready for Formal Wrapping!' : 'Needs More Testing'}
          </Typography>
          <IconButton onClick={onDismiss} size="small">
            <ExpandLess />
          </IconButton>
        </Box>

        <Alert 
          severity={recommendation.isRecommended ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
        >
          <AlertTitle>
            {recommendation.isRecommended 
              ? 'This multi-agent configuration shows excellent potential' 
              : 'This configuration needs improvement before wrapping'
            }
          </AlertTitle>
          {recommendation.isRecommended 
            ? `Success rate: ${recommendation.estimatedSuccessRate.toFixed(1)}% - Ready for production deployment`
            : `Success rate: ${recommendation.estimatedSuccessRate.toFixed(1)}% - Consider more testing or agent adjustments`
          }
        </Alert>

        {/* Quick Stats */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {recommendation.analysis.coordinationEffectiveness.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Coordination
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="secondary">
                {recommendation.analysis.agentPerformance.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Agents
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {recommendation.analysis.recommendedFlowType}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Flow Type
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {recommendation.analysis.confidence.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confidence
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Recommendation Reasons */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Analysis Results:
          </Typography>
          <Stack spacing={1}>
            {recommendation.reasons.map((reason, index) => (
              <Chip 
                key={index}
                label={reason}
                size="small"
                color={recommendation.isRecommended ? 'success' : 'warning'}
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} mb={2}>
          {recommendation.isRecommended ? (
            <Button
              variant="contained"
              startIcon={<Rocket />}
              onClick={handleWrapSystem}
              size="large"
              sx={{ flex: 1 }}
            >
              Wrap as Formal System
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Info />}
              onClick={handleWrapSystem}
              size="large"
              sx={{ flex: 1 }}
            >
              Review Configuration
            </Button>
          )}
          
          <Button
            variant="outlined"
            onClick={() => setShowDetails(!showDetails)}
            endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </Stack>

        {/* Detailed Analysis */}
        <Collapse in={showDetails}>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Detailed Analysis
          </Typography>
          
          {/* Suggested System Configuration */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Suggested System Configuration
                </Typography>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Name:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {recommendation.analysis.systemName}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Flow Type:</Typography>
                    <Chip 
                      label={recommendation.analysis.recommendedFlowType} 
                      size="small" 
                      color="primary"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Governance:</Typography>
                    <Chip 
                      label={recommendation.analysis.suggestedGovernanceRules.governancePolicy} 
                      size="small" 
                      color="secondary"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Max Execution:</Typography>
                    <Typography variant="body2">
                      {recommendation.analysis.suggestedGovernanceRules.maxExecutionTime}s
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Metrics
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Coordination Effectiveness</Typography>
                      <Typography variant="body2">
                        {recommendation.analysis.coordinationEffectiveness.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={recommendation.analysis.coordinationEffectiveness} 
                      color="primary"
                    />
                  </Box>
                  
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Overall Confidence</Typography>
                      <Typography variant="body2">
                        {recommendation.analysis.confidence.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={recommendation.analysis.confidence} 
                      color="secondary"
                    />
                  </Box>
                  
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Estimated Success Rate</Typography>
                      <Typography variant="body2">
                        {recommendation.estimatedSuccessRate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={recommendation.estimatedSuccessRate} 
                      color="success"
                    />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Agent Performance Table */}
          <Typography variant="subtitle2" gutterBottom>
            Agent Performance Analysis
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell align="right">Quality Score</TableCell>
                  <TableCell align="right">Confidence</TableCell>
                  <TableCell align="right">Response Time</TableCell>
                  <TableCell>Suggested Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recommendation.analysis.agentPerformance.map((perf) => (
                  <TableRow key={perf.agentId}>
                    <TableCell>{perf.agentName}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        {perf.responseQuality.toFixed(1)}%
                        {perf.responseQuality > 80 && <TrendingUp color="success" sx={{ ml: 1, fontSize: 16 }} />}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{(perf.confidence * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{perf.responseTime.toFixed(0)}ms</TableCell>
                    <TableCell>
                      <Chip 
                        label={perf.suggestedRole} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ConversationWrappingPrompt;

