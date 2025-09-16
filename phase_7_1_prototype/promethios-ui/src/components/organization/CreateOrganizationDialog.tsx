/**
 * CreateOrganizationDialog - Dialog for creating new organizations
 * 
 * Integrates with FirebaseOrganizationService to create organizations
 * with proper validation and user experience.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  Box,
  Typography,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Business,
  Public,
  Lock,
  Domain,
} from '@mui/icons-material';
import { FirebaseOrganizationService } from '../../services/FirebaseOrganizationService';
import { useAuth } from '../../context/AuthContext';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (organizationId: string) => void;
}

const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    industry: '',
    isPublic: true,
    allowPublicJoining: true,
    requireApproval: false,
    maxMembers: 100
  });

  const organizationService = FirebaseOrganizationService.getInstance();

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to create an organization');
      return;
    }

    if (!formData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    if (!formData.domain.trim()) {
      setError('Organization domain is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const organization = await organizationService.createOrganization(currentUser.uid, {
        name: formData.name.trim(),
        domain: formData.domain.trim(),
        description: formData.description.trim(),
        industry: formData.industry.trim(),
        isPublic: formData.isPublic,
        isVerified: false,
        ownerId: currentUser.uid,
        adminIds: [],
        memberIds: [],
        channels: [],
        settings: {
          allowPublicJoining: formData.allowPublicJoining,
          requireApproval: formData.requireApproval,
          allowGuestAccess: false,
          maxMembers: formData.maxMembers,
          aiAgentsEnabled: true,
          allowedDomains: []
        }
      });

      if (onSuccess) {
        onSuccess(organization.id);
      }
      
      handleClose();
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      domain: '',
      description: '',
      industry: '',
      isPublic: true,
      allowPublicJoining: true,
      requireApproval: false,
      maxMembers: 100
    });
    setError(null);
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          color: '#f8fafc'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid #475569',
        pb: 2
      }}>
        <Business sx={{ color: '#6366f1' }} />
        Create New Organization
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Organization Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Acme Corporation"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business sx={{ color: '#cbd5e1' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: '#334155',
                color: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#64748b'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6366f1'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: '#cbd5e1' }
            }}
          />

          <TextField
            fullWidth
            label="Domain"
            value={formData.domain}
            onChange={(e) => handleInputChange('domain', e.target.value)}
            placeholder="e.g., acme.com"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Domain sx={{ color: '#cbd5e1' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: '#334155',
                color: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#64748b'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6366f1'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: '#cbd5e1' }
            }}
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of your organization"
            multiline
            rows={3}
            InputProps={{
              sx: {
                bgcolor: '#334155',
                color: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#64748b'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6366f1'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: '#cbd5e1' }
            }}
          />

          <TextField
            fullWidth
            label="Industry"
            value={formData.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            placeholder="e.g., Technology, Healthcare, Finance"
            InputProps={{
              sx: {
                bgcolor: '#334155',
                color: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#64748b'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6366f1'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: '#cbd5e1' }
            }}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#cbd5e1' }}>
              Organization Settings
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6366f1',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#6366f1',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formData.isPublic ? <Public sx={{ fontSize: 16 }} /> : <Lock sx={{ fontSize: 16 }} />}
                    <Typography variant="body2">
                      {formData.isPublic ? 'Public Organization' : 'Private Organization'}
                    </Typography>
                  </Box>
                }
                sx={{ color: '#f8fafc' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowPublicJoining}
                    onChange={(e) => handleInputChange('allowPublicJoining', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6366f1',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#6366f1',
                      },
                    }}
                  />
                }
                label="Allow anyone to join"
                sx={{ color: '#f8fafc' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requireApproval}
                    onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6366f1',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#6366f1',
                      },
                    }}
                  />
                }
                label="Require approval for new members"
                sx={{ color: '#f8fafc' }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #475569' }}>
        <Button 
          onClick={handleClose}
          sx={{ color: '#cbd5e1' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim() || !formData.domain.trim()}
          sx={{
            bgcolor: '#6366f1',
            '&:hover': {
              bgcolor: '#4f46e5'
            }
          }}
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrganizationDialog;

