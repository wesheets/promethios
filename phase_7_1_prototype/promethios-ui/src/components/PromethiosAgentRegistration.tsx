import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  AutoAwesome,
  Security,
  Assessment,
  Policy,
  Speed,
  CheckCircle,
} from '@mui/icons-material';

interface PromethiosAgentRegistrationProps {
  initialData?: {
    agentName?: string;
    description?: string;
    governanceModel?: string;
  };
  onDataChange?: (data: any) => void;
  title?: string;
  subtitle?: string;
}

const PromethiosAgentRegistration: React.FC<PromethiosAgentRegistrationProps> = ({
  initialData = {},
  onDataChange,
  title = "Create Promethios Native Agent",
  subtitle = "Create a new agent powered by Promethios' native governance-enhanced LLM models"
}) => {
  const [agentName, setAgentName] = useState(initialData.agentName || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [governanceModel, setGovernanceModel] = useState(initialData.governanceModel || 'ultimate');

  // Notify parent component of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        agentName,
        description,
        governanceModel,
        provider: 'Promethios Native',
        apiEndpoint: `/llm/governance/${governanceModel}/analyze`,
        capabilities: getModelCapabilities(governanceModel),
        contextLength: 128000,
        supportsFunctions: true,
        pricing: { input: 0.0, output: 0.0 }, // Free for native models
        isNative: true
      });
    }
  }, [agentName, description, governanceModel, onDataChange]);

  const getModelCapabilities = (model: string): string[] => {
    switch (model) {
      case 'ultimate':
        return [
          'governance_analysis',
          'policy_evaluation',
          'risk_assessment',
          'compliance_checking',
          'stakeholder_analysis',
          'decision_support',
          'ethical_reasoning',
          'regulatory_guidance'
        ];
      case 'constitutional':
        return [
          'constitutional_analysis',
          'legal_compliance',
          'policy_interpretation',
          'regulatory_review',
          'constitutional_reasoning',
          'legal_precedent_analysis'
        ];
      case 'operational':
        return [
          'operational_guidance',
          'process_optimization',
          'workflow_analysis',
          'efficiency_assessment',
          'resource_allocation',
          'performance_monitoring'
        ];
      default:
        return ['governance_analysis'];
    }
  };

  const governanceModels = [
    {
      value: 'ultimate',
      label: 'Ultimate Governance LLM',
      description: 'Comprehensive governance analysis with holistic reasoning capabilities',
      icon: <AutoAwesome sx={{ color: '#3b82f6' }} />,
      color: '#3b82f6',
      features: ['Holistic Analysis', 'Multi-Domain Expertise', 'Advanced Reasoning', 'Stakeholder Impact']
    },
    {
      value: 'constitutional',
      label: 'Constitutional Specialist',
      description: 'Specialized in legal compliance, policy interpretation, and constitutional analysis',
      icon: <Policy sx={{ color: '#10b981' }} />,
      color: '#10b981',
      features: ['Legal Compliance', 'Policy Analysis', 'Constitutional Law', 'Regulatory Review']
    },
    {
      value: 'operational',
      label: 'Operational Specialist',
      description: 'Focused on operational efficiency, process optimization, and workflow management',
      icon: <Speed sx={{ color: '#f59e0b' }} />,
      color: '#f59e0b',
      features: ['Process Optimization', 'Workflow Analysis', 'Efficiency Assessment', 'Resource Planning']
    }
  ];

  const selectedModelInfo = governanceModels.find(model => model.value === governanceModel);

  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
        {subtitle}
      </Typography>

      {/* Native LLM Benefits Alert */}
      <Alert 
        severity="success" 
        sx={{ 
          backgroundColor: '#065f46', 
          color: 'white',
          mb: 3,
          '& .MuiAlert-icon': { color: 'white' },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          🚀 Promethios Native LLM Benefits
        </Typography>
        <Typography variant="body2">
          • No API keys required • Built-in governance expertise • Free to use • 
          Optimized for governance tasks • Direct integration with Promethios ecosystem
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Agent Name *"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="e.g., Corporate Governance Assistant"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a202c',
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' },
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
            }}
          />
          
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your agent's purpose and use cases"
            multiline
            rows={4}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a202c',
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' },
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Governance Model *</InputLabel>
            <Select
              value={governanceModel}
              label="Governance Model *"
              onChange={(e) => setGovernanceModel(e.target.value)}
              sx={{
                backgroundColor: '#1a202c',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#2d3748',
                    color: 'white',
                    border: '1px solid #4a5568',
                    maxHeight: 400,
                  },
                },
              }}
            >
              {governanceModels.map((model) => (
                <MenuItem 
                  key={model.value} 
                  value={model.value}
                  sx={{ 
                    py: 2, 
                    borderBottom: '1px solid #4a5568',
                    '&:hover': { backgroundColor: '#374151' },
                    '&.Mui-selected': { backgroundColor: '#1e3a8a' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    {model.icon}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>
                        {model.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                        {model.description}
                      </Typography>
                    </Box>
                    {governanceModel === model.value && (
                      <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Model Information Alert */}
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: '#1e3a8a', 
              color: 'white',
              '& .MuiAlert-icon': { color: 'white' },
            }}
          >
            <Typography variant="body2">
              <Security sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              All Promethios Native models include built-in governance, security, and compliance features.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Selected Model Details */}
      {selectedModelInfo && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, fontWeight: 'bold' }}>
            🎯 Selected Model: {selectedModelInfo.label}
          </Typography>
          <Card sx={{ backgroundColor: '#374151', border: '1px solid #4b5563' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {selectedModelInfo.icon}
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {selectedModelInfo.label}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#d1d5db', mb: 2 }}>
                {selectedModelInfo.description}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedModelInfo.features.map((feature) => (
                  <Chip
                    key={feature}
                    label={feature}
                    size="small"
                    sx={{
                      backgroundColor: `${selectedModelInfo.color}20`,
                      color: selectedModelInfo.color,
                      fontSize: '0.75rem',
                    }}
                  />
                ))}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                      Context Length
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                      128K tokens
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                      Capabilities
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                      {getModelCapabilities(governanceModel).length} specialized
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                      Cost
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                      Free
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Capabilities Preview */}
      {governanceModel && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, fontWeight: 'bold' }}>
            ⚡ Specialized Capabilities
          </Typography>
          <Card sx={{ backgroundColor: '#374151', border: '1px solid #4b5563' }}>
            <CardContent>
              <Grid container spacing={1}>
                {getModelCapabilities(governanceModel).map((capability) => (
                  <Grid item xs={12} sm={6} md={4} key={capability}>
                    <Chip
                      label={capability.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      size="small"
                      sx={{
                        backgroundColor: '#065f46',
                        color: '#10b981',
                        fontSize: '0.75rem',
                        width: '100%',
                        justifyContent: 'flex-start',
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default PromethiosAgentRegistration;

