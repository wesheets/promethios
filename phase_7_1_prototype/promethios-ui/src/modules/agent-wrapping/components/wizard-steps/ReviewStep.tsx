import React from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Api,
  Schema,
  Security,
  Speed,
  Visibility,
  Block,
  Launch,
} from '@mui/icons-material';
import { WizardFormData } from '../AgentWrappingWizard';

interface ReviewStepProps {
  formData: WizardFormData;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onComplete,
  onBack,
  isSubmitting,
}) => {
  const getComplianceLevelColor = (level: string) => {
    const colors = {
      basic: 'default' as const,
      standard: 'primary' as const,
      strict: 'secondary' as const,
      enterprise: 'success' as const,
    };
    return colors[level as keyof typeof colors] || 'default';
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    return 'warning';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        4. Review & Deploy
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review your agent configuration before deployment. Once deployed, your agent will be 
        available for use with full governance controls.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader 
              title="Agent Configuration"
              avatar={<Api color="primary" />}
            />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Agent Name"
                    secondary={formData.agentName}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Provider"
                    secondary={formData.provider}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Model"
                    secondary={formData.model}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="API Endpoint"
                    secondary={formData.apiEndpoint}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Authentication"
                    secondary={formData.authMethod}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader 
              title="Schema Configuration"
              avatar={<Schema color="primary" />}
            />
            <CardContent>
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Input Schema
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {(formData.inputSchema.required || []).map((field: string) => (
                    <Chip key={field} label={field} size="small" color="primary" />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Object.keys(formData.inputSchema.properties || {}).length} properties defined
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Output Schema
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {(formData.outputSchema.required || []).map((field: string) => (
                    <Chip key={field} label={field} size="small" color="secondary" />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Object.keys(formData.outputSchema.properties || {}).length} properties defined
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardHeader 
              title="Governance & Security"
              avatar={<Security color="primary" />}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={getSecurityScoreColor(formData.securityScore)} gutterBottom>
                      {formData.securityScore}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Security Score
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Chip 
                      label={formData.complianceLevel.toUpperCase()} 
                      color={getComplianceLevelColor(formData.complianceLevel)}
                      size="medium"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Compliance Level
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      {(formData.trustThreshold * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Trust Threshold
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      {formData.estimatedCost}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Est. Cost/Request
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {formData.enableLogging ? <Visibility color="success" /> : <Block color="disabled" />}
                      </ListItemIcon>
                      <ListItemText
                        primary="Request Logging"
                        secondary={formData.enableLogging ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {formData.enableRateLimiting ? <Speed color="success" /> : <Block color="disabled" />}
                      </ListItemIcon>
                      <ListItemText
                        primary="Rate Limiting"
                        secondary={formData.enableRateLimiting ? `${formData.maxRequestsPerMinute}/min` : 'Disabled'}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Ready to Deploy:</strong> Your agent configuration has been validated and is ready 
              for deployment. Once deployed, your agent will be available through the Promethios platform 
              with full governance controls and monitoring.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={isSubmitting}
          size="large"
        >
          Back: Governance Rules
        </Button>
        <Button
          variant="contained"
          onClick={onComplete}
          disabled={isSubmitting}
          size="large"
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <Launch />}
        >
          {isSubmitting ? 'Deploying Agent...' : 'Deploy Agent'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewStep;

