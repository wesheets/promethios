/**
 * Cost Comparison Dashboard
 * 
 * Real-time cost comparison across all 8 providers for enterprise decision-making
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Switch,
  FormControlLabel,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as CostIcon,
  Speed as PerformanceIcon,
  Timer as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Compare as CompareIcon,
  Savings as SavingsIcon,
  Business as EnterpriseIcon,
  ExpandMore as ExpandIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

interface ProviderPricing {
  provider: string;
  displayName: string;
  baseCost: number;
  costPerToken: number;
  setupFee: number;
  monthlyFee: number;
  supportLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
  availability: 'available' | 'contact' | 'waitlist';
  features: string[];
  pros: string[];
  cons: string[];
  bestFor: string[];
  estimatedDuration: string;
  color: 'success' | 'info' | 'primary' | 'warning' | 'secondary' | 'error';
}

interface CostEstimate {
  provider: string;
  trainingCost: number;
  inferenceCost: number;
  totalFirstYear: number;
  totalThreeYear: number;
  roi: number;
  breakEvenMonths: number;
}

const providerData: ProviderPricing[] = [
  {
    provider: 'huggingface',
    displayName: 'HuggingFace AutoTrain',
    baseCost: 1.50,
    costPerToken: 0.0005,
    setupFee: 0,
    monthlyFee: 0,
    supportLevel: 'basic',
    availability: 'available',
    features: ['Open source models', 'Own the model', 'T4 GPU training', 'No vendor lock-in'],
    pros: ['Cheapest option', 'Model ownership', 'Open source', 'Fast training'],
    cons: ['Basic support', 'Technical setup required', 'Limited model types'],
    bestFor: ['Startups', 'Cost-conscious enterprises', 'Technical teams'],
    estimatedDuration: '2-6 hours',
    color: 'success'
  },
  {
    provider: 'perplexity',
    displayName: 'Perplexity',
    baseCost: 30,
    costPerToken: 0.003,
    setupFee: 100,
    monthlyFee: 50,
    supportLevel: 'standard',
    availability: 'available',
    features: ['Real-time search', 'Base model training', 'Competitive rates', 'Search integration'],
    pros: ['Search capabilities', 'Good performance', 'Reasonable pricing'],
    cons: ['Limited fine-tuning options', 'Newer platform', 'Search dependency'],
    bestFor: ['Research applications', 'Search-heavy use cases', 'Medium enterprises'],
    estimatedDuration: '1-2 days',
    color: 'info'
  },
  {
    provider: 'cohere',
    displayName: 'Cohere',
    baseCost: 60,
    costPerToken: 0.002,
    setupFee: 200,
    monthlyFee: 100,
    supportLevel: 'premium',
    availability: 'available',
    features: ['Command models', 'Custom training', 'Enterprise support', 'Multilingual'],
    pros: ['Excellent support', 'Proven models', 'Enterprise features'],
    cons: ['Higher cost', 'Vendor lock-in', 'Complex pricing'],
    bestFor: ['Enterprise customers', 'Multilingual needs', 'Production systems'],
    estimatedDuration: '3-5 days',
    color: 'primary'
  },
  {
    provider: 'gemini',
    displayName: 'Google Gemini',
    baseCost: 80,
    costPerToken: 0.001,
    setupFee: 500,
    monthlyFee: 200,
    supportLevel: 'enterprise',
    availability: 'available',
    features: ['Vertex AI', 'Google Cloud', 'Scalable training', 'Enterprise grade'],
    pros: ['Google infrastructure', 'Scalable', 'Enterprise support'],
    cons: ['High setup cost', 'Complex setup', 'Google dependency'],
    bestFor: ['Large enterprises', 'Google Cloud users', 'Scalable applications'],
    estimatedDuration: '1-2 weeks',
    color: 'warning'
  },
  {
    provider: 'openai',
    displayName: 'OpenAI',
    baseCost: 240,
    costPerToken: 0.008,
    setupFee: 1000,
    monthlyFee: 500,
    supportLevel: 'enterprise',
    availability: 'available',
    features: ['GPT models', 'High quality', 'Proven results', 'Best performance'],
    pros: ['Highest quality', 'Proven track record', 'Excellent documentation'],
    cons: ['Most expensive', 'Rate limits', 'Vendor dependency'],
    bestFor: ['Premium applications', 'Quality-first enterprises', 'High-value use cases'],
    estimatedDuration: '1-2 weeks',
    color: 'secondary'
  },
  {
    provider: 'anthropic',
    displayName: 'Anthropic Claude',
    baseCost: 0,
    costPerToken: 0.020,
    setupFee: 0,
    monthlyFee: 0,
    supportLevel: 'enterprise',
    availability: 'contact',
    features: ['Constitutional AI', 'Safety focused', 'Custom pricing', 'Enterprise only'],
    pros: ['Safety focused', 'Constitutional AI', 'Custom solutions'],
    cons: ['Contact only', 'Limited availability', 'Unknown pricing'],
    bestFor: ['Safety-critical applications', 'Regulated industries', 'Large enterprises'],
    estimatedDuration: '4-8 weeks',
    color: 'error'
  }
];

const CostComparisonDashboard: React.FC = () => {
  const [dataSize, setDataSize] = useState(10000); // Number of training samples
  const [useCase, setUseCase] = useState('customer-support');
  const [budget, setBudget] = useState(10000);
  const [timeline, setTimeline] = useState('flexible');
  const [supportLevel, setSupportLevel] = useState('standard');
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderPricing | null>(null);
  const [showROI, setShowROI] = useState(true);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);

  const useCaseOptions = [
    { value: 'customer-support', label: 'Customer Support', multiplier: 1.0 },
    { value: 'legal-analysis', label: 'Legal Document Analysis', multiplier: 1.5 },
    { value: 'medical-diagnosis', label: 'Medical Diagnosis', multiplier: 2.0 },
    { value: 'financial-analysis', label: 'Financial Analysis', multiplier: 1.3 },
    { value: 'content-creation', label: 'Content Creation', multiplier: 0.8 },
    { value: 'code-review', label: 'Code Review', multiplier: 1.2 },
    { value: 'education', label: 'Educational Content', multiplier: 0.9 },
    { value: 'research', label: 'Research Assistant', multiplier: 1.1 }
  ];

  const calculateCosts = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const estimates = providerData
        .filter(provider => provider.availability === 'available')
        .map(provider => {
          const useCaseMultiplier = useCaseOptions.find(uc => uc.value === useCase)?.multiplier || 1.0;
          const sizeMultiplier = Math.log10(dataSize / 1000) + 1;
          
          const trainingCost = provider.baseCost * sizeMultiplier * useCaseMultiplier + provider.setupFee;
          const monthlyInferenceCost = (dataSize * provider.costPerToken * 0.1) + provider.monthlyFee; // Assume 10% of training data used monthly
          const inferenceCost = monthlyInferenceCost * 12; // Annual inference cost
          const totalFirstYear = trainingCost + inferenceCost;
          const totalThreeYear = trainingCost + (inferenceCost * 3);
          
          // ROI calculation (assuming 30% cost savings vs manual processes)
          const manualCost = 50000; // Baseline manual process cost
          const savings = manualCost * 0.3;
          const roi = ((savings - totalFirstYear) / totalFirstYear) * 100;
          const breakEvenMonths = totalFirstYear / (savings / 12);

          return {
            provider: provider.provider,
            trainingCost,
            inferenceCost,
            totalFirstYear,
            totalThreeYear,
            roi,
            breakEvenMonths: Math.max(0, breakEvenMonths)
          };
        })
        .sort((a, b) => a.totalFirstYear - b.totalFirstYear);

      setCostEstimates(estimates);
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    calculateCosts();
  }, [dataSize, useCase, budget, timeline, supportLevel]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProviderData = (providerKey: string) => {
    return providerData.find(p => p.provider === providerKey);
  };

  const renderConfigurationPanel = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Cost Calculation Parameters
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography gutterBottom>Training Data Size: {dataSize.toLocaleString()} samples</Typography>
            <Slider
              value={dataSize}
              onChange={(_, value) => setDataSize(value as number)}
              min={1000}
              max={100000}
              step={1000}
              marks={[
                { value: 1000, label: '1K' },
                { value: 10000, label: '10K' },
                { value: 50000, label: '50K' },
                { value: 100000, label: '100K' }
              ]}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Use Case</InputLabel>
              <Select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                label="Use Case"
              >
                {useCaseOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Timeline</InputLabel>
              <Select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                label="Timeline"
              >
                <MenuItem value="asap">ASAP (Rush)</MenuItem>
                <MenuItem value="1-2weeks">1-2 weeks</MenuItem>
                <MenuItem value="1month">1 month</MenuItem>
                <MenuItem value="flexible">Flexible</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography gutterBottom>Budget: {formatCurrency(budget)}</Typography>
            <Slider
              value={budget}
              onChange={(_, value) => setBudget(value as number)}
              min={1000}
              max={50000}
              step={1000}
              marks={[
                { value: 1000, label: '$1K' },
                { value: 10000, label: '$10K' },
                { value: 25000, label: '$25K' },
                { value: 50000, label: '$50K+' }
              ]}
            />
          </Grid>
        </Grid>

        <Box mt={2} display="flex" gap={2} alignItems="center">
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={calculateCosts}
            disabled={loading}
          >
            Recalculate Costs
          </Button>
          
          <FormControlLabel
            control={
              <Switch
                checked={showROI}
                onChange={(e) => setShowROI(e.target.checked)}
              />
            }
            label="Show ROI Analysis"
          />

          <Button 
            variant="outlined" 
            startIcon={<CompareIcon />}
            onClick={() => setComparisonDialogOpen(true)}
          >
            Detailed Comparison
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderCostEstimates = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Cost Comparison Results
          </Typography>
          <Box>
            <IconButton onClick={() => {}}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={() => {}}>
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Provider</TableCell>
                <TableCell align="right">Training Cost</TableCell>
                <TableCell align="right">Annual Inference</TableCell>
                <TableCell align="right">First Year Total</TableCell>
                {showROI && <TableCell align="right">ROI %</TableCell>}
                {showROI && <TableCell align="right">Break Even</TableCell>}
                <TableCell align="center">Recommendation</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {costEstimates.map((estimate, index) => {
                const providerInfo = getProviderData(estimate.provider);
                if (!providerInfo) return null;

                const isRecommended = index === 0; // Cheapest option
                const isBudgetFriendly = estimate.totalFirstYear <= budget;

                return (
                  <TableRow 
                    key={estimate.provider}
                    sx={{ 
                      backgroundColor: isRecommended ? 'success.light' : 'inherit',
                      opacity: isBudgetFriendly ? 1 : 0.6
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2">
                            {providerInfo.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {providerInfo.estimatedDuration}
                          </Typography>
                        </Box>
                        {isRecommended && (
                          <Chip 
                            label="Best Value" 
                            color="success" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                        {!isBudgetFriendly && (
                          <Chip 
                            label="Over Budget" 
                            color="warning" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(estimate.trainingCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(estimate.inferenceCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color={isBudgetFriendly ? 'success.main' : 'warning.main'}>
                        {formatCurrency(estimate.totalFirstYear)}
                      </Typography>
                    </TableCell>
                    {showROI && (
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={estimate.roi > 0 ? 'success.main' : 'error.main'}
                        >
                          {estimate.roi.toFixed(1)}%
                        </Typography>
                      </TableCell>
                    )}
                    {showROI && (
                      <TableCell align="right">
                        <Typography variant="body2">
                          {estimate.breakEvenMonths.toFixed(1)} months
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      {isRecommended && <StarIcon color="success" />}
                      {estimate.roi > 50 && <TrendingUpIcon color="success" />}
                      {!isBudgetFriendly && <WarningIcon color="warning" />}
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => setSelectedProvider(providerInfo)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Costs are estimates based on typical usage patterns. 
            Actual costs may vary based on specific requirements, data complexity, and provider pricing changes.
            Contact our sales team for accurate enterprise quotes.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderProviderDetails = () => (
    <Dialog 
      open={!!selectedProvider} 
      onClose={() => setSelectedProvider(null)}
      maxWidth="md" 
      fullWidth
    >
      {selectedProvider && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Typography variant="h6">{selectedProvider.displayName}</Typography>
              <Chip 
                label={selectedProvider.supportLevel}
                color={selectedProvider.color}
                size="small"
                sx={{ ml: 2, textTransform: 'capitalize' }}
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Pricing Details</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Base Training Cost" 
                      secondary={formatCurrency(selectedProvider.baseCost)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Setup Fee" 
                      secondary={formatCurrency(selectedProvider.setupFee)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Monthly Fee" 
                      secondary={formatCurrency(selectedProvider.monthlyFee)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Cost per Token" 
                      secondary={`$${selectedProvider.costPerToken.toFixed(4)}`}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Features</Typography>
                <List dense>
                  {selectedProvider.features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Pros</Typography>
                <List dense>
                  {selectedProvider.pros.map((pro, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={pro} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Considerations</Typography>
                <List dense>
                  {selectedProvider.cons.map((con, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <InfoIcon color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={con} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Best For</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedProvider.bestFor.map((item, index) => (
                    <Chip key={index} label={item} variant="outlined" size="small" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedProvider(null)}>Close</Button>
            <Button variant="contained" startIcon={<EnterpriseIcon />}>
              Contact Sales
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const renderSummaryCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <SavingsIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {costEstimates.length > 0 ? formatCurrency(costEstimates[0]?.totalFirstYear || 0) : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">Lowest Cost Option</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" color="info.main">
              {costEstimates.length > 0 ? `${Math.max(...costEstimates.map(e => e.roi)).toFixed(0)}%` : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">Best ROI</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TimeIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" color="warning.main">
              {costEstimates.length > 0 ? `${Math.min(...costEstimates.map(e => e.breakEvenMonths)).toFixed(0)}` : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">Months to Break Even</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CompareIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary.main">
              {costEstimates.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Providers Available</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Cost Comparison Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time cost comparison across all providers to help you make informed decisions.
        </Typography>
      </Box>

      {renderSummaryCards()}
      {renderConfigurationPanel()}
      {renderCostEstimates()}
      {renderProviderDetails()}
    </Container>
  );
};

export default CostComparisonDashboard;

