import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import {
  Store as StoreIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingIcon,
  New as NewIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  School as EducationIcon,
  LocalHospital as HealthcareIcon,
  AccountBalance as FinancialIcon,
  Gavel as LegalIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Timeline as AnalyticsIcon,
  MonetizationOn as MonetizeIcon,
  Publish as PublishIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'healthcare' | 'legal' | 'general' | 'technology' | 'education';
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    reputation: number;
  };
  price: number; // 0 for free
  currency: 'USD' | 'credits';
  rating: number;
  reviews: number;
  downloads: number;
  version: string;
  last_updated: string;
  tags: string[];
  rules_count: number;
  compliance_mappings: string[];
  preview_rules: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  license: 'MIT' | 'Commercial' | 'Enterprise' | 'Custom';
  featured: boolean;
  trending: boolean;
  new_release: boolean;
  effectiveness_score?: number;
  industry_verified?: boolean;
}

interface MarketplaceStats {
  total_templates: number;
  total_downloads: number;
  top_categories: Array<{
    category: string;
    count: number;
  }>;
  featured_authors: Array<{
    id: string;
    name: string;
    templates_count: number;
    total_downloads: number;
  }>;
}

const CATEGORY_ICONS = {
  financial: FinancialIcon,
  healthcare: HealthcareIcon,
  legal: LegalIcon,
  general: BusinessIcon,
  technology: CodeIcon,
  education: EducationIcon
};

const CATEGORY_COLORS = {
  financial: '#1976d2',
  healthcare: '#d32f2f',
  legal: '#7b1fa2',
  general: '#388e3c',
  technology: '#f57c00',
  education: '#303f9f'
};

export const PolicyMarketplace: React.FC = () => {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PolicyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'price'>('popular');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [tabValue, setTabValue] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchQuery, selectedCategory, sortBy, priceFilter]);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call the marketplace API
      const mockTemplates: PolicyTemplate[] = [
        {
          id: 'hipaa_complete',
          name: 'HIPAA Complete Compliance Suite',
          description: 'Comprehensive HIPAA-compliant governance policies for healthcare applications. Includes PHI protection, audit trails, and breach prevention.',
          category: 'healthcare',
          author: {
            id: 'healthcare_expert',
            name: 'Dr. Sarah Chen',
            verified: true,
            reputation: 4.9
          },
          price: 299,
          currency: 'USD',
          rating: 4.8,
          reviews: 127,
          downloads: 2341,
          version: '2.1.0',
          last_updated: '2024-12-15',
          tags: ['HIPAA', 'PHI', 'Healthcare', 'Compliance', 'Audit'],
          rules_count: 23,
          compliance_mappings: ['HIPAA', 'HITECH', 'GDPR'],
          preview_rules: [
            { name: 'PHI Detection & Blocking', type: 'pii_protection', description: 'Automatically detect and block PHI in responses' },
            { name: 'Medical Advice Disclaimer', type: 'content_filter', description: 'Require disclaimers for medical advice' },
            { name: 'Audit Trail Requirement', type: 'audit_requirement', description: 'Log all healthcare-related interactions' }
          ],
          license: 'Commercial',
          featured: true,
          trending: true,
          new_release: false,
          effectiveness_score: 96,
          industry_verified: true
        },
        {
          id: 'financial_sox',
          name: 'SOX Financial Compliance',
          description: 'Sarbanes-Oxley compliant policies for financial services. Includes fraud detection, financial advice controls, and audit requirements.',
          category: 'financial',
          author: {
            id: 'fintech_pro',
            name: 'Michael Rodriguez',
            verified: true,
            reputation: 4.7
          },
          price: 199,
          currency: 'USD',
          rating: 4.6,
          reviews: 89,
          downloads: 1876,
          version: '1.8.2',
          last_updated: '2024-12-10',
          tags: ['SOX', 'Financial', 'Fraud Detection', 'Compliance'],
          rules_count: 18,
          compliance_mappings: ['SOX', 'PCI-DSS', 'GDPR'],
          preview_rules: [
            { name: 'Financial Data Protection', type: 'pii_protection', description: 'Protect sensitive financial information' },
            { name: 'Investment Advice Controls', type: 'content_filter', description: 'Control investment advice delivery' }
          ],
          license: 'Commercial',
          featured: true,
          trending: false,
          new_release: false,
          effectiveness_score: 94,
          industry_verified: true
        },
        {
          id: 'basic_trust',
          name: 'Basic Trust & Safety',
          description: 'Essential trust and safety policies for any AI application. Free starter template with basic content filtering and trust scoring.',
          category: 'general',
          author: {
            id: 'promethios_team',
            name: 'Promethios Team',
            verified: true,
            reputation: 5.0
          },
          price: 0,
          currency: 'USD',
          rating: 4.4,
          reviews: 523,
          downloads: 12847,
          version: '3.0.1',
          last_updated: '2024-12-20',
          tags: ['Free', 'Basic', 'Trust', 'Safety', 'Starter'],
          rules_count: 8,
          compliance_mappings: ['Basic Safety'],
          preview_rules: [
            { name: 'Basic Trust Threshold', type: 'trust_threshold', description: 'Require minimum trust score' },
            { name: 'Content Safety Filter', type: 'content_filter', description: 'Filter harmful content' }
          ],
          license: 'MIT',
          featured: true,
          trending: false,
          new_release: false,
          effectiveness_score: 87
        },
        {
          id: 'gdpr_privacy',
          name: 'GDPR Privacy Protection',
          description: 'Complete GDPR compliance suite with data protection, consent management, and right to be forgotten implementation.',
          category: 'legal',
          author: {
            id: 'privacy_expert',
            name: 'Emma Thompson',
            verified: true,
            reputation: 4.8
          },
          price: 149,
          currency: 'USD',
          rating: 4.7,
          reviews: 156,
          downloads: 2103,
          version: '1.5.0',
          last_updated: '2024-12-18',
          tags: ['GDPR', 'Privacy', 'Data Protection', 'EU Compliance'],
          rules_count: 15,
          compliance_mappings: ['GDPR', 'CCPA', 'Privacy Laws'],
          preview_rules: [
            { name: 'PII Detection & Anonymization', type: 'pii_protection', description: 'Detect and anonymize personal data' },
            { name: 'Consent Verification', type: 'audit_requirement', description: 'Verify user consent for data processing' }
          ],
          license: 'Commercial',
          featured: false,
          trending: true,
          new_release: true,
          effectiveness_score: 92,
          industry_verified: true
        },
        {
          id: 'education_coppa',
          name: 'Educational COPPA Compliance',
          description: 'Child privacy protection for educational applications. COPPA and FERPA compliant policies for schools and EdTech.',
          category: 'education',
          author: {
            id: 'edtech_specialist',
            name: 'Prof. David Kim',
            verified: true,
            reputation: 4.6
          },
          price: 99,
          currency: 'USD',
          rating: 4.5,
          reviews: 67,
          downloads: 892,
          version: '1.2.1',
          last_updated: '2024-12-12',
          tags: ['COPPA', 'FERPA', 'Education', 'Child Privacy'],
          rules_count: 12,
          compliance_mappings: ['COPPA', 'FERPA', 'Child Privacy'],
          preview_rules: [
            { name: 'Child Data Protection', type: 'pii_protection', description: 'Enhanced protection for children under 13' },
            { name: 'Educational Content Filter', type: 'content_filter', description: 'Age-appropriate content filtering' }
          ],
          license: 'Commercial',
          featured: false,
          trending: false,
          new_release: false,
          effectiveness_score: 89
        }
      ];

      const mockStats: MarketplaceStats = {
        total_templates: 156,
        total_downloads: 45892,
        top_categories: [
          { category: 'financial', count: 34 },
          { category: 'healthcare', count: 28 },
          { category: 'general', count: 45 },
          { category: 'legal', count: 23 },
          { category: 'technology', count: 18 },
          { category: 'education', count: 8 }
        ],
        featured_authors: [
          { id: 'healthcare_expert', name: 'Dr. Sarah Chen', templates_count: 8, total_downloads: 12450 },
          { id: 'fintech_pro', name: 'Michael Rodriguez', templates_count: 12, total_downloads: 9876 },
          { id: 'privacy_expert', name: 'Emma Thompson', templates_count: 6, total_downloads: 8234 }
        ]
      };

      setTemplates(mockTemplates);
      setMarketplaceStats(mockStats);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast({
        title: "Loading failed",
        description: "Failed to load marketplace data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(template => template.price === 0);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(template => template.price > 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'newest':
          return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.price - b.price;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const toggleFavorite = (templateId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId);
    } else {
      newFavorites.add(templateId);
    }
    setFavorites(newFavorites);
  };

  const addToCart = (templateId: string) => {
    const newCart = new Set(cart);
    newCart.add(templateId);
    setCart(newCart);
    toast({
      title: "Added to cart",
      description: "Template has been added to your cart."
    });
  };

  const purchaseTemplate = async (template: PolicyTemplate) => {
    try {
      // In a real implementation, this would process payment
      toast({
        title: "Purchase successful",
        description: `${template.name} has been added to your library.`
      });
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: "Failed to complete purchase. Please try again.",
        variant: "destructive"
      });
    }
  };

  const previewTemplate = (template: PolicyTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || BusinessIcon;
    return <IconComponent sx={{ color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }} />;
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return currency === 'USD' ? `$${price}` : `${price} credits`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StoreIcon color="primary" />
        Policy Marketplace
        <Tooltip title="Browse, purchase, and sell governance policy templates created by the community">
          <IconButton size="small">
            <SecurityIcon />
          </IconButton>
        </Tooltip>
      </Typography>

      {/* Marketplace Stats */}
      {marketplaceStats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{marketplaceStats.total_templates}</Typography>
                <Typography variant="body2" color="text.secondary">Templates Available</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{marketplaceStats.total_downloads.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">Total Downloads</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{marketplaceStats.featured_authors.length}</Typography>
                <Typography variant="body2" color="text.secondary">Featured Authors</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{marketplaceStats.top_categories.length}</Typography>
                <Typography variant="body2" color="text.secondary">Categories</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Browse Templates" />
        <Tab label="My Purchases" />
        <Tab label="My Templates" />
        <Tab label="Publish Template" />
      </Tabs>

      {tabValue === 0 && (
        <>
          {/* Filters and Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      <MenuItem value="financial">Financial</MenuItem>
                      <MenuItem value="healthcare">Healthcare</MenuItem>
                      <MenuItem value="legal">Legal</MenuItem>
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="technology">Technology</MenuItem>
                      <MenuItem value="education">Education</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Price</InputLabel>
                    <Select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value as any)}
                    >
                      <MenuItem value="all">All Prices</MenuItem>
                      <MenuItem value="free">Free Only</MenuItem>
                      <MenuItem value="paid">Paid Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <MenuItem value="popular">Most Popular</MenuItem>
                      <MenuItem value="newest">Newest</MenuItem>
                      <MenuItem value="rating">Highest Rated</MenuItem>
                      <MenuItem value="price">Price: Low to High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PublishIcon />}
                    onClick={() => setPublishOpen(true)}
                  >
                    Publish Template
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredTemplates.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getCategoryIcon(template.category)}
                          <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {template.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {template.featured && (
                            <Tooltip title="Featured template">
                              <StarIcon color="warning" fontSize="small" />
                            </Tooltip>
                          )}
                          {template.trending && (
                            <Tooltip title="Trending">
                              <TrendingIcon color="success" fontSize="small" />
                            </Tooltip>
                          )}
                          {template.new_release && (
                            <Tooltip title="New release">
                              <NewIcon color="info" fontSize="small" />
                            </Tooltip>
                          )}
                          {template.industry_verified && (
                            <Tooltip title="Industry verified">
                              <VerifiedIcon color="primary" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {template.author.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{template.author.name}</Typography>
                        {template.author.verified && (
                          <VerifiedIcon color="primary" fontSize="small" />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Rating value={template.rating} precision={0.1} size="small" readOnly />
                          <Typography variant="body2">({template.reviews})</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {template.downloads.toLocaleString()} downloads
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {template.tags.slice(0, 3).map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                        {template.tags.length > 3 && (
                          <Chip label={`+${template.tags.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {formatPrice(template.price, template.currency)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.rules_count} rules
                        </Typography>
                      </Box>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PreviewIcon />}
                          onClick={() => previewTemplate(template)}
                          sx={{ flex: 1 }}
                        >
                          Preview
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => toggleFavorite(template.id)}
                          color={favorites.has(template.id) ? "error" : "default"}
                        >
                          {favorites.has(template.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                        {template.price > 0 ? (
                          <IconButton
                            size="small"
                            onClick={() => addToCart(template.id)}
                            color={cart.has(template.id) ? "primary" : "default"}
                          >
                            <CartIcon />
                          </IconButton>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => purchaseTemplate(template)}
                          >
                            Install
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        {selectedTemplate && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getCategoryIcon(selectedTemplate.category)}
                {selectedTemplate.name}
                {selectedTemplate.industry_verified && (
                  <VerifiedIcon color="primary" />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedTemplate.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Author</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {selectedTemplate.author.name.charAt(0)}
                    </Avatar>
                    <Typography>{selectedTemplate.author.name}</Typography>
                    {selectedTemplate.author.verified && <VerifiedIcon color="primary" fontSize="small" />}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                  <Typography variant="h6" color="primary">
                    {formatPrice(selectedTemplate.price, selectedTemplate.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Rating</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={selectedTemplate.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="body2">({selectedTemplate.reviews} reviews)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Downloads</Typography>
                  <Typography>{selectedTemplate.downloads.toLocaleString()}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Policy Rules Preview</Typography>
              {selectedTemplate.preview_rules.map((rule, index) => (
                <Paper key={index} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="subtitle2">{rule.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{rule.description}</Typography>
                  <Chip label={rule.type} size="small" variant="outlined" sx={{ mt: 1 }} />
                </Paper>
              ))}

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Compliance Mappings</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTemplate.compliance_mappings.map((mapping) => (
                  <Chip key={mapping} label={mapping} color="primary" variant="outlined" />
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
              {selectedTemplate.price === 0 ? (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    purchaseTemplate(selectedTemplate);
                    setPreviewOpen(false);
                  }}
                >
                  Install Free
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<MonetizeIcon />}
                  onClick={() => {
                    purchaseTemplate(selectedTemplate);
                    setPreviewOpen(false);
                  }}
                >
                  Purchase {formatPrice(selectedTemplate.price, selectedTemplate.currency)}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

