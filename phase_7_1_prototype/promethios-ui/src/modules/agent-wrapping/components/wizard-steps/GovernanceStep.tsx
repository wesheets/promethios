import React from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import { Security, Speed, Visibility, Block } from '@mui/icons-material';
import { WizardFormData } from '../AgentWrappingWizard';

interface GovernanceStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const GovernanceStep: React.FC<GovernanceStepProps> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const complianceLevels = [
    { value: 'basic', label: 'Basic', description: 'Standard logging and monitoring' },
    { value: 'standard', label: 'Standard', description: 'Enhanced compliance with audit trails' },
    { value: 'strict', label: 'Strict', description: 'Full compliance with detailed governance' },
    { value: 'enterprise', label: 'Enterprise', description: 'Maximum security and compliance' },
  ];

  const getSecurityScore = () => {
    let score = 50; // Base score
    
    // Trust threshold impact
    score += (formData.trustThreshold - 0.5) * 40;
    
    // Compliance level impact
    const complianceScores = { basic: 0, standard: 10, strict: 20, enterprise: 30 };
    score += complianceScores[formData.complianceLevel as keyof typeof complianceScores] || 0;
    
    // Logging impact
    if (formData.enableLogging) score += 10;
    
    // Rate limiting impact
    if (formData.enableRateLimiting) score += 10;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const getEstimatedCost = () => {
    const baseCost = 0.01;
    const complianceMultiplier = {
      basic: 1,
      standard: 1.2,
      strict: 1.5,
      enterprise: 2
    };
    
    const multiplier = complianceMultiplier[formData.complianceLevel as keyof typeof complianceMultiplier] || 1;
    const loggingCost = formData.enableLogging ? 0.005 : 0;
    
    const totalCost = (baseCost * multiplier) + loggingCost;
    return `$${totalCost.toFixed(3)}/request`;
  };

  const handleNext = () => {
    // Update computed values
    updateFormData({
      securityScore: getSecurityScore(),
      estimatedCost: getEstimatedCost()
    });
    onNext();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        3. Configure Governance Rules
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Set up governance controls to ensure your agent operates safely and compliantly.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader 
              title="Trust & Security"
              avatar={<Security color="primary" />}
            />
            <CardContent>
              <Box mb={3}>
                <Typography gutterBottom>
                  Trust Threshold: {(formData.trustThreshold * 100).toFixed(0)}%
                </Typography>
                <Slider
                  value={formData.trustThreshold}
                  onChange={(_, value) => updateFormData({ trustThreshold: value as number })}
                  min={0.5}
                  max={1.0}
                  step={0.05}
                  marks={[
                    { value: 0.5, label: '50%' },
                    { value: 0.7, label: '70%' },
                    { value: 0.9, label: '90%' },
                    { value: 1.0, label: '100%' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Typography variant="body2" color="text.secondary">
                  Minimum confidence score required for agent responses
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Compliance Level</InputLabel>
                <Select
                  value={formData.complianceLevel}
                  label="Compliance Level"
                  onChange={(e) => updateFormData({ complianceLevel: e.target.value })}
                >
                  {complianceLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      <Box>
                        <Typography>{level.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {level.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader 
              title="Monitoring & Controls"
              avatar={<Visibility color="primary" />}
            />
            <CardContent>
              <Box mb={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableLogging}
                      onChange={(e) => updateFormData({ enableLogging: e.target.checked })}
                    />
                  }
                  label="Enable Request Logging"
                />
                <Typography variant="body2" color="text.secondary">
                  Log all requests and responses for audit and debugging
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableRateLimiting}
                      onChange={(e) => updateFormData({ enableRateLimiting: e.target.checked })}
                    />
                  }
                  label="Enable Rate Limiting"
                />
                <Typography variant="body2" color="text.secondary">
                  Limit the number of requests per minute
                </Typography>
              </Box>

              {formData.enableRateLimiting && (
                <TextField
                  fullWidth
                  label="Max Requests per Minute"
                  type="number"
                  value={formData.maxRequestsPerMinute}
                  onChange={(e) => updateFormData({ maxRequestsPerMinute: parseInt(e.target.value) || 60 })}
                  inputProps={{ min: 1, max: 1000 }}
                  helperText="Recommended: 60-300 requests per minute"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardHeader title="Governance Summary" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" gutterBottom>
                      {getSecurityScore()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Security Score
                    </Typography>
                    <Box mt={1}>
                      {getSecurityScore() >= 80 && <Chip label="Excellent" color="success" size="small" />}
                      {getSecurityScore() >= 60 && getSecurityScore() < 80 && <Chip label="Good" color="primary" size="small" />}
                      {getSecurityScore() < 60 && <Chip label="Needs Improvement" color="warning" size="small" />}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary" gutterBottom>
                      {getEstimatedCost()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Cost
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      per request
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main" gutterBottom>
                      {formData.enableRateLimiting ? formData.maxRequestsPerMinute : '∞'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requests/Minute
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      rate limit
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Governance Features:</strong> Your agent will be monitored for compliance, 
                  trust scores, and performance metrics. All interactions will be logged and audited 
                  according to your selected compliance level.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          onClick={onBack}
          size="large"
        >
          Back: Schema Definition
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          size="large"
        >
          Next: Review & Deploy
        </Button>
      </Box>
    </Box>
  );
};

export default GovernanceStep;

