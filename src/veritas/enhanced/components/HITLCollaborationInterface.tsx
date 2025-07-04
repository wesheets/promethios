/**
 * Human-in-the-Loop Collaboration Interface
 * 
 * Interactive interface for progressive clarification workflows and
 * collaborative reflection sessions between humans and AI agents.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Slider,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Rating,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  QuestionAnswer,
  Send,
  Skip,
  CheckCircle,
  AccessTime,
  Psychology,
  Lightbulb,
  TrendingUp,
  Info,
  Warning
} from '@mui/icons-material';
import {
  HITLSession,
  HITLResponse,
  ClarificationQuestion,
  HITLInteraction
} from '../types';

interface HITLCollaborationInterfaceProps {
  session: HITLSession;
  onResponseSubmit: (sessionId: string, questionId: string, response: HITLResponse) => Promise<void>;
  onSessionComplete: (sessionId: string) => Promise<void>;
  className?: string;
}

const HITLCollaborationInterface: React.FC<HITLCollaborationInterfaceProps> = ({
  session,
  onResponseSubmit,
  onSessionComplete,
  className = ''
}) => {
  const [currentResponse, setCurrentResponse] = useState<any>('');
  const [responseConfidence, setResponseConfidence] = useState<number>(3);
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [responseStartTime, setResponseStartTime] = useState<number>(Date.now());

  const currentStage = session.stages[session.currentStage];
  const currentQuestion = currentStage?.questions.find(q => 
    !session.interactions.some(i => i.question.id === q.id)
  );

  useEffect(() => {
    setResponseStartTime(Date.now());
    setCurrentResponse('');
    setResponseConfidence(3);
    setAdditionalContext('');
  }, [currentQuestion?.id]);

  const handleResponseSubmit = async () => {
    if (!currentQuestion) return;

    setSubmitting(true);
    try {
      const response: HITLResponse = {
        type: getResponseType(),
        value: currentResponse,
        confidence: responseConfidence / 5, // Convert 1-5 scale to 0-1
        additionalContext: additionalContext || undefined,
        responseTime: (Date.now() - responseStartTime) / 1000
      };

      await onResponseSubmit(session.id, currentQuestion.id, response);
      
      // Reset form
      setCurrentResponse('');
      setResponseConfidence(3);
      setAdditionalContext('');
      
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!currentQuestion) return;

    const skipResponse: HITLResponse = {
      type: 'skip',
      value: 'skipped',
      responseTime: (Date.now() - responseStartTime) / 1000
    };

    await onResponseSubmit(session.id, currentQuestion.id, skipResponse);
  };

  const handleSessionComplete = async () => {
    await onSessionComplete(session.id);
  };

  const getResponseType = (): 'text' | 'choice' | 'numeric' | 'boolean' | 'skip' => {
    if (!currentQuestion) return 'text';
    
    switch (currentQuestion.type) {
      case 'multiple_choice': return 'choice';
      case 'yes_no': return 'boolean';
      case 'scale': return 'numeric';
      case 'ranking': return 'choice';
      default: return 'text';
    }
  };

  const getSessionProgress = (): number => {
    const totalQuestions = session.stages.reduce((sum, stage) => sum + stage.questions.length, 0);
    const answeredQuestions = session.interactions.length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const getUncertaintyReduction = (): number => {
    const initialUncertainty = session.config.uncertaintyAnalysis.overallUncertainty;
    const currentUncertainty = session.interactions.length > 0 
      ? session.interactions[session.interactions.length - 1].processingResult.updatedUncertainty.overallUncertainty
      : initialUncertainty;
    
    return ((initialUncertainty - currentUncertainty) / initialUncertainty) * 100;
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ color: 'white', mb: 2 }}>
              Select your answer:
            </FormLabel>
            <RadioGroup
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
            >
              {currentQuestion.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio sx={{ color: 'white' }} />}
                  label={option}
                  sx={{ color: 'white' }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'yes_no':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ color: 'white', mb: 2 }}>
              Your answer:
            </FormLabel>
            <RadioGroup
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value === 'true')}
              row
            >
              <FormControlLabel
                value="true"
                control={<Radio sx={{ color: 'white' }} />}
                label="Yes"
                sx={{ color: 'white' }}
              />
              <FormControlLabel
                value="false"
                control={<Radio sx={{ color: 'white' }} />}
                label="No"
                sx={{ color: 'white' }}
              />
            </RadioGroup>
          </FormControl>
        );

      case 'scale':
        return (
          <Box>
            <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
              Rate on a scale from 1 to 10:
            </Typography>
            <Slider
              value={currentResponse || 5}
              onChange={(e, value) => setCurrentResponse(value)}
              min={1}
              max={10}
              step={1}
              marks
              valueLabelDisplay="on"
              sx={{ color: '#3182ce' }}
            />
          </Box>
        );

      case 'ranking':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ color: 'white', mb: 2 }}>
              Rank your preference (1 = highest):
            </FormLabel>
            <RadioGroup
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
            >
              {currentQuestion.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio sx={{ color: 'white' }} />}
                  label={`${index + 1}. ${option}`}
                  sx={{ color: 'white' }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      default: // open_ended
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Please provide your response..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
        );
    }
  };

  if (session.status === 'completed') {
    return (
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CheckCircle color="success" />
            <Typography variant="h6">Collaboration Completed</Typography>
          </Box>
          
          <Alert severity="success" sx={{ mb: 2 }}>
            Session completed successfully! Uncertainty reduced by {getUncertaintyReduction().toFixed(1)}%
          </Alert>

          {session.resolution && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {session.resolution.summary}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Final confidence: {(session.resolution.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <AccessTime color="warning" />
            <Typography variant="h6">Waiting for Next Question</Typography>
          </Box>
          
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
            Processing your previous responses...
          </Typography>

          <Button
            variant="contained"
            onClick={handleSessionComplete}
            sx={{ backgroundColor: '#3182ce' }}
          >
            Complete Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className={`hitl-collaboration-interface ${className}`}>
      {/* Session Progress */}
      <Card sx={{ mb: 2, backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <QuestionAnswer />
              <Typography variant="h6">Collaborative Clarification</Typography>
              <Chip
                label={`${session.strategy.type} strategy`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          }
        />
        <CardContent>
          <Box mb={2}>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
              Session Progress: {getSessionProgress().toFixed(0)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getSessionProgress()}
              sx={{
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': { backgroundColor: '#3182ce' }
              }}
            />
          </Box>

          <Box display="flex" gap={4}>
            <Box>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Stage
              </Typography>
              <Typography variant="body2">
                {session.currentStage + 1} of {session.stages.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Interactions
              </Typography>
              <Typography variant="body2">
                {session.interactions.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Uncertainty Reduction
              </Typography>
              <Typography variant="body2" color="success.main">
                {getUncertaintyReduction().toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Current Stage */}
      <Card sx={{ mb: 2, backgroundColor: '#4a5568', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {currentStage.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            {currentStage.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card sx={{ mb: 2, backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Psychology />
              <Typography variant="h6">Question</Typography>
              <Chip
                label={`Priority ${currentQuestion.priority}`}
                size="small"
                color={currentQuestion.priority >= 4 ? 'error' : currentQuestion.priority >= 3 ? 'warning' : 'info'}
              />
            </Box>
          }
        />
        <CardContent>
          <Typography variant="body1" gutterBottom sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            {currentQuestion.question}
          </Typography>

          {currentQuestion.uncertaintyReduction > 0 && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                backgroundColor: '#4a5568', 
                color: 'white',
                '& .MuiAlert-icon': { color: '#3182ce' }
              }}
            >
              This question can reduce uncertainty by up to {(currentQuestion.uncertaintyReduction * 100).toFixed(0)}%
            </Alert>
          )}

          {/* Question Input */}
          <Box mb={3}>
            {renderQuestionInput()}
          </Box>

          {/* Additional Context */}
          <Box mb={3}>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
              Additional context (optional):
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any additional information that might be helpful..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' }
                }
              }}
            />
          </Box>

          {/* Confidence Rating */}
          <Box mb={3}>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
              How confident are you in your response?
            </Typography>
            <Rating
              value={responseConfidence}
              onChange={(e, value) => setResponseConfidence(value || 3)}
              max={5}
              sx={{ color: '#3182ce' }}
            />
          </Box>

          {/* Action Buttons */}
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleResponseSubmit}
              disabled={!currentResponse || submitting}
              sx={{ backgroundColor: '#3182ce', flex: 1 }}
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </Button>
            
            <Tooltip title="Skip this question">
              <IconButton
                onClick={handleSkip}
                disabled={submitting}
                sx={{ color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' }}
              >
                <Skip />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Previous Interactions */}
      {session.interactions.length > 0 && (
        <Card sx={{ backgroundColor: '#4a5568', color: 'white' }}>
          <CardHeader
            title={
              <Typography variant="h6">Previous Interactions</Typography>
            }
          />
          <CardContent>
            <List>
              {session.interactions.slice(-3).map((interaction, index) => (
                <React.Fragment key={interaction.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Q: {interaction.question.question}
                        </Typography>
                      }
                      secondary={
                        <Box mt={1}>
                          <Typography variant="body1" sx={{ color: 'white' }}>
                            A: {String(interaction.response.value)}
                          </Typography>
                          {interaction.response.additionalContext && (
                            <Typography variant="caption" sx={{ color: '#718096' }}>
                              Context: {interaction.response.additionalContext}
                            </Typography>
                          )}
                          <Box display="flex" alignItems="center" gap={2} mt={1}>
                            <Chip
                              label={`-${(interaction.uncertaintyReduction * 100).toFixed(0)}% uncertainty`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                            <Typography variant="caption" sx={{ color: '#718096' }}>
                              {interaction.response.responseTime.toFixed(1)}s response time
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < session.interactions.slice(-3).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HITLCollaborationInterface;

