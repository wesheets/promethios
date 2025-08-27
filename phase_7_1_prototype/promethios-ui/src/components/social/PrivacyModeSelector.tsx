import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Business,
  Public,
  Security,
  People,
  Visibility,
  VisibilityOff,
  Settings,
  Shield,
  Group,
  Language,
  Lock,
  AdminPanelSettings,
  Info,
} from '@mui/icons-material';

export interface PrivacyMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  restrictions: string[];
}

export interface CompanySettings {
  id: string;
  name: string;
  domain: string;
  allowExternalCollaboration: boolean;
  requireApprovalForExternal: boolean;
  dataResidency: 'us' | 'eu' | 'global';
  ssoEnabled: boolean;
  adminApprovalRequired: boolean;
}

export interface UserPrivacySettings {
  currentMode: string;
  allowPublicProfile: boolean;
  allowExternalMessages: boolean;
  allowCrossCompanyCollaboration: boolean;
  shareAIAgentPortfolio: boolean;
  shareCollaborationHistory: boolean;
  autoSwitchModes: boolean;
  workHoursOnly: boolean;
}

interface PrivacyModeSelectorProps {
  currentMode: string;
  userSettings: UserPrivacySettings;
  companySettings?: CompanySettings;
  onModeChange: (mode: string) => void;
  onSettingsChange: (settings: Partial<UserPrivacySettings>) => void;
  onCompanySettingsClick?: () => void;
  isAdmin?: boolean;
}

const PrivacyModeSelector: React.FC<PrivacyModeSelectorProps> = ({
  currentMode,
  userSettings,
  companySettings,
  onModeChange,
  onSettingsChange,
  onCompanySettingsClick,
  isAdmin = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showModeInfo, setShowModeInfo] = useState(false);

  const privacyModes: PrivacyMode[] = [
    {
      id: 'enterprise',
      name: 'Enterprise Mode',
      description: 'Secure internal collaboration within your organization',
      icon: <Business />,
      color: '#1976D2',
      features: [
        'Company-only AI collaboration',
        'Internal team discovery',
        'Secure data handling',
        'Admin governance controls',
        'Audit trail compliance',
        'SSO integration',
      ],
      restrictions: [
        'No external profile visibility',
        'Limited cross-company collaboration',
        'Admin approval for external sharing',
      ],
    },
    {
      id: 'professional',
      name: 'Professional Mode',
      description: 'Balanced networking with controlled external visibility',
      icon: <People />,
      color: '#4CAF50',
      features: [
        'Industry networking',
        'Selective profile sharing',
        'Controlled external collaboration',
        'Professional AI showcases',
        'Cross-company projects (with approval)',
        'Thought leadership posts',
      ],
      restrictions: [
        'Company data stays internal',
        'Manager approval for external projects',
        'Limited personal AI agent sharing',
      ],
    },
    {
      id: 'public',
      name: 'Public Mode',
      description: 'Open networking and creative collaboration',
      icon: <Public />,
      color: '#FF6B35',
      features: [
        'Global talent discovery',
        'Public AI agent portfolio',
        'Open collaboration invites',
        'Creative project showcases',
        'Industry thought leadership',
        'Freelancer networking',
      ],
      restrictions: [
        'No access to company-internal content',
        'Personal AI agents only',
        'Public profile required',
      ],
    },
  ];

  const getCurrentModeData = () => {
    return privacyModes.find(mode => mode.id === currentMode) || privacyModes[0];
  };

  const handleModeChange = (modeId: string) => {
    if (modeId === 'public' && companySettings?.adminApprovalRequired) {
      // Show approval required dialog
      setShowModeInfo(true);
      return;
    }
    onModeChange(modeId);
  };

  const getCompanyRestrictions = () => {
    if (!companySettings) return [];
    
    const restrictions = [];
    if (!companySettings.allowExternalCollaboration) {
      restrictions.push('External collaboration disabled by company policy');
    }
    if (companySettings.requireApprovalForExternal) {
      restrictions.push('Manager approval required for external projects');
    }
    if (companySettings.adminApprovalRequired) {
      restrictions.push('Admin approval required for public mode');
    }
    return restrictions;
  };

  const currentModeData = getCurrentModeData();
  const companyRestrictions = getCompanyRestrictions();

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield color="primary" />
              Privacy & Collaboration Mode
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isAdmin && (
                <Tooltip title="Company Settings">
                  <IconButton onClick={onCompanySettingsClick} size="small">
                    <AdminPanelSettings />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Privacy Settings">
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                  <Settings />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Mode Information">
                <IconButton onClick={() => setShowModeInfo(true)} size="small">
                  <Info />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Current Mode Display */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: currentModeData.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              {currentModeData.icon}
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: currentModeData.color }}>
                {currentModeData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentModeData.description}
              </Typography>
            </Box>
            
            {companySettings && (
              <Chip
                icon={<Business />}
                label={companySettings.name}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          {/* Mode Selection */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {privacyModes.map((mode) => {
              const isDisabled = mode.id === 'public' && companySettings?.adminApprovalRequired;
              const isRestricted = mode.id === 'professional' && !companySettings?.allowExternalCollaboration;
              
              return (
                <Card
                  key={mode.id}
                  variant={currentMode === mode.id ? 'elevation' : 'outlined'}
                  sx={{
                    flex: 1,
                    cursor: isDisabled || isRestricted ? 'not-allowed' : 'pointer',
                    opacity: isDisabled || isRestricted ? 0.6 : 1,
                    border: currentMode === mode.id ? `2px solid ${mode.color}` : undefined,
                    '&:hover': {
                      boxShadow: !isDisabled && !isRestricted ? 2 : undefined,
                    },
                  }}
                  onClick={() => !isDisabled && !isRestricted && handleModeChange(mode.id)}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: mode.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      {mode.icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {mode.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mode.description}
                    </Typography>
                    
                    {isDisabled && (
                      <Chip
                        size="small"
                        label="Admin Approval Required"
                        color="warning"
                        sx={{ mt: 1 }}
                      />
                    )}
                    
                    {isRestricted && (
                      <Chip
                        size="small"
                        label="Restricted by Policy"
                        color="error"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          
          {/* Company Restrictions Alert */}
          {companyRestrictions.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Company Policy Restrictions:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {companyRestrictions.map((restriction, index) => (
                  <li key={index}>
                    <Typography variant="body2">{restriction}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}
          
          {/* Quick Settings */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={userSettings.allowPublicProfile}
                  onChange={(e) => onSettingsChange({ allowPublicProfile: e.target.checked })}
                  disabled={currentMode === 'enterprise'}
                />
              }
              label="Public Profile"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={userSettings.allowExternalMessages}
                  onChange={(e) => onSettingsChange({ allowExternalMessages: e.target.checked })}
                  disabled={currentMode === 'enterprise'}
                />
              }
              label="External Messages"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={userSettings.shareAIAgentPortfolio}
                  onChange={(e) => onSettingsChange({ shareAIAgentPortfolio: e.target.checked })}
                  disabled={currentMode === 'enterprise'}
                />
              }
              label="Share AI Portfolio"
            />
            
            {companySettings?.ssoEnabled && (
              <FormControlLabel
                control={
                  <Switch
                    checked={userSettings.autoSwitchModes}
                    onChange={(e) => onSettingsChange({ autoSwitchModes: e.target.checked })}
                  />
                }
                label="Auto-Switch Modes"
              />
            )}
          </Box>
        </CardContent>
      </Card>
      
      {/* Settings Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { setShowSettingsDialog(true); setAnchorEl(null); }}>
          <Settings sx={{ mr: 1 }} />
          Advanced Privacy Settings
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Security sx={{ mr: 1 }} />
          Data & Security
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Visibility sx={{ mr: 1 }} />
          Profile Visibility
        </MenuItem>
        {isAdmin && (
          <>
            <Divider />
            <MenuItem onClick={() => { onCompanySettingsClick?.(); setAnchorEl(null); }}>
              <AdminPanelSettings sx={{ mr: 1 }} />
              Company Settings
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Advanced Settings Dialog */}
      <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced Privacy Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Profile & Discovery</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.allowPublicProfile}
                      onChange={(e) => onSettingsChange({ allowPublicProfile: e.target.checked })}
                    />
                  }
                  label="Allow public profile visibility"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.shareAIAgentPortfolio}
                      onChange={(e) => onSettingsChange({ shareAIAgentPortfolio: e.target.checked })}
                    />
                  }
                  label="Share AI agent portfolio publicly"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.shareCollaborationHistory}
                      onChange={(e) => onSettingsChange({ shareCollaborationHistory: e.target.checked })}
                    />
                  }
                  label="Share collaboration history and ratings"
                />
              </Box>
            </Box>
            
            <Divider />
            
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Communication & Collaboration</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.allowExternalMessages}
                      onChange={(e) => onSettingsChange({ allowExternalMessages: e.target.checked })}
                    />
                  }
                  label="Allow messages from external users"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.allowCrossCompanyCollaboration}
                      onChange={(e) => onSettingsChange({ allowCrossCompanyCollaboration: e.target.checked })}
                    />
                  }
                  label="Allow cross-company AI collaboration"
                />
              </Box>
            </Box>
            
            <Divider />
            
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Automation & Preferences</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.autoSwitchModes}
                      onChange={(e) => onSettingsChange({ autoSwitchModes: e.target.checked })}
                    />
                  }
                  label="Auto-switch between enterprise and professional modes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.workHoursOnly}
                      onChange={(e) => onSettingsChange({ workHoursOnly: e.target.checked })}
                    />
                  }
                  label="Restrict external collaboration to work hours"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Mode Information Dialog */}
      <Dialog open={showModeInfo} onClose={() => setShowModeInfo(false)} maxWidth="md" fullWidth>
        <DialogTitle>Privacy Mode Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {privacyModes.map((mode) => (
              <Box key={mode.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: mode.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {mode.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: mode.color }}>
                      {mode.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mode.description}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'success.main' }}>
                      ✓ Features:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {mode.features.map((feature, index) => (
                        <li key={index}>
                          <Typography variant="body2">{feature}</Typography>
                        </li>
                      ))}
                    </Box>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.main' }}>
                      ⚠ Restrictions:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {mode.restrictions.map((restriction, index) => (
                        <li key={index}>
                          <Typography variant="body2">{restriction}</Typography>
                        </li>
                      ))}
                    </Box>
                  </Box>
                </Box>
                
                {mode.id !== privacyModes[privacyModes.length - 1].id && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModeInfo(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrivacyModeSelector;

