import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Description as FileIcon,
  Api as ApiIcon,
  Chat as ChatIcon,
  Assessment as MetricsIcon,
  Backup as BackupIcon,
  Settings as SettingsIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Sync as SyncIcon,
  Security as SecurityIcon,
  AttachMoney as CostIcon
} from '@mui/icons-material';
import { CustomGPTProfile, customGPTStorage } from '../../services/CustomGPTStorageService';
import { useAuth } from '../../context/AuthContext';

interface CustomGPTTabProps {
  agentId: string;
  onClose?: () => void;
}

export const CustomGPTTab: React.FC<CustomGPTTabProps> = ({ agentId, onClose }) => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<CustomGPTProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [agentId]);

  const loadProfile = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const loadedProfile = await customGPTStorage.getCustomGPTProfile(currentUser.uid, agentId);
      setProfile(loadedProfile);
    } catch (error) {
      console.error('Error loading Custom GPT profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!currentUser?.uid || !profile) return;
    
    try {
      setBackupInProgress(true);
      const result = await customGPTStorage.backupCustomGPTContent(currentUser.uid, agentId);
      
      if (result.success) {
        alert(`Backup created successfully! Backup ID: ${result.backupId}`);
        await loadProfile(); // Refresh to show updated backup timestamp
      } else {
        alert(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Backup failed: ${error.message}`);
    } finally {
      setBackupInProgress(false);
      setShowBackupDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Loading Custom GPT...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Custom GPT profile not found. The agent may have been deleted or you may not have access.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1a202c' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #4a5568' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: profile.customGPTConfig.commandCenter.iconColor,
                mr: 2 
              }} 
            />
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              {profile.customGPTConfig.originalGPT.name}
            </Typography>
            <Chip 
              label="Custom GPT" 
              size="small" 
              sx={{ ml: 2, backgroundColor: '#3182ce', color: 'white' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Open Original GPT">
              <IconButton 
                onClick={() => window.open(profile.customGPTConfig.originalGPT.url, '_blank')}
                sx={{ color: 'white' }}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Backup Content">
              <IconButton 
                onClick={() => setShowBackupDialog(true)}
                sx={{ color: 'white' }}
              >
                <BackupIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton sx={{ color: 'white' }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Status Indicators */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<SecurityIcon />}
            label={`Trust: ${profile.trustLevel}`}
            size="small"
            sx={{ backgroundColor: '#374151', color: 'white' }}
          />
          <Chip 
            icon={<ApiIcon />}
            label={`${profile.customGPTConfig.preservedContent.customActions.length} Actions`}
            size="small"
            sx={{ backgroundColor: '#374151', color: 'white' }}
          />
          <Chip 
            icon={<FileIcon />}
            label={`${profile.customGPTConfig.preservedContent.knowledgeBase.files.length} Files`}
            size="small"
            sx={{ backgroundColor: '#374151', color: 'white' }}
          />
          <Chip 
            label={`Content: ${profile.customGPTMetadata.contentPreservationStatus}`}
            size="small"
            color={profile.customGPTMetadata.contentPreservationStatus === 'complete' ? 'success' : 'warning'}
          />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Grid container spacing={3}>
          {/* Main Chat Interface */}
          <Grid item xs={12} md={8}>
            <Card sx={{ backgroundColor: '#2d3748', height: '600px' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  <ChatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Chat Interface
                </Typography>
                <Box sx={{ 
                  flex: 1, 
                  backgroundColor: '#1a202c', 
                  borderRadius: 1, 
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ color: '#a0aec0' }}>
                    Chat interface will be integrated here
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Side Panel */}
          <Grid item xs={12} md={4}>
            {/* Knowledge Base */}
            <Card sx={{ backgroundColor: '#2d3748', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  <FileIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Knowledge Base
                </Typography>
                
                {profile.customGPTConfig.preservedContent.knowledgeBase.files.length > 0 ? (
                  <List dense>
                    {profile.customGPTConfig.preservedContent.knowledgeBase.files.slice(0, 5).map((file) => (
                      <ListItem key={file.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <FileIcon sx={{ color: '#a0aec0' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={file.originalName}
                          secondary={`${(file.size / 1024).toFixed(1)} KB`}
                          primaryTypographyProps={{ sx: { color: 'white', fontSize: '0.9rem' } }}
                          secondaryTypographyProps={{ sx: { color: '#a0aec0', fontSize: '0.8rem' } }}
                        />
                        <Tooltip title="Download">
                          <IconButton size="small" sx={{ color: '#a0aec0' }}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItem>
                    ))}
                    {profile.customGPTConfig.preservedContent.knowledgeBase.files.length > 5 && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary={`+${profile.customGPTConfig.preservedContent.knowledgeBase.files.length - 5} more files`}
                          primaryTypographyProps={{ sx: { color: '#a0aec0', fontSize: '0.9rem', fontStyle: 'italic' } }}
                        />
                      </ListItem>
                    )}
                  </List>
                ) : (
                  <Typography sx={{ color: '#a0aec0', fontStyle: 'italic' }}>
                    No knowledge files imported
                  </Typography>
                )}
                
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<UploadIcon />}
                  sx={{ mt: 2, color: 'white', borderColor: '#4a5568' }}
                >
                  Add Files
                </Button>
              </CardContent>
            </Card>

            {/* Custom Actions */}
            <Card sx={{ backgroundColor: '#2d3748', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  <ApiIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Custom Actions
                </Typography>
                
                {profile.customGPTConfig.preservedContent.customActions.length > 0 ? (
                  <List dense>
                    {profile.customGPTConfig.preservedContent.customActions.map((action) => (
                      <ListItem key={action.id} sx={{ px: 0 }}>
                        <ListItemText 
                          primary={action.name}
                          secondary={action.description}
                          primaryTypographyProps={{ sx: { color: 'white', fontSize: '0.9rem' } }}
                          secondaryTypographyProps={{ sx: { color: '#a0aec0', fontSize: '0.8rem' } }}
                        />
                        <Chip 
                          label={action.status}
                          size="small"
                          color={action.status === 'active' ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography sx={{ color: '#a0aec0', fontStyle: 'italic' }}>
                    No custom actions imported
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Usage Metrics */}
            <Card sx={{ backgroundColor: '#2d3748' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  <MetricsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Usage Metrics
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                    Total Requests
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white' }}>
                    {profile.usageMetrics.totalRequests.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                    Monthly Cost
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#38a169' }}>
                    ${profile.usageMetrics.costTracking.monthlySpend.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                    Success Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={profile.usageMetrics.successRate} 
                      sx={{ flex: 1, mr: 1 }}
                    />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {profile.usageMetrics.successRate}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Information Accordion */}
          <Grid item xs={12}>
            <Accordion sx={{ backgroundColor: '#2d3748' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ color: 'white' }}>Original GPT Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      Instructions
                    </Typography>
                    <Box sx={{ 
                      backgroundColor: '#1a202c', 
                      p: 2, 
                      borderRadius: 1, 
                      maxHeight: 200, 
                      overflow: 'auto' 
                    }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', whiteSpace: 'pre-wrap' }}>
                        {profile.customGPTConfig.preservedContent.instructions}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      Capabilities
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.customGPTConfig.preservedContent.capabilities.map((capability) => (
                        <Chip 
                          key={capability}
                          label={capability.replace('_', ' ')}
                          size="small"
                          sx={{ backgroundColor: '#3182ce', color: 'white' }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ backgroundColor: '#2d3748', mt: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ color: 'white' }}>Governance & Security</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      Trust Level
                    </Typography>
                    <Chip 
                      label={profile.customGPTConfig.governanceSettings.trustLevel}
                      color={profile.trustLevel === 'high' ? 'success' : 'warning'}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      Compliance
                    </Typography>
                    <Chip 
                      label={profile.customGPTConfig.governanceSettings.complianceLevel}
                      sx={{ backgroundColor: '#374151', color: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      Audit Logging
                    </Typography>
                    <Chip 
                      label={profile.customGPTConfig.governanceSettings.auditLogging ? 'Enabled' : 'Disabled'}
                      color={profile.customGPTConfig.governanceSettings.auditLogging ? 'success' : 'error'}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </Box>

      {/* Backup Dialog */}
      <Dialog 
        open={showBackupDialog} 
        onClose={() => setShowBackupDialog(false)}
        PaperProps={{ sx: { backgroundColor: '#2d3748', color: 'white' } }}
      >
        <DialogTitle>Backup Custom GPT Content</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This will create a complete backup of your Custom GPT including:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Original GPT configuration and instructions" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• All knowledge base files and metadata" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Custom actions and API schemas" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Governance settings and usage metrics" />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ color: '#a0aec0', mt: 2 }}>
            Last backup: {profile.customGPTMetadata.lastContentBackup 
              ? new Date(profile.customGPTMetadata.lastContentBackup).toLocaleDateString()
              : 'Never'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBackupDialog(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleBackup} 
            variant="contained"
            disabled={backupInProgress}
            startIcon={backupInProgress ? <SyncIcon className="animate-spin" /> : <BackupIcon />}
          >
            {backupInProgress ? 'Creating Backup...' : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomGPTTab;

