import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Autocomplete,
} from '@mui/material';
import {
  Public,
  Lock,
  Business,
  Star,
  Security,
  AttachMoney,
  Info,
} from '@mui/icons-material';

interface PublishToRegistryModalProps {
  open: boolean;
  onClose: () => void;
  agentName: string;
  agentType: 'single' | 'multi-agent';
  governanceTier: 'basic' | 'enhanced' | 'strict';
  onPublish: (publishData: PublishData) => void;
}

interface PublishData {
  visibility: 'private' | 'organization' | 'public';
  name: string;
  description: string;
  tags: string[];
  category: string;
  pricing: {
    type: 'free' | 'freemium' | 'paid';
    price?: number;
    betaFeature: boolean;
  };
  governanceInheritance: boolean;
}

const PublishToRegistryModal: React.FC<PublishToRegistryModalProps> = ({
  open,
  onClose,
  agentName,
  agentType,
  governanceTier,
  onPublish,
}) => {
  const [publishData, setPublishData] = useState<PublishData>({
    visibility: 'private',
    name: agentName,
    description: '',
    tags: [],
    category: '',
    pricing: {
      type: 'free',
      betaFeature: true,
    },
    governanceInheritance: true,
  });

  const [tagInput, setTagInput] = useState('');

  const categories = [
    'Customer Support',
    'Data Analysis',
    'Content Generation',
    'Financial Services',
    'Healthcare',
    'Security & Compliance',
    'Marketing & Sales',
    'Operations',
    'Research & Development',
    'Education',
    'Legal',
    'Other',
  ];

  const commonTags = [
    'nlp', 'automation', 'analytics', 'chatbot', 'api-integration',
    'compliance', 'reporting', 'workflow', 'ai-assistant', 'data-processing',
    'customer-service', 'finance', 'healthcare', 'security', 'marketing',
  ];

  const handlePublish = () => {
    onPublish(publishData);
    onClose();
  };

  const getGovernanceTierColor = (tier: string) => {
    switch (tier) {
      case 'strict': return '#dc2626';
      case 'enhanced': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Public />;
      case 'organization': return <Business />;
      default: return <Lock />;
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
          backgroundColor: '#2d3748',
          color: 'white',
          border: '1px solid #4a5568',
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #4a5568',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Public sx={{ color: '#3b82f6' }} />
        Publish Agent to Registry
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Success Alert */}
        <Alert 
          severity="success" 
          sx={{ 
            backgroundColor: '#065f46', 
            color: 'white',
            mb: 3,
            '& .MuiAlert-icon': { color: '#10b981' }
          }}
        >
          <AlertTitle>Agent Successfully Wrapped!</AlertTitle>
          Your agent has been wrapped with Promethios governance and is ready to be shared.
        </Alert>

        {/* Agent Info */}
        <Box sx={{ 
          backgroundColor: '#374151', 
          p: 2, 
          borderRadius: 1, 
          mb: 3,
          border: '1px solid #4a5568'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              {agentName}
            </Typography>
            <Chip 
              label={agentType === 'single' ? 'Single Agent' : 'Multi-Agent System'}
              size="small"
              sx={{ 
                backgroundColor: agentType === 'single' ? '#3b82f6' : '#8b5cf6',
                color: 'white'
              }}
            />
            <Chip 
              label={governanceTier.toUpperCase()}
              size="small"
              sx={{ 
                backgroundColor: getGovernanceTierColor(governanceTier),
                color: 'white'
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            Governance tier automatically assigned based on wrapping policies
          </Typography>
        </Box>

        {/* Visibility Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Visibility & Access
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Visibility</InputLabel>
            <Select
              value={publishData.visibility}
              onChange={(e) => setPublishData(prev => ({ 
                ...prev, 
                visibility: e.target.value as 'private' | 'organization' | 'public' 
              }))}
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
              }}
            >
              <MenuItem value="private">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Lock fontSize="small" />
                  Private - For personal use only
                </Box>
              </MenuItem>
              <MenuItem value="organization">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business fontSize="small" />
                  Organization - Visible to team members
                </Box>
              </MenuItem>
              <MenuItem value="public">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Public fontSize="small" />
                  Public Registry - Available to all users
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Agent Details */}
        {publishData.visibility !== 'private' && (
          <>
            <Divider sx={{ my: 3, borderColor: '#4a5568' }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Agent Details
              </Typography>
              
              <TextField
                fullWidth
                label="Display Name"
                value={publishData.name}
                onChange={(e) => setPublishData(prev => ({ ...prev, name: e.target.value }))}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': { 
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="Describe what your agent does, its capabilities, and use cases..."
                value={publishData.description}
                onChange={(e) => setPublishData(prev => ({ ...prev, description: e.target.value }))}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': { 
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: '#a0aec0' }}>Category</InputLabel>
                <Select
                  value={publishData.category}
                  onChange={(e) => setPublishData(prev => ({ ...prev, category: e.target.value }))}
                  sx={{ 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Autocomplete
                multiple
                freeSolo
                options={commonTags}
                value={publishData.tags}
                onChange={(_, newValue) => setPublishData(prev => ({ ...prev, tags: newValue }))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      sx={{ 
                        color: 'white',
                        borderColor: '#4a5568',
                        '& .MuiChip-deleteIcon': { color: '#a0aec0' }
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags to help users discover your agent..."
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        color: 'white',
                        '& fieldset': { borderColor: '#4a5568' },
                        '&:hover fieldset': { borderColor: '#718096' },
                      },
                      '& .MuiInputLabel-root': { color: '#a0aec0' },
                    }}
                  />
                )}
              />
            </Box>

            {/* Pricing Section */}
            <Divider sx={{ my: 3, borderColor: '#4a5568' }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Pricing & Monetization
              </Typography>
              
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: '#1e3a8a', 
                  color: 'white',
                  mb: 2,
                  '& .MuiAlert-icon': { color: '#3b82f6' }
                }}
              >
                <AlertTitle>🚧 Marketplace Pricing - Beta Coming Soon</AlertTitle>
                Monetization features are currently in development. All agents are free to fork for now.
              </Alert>

              <FormControl fullWidth disabled>
                <InputLabel sx={{ color: '#6b7280' }}>Pricing Model</InputLabel>
                <Select
                  value={publishData.pricing.type}
                  sx={{ 
                    color: '#6b7280',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  }}
                >
                  <MenuItem value="free">Free - No cost to fork or use</MenuItem>
                  <MenuItem value="freemium">Freemium - Basic free, premium features paid</MenuItem>
                  <MenuItem value="paid">Paid - Subscription or one-time license</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Governance Settings */}
            <Divider sx={{ my: 3, borderColor: '#4a5568' }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Governance & Trust
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={publishData.governanceInheritance}
                    onChange={(e) => setPublishData(prev => ({ 
                      ...prev, 
                      governanceInheritance: e.target.checked 
                    }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10b981' },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Inherit Governance Policies
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Forked agents will inherit your governance tier and policies
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #4a5568' }}>
        <Button 
          onClick={onClose}
          sx={{ color: '#a0aec0' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePublish}
          disabled={publishData.visibility !== 'private' && (!publishData.name || !publishData.description || !publishData.category)}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            '&:disabled': { backgroundColor: '#374151', color: '#6b7280' }
          }}
          startIcon={getVisibilityIcon(publishData.visibility)}
        >
          {publishData.visibility === 'private' ? 'Keep Private' : 
           publishData.visibility === 'organization' ? 'Share with Organization' : 
           'Publish to Registry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PublishToRegistryModal;

