import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Security as SecurityIcon,
  Gavel as ComplianceIcon,
  Settings as OperationalIcon,
  Psychology as EthicalIcon,
  Balance as LegalIcon,
  Rule as RuleIcon
} from '@mui/icons-material';

interface PrometheiosPolicyRule {
  rule_id: string;
  name?: string;
  description?: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert' | 'escalate';
  priority?: number;
  metadata?: {
    rationale?: string;
    tags?: string[];
    [key: string]: any;
  };
}

interface PrometheiosPolicy {
  policy_id: string;
  name: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  category?: string;
  description?: string;
  rules: PrometheiosPolicyRule[];
  metadata?: {
    owner?: string;
    compliance_mappings?: {
      gdpr?: boolean;
      hipaa?: boolean;
      sox?: boolean;
      [key: string]: any;
    };
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

interface PolicyDetailsDialogProps {
  open: boolean;
  policy: PrometheiosPolicy | null;
  onClose: () => void;
}

const getCategoryIcon = (category?: string) => {
  switch (category?.toUpperCase()) {
    case 'SECURITY':
      return <SecurityIcon />;
    case 'COMPLIANCE':
      return <ComplianceIcon />;
    case 'OPERATIONAL':
      return <OperationalIcon />;
    case 'ETHICAL':
      return <EthicalIcon />;
    case 'LEGAL':
      return <LegalIcon />;
    default:
      return <RuleIcon />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'allow':
      return 'success';
    case 'deny':
      return 'error';
    case 'alert':
      return 'warning';
    case 'log':
      return 'info';
    case 'escalate':
      return 'secondary';
    default:
      return 'default';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'warning';
    case 'deprecated':
      return 'error';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
};

const PolicyDetailsDialog: React.FC<PolicyDetailsDialogProps> = ({
  open,
  policy,
  onClose
}) => {
  // Defensive coding - handle null/undefined policy
  if (!policy) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm">
        <DialogTitle>Policy Not Found</DialogTitle>
        <DialogContent>
          <Typography>The selected policy could not be loaded.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Defensive coding - ensure required fields exist
  const safePolicy = {
    policy_id: policy.policy_id || 'unknown',
    name: policy.name || 'Unnamed Policy',
    version: policy.version || '1.0.0',
    status: policy.status || 'draft',
    category: policy.category || 'GENERAL',
    description: policy.description || '',
    rules: Array.isArray(policy.rules) ? policy.rules : [],
    metadata: policy.metadata || {},
    created_at: policy.created_at || '',
    updated_at: policy.updated_at || ''
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getCategoryIcon(safePolicy.category)}
          <Box>
            <Typography variant="h6" component="div">
              {safePolicy.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip 
                label={safePolicy.category} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={safePolicy.status} 
                size="small" 
                color={getStatusColor(safePolicy.status) as any}
              />
              <Chip 
                label={`v${safePolicy.version}`} 
                size="small" 
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Description */}
        {safePolicy.description && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2">
                {safePolicy.description}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Policy Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Policy Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Policy ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {safePolicy.policy_id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body2">
                  {safePolicy.version}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {safePolicy.status}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rules Count
                </Typography>
                <Typography variant="body2">
                  {safePolicy.rules.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Policy Rules ({safePolicy.rules.length})
            </Typography>
            {safePolicy.rules.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No rules defined for this policy
              </Typography>
            ) : (
              <List sx={{ pt: 1 }}>
                {safePolicy.rules.map((rule, index) => {
                  // Defensive coding for rule data
                  const safeRule = {
                    rule_id: rule?.rule_id || `rule-${index}`,
                    name: rule?.name || `Rule ${index + 1}`,
                    description: rule?.description || '',
                    condition: rule?.condition || 'No condition specified',
                    action: rule?.action || 'allow',
                    priority: rule?.priority || undefined,
                    metadata: rule?.metadata || {}
                  };

                  return (
                    <React.Fragment key={safeRule.rule_id}>
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ mt: 0.5 }}>
                          <RuleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle2">
                                {safeRule.name}
                              </Typography>
                              <Chip 
                                label={safeRule.action} 
                                size="small" 
                                color={getActionColor(safeRule.action) as any}
                              />
                              {safeRule.priority && (
                                <Chip 
                                  label={`Priority: ${safeRule.priority}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              {safeRule.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {safeRule.description}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                <strong>Condition:</strong> {safeRule.condition}
                              </Typography>
                              {safeRule.metadata?.rationale && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  <strong>Rationale:</strong> {safeRule.metadata.rationale}
                                </Typography>
                              )}
                              {safeRule.metadata?.tags && Array.isArray(safeRule.metadata.tags) && safeRule.metadata.tags.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {safeRule.metadata.tags.map((tag, tagIndex) => (
                                    <Chip 
                                      key={tagIndex}
                                      label={tag} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < safePolicy.rules.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        {safePolicy.metadata && Object.keys(safePolicy.metadata).length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Metadata
              </Typography>
              <Box sx={{ mt: 1 }}>
                {safePolicy.metadata.owner && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Owner:</strong> {safePolicy.metadata.owner}
                  </Typography>
                )}
                {safePolicy.metadata.tags && Array.isArray(safePolicy.metadata.tags) && safePolicy.metadata.tags.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Tags:</strong>
                    </Typography>
                    {safePolicy.metadata.tags.map((tag, index) => (
                      <Chip 
                        key={index}
                        label={tag} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
                {safePolicy.metadata.compliance_mappings && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Compliance Mappings:</strong>
                    </Typography>
                    {Object.entries(safePolicy.metadata.compliance_mappings).map(([key, value]) => (
                      <Chip 
                        key={key}
                        label={key.toUpperCase()} 
                        size="small" 
                        color={value ? 'success' : 'default'}
                        variant={value ? 'filled' : 'outlined'}
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PolicyDetailsDialog;

