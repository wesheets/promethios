/**
 * Agent Role Manager Component
 * 
 * Provides a comprehensive interface for managing agent roles within the personality tab.
 * Integrates with the AgentRoleService and Universal Governance Adapter for complete
 * role management with contextual linking to receipts and logs.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Badge,
  Slider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Groups as GroupsIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

import { AgentRoleService, AgentRole, RoleAssignment, RoleValidationResult, RoleContextualData } from '../../services/AgentRoleService';

interface AgentRoleManagerProps {
  agentId: string;
  onRoleChange?: (roles: AgentRole[]) => void;
  onContextualDataUpdate?: (data: RoleContextualData | null) => void;
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
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const AgentRoleManager: React.FC<AgentRoleManagerProps> = ({
  agentId,
  onRoleChange,
  onContextualDataUpdate
}) => {
  const [roleService] = useState(() => new AgentRoleService());
  const [allRoles, setAllRoles] = useState<AgentRole[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<AgentRole[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false);
  const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<string>('');
  const [assignmentContext, setAssignmentContext] = useState('');
  
  // Custom role creation state
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    category: 'custom' as AgentRole['category'],
    permissions: [] as string[],
    responsibilities: [] as string[],
    trustScoreMinimum: 0.6,
    complianceLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });

  // Validation state
  const [roleValidations, setRoleValidations] = useState<Map<string, RoleValidationResult>>(new Map());

  useEffect(() => {
    loadRoles();
  }, [agentId]);

  useEffect(() => {
    updateContextualData();
  }, [assignedRoles]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allRolesData, assignedRolesData] = await Promise.all([
        roleService.getAllRoles(),
        roleService.getAgentRoles(agentId)
      ]);

      setAllRoles(allRolesData);
      setAssignedRoles(assignedRolesData);

      // Validate all roles for this agent
      const validations = new Map<string, RoleValidationResult>();
      for (const role of allRolesData) {
        const validation = await roleService.validateRoleAssignment(agentId, role.id);
        validations.set(role.id, validation);
      }
      setRoleValidations(validations);

      onRoleChange?.(assignedRolesData);
    } catch (err) {
      console.error('Failed to load roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const updateContextualData = async () => {
    try {
      const contextualData = await roleService.createRoleContextualData(
        agentId,
        'Professional', // This could be dynamic based on personality settings
        [], // Knowledge bases used - could be tracked
        [] // Capabilities utilized - could be tracked
      );
      onContextualDataUpdate?.(contextualData);
    } catch (err) {
      console.error('Failed to update contextual data:', err);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleForAssignment) return;

    try {
      await roleService.assignRole(
        agentId,
        selectedRoleForAssignment,
        'user', // This could be dynamic based on current user
        assignmentContext || undefined
      );

      await loadRoles();
      setAssignRoleDialogOpen(false);
      setSelectedRoleForAssignment('');
      setAssignmentContext('');
    } catch (err) {
      console.error('Failed to assign role:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  const handleCreateCustomRole = async () => {
    try {
      await roleService.createCustomRole({
        ...newRole,
        createdBy: 'user' // This could be dynamic based on current user
      });

      await loadRoles();
      setCreateRoleDialogOpen(false);
      setNewRole({
        name: '',
        description: '',
        category: 'custom',
        permissions: [],
        responsibilities: [],
        trustScoreMinimum: 0.6,
        complianceLevel: 'medium'
      });
    } catch (err) {
      console.error('Failed to create custom role:', err);
      setError(err instanceof Error ? err.message : 'Failed to create custom role');
    }
  };

  const getCategoryIcon = (category: AgentRole['category']) => {
    switch (category) {
      case 'workflow': return <WorkIcon />;
      case 'functional': return <FunctionsIcon />;
      case 'communication': return <ChatIcon />;
      case 'specialized': return <EngineeringIcon />;
      case 'custom': return <PersonIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const getCategoryColor = (category: AgentRole['category']) => {
    switch (category) {
      case 'workflow': return '#2196f3';
      case 'functional': return '#4caf50';
      case 'communication': return '#ff9800';
      case 'specialized': return '#9c27b0';
      case 'custom': return '#607d8b';
      default: return '#757575';
    }
  };

  const getComplianceLevelColor = (level: string) => {
    switch (level) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'critical': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getValidationIcon = (validation: RoleValidationResult) => {
    if (validation.valid && validation.governanceCompliance) {
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    } else if (validation.valid) {
      return <WarningIcon sx={{ color: '#ff9800' }} />;
    } else {
      return <WarningIcon sx={{ color: '#f44336' }} />;
    }
  };

  const renderRoleCard = (role: AgentRole, isAssigned: boolean = false) => {
    const validation = roleValidations.get(role.id);
    
    return (
      <Card 
        key={role.id} 
        sx={{ 
          mb: 2, 
          border: isAssigned ? '2px solid #4caf50' : '1px solid #333',
          bgcolor: isAssigned ? 'rgba(76, 175, 80, 0.1)' : 'background.paper'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ color: getCategoryColor(role.category), mr: 1 }}>
              {getCategoryIcon(role.category)}
            </Box>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {role.name}
              {role.isPrebuilt && (
                <Chip 
                  label="Prebuilt" 
                  size="small" 
                  sx={{ ml: 1, bgcolor: '#1976d2', color: 'white' }}
                />
              )}
              {isAssigned && (
                <Chip 
                  label="Assigned" 
                  size="small" 
                  sx={{ ml: 1, bgcolor: '#4caf50', color: 'white' }}
                />
              )}
            </Typography>
            {validation && (
              <Tooltip title={`Validation Score: ${(validation.score * 100).toFixed(0)}%`}>
                {getValidationIcon(validation)}
              </Tooltip>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {role.description}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Permissions ({role.permissions.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {role.permissions.slice(0, 3).map(permission => (
                  <Chip 
                    key={permission} 
                    label={permission.replace(/_/g, ' ')} 
                    size="small" 
                    variant="outlined"
                  />
                ))}
                {role.permissions.length > 3 && (
                  <Chip 
                    label={`+${role.permissions.length - 3} more`} 
                    size="small" 
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Governance Requirements
              </Typography>
              {role.governanceRequirements ? (
                <Box>
                  {role.governanceRequirements.trustScoreMinimum && (
                    <Typography variant="body2">
                      Trust Score: ≥{(role.governanceRequirements.trustScoreMinimum * 100).toFixed(0)}%
                    </Typography>
                  )}
                  {role.governanceRequirements.complianceLevel && (
                    <Chip 
                      label={role.governanceRequirements.complianceLevel.toUpperCase()} 
                      size="small"
                      sx={{ 
                        bgcolor: getComplianceLevelColor(role.governanceRequirements.complianceLevel),
                        color: 'white',
                        mt: 0.5
                      }}
                    />
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No specific requirements
                </Typography>
              )}
            </Grid>
          </Grid>

          {validation && validation.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {validation.warnings.join(', ')}
              </Typography>
            </Alert>
          )}

          {!isAssigned && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedRoleForAssignment(role.id);
                  setAssignRoleDialogOpen(true);
                }}
                disabled={validation && !validation.valid}
              >
                Assign Role
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRolesByCategory = (category: AgentRole['category'], roles: AgentRole[]) => {
    const categoryRoles = roles.filter(role => role.category === category);
    if (categoryRoles.length === 0) return null;

    return (
      <Accordion key={category} defaultExpanded={category === 'workflow'}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ color: getCategoryColor(category), mr: 1 }}>
              {getCategoryIcon(category)}
            </Box>
            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
              {category} Roles
            </Typography>
            <Badge badgeContent={categoryRoles.length} color="primary" sx={{ ml: 2 }} />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {categoryRoles.map(role => renderRoleCard(role))}
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Agent Role Management
        </Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading roles and validating assignments...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadRoles}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">
          Agent Role Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateRoleDialogOpen(true)}
        >
          Create Custom Role
        </Button>
      </Box>

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ mr: 1 }} />
              Assigned Roles
              <Badge badgeContent={assignedRoles.length} color="primary" sx={{ ml: 1 }} />
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GroupsIcon sx={{ mr: 1 }} />
              Available Roles
              <Badge badgeContent={allRoles.length} color="secondary" sx={{ ml: 1 }} />
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AnalyticsIcon sx={{ mr: 1 }} />
              Analytics
            </Box>
          } 
        />
      </Tabs>

      <TabPanel value={selectedTab} index={0}>
        {assignedRoles.length > 0 ? (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              This agent is currently assigned {assignedRoles.length} role{assignedRoles.length !== 1 ? 's' : ''}:
            </Typography>
            {assignedRoles.map(role => renderRoleCard(role, true))}
          </Box>
        ) : (
          <Alert severity="info">
            No roles are currently assigned to this agent. Assign roles to define the agent's capabilities and responsibilities.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Choose from {allRoles.length} available roles across different categories:
        </Typography>
        
        {(['workflow', 'functional', 'communication', 'specialized', 'custom'] as const).map(category =>
          renderRolesByCategory(category, allRoles)
        )}
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <Typography variant="h6" gutterBottom>
          Role Performance Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Analytics and performance metrics for role assignments will be displayed here.
          This includes role effectiveness, governance compliance, and contextual performance data.
        </Typography>
        {/* TODO: Implement role analytics dashboard */}
      </TabPanel>

      {/* Assign Role Dialog */}
      <Dialog open={assignRoleDialogOpen} onClose={() => setAssignRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role to Agent</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Role</InputLabel>
            <Select
              value={selectedRoleForAssignment}
              onChange={(e) => setSelectedRoleForAssignment(e.target.value)}
              label="Select Role"
            >
              {allRoles
                .filter(role => !assignedRoles.some(ar => ar.id === role.id))
                .map(role => (
                  <MenuItem key={role.id} value={role.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ color: getCategoryColor(role.category), mr: 1 }}>
                        {getCategoryIcon(role.category)}
                      </Box>
                      {role.name}
                      {role.isPrebuilt && (
                        <Chip label="Prebuilt" size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Assignment Context (Optional)"
            value={assignmentContext}
            onChange={(e) => setAssignmentContext(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
            placeholder="Describe the context or reason for this role assignment..."
          />

          {selectedRoleForAssignment && roleValidations.get(selectedRoleForAssignment) && (
            <Box sx={{ mt: 2 }}>
              {(() => {
                const validation = roleValidations.get(selectedRoleForAssignment)!;
                return (
                  <Alert 
                    severity={validation.valid ? (validation.governanceCompliance ? 'success' : 'warning') : 'error'}
                  >
                    <Typography variant="body2">
                      Validation Score: {(validation.score * 100).toFixed(0)}%
                    </Typography>
                    {validation.warnings.length > 0 && (
                      <Typography variant="body2">
                        Warnings: {validation.warnings.join(', ')}
                      </Typography>
                    )}
                    {validation.recommendations.length > 0 && (
                      <Typography variant="body2">
                        Recommendations: {validation.recommendations.join(', ')}
                      </Typography>
                    )}
                  </Alert>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignRoleDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignRole} 
            variant="contained"
            disabled={!selectedRoleForAssignment || (roleValidations.get(selectedRoleForAssignment) && !roleValidations.get(selectedRoleForAssignment)!.valid)}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Custom Role Dialog */}
      <Dialog open={createRoleDialogOpen} onClose={() => setCreateRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: '#607d8b' }} />
            Create Custom Agent Role
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  required
                  error={!newRole.name}
                  helperText={!newRole.name ? 'Role name is required' : ''}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newRole.category}
                    onChange={(e) => setNewRole({ ...newRole, category: e.target.value as AgentRole['category'] })}
                    label="Category"
                  >
                    <MenuItem value="workflow">Workflow</MenuItem>
                    <MenuItem value="functional">Functional</MenuItem>
                    <MenuItem value="communication">Communication</MenuItem>
                    <MenuItem value="specialized">Specialized</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  required
                  error={!newRole.description}
                  helperText={!newRole.description ? 'Description is required' : 'Describe the role\'s purpose and responsibilities'}
                />
              </Grid>

              {/* Governance Requirements */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Governance Requirements
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" gutterBottom>
                  Minimum Trust Score: {(newRole.trustScoreMinimum * 100).toFixed(0)}%
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={newRole.trustScoreMinimum}
                    onChange={(_, value) => setNewRole({ ...newRole, trustScoreMinimum: value as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 0.5, label: '50%' },
                      { value: 1, label: '100%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Compliance Level</InputLabel>
                  <Select
                    value={newRole.complianceLevel}
                    onChange={(e) => setNewRole({ ...newRole, complianceLevel: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                    label="Compliance Level"
                  >
                    <MenuItem value="low">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50', mr: 1 }} />
                        Low
                      </Box>
                    </MenuItem>
                    <MenuItem value="medium">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800', mr: 1 }} />
                        Medium
                      </Box>
                    </MenuItem>
                    <MenuItem value="high">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336', mr: 1 }} />
                        High
                      </Box>
                    </MenuItem>
                    <MenuItem value="critical">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#d32f2f', mr: 1 }} />
                        Critical
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Permissions */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Permissions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  label="Add Permission"
                  placeholder="e.g., data_processing, quality_control, user_interaction"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const permission = (e.target as HTMLInputElement).value.trim();
                      if (permission && !newRole.permissions.includes(permission)) {
                        setNewRole({
                          ...newRole,
                          permissions: [...newRole.permissions, permission]
                        });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  helperText="Press Enter to add permissions"
                />
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {newRole.permissions.map((permission, index) => (
                    <Chip
                      key={index}
                      label={permission.replace(/_/g, ' ')}
                      onDelete={() => {
                        setNewRole({
                          ...newRole,
                          permissions: newRole.permissions.filter((_, i) => i !== index)
                        });
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              {/* Responsibilities */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Responsibilities
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  label="Add Responsibility"
                  placeholder="e.g., Analyze data patterns, Generate reports, Ensure quality standards"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const responsibility = (e.target as HTMLInputElement).value.trim();
                      if (responsibility && !newRole.responsibilities.includes(responsibility)) {
                        setNewRole({
                          ...newRole,
                          responsibilities: [...newRole.responsibilities, responsibility]
                        });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  helperText="Press Enter to add responsibilities"
                />
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {newRole.responsibilities.map((responsibility, index) => (
                    <Chip
                      key={index}
                      label={responsibility}
                      onDelete={() => {
                        setNewRole({
                          ...newRole,
                          responsibilities: newRole.responsibilities.filter((_, i) => i !== index)
                        });
                      }}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              {/* Validation Preview */}
              {(newRole.name || newRole.description) && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Role Preview:</strong> {newRole.name} - {newRole.description}
                      <br />
                      <strong>Governance:</strong> {(newRole.trustScoreMinimum * 100).toFixed(0)}% trust score minimum, {newRole.complianceLevel} compliance level
                      <br />
                      <strong>Permissions:</strong> {newRole.permissions.length} permissions defined
                      <br />
                      <strong>Responsibilities:</strong> {newRole.responsibilities.length} responsibilities defined
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoleDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCustomRole}
            disabled={!newRole.name || !newRole.description || newRole.permissions.length === 0}
          >
            Create Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentRoleManager;

