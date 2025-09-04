import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Card,
  CardContent,
  Link,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Upload as UploadIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { CustomGPTConfig, CustomGPTConfigurationStepProps, CustomGPTAction } from '../../types/CustomGPTTypes';
interface GPTMetadata {
  name: string;
  description: string;
  capabilities: string[];
}

interface CustomGPTConfigurationStepProps {
  config: CustomGPTConfig;
  setConfig: (config: CustomGPTConfig) => void;
}

// Main Custom GPT Configuration Component
export const CustomGPTConfigurationStep: React.FC<CustomGPTConfigurationStepProps> = ({ 
  onConfigComplete, 
  onBack 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<CustomGPTConfig>({
    url: '',
    name: '',
    instructions: '',
    capabilities: [],
    knowledgeFiles: [],
    actions: []
  });
  const [metadata, setMetadata] = useState<GPTMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const steps = [
    'GPT Identification',
    'Configuration Import',
    'Custom Actions/Tools',
    'Knowledge Base',
    'Review & Deploy'
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onConfigComplete(config);
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBack();
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
          Import Your Custom GPT
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Important:</strong> This creates an API-wrapped version of your Custom GPT 
            with governance controls. Costs will be based on token usage through the OpenAI API 
            instead of your ChatGPT Plus subscription.
          </Typography>
        </Alert>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Step 1: GPT Identification */}
        <Step>
          <StepLabel>GPT Identification</StepLabel>
          <StepContent>
            <GPTIdentificationStep
              config={config}
              setConfig={setConfig}
              metadata={metadata}
              setMetadata={setMetadata}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
            <Box sx={{ mb: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!config.url || isAnalyzing}
                sx={{ mr: 1 }}
              >
                Continue
              </Button>
              <Button onClick={handleBack} sx={{ color: 'white' }}>
                Back
              </Button>
            </Box>
          </StepContent>
        </Step>

        {/* Step 2: Configuration Import */}
        <Step>
          <StepLabel>Configuration Import</StepLabel>
          <StepContent>
            <ConfigurationImportStep
              config={config}
              setConfig={setConfig}
              metadata={metadata}
            />
            <Box sx={{ mb: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!config.instructions}
                sx={{ mr: 1 }}
              >
                Continue
              </Button>
              <Button onClick={handleBack} sx={{ color: 'white' }}>
                Back
              </Button>
            </Box>
          </StepContent>
        </Step>

        {/* Step 3: Custom Actions/Tools */}
        <Step>
          <StepLabel>Custom Actions/Tools (Optional)</StepLabel>
          <StepContent>
            <CustomActionsStep
              config={config}
              setConfig={setConfig}
            />
            <Box sx={{ mb: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ mr: 1 }}
              >
                Continue
              </Button>
              <Button onClick={handleBack} sx={{ color: 'white' }}>
                Back
              </Button>
            </Box>
          </StepContent>
        </Step>

        {/* Step 4: Knowledge Base */}
        <Step>
          <StepLabel>Knowledge Base (Optional)</StepLabel>
          <StepContent>
            <KnowledgeBaseStep
              config={config}
              setConfig={setConfig}
            />
            <Box sx={{ mb: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ mr: 1 }}
              >
                Continue
              </Button>
              <Button onClick={handleBack} sx={{ color: 'white' }}>
                Back
              </Button>
            </Box>
          </StepContent>
        </Step>

        {/* Step 5: Review & Deploy */}
        <Step>
          <StepLabel>Review & Deploy</StepLabel>
          <StepContent>
            <ReviewStep config={config} />
            <Box sx={{ mb: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                sx={{ mr: 1 }}
              >
                Deploy Governed Agent
              </Button>
              <Button onClick={handleBack} sx={{ color: 'white' }}>
                Back
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </Box>
  );
};

// Step 1: GPT Identification
const GPTIdentificationStep: React.FC<{
  config: CustomGPTConfig;
  setConfig: (config: CustomGPTConfig) => void;
  metadata: GPTMetadata | null;
  setMetadata: (metadata: GPTMetadata | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}> = ({ config, setConfig, metadata, setMetadata, isAnalyzing, setIsAnalyzing }) => {
  
  const analyzeGPTUrl = async (url: string) => {
    if (!url.includes('chatgpt.com/g/g-')) return;
    
    setIsAnalyzing(true);
    try {
      // Simulate API call to analyze GPT URL
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract name from URL slug
      const urlParts = url.split('/');
      const gptSlug = urlParts[urlParts.length - 1];
      const estimatedName = gptSlug
        .split('-')
        .slice(1) // Remove the 'g' prefix
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setMetadata({
        name: estimatedName || 'Custom GPT',
        description: 'Auto-detected from URL',
        isPublic: true,
        confidence: 0.8
      });
      
      setConfig({
        ...config,
        url,
        name: estimatedName || 'Custom GPT'
      });
    } catch (error) {
      console.error('Error analyzing GPT URL:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (config.url) {
      const timer = setTimeout(() => analyzeGPTUrl(config.url), 1000);
      return () => clearTimeout(timer);
    }
  }, [config.url]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
        Enter Your Custom GPT URL
      </Typography>
      
      <TextField
        fullWidth
        label="Custom GPT URL"
        value={config.url}
        onChange={(e) => setConfig({ ...config, url: e.target.value })}
        placeholder="https://chatgpt.com/g/g-abc123-your-gpt-name"
        helperText="Find this URL by going to your Custom GPT and copying the browser address"
        sx={{ 
          mb: 2,
          '& .MuiInputLabel-root': { color: '#a0aec0' },
          '& .MuiOutlinedInput-root': { 
            color: 'white',
            '& fieldset': { borderColor: '#4a5568' },
            '&:hover fieldset': { borderColor: '#718096' },
            '&.Mui-focused fieldset': { borderColor: '#3182ce' }
          },
          '& .MuiFormHelperText-root': { color: '#a0aec0' }
        }}
      />

      {/* URL Validation */}
      {config.url && !config.url.includes('chatgpt.com/g/g-') && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Please enter a valid Custom GPT URL. It should start with "https://chatgpt.com/g/g-"
        </Alert>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2" sx={{ color: 'white' }}>Analyzing GPT URL...</Typography>
        </Box>
      )}

      {/* Auto-Discovery Results */}
      {metadata && (
        <Card sx={{ mb: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ color: 'white' }}>GPT Detected Successfully</Typography>
            </Box>
            <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
              <strong>Name:</strong> {metadata.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              <strong>Status:</strong> {metadata.isPublic ? 'Public GPT' : 'Private GPT'}
            </Typography>
            <Chip 
              label={`${Math.round(metadata.confidence * 100)}% Confidence`}
              size="small"
              color="success"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Accordion sx={{ backgroundColor: '#374151', color: 'white' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
          <Typography variant="body2">Need help finding your GPT URL?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            1. Go to ChatGPT and open your Custom GPT
          </Typography>
          <Typography variant="body2" paragraph>
            2. Copy the URL from your browser's address bar
          </Typography>
          <Typography variant="body2" paragraph>
            3. The URL should look like: https://chatgpt.com/g/g-abc123-your-gpt-name
          </Typography>
          <Link 
            href="https://chatgpt.com" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ color: '#3182ce', display: 'flex', alignItems: 'center', mt: 1 }}
          >
            Open ChatGPT <OpenInNewIcon sx={{ ml: 0.5, fontSize: 16 }} />
          </Link>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

// Step 2: Configuration Import
const ConfigurationImportStep: React.FC<{
  config: CustomGPTConfig;
  setConfig: (config: CustomGPTConfig) => void;
  metadata: GPTMetadata | null;
}> = ({ config, setConfig, metadata }) => {
  
  const handleCapabilityChange = (capability: string, checked: boolean) => {
    const newCapabilities = checked
      ? [...config.capabilities, capability]
      : config.capabilities.filter(c => c !== capability);
    
    setConfig({ ...config, capabilities: newCapabilities });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
        Import GPT Configuration
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Copy the following information from your Custom GPT configuration page:
        </Typography>
      </Alert>

      {/* Instructions */}
      <TextField
        fullWidth
        multiline
        rows={6}
        label="GPT Instructions"
        value={config.instructions}
        onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
        placeholder="Paste your GPT's instructions here..."
        helperText={
          <span>
            Go to your GPT → <strong>Configure</strong> → Copy the <strong>Instructions</strong> field
          </span>
        }
        sx={{ 
          mb: 3,
          '& .MuiInputLabel-root': { color: '#a0aec0' },
          '& .MuiOutlinedInput-root': { 
            color: 'white',
            '& fieldset': { borderColor: '#4a5568' },
            '&:hover fieldset': { borderColor: '#718096' },
            '&.Mui-focused fieldset': { borderColor: '#3182ce' }
          },
          '& .MuiFormHelperText-root': { color: '#a0aec0' }
        }}
      />

      {/* Capabilities */}
      <Typography variant="subtitle1" gutterBottom sx={{ color: 'white' }}>
        Select Capabilities
      </Typography>
      <Typography variant="body2" sx={{ color: '#a0aec0' }} paragraph>
        Check the capabilities that your Custom GPT uses:
      </Typography>
      
      <FormGroup sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={config.capabilities.includes('web_browsing')}
              onChange={(e) => handleCapabilityChange('web_browsing', e.target.checked)}
              sx={{ color: '#a0aec0', '&.Mui-checked': { color: '#3182ce' } }}
            />
          }
          label={<Typography sx={{ color: 'white' }}>Web Browsing</Typography>}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={config.capabilities.includes('dalle_image_generation')}
              onChange={(e) => handleCapabilityChange('dalle_image_generation', e.target.checked)}
              sx={{ color: '#a0aec0', '&.Mui-checked': { color: '#3182ce' } }}
            />
          }
          label={<Typography sx={{ color: 'white' }}>DALL-E Image Generation</Typography>}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={config.capabilities.includes('code_interpreter')}
              onChange={(e) => handleCapabilityChange('code_interpreter', e.target.checked)}
              sx={{ color: '#a0aec0', '&.Mui-checked': { color: '#3182ce' } }}
            />
          }
          label={<Typography sx={{ color: 'white' }}>Code Interpreter</Typography>}
        />
      </FormGroup>

      {/* Help Section */}
      <Accordion sx={{ backgroundColor: '#374151', color: 'white' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
          <Typography variant="body2">How to find your GPT's instructions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            1. Go to your Custom GPT in ChatGPT
          </Typography>
          <Typography variant="body2" paragraph>
            2. Click the <strong>Configure</strong> tab (next to Create)
          </Typography>
          <Typography variant="body2" paragraph>
            3. Copy all text from the <strong>Instructions</strong> text box
          </Typography>
          <Typography variant="body2" paragraph>
            4. Paste it into the field above
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

// Step 3: Knowledge Base
const KnowledgeBaseStep: React.FC<{
  config: CustomGPTConfig;
  setConfig: (config: CustomGPTConfig) => void;
}> = ({ config, setConfig }) => {
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setConfig({ ...config, knowledgeFiles: files });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
        Knowledge Base (Optional)
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> You'll need the original files you uploaded to your Custom GPT. 
          ChatGPT doesn't allow downloading files from existing GPTs.
        </Typography>
      </Alert>

      {/* File Upload */}
      <Card sx={{ mb: 3, p: 3, textAlign: 'center', border: '2px dashed #4a5568', backgroundColor: '#374151' }}>
        <UploadIcon sx={{ fontSize: 48, color: '#a0aec0', mb: 2 }} />
        <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
          Upload Knowledge Files
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0' }} paragraph>
          Upload the same files you used in your Custom GPT
        </Typography>
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.md"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="knowledge-files-upload"
        />
        <label htmlFor="knowledge-files-upload">
          <Button variant="outlined" component="span" sx={{ color: 'white', borderColor: '#4a5568' }}>
            Choose Files
          </Button>
        </label>
      </Card>

      {/* Uploaded Files */}
      {config.knowledgeFiles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
            Uploaded Files ({config.knowledgeFiles.length}):
          </Typography>
          {config.knowledgeFiles.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              sx={{ mr: 1, mb: 1, backgroundColor: '#4a5568', color: 'white' }}
              onDelete={() => {
                const newFiles = config.knowledgeFiles.filter((_, i) => i !== index);
                setConfig({ ...config, knowledgeFiles: newFiles });
              }}
            />
          ))}
        </Box>
      )}

      {/* Alternative Options */}
      <Divider sx={{ my: 3, borderColor: '#4a5568' }} />
      
      <Typography variant="subtitle1" gutterBottom sx={{ color: 'white' }}>
        Don't have the original files?
      </Typography>
      <Typography variant="body2" sx={{ color: '#a0aec0' }} paragraph>
        You can still proceed without uploading files. Consider these alternatives:
      </Typography>
      
      <Box sx={{ pl: 2 }}>
        <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
          • Enable <strong>Web Browsing</strong> to access information online
        </Typography>
        <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
          • Upload files later after deployment
        </Typography>
        <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
          • Recreate your knowledge base with new files
        </Typography>
      </Box>
    </Box>
  );
};

// Step 4: Review
const ReviewStep: React.FC<{
  config: CustomGPTConfig;
}> = ({ config }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
        Review Configuration
      </Typography>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Your Custom GPT is ready to be deployed as a governed agent!
        </Typography>
      </Alert>

      {/* Configuration Summary */}
      <Card sx={{ mb: 3, backgroundColor: '#374151' }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ color: 'white' }}>
            <strong>GPT Configuration</strong>
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            <strong>Name:</strong> {config.name}
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            <strong>Instructions:</strong> {config.instructions.substring(0, 100)}...
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            <strong>Capabilities:</strong> {config.capabilities.join(', ') || 'None selected'}
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            <strong>Custom Actions:</strong> {config.actions.length} actions registered
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            <strong>Knowledge Files:</strong> {config.knowledgeFiles.length} files uploaded
          </Typography>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card sx={{ backgroundColor: '#374151' }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ color: 'white' }}>
            <strong>What happens next?</strong>
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            ✓ Your GPT will be recreated using the OpenAI API with GPT-4o
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            ✓ Full governance controls will be applied (audit trails, rate limiting, etc.)
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            ✓ The agent will appear in your command center with scorecard tracking
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: '#a0aec0' }}>
            ✓ You'll have unlimited API access (pay-per-use pricing)
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomGPTConfigurationStep;



// Step 3: Custom Actions/Tools
const CustomActionsStep: React.FC<{
  config: CustomGPTConfig;
  setConfig: (config: CustomGPTConfig) => void;
}> = ({ config, setConfig }) => {
  const [newAction, setNewAction] = useState<CustomAction>({
    name: '',
    description: '',
    schema: {}
  });
  const [showAddAction, setShowAddAction] = useState(false);
  const [schemaText, setSchemaText] = useState('');

  const handleAddAction = () => {
    try {
      const parsedSchema = schemaText ? JSON.parse(schemaText) : {};
      const actionToAdd = {
        ...newAction,
        schema: parsedSchema
      };
      
      setConfig({
        ...config,
        actions: [...config.actions, actionToAdd]
      });
      
      // Reset form
      setNewAction({ name: '', description: '', schema: {} });
      setSchemaText('');
      setShowAddAction(false);
    } catch (error) {
      alert('Invalid JSON schema. Please check your formatting.');
    }
  };

  const handleRemoveAction = (index: number) => {
    const newActions = config.actions.filter((_, i) => i !== index);
    setConfig({ ...config, actions: newActions });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
        Custom Actions/Tools (Optional)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Custom Actions</strong> allow your GPT to call external APIs and services. 
          If your Custom GPT uses Actions, you can register them here for full functionality.
        </Typography>
      </Alert>

      {/* Existing Actions */}
      {config.actions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: 'white' }}>
            Registered Actions ({config.actions.length})
          </Typography>
          {config.actions.map((action, index) => (
            <Card key={index} sx={{ mb: 2, backgroundColor: '#374151' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {action.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      {action.description}
                    </Typography>
                    <Chip 
                      label="Custom API"
                      size="small"
                      sx={{ backgroundColor: '#3182ce', color: 'white' }}
                    />
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveAction(index)}
                    sx={{ color: '#f56565' }}
                  >
                    Remove
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add New Action */}
      {!showAddAction ? (
        <Button
          variant="outlined"
          onClick={() => setShowAddAction(true)}
          sx={{ 
            color: 'white', 
            borderColor: '#4a5568',
            '&:hover': { borderColor: '#718096' }
          }}
        >
          + Add Custom Action
        </Button>
      ) : (
        <Card sx={{ backgroundColor: '#374151', p: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: 'white' }}>
            Add New Custom Action
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Action Name"
                value={newAction.name}
                onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                placeholder="e.g., get_weather, send_email"
                sx={{ 
                  mb: 2,
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiOutlinedInput-root': { 
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                    '&.Mui-focused fieldset': { borderColor: '#3182ce' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                value={newAction.description}
                onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                placeholder="What this action does"
                sx={{ 
                  mb: 2,
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiOutlinedInput-root': { 
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                    '&.Mui-focused fieldset': { borderColor: '#3182ce' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="OpenAPI Schema (JSON)"
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                placeholder={`{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api.example.com"
    }
  ],
  "paths": {
    "/endpoint": {
      "get": {
        "summary": "Description",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}`}
                helperText="Paste the OpenAPI schema from your Custom GPT's Action configuration"
                sx={{ 
                  mb: 2,
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiOutlinedInput-root': { 
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                    '&.Mui-focused fieldset': { borderColor: '#3182ce' }
                  },
                  '& .MuiFormHelperText-root': { color: '#a0aec0' }
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleAddAction}
              disabled={!newAction.name || !newAction.description}
            >
              Add Action
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setShowAddAction(false);
                setNewAction({ name: '', description: '', schema: {} });
                setSchemaText('');
              }}
              sx={{ color: 'white', borderColor: '#4a5568' }}
            >
              Cancel
            </Button>
          </Box>
        </Card>
      )}

      {/* Help Section */}
      <Accordion sx={{ backgroundColor: '#374151', color: 'white', mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
          <Typography variant="body2">How to find your GPT's Actions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            1. Go to your Custom GPT in ChatGPT
          </Typography>
          <Typography variant="body2" paragraph>
            2. Click the <strong>Configure</strong> tab
          </Typography>
          <Typography variant="body2" paragraph>
            3. Scroll down to the <strong>Actions</strong> section
          </Typography>
          <Typography variant="body2" paragraph>
            4. For each Action, copy the <strong>Schema</strong> (OpenAPI format)
          </Typography>
          <Typography variant="body2" paragraph>
            5. You may also need to configure authentication settings separately
          </Typography>
          
          <Divider sx={{ my: 2, borderColor: '#4a5568' }} />
          
          <Typography variant="body2" paragraph sx={{ fontWeight: 'bold' }}>
            Don't have Actions?
          </Typography>
          <Typography variant="body2" paragraph>
            Most Custom GPTs don't use Actions - they rely on built-in capabilities like web browsing, 
            code interpreter, and DALL-E. You can skip this step if your GPT doesn't have custom Actions.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

