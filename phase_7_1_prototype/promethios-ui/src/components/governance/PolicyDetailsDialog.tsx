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
  if (!policy) return null;

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
          {getCategoryIcon(policy.category)}
          <Box>
            <Typography variant="h6" component="div">
              {policy.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip 
                label={policy.category || 'GENERAL'} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={policy.status} 
                size="small" 
                color={getStatusColor(policy.status) as any}
              />
              <Chip 
                label={`v${policy.version}`} 
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
        {policy.description && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2">
                {policy.description}
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
                  {policy.policy_id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body2">
                  {policy.version}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {policy.status}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rules Count
                </Typography>
                <Typography variant="body2">
                  {policy.rules.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Policy Rules ({policy.rules.length})
            </Typography>
            {policy.rules.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No rules defined for this policy
              </Typography>
            ) : (
              <List sx={{ pt: 1 }}>
                {policy.rules.map((rule, index) => (
                  <React.Fragment key={rule.rule_id}>
                    <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ mt: 0.5 }}>
                        <RuleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2">
                              {rule.name || `Rule ${index + 1}`}
                            </Typography>
                            <Chip 
                              label={rule.action} 
                              size="small" 
                              color={getActionColor(rule.action) as any}
                            />
                            {rule.priority && (
                              <Chip 
                                label={`Priority: ${rule.priority}`} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {rule.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {rule.description}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              <strong>Condition:</strong> {rule.condition}
                            </Typography>
                            {rule.metadata?.rationale && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                <strong>Rationale:</strong> {rule.metadata.rationale}
                              </Typography>
                            )}
                            {rule.metadata?.tags && rule.metadata.tags.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {rule.metadata.tags.map((tag, tagIndex) => (
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
                    {index < policy.rules.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        {policy.metadata && Object.keys(policy.metadata).length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Metadata
              </Typography>
              <Box sx={{ mt: 1 }}>
                {policy.metadata.owner && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Owner:</strong> {policy.metadata.owner}
                  </Typography>
                )}
                {policy.metadata.tags && policy.metadata.tags.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Tags:</strong>
                    </Typography>
                    {policy.metadata.tags.map((tag, index) => (
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
                {policy.metadata.compliance_mappings && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Compliance Mappings:</strong>
                    </Typography>
                    {Object.entries(policy.metadata.compliance_mappings).map(([key, value]) => (
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

