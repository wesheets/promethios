import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  Psychology as PsychologyIcon,
  AccountTree as AccountTreeIcon,
  HowToVote as HowToVoteIcon,
  Chat as ChatIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface MASVisualizationProps {
  contextId: string;
  darkMode?: boolean;
}

interface MASContext {
  contextId: string;
  auditId: string;
  eventType: string;
  timestamp: string;
  contextData: {
    name: string;
    agentIds: string[];
    collaborationModel: string;
    policies: any;
    governanceEnabled: boolean;
    metadata: any;
  };
  createdBy: string;
  signature: string;
  hash: string;
}

interface CollectiveBehavior {
  behaviorId: string;
  contextId: string;
  eventType: string;
  timestamp: string;
  behaviorType: string;
  participants: string[];
  behaviorData: {
    description: string;
    triggers: string[];
    outcomes: string[];
    metrics: any;
    emergenceLevel: 'low' | 'medium' | 'high';
    coordinationPattern: string;
    consensusReached: boolean;
  };
  detectedBy: string;
  signature: string;
  hash: string;
}

interface CoordinationProtocol {
  protocolId: string;
  contextId: string;
  eventType: string;
  timestamp: string;
  protocolType: string;
  participants: string[];
  protocolData: {
    description: string;
    phases: string[];
    currentPhase: string;
    rules: any;
    constraints: any;
    expectedOutcome: string;
    actualOutcome: string | null;
    success: boolean;
  };
  initiatedBy: string;
  signature: string;
  hash: string;
}

interface ConsensusEvent {
  consensusId: string;
  contextId: string;
  eventType: string;
  timestamp: string;
  consensusType: string;
  participants: string[];
  consensusData: {
    proposal: string;
    votes: { [agentId: string]: string };
    threshold: number;
    result: 'accepted' | 'rejected' | 'timeout';
    finalDecision: string;
    votingRounds: number;
    byzantineFaultTolerance: boolean;
    proofOfConsensus: string | null;
  };
  facilitatedBy: string;
  signature: string;
  hash: string;
}

interface Communication {
  communicationId: string;
  contextId: string;
  eventType: string;
  timestamp: string;
  fromAgentId: string;
  toAgentId: string;
  messageData: {
    messageType: string;
    content: string;
    contentHash: string;
    priority: string;
    encrypted: boolean;
    acknowledgmentRequired: boolean;
    acknowledged: boolean;
    metadata: any;
  };
  signature: string;
  hash: string;
}

interface EmergentBehaviorAnalysis {
  totalBehaviors: number;
  behaviorTypes: { [type: string]: number };
  emergenceLevels: { low: number; medium: number; high: number };
  coordinationPatterns: { [pattern: string]: number };
  consensusSuccess: number;
  averageParticipants: number;
  timeDistribution: any;
  cryptographicIntegrity: boolean;
}

const MultiAgentSystemVisualization: React.FC<MASVisualizationProps> = ({
  contextId,
  darkMode = true
}) => {
  const [masContext, setMasContext] = useState<MASContext | null>(null);
  const [collectiveBehaviors, setCollectiveBehaviors] = useState<CollectiveBehavior[]>([]);
  const [coordinationProtocols, setCoordinationProtocols] = useState<CoordinationProtocol[]>([]);
  const [consensusEvents, setConsensusEvents] = useState<ConsensusEvent[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [emergentAnalysis, setEmergentAnalysis] = useState<EmergentBehaviorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const theme = {
    background: darkMode ? '#1a1a1a' : '#ffffff',
    surface: darkMode ? '#2d2d2d' : '#f5f5f5',
    primary: darkMode ? '#bb86fc' : '#6200ea',
    secondary: darkMode ? '#03dac6' : '#018786',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#b3b3b3' : '#666666',
    success: darkMode ? '#4caf50' : '#2e7d32',
    warning: darkMode ? '#ff9800' : '#ed6c02',
    error: darkMode ? '#f44336' : '#d32f2f',
    border: darkMode ? '#404040' : '#e0e0e0'
  };

  useEffect(() => {
    loadMASData();
  }, [contextId]);

  const loadMASData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load MAS context
      const contextResponse = await fetch(`/api/multi-agent-audit/context/${contextId}`);
      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        setMasContext(contextData);
      }

      // Load collective behaviors
      const behaviorsResponse = await fetch(`/api/multi-agent-audit/collective-behaviors/${contextId}`);
      if (behaviorsResponse.ok) {
        const behaviorsData = await behaviorsResponse.json();
        setCollectiveBehaviors(behaviorsData.behaviors || []);
      }

      // Load coordination protocols
      const protocolsResponse = await fetch(`/api/multi-agent-audit/coordination-protocols/${contextId}`);
      if (protocolsResponse.ok) {
        const protocolsData = await protocolsResponse.json();
        setCoordinationProtocols(protocolsData.protocols || []);
      }

      // Load consensus events
      const consensusResponse = await fetch(`/api/multi-agent-audit/consensus-events/${contextId}`);
      if (consensusResponse.ok) {
        const consensusData = await consensusResponse.json();
        setConsensusEvents(consensusData.consensus || []);
      }

      // Load communications
      const communicationsResponse = await fetch(`/api/multi-agent-audit/communications/${contextId}`);
      if (communicationsResponse.ok) {
        const communicationsData = await communicationsResponse.json();
        setCommunications(communicationsData.communications || []);
      }

      // Load emergent behavior analysis
      const analysisResponse = await fetch(`/api/multi-agent-audit/emergent-behaviors/${contextId}`);
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setEmergentAnalysis(analysisData.analysis);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MAS data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMASData();
    setRefreshing(false);
  };

  const getEmergenceLevelColor = (level: string) => {
    switch (level) {
      case 'high': return theme.error;
      case 'medium': return theme.warning;
      case 'low': return theme.success;
      default: return theme.textSecondary;
    }
  };

  const getConsensusResultColor = (result: string) => {
    switch (result) {
      case 'accepted': return theme.success;
      case 'rejected': return theme.error;
      case 'timeout': return theme.warning;
      default: return theme.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{ backgroundColor: theme.background }}
      >
        <CircularProgress sx={{ color: theme.primary }} />
        <Typography sx={{ ml: 2, color: theme.text }}>
          Loading multi-agent system data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          backgroundColor: theme.surface,
          color: theme.text,
          '& .MuiAlert-icon': { color: theme.error }
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ backgroundColor: theme.background, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ color: theme.text, fontWeight: 'bold' }}>
          <AccountTreeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Multi-Agent System Visualization
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ color: theme.primary }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* MAS Context Overview */}
      {masContext && (
        <Card sx={{ mb: 3, backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: theme.text, mb: 2 }}>
              <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Context: {masContext.contextData.name}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                  Context ID: {masContext.contextId}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                  Collaboration Model: {masContext.contextData.collaborationModel}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                  Created: {formatTimestamp(masContext.timestamp)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                  Agents ({masContext.contextData.agentIds.length}):
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {masContext.contextData.agentIds.map((agentId) => (
                    <Chip
                      key={agentId}
                      label={agentId}
                      size="small"
                      sx={{
                        backgroundColor: theme.primary,
                        color: theme.background,
                        '&:hover': { backgroundColor: theme.secondary }
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Emergent Behavior Analysis */}
      {emergentAnalysis && (
        <Card sx={{ mb: 3, backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: theme.text, mb: 2 }}>
              <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Emergent Behavior Analysis
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                  Total Behaviors: {emergentAnalysis.totalBehaviors}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                  Average Participants: {emergentAnalysis.averageParticipants}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                  Consensus Success: {emergentAnalysis.consensusSuccess}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                  Emergence Levels:
                </Typography>
                {Object.entries(emergentAnalysis.emergenceLevels).map(([level, count]) => (
                  <Box key={level} display="flex" alignItems="center" mb={0.5}>
                    <Chip
                      label={`${level}: ${count}`}
                      size="small"
                      sx={{
                        backgroundColor: getEmergenceLevelColor(level),
                        color: theme.background,
                        minWidth: '80px'
                      }}
                    />
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                  Behavior Types:
                </Typography>
                {Object.entries(emergentAnalysis.behaviorTypes).map(([type, count]) => (
                  <Typography key={type} variant="body2" sx={{ color: theme.text }}>
                    {type}: {count}
                  </Typography>
                ))}
              </Grid>
            </Grid>
            <Box mt={2}>
              <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                Cryptographic Integrity:
              </Typography>
              <Chip
                icon={emergentAnalysis.cryptographicIntegrity ? <CheckCircleIcon /> : <ErrorIcon />}
                label={emergentAnalysis.cryptographicIntegrity ? 'Verified' : 'Compromised'}
                color={emergentAnalysis.cryptographicIntegrity ? 'success' : 'error'}
                sx={{ color: theme.background }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Collective Behaviors */}
      <Accordion sx={{ mb: 2, backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.text }} />}>
          <Typography variant="h6" sx={{ color: theme.text }}>
            <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Collective Behaviors ({collectiveBehaviors.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} sx={{ backgroundColor: theme.background }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Timestamp</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Emergence Level</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Participants</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collectiveBehaviors.map((behavior) => (
                  <TableRow key={behavior.behaviorId}>
                    <TableCell sx={{ color: theme.textSecondary }}>
                      {formatTimestamp(behavior.timestamp)}
                    </TableCell>
                    <TableCell sx={{ color: theme.text }}>{behavior.behaviorType}</TableCell>
                    <TableCell>
                      <Chip
                        label={behavior.behaviorData.emergenceLevel}
                        size="small"
                        sx={{
                          backgroundColor: getEmergenceLevelColor(behavior.behaviorData.emergenceLevel),
                          color: theme.background
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.text }}>{behavior.participants.length}</TableCell>
                    <TableCell sx={{ color: theme.textSecondary }}>
                      {behavior.behaviorData.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Coordination Protocols */}
      <Accordion sx={{ mb: 2, backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.text }} />}>
          <Typography variant="h6" sx={{ color: theme.text }}>
            <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Coordination Protocols ({coordinationProtocols.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} sx={{ backgroundColor: theme.background }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Timestamp</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Phase</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Success</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Participants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coordinationProtocols.map((protocol) => (
                  <TableRow key={protocol.protocolId}>
                    <TableCell sx={{ color: theme.textSecondary }}>
                      {formatTimestamp(protocol.timestamp)}
                    </TableCell>
                    <TableCell sx={{ color: theme.text }}>{protocol.protocolType}</TableCell>
                    <TableCell sx={{ color: theme.text }}>{protocol.protocolData.currentPhase}</TableCell>
                    <TableCell>
                      <Chip
                        icon={protocol.protocolData.success ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={protocol.protocolData.success ? 'Success' : 'Failed'}
                        color={protocol.protocolData.success ? 'success' : 'error'}
                        size="small"
                        sx={{ color: theme.background }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.text }}>{protocol.participants.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Consensus Events */}
      <Accordion sx={{ mb: 2, backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.text }} />}>
          <Typography variant="h6" sx={{ color: theme.text }}>
            <HowToVoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Consensus Events ({consensusEvents.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} sx={{ backgroundColor: theme.background }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Timestamp</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Result</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Rounds</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Byzantine FT</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Participants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consensusEvents.map((consensus) => (
                  <TableRow key={consensus.consensusId}>
                    <TableCell sx={{ color: theme.textSecondary }}>
                      {formatTimestamp(consensus.timestamp)}
                    </TableCell>
                    <TableCell sx={{ color: theme.text }}>{consensus.consensusType}</TableCell>
                    <TableCell>
                      <Chip
                        label={consensus.consensusData.result}
                        size="small"
                        sx={{
                          backgroundColor: getConsensusResultColor(consensus.consensusData.result),
                          color: theme.background
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.text }}>{consensus.consensusData.votingRounds}</TableCell>
                    <TableCell>
                      <Chip
                        icon={consensus.consensusData.byzantineFaultTolerance ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={consensus.consensusData.byzantineFaultTolerance ? 'Yes' : 'No'}
                        color={consensus.consensusData.byzantineFaultTolerance ? 'success' : 'default'}
                        size="small"
                        sx={{ color: theme.background }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.text }}>{consensus.participants.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Inter-Agent Communications */}
      <Accordion sx={{ mb: 2, backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.text }} />}>
          <Typography variant="h6" sx={{ color: theme.text }}>
            <ChatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Inter-Agent Communications ({communications.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} sx={{ backgroundColor: theme.background }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Timestamp</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>From</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>To</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ color: theme.text, fontWeight: 'bold' }}>Acknowledged</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {communications.map((comm) => (
                  <TableRow key={comm.communicationId}>
                    <TableCell sx={{ color: theme.textSecondary }}>
                      {formatTimestamp(comm.timestamp)}
                    </TableCell>
                    <TableCell sx={{ color: theme.text }}>{comm.fromAgentId}</TableCell>
                    <TableCell sx={{ color: theme.text }}>{comm.toAgentId}</TableCell>
                    <TableCell sx={{ color: theme.text }}>{comm.messageData.messageType}</TableCell>
                    <TableCell>
                      <Chip
                        label={comm.messageData.priority}
                        size="small"
                        color={comm.messageData.priority === 'high' ? 'error' : 
                               comm.messageData.priority === 'medium' ? 'warning' : 'default'}
                        sx={{ color: theme.background }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={comm.messageData.acknowledged ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={comm.messageData.acknowledged ? 'Yes' : 'No'}
                        color={comm.messageData.acknowledged ? 'success' : 'default'}
                        size="small"
                        sx={{ color: theme.background }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default MultiAgentSystemVisualization;

