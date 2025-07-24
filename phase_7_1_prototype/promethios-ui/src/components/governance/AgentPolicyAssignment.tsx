/**
 * Agent-Policy Assignment Interface
 * 
 * Allows users to assign multiple policies to agents and manage
 * policy assignments across the governance system.
 */
import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Badge,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Assignment,
  AssignmentTurnedIn,
  Add,
  Edit,
  Delete,
  MoreVert,
  Security,
  Gavel,
  Balance,
  Settings,
  CheckCircle,
  Warning,
  Error,
  Info,
  Person,
  Policy as PolicyIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon
} from '@mui/icons-material';
import { useToast } from '../../hooks/use-toast';

// Interfaces
interface Agent {
  agentId: string;
  agentName: string;
  version: 'test' | 'production';
  status: 'active' | 'inactive';
  assignedPolicies: string[];
}

interface Policy {
  policy_id: string;
  name: string;
  category: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  description: string;
  assignedAgents: string[];
}

interface PolicyAssignment {
  agentId: string;
  policyId: string;
  assignedAt: string;
  status: 'active' | 'inactive';
  complianceRate?: number;
}

interface AgentPolicyAssignmentProps {
  agents: Agent[];
  policies: Policy[];
  assignments: PolicyAssignment[];
  onAssignPolicy: (agentId: string, policyId: string) => Promise<void>;
  onUnassignPolicy: (agentId: string, policyId: string) => Promise<void>;
  onUpdateAssignment: (agentId: string, policyId: string, updates: Partial<PolicyAssignment>) => Promise<void>;
}

const AgentPolicyAssignment: React.FC<AgentPolicyAssignmentProps> = ({
  agents: rawAgents,
  policies,
  assignments,
  onAssignPolicy,
  onUnassignPolicy,
  onUpdateAssignment
}) => {
  // Deduplicate agents to ensure clean list
  const agents = useMemo(() => {
    const uniqueAgents = rawAgents.filter((agent, index, self) => 
      index === self.findIndex(a => a.agentId === agent.agentId)
    );
    
    console.log(`Agent deduplication: ${rawAgents.length} → ${uniqueAgents.length} agents`);
    return uniqueAgents;
  }, [rawAgents]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'agent' | 'policy'>('agent');
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { toast } = useToast();

  // Get assignments for a specific agent
  const getAgentAssignments = (agentId: string): PolicyAssignment[] => {
    return assignments.filter(assignment => assignment.agentId === agentId);
  };

  // Get assignments for a specific policy
  const getPolicyAssignments = (policyId: string): PolicyAssignment[] => {
    return assignments.filter(assignment => assignment.policyId === policyId);
  };

  // Check if agent has policy assigned
  const isAssigned = (agentId: string, policyId: string): boolean => {
    return assignments.some(assignment => 
      assignment.agentId === agentId && assignment.policyId === policyId
    );
  };

  // Get policy by ID
  const getPolicyById = (policyId: string): Policy | undefined => {
    return policies.find(policy => policy.policy_id === policyId);
  };

  // Get agent by ID
  const getAgentById = (agentId: string): Agent | undefined => {
    return agents.find(agent => agent.agentId === agentId);
  };

  // Handle single policy assignment
  const handleAssignPolicy = async (agentId: string, policyId: string) => {
    setLoading(true);
    try {
      await onAssignPolicy(agentId, policyId);
      toast({
        title: 'Success',
        description: 'Policy assigned successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign policy',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle policy unassignment
  const handleUnassignPolicy = async (agentId: string, policyId: string) => {
    setLoading(true);
    try {
      await onUnassignPolicy(agentId, policyId);
      toast({
        title: 'Success',
        description: 'Policy unassigned successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unassign policy',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get policy icon by category
  const getPolicyIcon = (category: string) => {
    switch (category) {
      case 'SECURITY': return <Security sx={{ color: '#f44336' }} />;
      case 'COMPLIANCE': return <Gavel sx={{ color: '#2196f3' }} />;
      case 'ETHICAL': return <Balance sx={{ color: '#9c27b0' }} />;
      default: return <PolicyIcon sx={{ color: '#607d8b' }} />;
    }
  };

  // Render agent view (agents with their assigned policies)
  const renderAgentView = () => (
    <Grid container spacing={3}>
      {agents.map((agent) => {
        const agentAssignments = getAgentAssignments(agent.agentId);
        const assignedPolicies = agentAssignments.map(assignment => 
          getPolicyById(assignment.policyId)
        ).filter(Boolean) as Policy[];

        return (
          <Grid item xs={12} md={6} lg={4} key={agent.agentId}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: agent.status === 'active' ? 'success.main' : 'grey.500' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {agent.agentName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {agent.version} • {agent.status}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setSelectedAgent(agent);
                      setAnchorEl(e.currentTarget);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Assigned Policies ({assignedPolicies.length})
                </Typography>

                {assignedPolicies.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      No policies assigned to this agent
                    </Typography>
                  </Alert>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    {assignedPolicies.map((policy) => {
                      const assignment = agentAssignments.find(a => a.policyId === policy.policy_id);
                      return (
                        <Chip
                          key={policy.policy_id}
                          icon={getPolicyIcon(policy.category)}
                          label={policy.name}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          onDelete={() => handleUnassignPolicy(agent.agentId, policy.policy_id)}
                          color={assignment?.status === 'active' ? 'primary' : 'default'}
                        />
                      );
                    })}
                  </Box>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setAssignmentDialogOpen(true);
                  }}
                  fullWidth
                >
                  Assign Policies
                </Button>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  // Render policy view (policies with their assigned agents)
  const renderPolicyView = () => (
    <Grid container spacing={3}>
      {policies.map((policy) => {
        const policyAssignments = getPolicyAssignments(policy.policy_id);
        const assignedAgents = policyAssignments.map(assignment => 
          getAgentById(assignment.agentId)
        ).filter(Boolean) as Agent[];

        return (
          <Grid item xs={12} md={6} lg={4} key={policy.policy_id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getPolicyIcon(policy.category)}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {policy.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {policy.category} • {policy.status}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setSelectedPolicy(policy);
                      setAnchorEl(e.currentTarget);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Assigned Agents ({assignedAgents.length})
                </Typography>

                {assignedAgents.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      No agents assigned to this policy
                    </Typography>
                  </Alert>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    {assignedAgents.map((agent) => {
                      const assignment = policyAssignments.find(a => a.agentId === agent.agentId);
                      return (
                        <Chip
                          key={agent.agentId}
                          icon={<Person />}
                          label={agent.agentName}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          onDelete={() => handleUnassignPolicy(agent.agentId, policy.policy_id)}
                          color={assignment?.status === 'active' ? 'primary' : 'default'}
                        />
                      );
                    })}
                  </Box>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedPolicy(policy);
                    setAssignmentDialogOpen(true);
                  }}
                  fullWidth
                >
                  Assign Agents
                </Button>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  // Render assignment dialog
  const renderAssignmentDialog = () => (
    <Dialog
      open={assignmentDialogOpen}
      onClose={() => setAssignmentDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {selectedAgent ? `Assign Policies to ${selectedAgent.agentName}` : 
         selectedPolicy ? `Assign Agents to ${selectedPolicy.name}` : 'Assign Policies'}
      </DialogTitle>
      <DialogContent>
        {selectedAgent && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select policies to assign to this agent:
            </Typography>
            <List>
              {policies.filter(p => p.status === 'active').map((policy) => (
                <ListItem key={policy.policy_id}>
                  <ListItemIcon>
                    {getPolicyIcon(policy.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={policy.name}
                    secondary={policy.description}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={isAssigned(selectedAgent.agentId, policy.policy_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleAssignPolicy(selectedAgent.agentId, policy.policy_id);
                        } else {
                          handleUnassignPolicy(selectedAgent.agentId, policy.policy_id);
                        }
                      }}
                      disabled={loading}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {selectedPolicy && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select agents to assign this policy to:
            </Typography>
            <List>
              {agents.filter(a => a.status === 'active').map((agent) => (
                <ListItem key={agent.agentId}>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary={agent.agentName}
                    secondary={`${agent.version} • ${agent.status}`}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={isAssigned(agent.agentId, selectedPolicy.policy_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleAssignPolicy(agent.agentId, selectedPolicy.policy_id);
                        } else {
                          handleUnassignPolicy(agent.agentId, selectedPolicy.policy_id);
                        }
                      }}
                      disabled={loading}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAssignmentDialogOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Agent-Policy Assignments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage policy assignments across your agents for comprehensive governance.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'agent' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('agent')}
            startIcon={<Person />}
          >
            By Agent
          </Button>
          <Button
            variant={viewMode === 'policy' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('policy')}
            startIcon={<PolicyIcon />}
          >
            By Policy
          </Button>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {agents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {policies.filter(p => p.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Policies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {assignments.filter(a => a.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Assignments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {Math.round(assignments.reduce((sum, a) => sum + (a.complianceRate || 0), 0) / assignments.length || 0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Compliance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      {viewMode === 'agent' ? renderAgentView() : renderPolicyView()}

      {/* Assignment Dialog */}
      {renderAssignmentDialog()}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <LinkIcon />
          </ListItemIcon>
          <ListItemText>Bulk Assign</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <UnlinkIcon />
          </ListItemIcon>
          <ListItemText>Remove All</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AgentPolicyAssignment;

