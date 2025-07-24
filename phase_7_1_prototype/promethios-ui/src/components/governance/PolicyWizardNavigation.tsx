/**
 * Policy Wizard Navigation Component
 * 
 * A standalone navigation component that's guaranteed to render
 * regardless of Material-UI Stepper issues.
 */

import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

interface PolicyWizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSave: () => void;
  onCancel?: () => void;
  saving: boolean;
  canProceed: boolean;
  policyName: string;
  rulesCount: number;
  selectedTemplate: string | null;
  validationMessage?: string;
}

const PolicyWizardNavigation: React.FC<PolicyWizardNavigationProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSave,
  onCancel,
  saving,
  canProceed,
  policyName,
  rulesCount,
  selectedTemplate,
  validationMessage
}) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Paper 
      sx={{ 
        mt: 4, 
        p: 3, 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        borderRadius: 2,
        position: 'sticky',
        bottom: 20,
        zIndex: 1000
      }} 
      elevation={8}
    >
      {/* Header */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        🚀 Policy Creation Progress
      </Typography>
      
      {/* Progress Info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Step {currentStep + 1} of {totalSteps}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Policy: "{policyName || 'Unnamed'}" | Rules: {rulesCount} | Template: {selectedTemplate || 'None'}
        </Typography>
      </Box>

      {/* Validation Status */}
      {validationMessage && (
        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
          {validationMessage}
        </Typography>
      )}

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {isLastStep ? (
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={onSave}
            disabled={saving || !canProceed}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ minWidth: 150 }}
          >
            {saving ? 'Saving Policy...' : 'Save Policy'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={onNext}
            disabled={!canProceed}
            endIcon={<NextIcon />}
            sx={{ minWidth: 150 }}
          >
            Continue to Next Step
          </Button>
        )}

        {currentStep > 0 && (
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={onBack}
            startIcon={<BackIcon />}
            sx={{ 
              minWidth: 100,
              borderColor: 'primary.contrastText',
              color: 'primary.contrastText',
              '&:hover': {
                borderColor: 'secondary.main',
                backgroundColor: 'secondary.main'
              }
            }}
          >
            Back
          </Button>
        )}

        {onCancel && (
          <Button
            variant="text"
            color="secondary"
            size="large"
            onClick={onCancel}
            startIcon={<CancelIcon />}
            sx={{ 
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cancel
          </Button>
        )}
      </Box>

      {/* Debug Info */}
      <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.7 }}>
        Debug: Step={currentStep}, CanProceed={canProceed.toString()}, Saving={saving.toString()}
      </Typography>
    </Paper>
  );
};

export default PolicyWizardNavigation;

