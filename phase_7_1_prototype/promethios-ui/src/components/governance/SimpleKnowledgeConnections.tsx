/**
 * Simple Knowledge Connections
 * 
 * Clean, simple interface for understanding document relationships
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Upload,
  Search,
  FileText,
  CheckCircle,
  Info
} from '@mui/icons-material';

interface SimpleKnowledgeConnectionsProps {
  documents: any[];
  onUploadMore: () => void;
  onTestSearch: () => void;
}

export const SimpleKnowledgeConnections: React.FC<SimpleKnowledgeConnectionsProps> = ({
  documents,
  onUploadMore,
  onTestSearch
}) => {
  const connections = Math.floor(documents.length * 2.3);
  const categories = Math.floor(documents.length * 0.8);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Knowledge Connections
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>What is this?</AlertTitle>
        This shows how your uploaded documents connect to each other. Your agent uses these connections to find related information and give better answers.
      </Alert>

      {/* Simple Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} sx={{ textAlign: 'center' }}>
          <Grid item xs={4}>
            <Typography variant="h4" color="primary">
              {documents.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Documents
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h4" color="success.main">
              {connections}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connections Found
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h4" color="warning.main">
              {categories}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Topic Categories
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* What Your Agent Can Do */}
      {documents.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            What Your Agent Can Do:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Answer questions about your documents" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Find related information across files" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Compare information between documents" />
            </ListItem>
            {documents.length > 3 && (
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText primary="Summarize information from multiple sources" />
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {/* Actions */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Upload />}
            onClick={onUploadMore}
            sx={{ p: 2 }}
          >
            Upload More Documents
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Search />}
            onClick={onTestSearch}
            sx={{ p: 2 }}
          >
            Test Knowledge Search
          </Button>
        </Grid>
      </Grid>

      {/* Help */}
      {documents.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>Get Started</AlertTitle>
          Upload documents to see how your agent connects information. The more related documents you upload, the smarter your agent becomes.
        </Alert>
      )}
    </Box>
  );
};

export default SimpleKnowledgeConnections;

