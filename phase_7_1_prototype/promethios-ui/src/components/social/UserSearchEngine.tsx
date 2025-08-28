import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Autocomplete,
  Chip,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  IconButton,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  LocationOn,
  Business,
  School,
  Star,
  SmartToy,
  Psychology,
  ExpandMore,
  ExpandLess,
  Tune,
} from '@mui/icons-material';

interface SearchFilters {
  query: string;
  location: string[];
  company: string[];
  industry: string[];
  skills: string[];
  aiAgents: string[];
  aiSkills: string[];
  collaborationStyle: string[];
  experienceLevel: string;
  collaborationRating: [number, number];
  connectionLevel: string;
  isOnline: boolean | null;
  hasPublicProfile: boolean | null;
}

interface UserSearchEngineProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  resultCount?: number;
  suggestions?: {
    locations: string[];
    companies: string[];
    industries: string[];
    skills: string[];
    aiAgents: string[];
    aiSkills: string[];
  };
}

const UserSearchEngine: React.FC<UserSearchEngineProps> = ({
  onSearch,
  onClearFilters,
  isLoading = false,
  resultCount = 0,
  suggestions = {
    locations: [],
    companies: [],
    industries: [],
    skills: [],
    aiAgents: [],
    aiSkills: [],
  },
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: [],
    company: [],
    industry: [],
    skills: [],
    aiAgents: [],
    aiSkills: [],
    collaborationStyle: [],
    experienceLevel: '',
    collaborationRating: [0, 5],
    connectionLevel: '',
    isOnline: null,
    hasPublicProfile: null,
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Default suggestions if none provided
  const defaultSuggestions = {
    locations: ['San Francisco, CA', 'New York, NY', 'London, UK', 'Toronto, ON', 'Berlin, Germany', 'Tokyo, Japan'],
    companies: ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'OpenAI', 'Anthropic', 'Tesla'],
    industries: ['Technology', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Consulting', 'Research', 'Startup'],
    skills: ['Machine Learning', 'Data Science', 'Product Management', 'Software Engineering', 'Marketing', 'Design', 'Strategy', 'Research'],
    aiAgents: ['Claude', 'OpenAI', 'Gemini', 'Custom'],
    aiSkills: ['Content Strategy', 'Code Review', 'Data Analysis', 'Creative Writing', 'Research', 'Problem Solving', 'Planning', 'Automation'],
  };

  const finalSuggestions = useMemo(() => ({
    locations: suggestions.locations.length > 0 ? suggestions.locations : defaultSuggestions.locations,
    companies: suggestions.companies.length > 0 ? suggestions.companies : defaultSuggestions.companies,
    industries: suggestions.industries.length > 0 ? suggestions.industries : defaultSuggestions.industries,
    skills: suggestions.skills.length > 0 ? suggestions.skills : defaultSuggestions.skills,
    aiAgents: suggestions.aiAgents.length > 0 ? suggestions.aiAgents : defaultSuggestions.aiAgents,
    aiSkills: suggestions.aiSkills.length > 0 ? suggestions.aiSkills : defaultSuggestions.aiSkills,
  }), [suggestions]);

  const collaborationStyles = ['Analytical', 'Creative', 'Technical', 'Strategic', 'Collaborative'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Expert'];
  const connectionLevels = ['1st Connections', '2nd Connections', '3rd+ Connections', 'All'];

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(filters.query, filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      query: '',
      location: [],
      company: [],
      industry: [],
      skills: [],
      aiAgents: [],
      aiSkills: [],
      collaborationStyle: [],
      experienceLevel: '',
      collaborationRating: [0, 5],
      connectionLevel: '',
      isOnline: null,
      hasPublicProfile: null,
    });
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.location.length > 0) count++;
    if (filters.company.length > 0) count++;
    if (filters.industry.length > 0) count++;
    if (filters.skills.length > 0) count++;
    if (filters.aiAgents.length > 0) count++;
    if (filters.aiSkills.length > 0) count++;
    if (filters.collaborationStyle.length > 0) count++;
    if (filters.experienceLevel) count++;
    if (filters.collaborationRating[0] > 0 || filters.collaborationRating[1] < 5) count++;
    if (filters.connectionLevel) count++;
    if (filters.isOnline !== null) count++;
    if (filters.hasPublicProfile !== null) count++;
    return count;
  };

  const handleQuickSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, query: searchTerm }));
    if (!searchHistory.includes(searchTerm)) {
      setSearchHistory(prev => [searchTerm, ...prev.slice(0, 4)]);
    }
  };

  const quickSearchSuggestions = [
    'Marketing experts using Claude',
    'Software engineers with OpenAI',
    'Data scientists in San Francisco',
    'Product managers at startups',
    'AI researchers with Gemini',
    'Creative professionals using AI',
  ];

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search color="primary" />
          Find AI Collaboration Partners
        </Typography>
        
        {/* Main Search Bar */}
        <TextField
          fullWidth
          placeholder="Search by name, skills, company, or AI specialization..."
          value={filters.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: filters.query && (
              <InputAdornment position="end">
                <IconButton onClick={() => handleFilterChange('query', '')} size="small">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        {/* Quick Search Suggestions */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
            Try:
          </Typography>
          {quickSearchSuggestions.map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              size="small"
              variant="outlined"
              onClick={() => handleQuickSearch(suggestion)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
        
        {/* Search Results Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {isLoading ? 'Searching...' : `${resultCount} professionals found`}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={getActiveFilterCount()} color="primary">
              <Button
                variant="outlined"
                startIcon={<Tune />}
                endIcon={showAdvancedFilters ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Filters
              </Button>
            </Badge>
            
            {getActiveFilterCount() > 0 && (
              <Button
                variant="text"
                startIcon={<Clear />}
                onClick={handleClearAllFilters}
                size="small"
              >
                Clear All
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Advanced Filters */}
      <Collapse in={showAdvancedFilters}>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {/* Location Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={finalSuggestions.locations}
              value={filters.location}
              onChange={(_, value) => handleFilterChange('location', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Location"
                  placeholder="Add locations..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </Grid>
          
          {/* Company Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={finalSuggestions.companies}
              value={filters.company}
              onChange={(_, value) => handleFilterChange('company', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Company"
                  placeholder="Add companies..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </Grid>
          
          {/* Industry Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={finalSuggestions.industries}
              value={filters.industry}
              onChange={(_, value) => handleFilterChange('industry', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Industry"
                  placeholder="Add industries..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </Grid>
          
          {/* Skills Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={finalSuggestions.skills}
              value={filters.skills}
              onChange={(_, value) => handleFilterChange('skills', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Professional Skills"
                  placeholder="Add skills..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <School />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </Grid>
          
          {/* AI Agents Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={finalSuggestions.aiAgents}
              value={filters.aiAgents}
              onChange={(_, value) => handleFilterChange('aiAgents', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="AI Agents"
                  placeholder="Add AI agents..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SmartToy />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </Grid>
          
          {/* AI Skills Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={finalSuggestions.aiSkills}
              value={filters.aiSkills}
              onChange={(_, value) => handleFilterChange('aiSkills', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="AI Specializations"
                  placeholder="Add AI skills..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Psychology />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </Grid>
          
          {/* Collaboration Style */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Collaboration Style</InputLabel>
              <Select
                multiple
                value={filters.collaborationStyle}
                onChange={(e) => handleFilterChange('collaborationStyle', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {collaborationStyles.map((style) => (
                  <MenuItem key={style} value={style}>
                    {style}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Experience Level */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={filters.experienceLevel}
                onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
              >
                <MenuItem value="">Any Level</MenuItem>
                {experienceLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Collaboration Rating */}
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>
              Collaboration Rating: {filters.collaborationRating[0]} - {filters.collaborationRating[1]} stars
            </Typography>
            <Slider
              value={filters.collaborationRating}
              onChange={(_, value) => handleFilterChange('collaborationRating', value)}
              valueLabelDisplay="auto"
              min={0}
              max={5}
              step={0.5}
              marks={[
                { value: 0, label: '0' },
                { value: 2.5, label: '2.5' },
                { value: 5, label: '5' },
              ]}
            />
          </Grid>
          
          {/* Connection Level */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Connection Level</InputLabel>
              <Select
                value={filters.connectionLevel}
                onChange={(e) => handleFilterChange('connectionLevel', e.target.value)}
              >
                <MenuItem value="">Any Connection</MenuItem>
                {connectionLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Toggle Filters */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.isOnline === true}
                    onChange={(e) => handleFilterChange('isOnline', e.target.checked ? true : null)}
                  />
                }
                label="Currently Online"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.hasPublicProfile === true}
                    onChange={(e) => handleFilterChange('hasPublicProfile', e.target.checked ? true : null)}
                  />
                }
                label="Public Profile Only"
              />
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default UserSearchEngine;

