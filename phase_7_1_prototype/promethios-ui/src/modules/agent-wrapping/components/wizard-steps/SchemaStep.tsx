import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Chip,
  Alert,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Delete, Edit, Visibility, Code } from '@mui/icons-material';
import { WizardFormData } from '../AgentWrappingWizard';

interface SchemaStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const SchemaStep: React.FC<SchemaStepProps> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [inputSchemaText, setInputSchemaText] = useState(
    JSON.stringify(formData.inputSchema, null, 2)
  );
  const [outputSchemaText, setOutputSchemaText] = useState(
    JSON.stringify(formData.outputSchema, null, 2)
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const sampleSchemas = {
    chatbot: {
      input: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'User message' },
          context: { type: 'string', description: 'Conversation context' },
          userId: { type: 'string', description: 'User identifier' }
        },
        required: ['message']
      },
      output: {
        type: 'object',
        properties: {
          response: { type: 'string', description: 'Agent response' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          intent: { type: 'string', description: 'Detected user intent' },
          entities: { type: 'array', items: { type: 'object' } }
        },
        required: ['response']
      }
    },
    contentGenerator: {
      input: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Content generation prompt' },
          style: { type: 'string', enum: ['formal', 'casual', 'technical'] },
          length: { type: 'string', enum: ['short', 'medium', 'long'] },
          audience: { type: 'string', description: 'Target audience' }
        },
        required: ['prompt']
      },
      output: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Generated content' },
          wordCount: { type: 'number', description: 'Number of words' },
          readabilityScore: { type: 'number', description: 'Content readability score' },
          keywords: { type: 'array', items: { type: 'string' } }
        },
        required: ['content']
      }
    },
    dataAnalyzer: {
      input: {
        type: 'object',
        properties: {
          data: { type: 'array', description: 'Data to analyze' },
          analysisType: { type: 'string', enum: ['summary', 'trend', 'anomaly'] },
          parameters: { type: 'object', description: 'Analysis parameters' }
        },
        required: ['data', 'analysisType']
      },
      output: {
        type: 'object',
        properties: {
          analysis: { type: 'object', description: 'Analysis results' },
          insights: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          visualizations: { type: 'array', items: { type: 'object' } }
        },
        required: ['analysis']
      }
    }
  };

  const validateSchema = (schemaText: string, schemaType: 'input' | 'output') => {
    try {
      const schema = JSON.parse(schemaText);
      
      // Basic JSON Schema validation
      if (!schema.type || schema.type !== 'object') {
        return `${schemaType} schema must be an object type`;
      }
      
      if (!schema.properties || typeof schema.properties !== 'object') {
        return `${schemaType} schema must have properties`;
      }
      
      return null;
    } catch (error) {
      return `Invalid JSON in ${schemaType} schema`;
    }
  };

  const handleSchemaUpdate = (schemaText: string, schemaType: 'input' | 'output') => {
    const error = validateSchema(schemaText, schemaType);
    
    if (error) {
      setValidationErrors(prev => ({ ...prev, [schemaType]: error }));
      return;
    }
    
    try {
      const schema = JSON.parse(schemaText);
      setValidationErrors(prev => ({ ...prev, [schemaType]: '' }));
      
      if (schemaType === 'input') {
        updateFormData({ inputSchema: schema });
      } else {
        updateFormData({ outputSchema: schema });
      }
    } catch (error) {
      setValidationErrors(prev => ({ ...prev, [schemaType]: 'Invalid JSON' }));
    }
  };

  const applySampleSchema = (sampleKey: keyof typeof sampleSchemas) => {
    const sample = sampleSchemas[sampleKey];
    setInputSchemaText(JSON.stringify(sample.input, null, 2));
    setOutputSchemaText(JSON.stringify(sample.output, null, 2));
    updateFormData({
      inputSchema: sample.input,
      outputSchema: sample.output
    });
    setValidationErrors({});
  };

  const handleNext = () => {
    const inputError = validateSchema(inputSchemaText, 'input');
    const outputError = validateSchema(outputSchemaText, 'output');
    
    if (!inputError && !outputError) {
      onNext();
    } else {
      setValidationErrors({
        input: inputError || '',
        output: outputError || ''
      });
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        2. Define Input & Output Schemas
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Define the structure of data your agent expects to receive and return.
      </Typography>

      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Quick Start Templates
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            label="Chatbot"
            onClick={() => applySampleSchema('chatbot')}
            clickable
            variant="outlined"
          />
          <Chip
            label="Content Generator"
            onClick={() => applySampleSchema('contentGenerator')}
            clickable
            variant="outlined"
          />
          <Chip
            label="Data Analyzer"
            onClick={() => applySampleSchema('dataAnalyzer')}
            clickable
            variant="outlined"
          />
        </Box>
      </Box>

      <Paper elevation={1}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Input Schema" />
          <Tab label="Output Schema" />
          <Tab label="Preview" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Input Schema
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Define what data your agent expects to receive from users.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={12}
              value={inputSchemaText}
              onChange={(e) => {
                setInputSchemaText(e.target.value);
                handleSchemaUpdate(e.target.value, 'input');
              }}
              error={!!validationErrors.input}
              helperText={validationErrors.input || 'JSON Schema format'}
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Output Schema
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Define the structure of responses your agent will return.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={12}
              value={outputSchemaText}
              onChange={(e) => {
                setOutputSchemaText(e.target.value);
                handleSchemaUpdate(e.target.value, 'output');
              }}
              error={!!validationErrors.output}
              helperText={validationErrors.output || 'JSON Schema format'}
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader 
                    title="Input Schema Preview"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Required Fields:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      {(formData.inputSchema.required || []).map((field: string) => (
                        <Chip key={field} label={field} size="small" color="primary" />
                      ))}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Properties:
                    </Typography>
                    <Box>
                      {Object.entries(formData.inputSchema.properties || {}).map(([key, value]: [string, any]) => (
                        <Box key={key} display="flex" justifyContent="space-between" py={0.5}>
                          <Typography variant="body2">{key}</Typography>
                          <Chip label={value.type} size="small" variant="outlined" />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader 
                    title="Output Schema Preview"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Required Fields:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      {(formData.outputSchema.required || []).map((field: string) => (
                        <Chip key={field} label={field} size="small" color="secondary" />
                      ))}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Properties:
                    </Typography>
                    <Box>
                      {Object.entries(formData.outputSchema.properties || {}).map(([key, value]: [string, any]) => (
                        <Box key={key} display="flex" justifyContent="space-between" py={0.5}>
                          <Typography variant="body2">{key}</Typography>
                          <Chip label={value.type} size="small" variant="outlined" />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                These schemas will be used to validate requests and responses, ensuring your agent 
                receives properly formatted data and returns consistent results.
              </Typography>
            </Alert>
          </Box>
        </TabPanel>
      </Paper>

      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          onClick={onBack}
          size="large"
        >
          Back: API Endpoint
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!!validationErrors.input || !!validationErrors.output}
          size="large"
        >
          Next: Governance Rules
        </Button>
      </Box>
    </Box>
  );
};

export default SchemaStep;

