/**
 * Create Attestation Wizard Component
 * 
 * Multi-step wizard for creating trust attestations between agents.
 * Follows the same pattern as CreateBoundaryWizard with dark theme.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Security,
  Verified,
  Assignment,
  Psychology,
  Policy
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { UserAgentStorageService } from '../services/UserAgentStorageService';

interface Agent {
  identity: {
    id: string;
    name: string;
  };
  id: string;
  name: string;
}

interface AttestationData {
  attestation_type: string;
  subject_instance_id: string;
  subject_name: string;
  attester_instance_id: string;
  attester_name: string;
  attestation_data: Record<string, any>;
  expires_at?: string;
  metadata: Record<string, any>;
}

interface CreateAttestationWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (attestationData: AttestationData) => Promise<void>;
  agents?: Agent[];
}

const attestationTypes = [
  {
    id: 'identity',
    name: 'Identity Attestation',
    icon: <Verified />,
    description: 'Verify the agent\'s identity and authenticity',
    examples: ['Digital signature verification', 'Certificate validation', 'Identity proof']
  },
  {
    id: 'capability',
    name: 'Capability Attestation',
    icon: <Psychology />,
    description: 'Certify specific skills or functional capabilities',
    examples: ['Language processing', 'Data analysis', 'Code generation']
  },
  {
    id: 'compliance',
    name: 'Compliance Attestation',
    icon: <Policy />,
    description: 'Verify regulatory and policy compliance',
    examples: ['GDPR compliance', 'HIPAA certification', 'SOX compliance']
  },
  {
    id: 'integrity',
    name: 'Integrity Attestation',
    icon: <Security />,
    description: 'Verify security measures and data integrity',
    examples: ['Security audit', 'Encryption standards', 'Access controls']
  },
  {
    id: 'behavior',
    name: 'Behavior Attestation',
    icon: <Assignment />,
    description: 'Certify ethical behavior and bias testing',
    examples: ['Bias testing results', 'Ethical guidelines', 'Behavior analysis']
  }
];

const steps = [
  'Attestation Type',
  'Select Agents',
  'Attestation Details',
  'Expiration & Metadata',
  'Review & Create'
];

export const CreateAttestationWizard: React.FC<CreateAttestationWizardProps> = ({
  open,
  onClose,
  onSubmit,
  agents: propAgents = []
}) => {
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [agents, setAgents] = useState<Agent[]>(propAgents);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [attestationData, setAttestationData] = useState<AttestationData>({
    attestation_type: '',
    subject_instance_id: '',
    subject_name: '',
    attester_instance_id: '',
    attester_name: '',
    attestation_data: {},
    metadata: {}
  });

  // Load agents when wizard opens
  useEffect(() => {
    if (open && propAgents.length === 0 && currentUser?.uid) {
      loadAgents();
    }
  }, [open, propAgents.length, currentUser?.uid]);

  const loadAgents = async () => {
    if (!currentUser?.uid) {
      console.warn('No authenticated user, cannot load agents');
      return;
    }

    setLoadingAgents(true);
    try {
      const userAgentService = new UserAgentStorageService();
      // Set the current user before loading agents
      userAgentService.setCurrentUser(currentUser.uid);
      const loadedAgents = await userAgentService.getAgents();
      console.log('Loaded agents for attestation wizard:', loadedAgents);
      setAgents(loadedAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Find agent names from loaded agents
      const subjectAgent = agents.find(agent => 
        (agent.identity?.id === attestationData.subject_instance_id) ||
        (agent.id === attestationData.subject_instance_id)
      );
      const attesterAgent = agents.find(agent => 
        (agent.identity?.id === attestationData.attester_instance_id) ||
        (agent.id === attestationData.attester_instance_id)
      );

      const finalAttestationData = {
        ...attestationData,
        subject_name: subjectAgent?.identity?.name || subjectAgent?.name || attestationData.subject_name,
        attester_name: attesterAgent?.identity?.name || attesterAgent?.name || attestationData.attester_name
      };

      console.log('Submitting attestation data:', finalAttestationData);
      await onSubmit(finalAttestationData);
      onClose();
      resetWizard();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create attestation';
      setSubmitError(errorMessage);
      console.error('Error creating attestation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setActiveStep(0);
    setAttestationData({
      attestation_type: '',
      subject_instance_id: '',
      subject_name: '',
      attester_instance_id: '',
      attester_name: '',
      attestation_data: {},
      metadata: {}
    });
    setSubmitError(null);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
              Choose Attestation Type
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 4 }}>
              Select the type of attestation you want to create. Each type serves different verification purposes.
            </Typography>
            
            <Grid container spacing={2}>
              {attestationTypes.map((type) => (
                <Grid item xs={12} key={type.id}>
                  <Card
                    sx={{
                      backgroundColor: attestationData.attestation_type === type.id ? '#3b82f6' : '#2d3748',
                      border: `1px solid ${attestationData.attestation_type === type.id ? '#3b82f6' : '#4a5568'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: attestationData.attestation_type === type.id ? '#3b82f6' : '#374151',
                        borderColor: '#3b82f6'
                      }
                    }}
                    onClick={() => setAttestationData(prev => ({ ...prev, attestation_type: type.id }))}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: attestationData.attestation_type === type.id ? '#ffffff' : '#3b82f6',
                          color: attestationData.attestation_type === type.id ? '#3b82f6' : '#ffffff'
                        }}>
                          {type.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                            {type.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                            {type.description}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {type.examples.map((example, index) => (
                              <Chip
                                key={index}
                                label={example}
                                size="small"
                                sx={{
                                  backgroundColor: '#4a5568',
                                  color: '#a0aec0',
                                  fontSize: '0.75rem'
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
              Select Agents
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 4 }}>
              Choose the subject agent (being attested) and the attester agent (providing the attestation).
            </Typography>

            {loadingAgents ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                        Subject Agent
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
                        The agent being attested to
                      </Typography>
                      
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#a0aec0' }}>Select subject agent</InputLabel>
                        <Select
                          value={attestationData.subject_instance_id}
                          onChange={(e) => setAttestationData(prev => ({
                            ...prev,
                            subject_instance_id: e.target.value
                          }))}
                          sx={{
                            backgroundColor: '#1a202c',
                            color: '#ffffff',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#4a5568'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#3b82f6'
                            }
                          }}
                        >
                          {agents.map((agent) => (
                            <MenuItem
                              key={agent.identity?.id || agent.id}
                              value={agent.identity?.id || agent.id}
                              sx={{ color: '#ffffff' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                  {(agent.identity?.name || agent.name || 'A').charAt(0)}
                                </Avatar>
                                {agent.identity?.name || agent.name || 'Unknown Agent'}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                        Attester Agent
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
                        The agent providing the attestation
                      </Typography>
                      
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#a0aec0' }}>Select attester agent</InputLabel>
                        <Select
                          value={attestationData.attester_instance_id}
                          onChange={(e) => setAttestationData(prev => ({
                            ...prev,
                            attester_instance_id: e.target.value
                          }))}
                          sx={{
                            backgroundColor: '#1a202c',
                            color: '#ffffff',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#4a5568'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#3b82f6'
                            }
                          }}
                        >
                          {agents.map((agent) => (
                            <MenuItem
                              key={agent.identity?.id || agent.id}
                              value={agent.identity?.id || agent.id}
                              sx={{ color: '#ffffff' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                  {(agent.identity?.name || agent.name || 'A').charAt(0)}
                                </Avatar>
                                {agent.identity?.name || agent.name || 'Unknown Agent'}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
              Attestation Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 4 }}>
              Provide specific details about what is being attested.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Attestation Title"
                  value={attestationData.attestation_data.title || ''}
                  onChange={(e) => setAttestationData(prev => ({
                    ...prev,
                    attestation_data: { ...prev.attestation_data, title: e.target.value }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#3b82f6' }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={attestationData.attestation_data.description || ''}
                  onChange={(e) => setAttestationData(prev => ({
                    ...prev,
                    attestation_data: { ...prev.attestation_data, description: e.target.value }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#3b82f6' }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confidence Score (0-100)"
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  value={attestationData.attestation_data.confidence_score || ''}
                  onChange={(e) => setAttestationData(prev => ({
                    ...prev,
                    attestation_data: { ...prev.attestation_data, confidence_score: parseInt(e.target.value) || 0 }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#3b82f6' }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Evidence URL (optional)"
                  value={attestationData.attestation_data.evidence_url || ''}
                  onChange={(e) => setAttestationData(prev => ({
                    ...prev,
                    attestation_data: { ...prev.attestation_data, evidence_url: e.target.value }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#3b82f6' }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
              Expiration & Metadata
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 4 }}>
              Set expiration date and additional metadata for the attestation.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Expires At (optional)"
                  type="datetime-local"
                  value={attestationData.expires_at || ''}
                  onChange={(e) => setAttestationData(prev => ({
                    ...prev,
                    expires_at: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#3b82f6' }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tags (comma-separated)"
                  value={attestationData.metadata.tags || ''}
                  onChange={(e) => setAttestationData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, tags: e.target.value }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#3b82f6' }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes"
                  value={attestationData.metadata.notes || ''}
                  onChange={(e) => setAttestationData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, notes: e.target.value }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#3b82f6' }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        const selectedType = attestationTypes.find(t => t.id === attestationData.attestation_type);
        const subjectAgent = agents.find(agent => 
          (agent.identity?.id === attestationData.subject_instance_id) ||
          (agent.id === attestationData.subject_instance_id)
        );
        const attesterAgent = agents.find(agent => 
          (agent.identity?.id === attestationData.attester_instance_id) ||
          (agent.id === attestationData.attester_instance_id)
        );

        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
              Review & Create
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 4 }}>
              Review your attestation details before creating.
            </Typography>

            {submitError && (
              <Alert severity="error" sx={{ mb: 3, backgroundColor: '#f56565', color: '#ffffff' }}>
                Error Creating Attestation: {submitError}
              </Alert>
            )}

            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 3 }}>
                  Agent Relationship
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1, bgcolor: '#3b82f6' }}>
                      {(subjectAgent?.identity?.name || subjectAgent?.name || 'S').charAt(0)}
                    </Avatar>
                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                      {subjectAgent?.identity?.name || subjectAgent?.name || 'Unknown Agent'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Subject Agent
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 40, height: 2, backgroundColor: '#3b82f6' }} />
                    <CheckCircle sx={{ color: '#10b981' }} />
                    <Box sx={{ width: 40, height: 2, backgroundColor: '#3b82f6' }} />
                  </Box>

                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1, bgcolor: '#10b981' }}>
                      {(attesterAgent?.identity?.name || attesterAgent?.name || 'A').charAt(0)}
                    </Avatar>
                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                      {attesterAgent?.identity?.name || attesterAgent?.name || 'Unknown Agent'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Attester Agent
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                      Attestation Type
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#3b82f6' }}>
                        {selectedType?.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ color: '#ffffff' }}>
                          {selectedType?.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          {selectedType?.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                      Details
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      <strong>Title:</strong> {attestationData.attestation_data.title || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      <strong>Confidence:</strong> {attestationData.attestation_data.confidence_score || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      <strong>Expires:</strong> {attestationData.expires_at ? new Date(attestationData.expires_at).toLocaleDateString() : 'Never'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="success" sx={{ mt: 3, backgroundColor: '#10b981', color: '#ffffff' }}>
              <CheckCircle sx={{ mr: 1 }} />
              Ready to Create
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your attestation is configured and ready to be created.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepComplete = () => {
    switch (activeStep) {
      case 0:
        return !!attestationData.attestation_type;
      case 1:
        return !!attestationData.subject_instance_id && !!attestationData.attester_instance_id;
      case 2:
        return !!attestationData.attestation_data.title && !!attestationData.attestation_data.description;
      case 3:
        return true; // Optional step
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a202c',
          color: '#ffffff',
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid #4a5568', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ color: '#ffffff' }}>
            Create Attestation
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            Step {activeStep + 1} of {steps.length}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: index <= activeStep ? '#3b82f6' : '#a0aec0',
                      fontSize: '0.875rem'
                    },
                    '& .MuiStepIcon-root': {
                      color: index <= activeStep ? '#3b82f6' : '#4a5568'
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          <LinearProgress
            variant="determinate"
            value={(activeStep / (steps.length - 1)) * 100}
            sx={{
              mt: 2,
              backgroundColor: '#4a5568',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#3b82f6'
              }
            }}
          />
        </Box>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #4a5568', p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: '#a0aec0' }}
        >
          Cancel
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ color: '#a0aec0' }}
        >
          Previous
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isStepComplete() || submitting}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              minWidth: 140
            }}
          >
            {submitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1, color: '#ffffff' }} />
                Creating...
              </>
            ) : (
              'Create Attestation'
            )}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepComplete()}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

