/**
 * Progressive Clarification Workflow Engine
 * 
 * Advanced workflow engine for managing multi-stage clarification processes
 * with adaptive questioning, intelligent branching, and continuous optimization.
 */

import {
  HITLSession,
  ClarificationStage,
  ClarificationQuestion,
  HITLResponse,
  HITLInteraction,
  UncertaintyAnalysis,
  VerificationContext,
  ClarificationStrategy,
  SessionLearningData
} from '../types';
import { contextAwareEngagementManager } from '../engagement/contextAwareEngagement';

/**
 * Workflow state management
 */
export interface WorkflowState {
  sessionId: string;
  currentStage: number;
  stageProgress: StageProgress[];
  adaptationHistory: AdaptationEvent[];
  learningInsights: WorkflowLearningInsight[];
  performanceMetrics: WorkflowPerformanceMetrics;
}

export interface StageProgress {
  stageId: string;
  questionsAsked: number;
  questionsAnswered: number;
  uncertaintyReduction: number;
  timeSpent: number;
  userEngagement: number;
  effectiveness: number;
}

export interface AdaptationEvent {
  timestamp: Date;
  trigger: string;
  action: string;
  parameters: Record<string, any>;
  outcome: string;
  effectiveness: number;
}

export interface WorkflowLearningInsight {
  type: 'pattern_recognition' | 'user_preference' | 'strategy_optimization' | 'question_effectiveness';
  insight: string;
  confidence: number;
  applicability: 'session_specific' | 'user_specific' | 'domain_specific' | 'general';
  actionable: boolean;
}

export interface WorkflowPerformanceMetrics {
  totalDuration: number;
  uncertaintyReductionRate: number;
  questionEfficiency: number;
  userSatisfaction: number;
  adaptationSuccess: number;
  goalAchievement: number;
}

/**
 * Progressive Clarification Workflow Engine
 */
export class ProgressiveClarificationWorkflow {
  private workflowStates: Map<string, WorkflowState> = new Map();
  private adaptationRules: AdaptationRule[] = [];
  private learningDatabase: WorkflowLearningDatabase = new WorkflowLearningDatabase();

  constructor() {
    this.initializeAdaptationRules();
  }

  /**
   * Initialize workflow for a session
   */
  async initializeWorkflow(session: HITLSession): Promise<WorkflowState> {
    const workflowState: WorkflowState = {
      sessionId: session.id,
      currentStage: 0,
      stageProgress: session.stages.map(stage => ({
        stageId: stage.id,
        questionsAsked: 0,
        questionsAnswered: 0,
        uncertaintyReduction: 0,
        timeSpent: 0,
        userEngagement: 0,
        effectiveness: 0
      })),
      adaptationHistory: [],
      learningInsights: [],
      performanceMetrics: {
        totalDuration: 0,
        uncertaintyReductionRate: 0,
        questionEfficiency: 0,
        userSatisfaction: 0,
        adaptationSuccess: 0,
        goalAchievement: 0
      }
    };

    this.workflowStates.set(session.id, workflowState);
    
    // Apply learned optimizations
    await this.applyLearningOptimizations(session, workflowState);
    
    return workflowState;
  }

  /**
   * Process interaction and advance workflow
   */
  async processInteraction(
    session: HITLSession,
    interaction: HITLInteraction
  ): Promise<WorkflowAdvancement> {
    const workflowState = this.workflowStates.get(session.id);
    if (!workflowState) {
      throw new Error(`Workflow state not found for session ${session.id}`);
    }

    // Update stage progress
    this.updateStageProgress(workflowState, interaction);

    // Analyze interaction for learning
    const learningInsights = await this.analyzeInteractionForLearning(interaction, session);
    workflowState.learningInsights.push(...learningInsights);

    // Check for adaptation triggers
    const adaptationNeeded = await this.checkAdaptationTriggers(workflowState, interaction, session);
    
    if (adaptationNeeded) {
      await this.executeAdaptation(workflowState, adaptationNeeded, session);
    }

    // Determine next step
    const advancement = await this.determineNextStep(workflowState, session);

    // Update performance metrics
    this.updatePerformanceMetrics(workflowState, interaction);

    return advancement;
  }

  /**
   * Generate adaptive questions based on workflow state
   */
  async generateAdaptiveQuestions(
    session: HITLSession,
    stage: ClarificationStage,
    workflowState: WorkflowState
  ): Promise<ClarificationQuestion[]> {
    const baseQuestions = stage.questions;
    
    // Apply context-aware adaptations
    const contextAdaptedQuestions = contextAwareEngagementManager.adaptQuestions(
      baseQuestions,
      session.config.context
    );

    // Apply workflow-specific adaptations
    const workflowAdaptedQuestions = await this.applyWorkflowAdaptations(
      contextAdaptedQuestions,
      workflowState,
      session
    );

    // Apply learning-based optimizations
    const optimizedQuestions = await this.applyLearningOptimizations(
      workflowAdaptedQuestions,
      workflowState,
      session
    );

    // Prioritize questions based on current state
    const prioritizedQuestions = this.prioritizeQuestions(
      optimizedQuestions,
      workflowState,
      session
    );

    return prioritizedQuestions;
  }

  /**
   * Complete workflow and generate insights
   */
  async completeWorkflow(session: HITLSession): Promise<WorkflowCompletion> {
    const workflowState = this.workflowStates.get(session.id);
    if (!workflowState) {
      throw new Error(`Workflow state not found for session ${session.id}`);
    }

    // Finalize performance metrics
    this.finalizePerformanceMetrics(workflowState, session);

    // Generate workflow insights
    const insights = await this.generateWorkflowInsights(workflowState, session);

    // Store learning data
    await this.storeLearningData(workflowState, session);

    // Generate recommendations for future sessions
    const recommendations = await this.generateFutureRecommendations(workflowState, session);

    const completion: WorkflowCompletion = {
      sessionId: session.id,
      finalMetrics: workflowState.performanceMetrics,
      insights,
      recommendations,
      learningData: workflowState.learningInsights,
      adaptationHistory: workflowState.adaptationHistory
    };

    // Cleanup workflow state
    this.workflowStates.delete(session.id);

    return completion;
  }

  /**
   * Private helper methods
   */
  private initializeAdaptationRules(): void {
    this.adaptationRules = [
      {
        name: 'low_engagement_adaptation',
        trigger: (state, interaction, session) => {
          const currentProgress = state.stageProgress[state.currentStage];
          return currentProgress.userEngagement < 0.3;
        },
        action: async (state, session) => {
          // Switch to more engaging question types
          return {
            type: 'question_type_adaptation',
            parameters: { 
              preferredTypes: ['multiple_choice', 'yes_no'],
              supportiveness: 'high'
            }
          };
        }
      },
      {
        name: 'slow_progress_adaptation',
        trigger: (state, interaction, session) => {
          const currentProgress = state.stageProgress[state.currentStage];
          return currentProgress.timeSpent > 600 && currentProgress.uncertaintyReduction < 0.2; // 10 minutes with low reduction
        },
        action: async (state, session) => {
          // Switch to direct strategy
          return {
            type: 'strategy_switch',
            parameters: { 
              newStrategy: 'direct',
              skipToHighPriority: true
            }
          };
        }
      },
      {
        name: 'high_confidence_acceleration',
        trigger: (state, interaction, session) => {
          return interaction.response.confidence && interaction.response.confidence > 0.8 &&
                 interaction.uncertaintyReduction > 0.4;
        },
        action: async (state, session) => {
          // Skip to next stage or reduce questions
          return {
            type: 'acceleration',
            parameters: { 
              skipOptionalQuestions: true,
              advanceStage: true
            }
          };
        }
      },
      {
        name: 'confusion_detection_adaptation',
        trigger: (state, interaction, session) => {
          return interaction.response.type === 'skip' ||
                 (interaction.response.confidence && interaction.response.confidence < 0.3) ||
                 interaction.response.responseTime > 300; // 5 minutes
        },
        action: async (state, session) => {
          // Simplify and provide more context
          return {
            type: 'simplification',
            parameters: { 
              addExplanations: true,
              simplifyLanguage: true,
              provideExamples: true
            }
          };
        }
      }
    ];
  }

  private updateStageProgress(state: WorkflowState, interaction: HITLInteraction): void {
    const currentProgress = state.stageProgress[state.currentStage];
    
    currentProgress.questionsAnswered++;
    currentProgress.uncertaintyReduction += Math.abs(interaction.uncertaintyReduction);
    currentProgress.timeSpent += interaction.response.responseTime;
    
    // Calculate user engagement based on response quality
    const engagement = this.calculateUserEngagement(interaction);
    currentProgress.userEngagement = (currentProgress.userEngagement + engagement) / 2;
    
    // Calculate stage effectiveness
    currentProgress.effectiveness = this.calculateStageEffectiveness(currentProgress);
  }

  private calculateUserEngagement(interaction: HITLInteraction): number {
    let engagement = 0.5; // Base engagement
    
    // Response type engagement
    if (interaction.response.type === 'text' && typeof interaction.response.value === 'string') {
      const responseLength = interaction.response.value.length;
      engagement += Math.min(0.3, responseLength / 200); // Longer responses = higher engagement
    }
    
    // Confidence engagement
    if (interaction.response.confidence) {
      engagement += interaction.response.confidence * 0.2;
    }
    
    // Additional context engagement
    if (interaction.response.additionalContext) {
      engagement += 0.2;
    }
    
    // Response time engagement (not too fast, not too slow)
    const responseTime = interaction.response.responseTime;
    if (responseTime > 10 && responseTime < 120) { // 10 seconds to 2 minutes is optimal
      engagement += 0.1;
    }
    
    return Math.min(1, engagement);
  }

  private calculateStageEffectiveness(progress: StageProgress): number {
    if (progress.questionsAnswered === 0) return 0;
    
    const uncertaintyEfficiency = progress.uncertaintyReduction / progress.questionsAnswered;
    const timeEfficiency = progress.questionsAnswered / (progress.timeSpent / 60); // questions per minute
    const engagementFactor = progress.userEngagement;
    
    return (uncertaintyEfficiency * 0.5 + timeEfficiency * 0.3 + engagementFactor * 0.2);
  }

  private async checkAdaptationTriggers(
    state: WorkflowState,
    interaction: HITLInteraction,
    session: HITLSession
  ): Promise<AdaptationAction | null> {
    for (const rule of this.adaptationRules) {
      if (rule.trigger(state, interaction, session)) {
        const action = await rule.action(state, session);
        
        // Record adaptation event
        const adaptationEvent: AdaptationEvent = {
          timestamp: new Date(),
          trigger: rule.name,
          action: action.type,
          parameters: action.parameters,
          outcome: 'pending',
          effectiveness: 0
        };
        
        state.adaptationHistory.push(adaptationEvent);
        return action;
      }
    }
    
    return null;
  }

  private async executeAdaptation(
    state: WorkflowState,
    adaptation: AdaptationAction,
    session: HITLSession
  ): Promise<void> {
    switch (adaptation.type) {
      case 'question_type_adaptation':
        await this.adaptQuestionTypes(session, adaptation.parameters);
        break;
      case 'strategy_switch':
        await this.switchStrategy(session, adaptation.parameters);
        break;
      case 'acceleration':
        await this.accelerateWorkflow(state, session, adaptation.parameters);
        break;
      case 'simplification':
        await this.simplifyQuestions(session, adaptation.parameters);
        break;
    }
  }

  private async analyzeInteractionForLearning(
    interaction: HITLInteraction,
    session: HITLSession
  ): Promise<WorkflowLearningInsight[]> {
    const insights: WorkflowLearningInsight[] = [];
    
    // Analyze question effectiveness
    if (interaction.uncertaintyReduction > 0.3) {
      insights.push({
        type: 'question_effectiveness',
        insight: `Question type "${interaction.question.type}" highly effective for uncertainty reduction`,
        confidence: 0.8,
        applicability: 'domain_specific',
        actionable: true
      });
    }
    
    // Analyze user preferences
    if (interaction.response.confidence && interaction.response.confidence > 0.7) {
      insights.push({
        type: 'user_preference',
        insight: `User responds well to ${interaction.question.type} questions`,
        confidence: 0.7,
        applicability: 'user_specific',
        actionable: true
      });
    }
    
    // Analyze response patterns
    if (interaction.response.responseTime < 30 && interaction.uncertaintyReduction > 0.2) {
      insights.push({
        type: 'pattern_recognition',
        insight: 'Quick, confident responses correlate with effective uncertainty reduction',
        confidence: 0.6,
        applicability: 'general',
        actionable: true
      });
    }
    
    return insights;
  }

  private async determineNextStep(
    state: WorkflowState,
    session: HITLSession
  ): Promise<WorkflowAdvancement> {
    const currentStage = session.stages[state.currentStage];
    const currentProgress = state.stageProgress[state.currentStage];
    
    // Check stage completion criteria
    const stageComplete = this.isStageComplete(currentStage, currentProgress, session);
    
    if (stageComplete && state.currentStage < session.stages.length - 1) {
      // Advance to next stage
      state.currentStage++;
      return {
        action: 'advance_stage',
        nextStage: session.stages[state.currentStage],
        reasoning: 'Stage completion criteria met'
      };
    } else if (stageComplete) {
      // Workflow complete
      return {
        action: 'complete_workflow',
        reasoning: 'All stages completed'
      };
    } else {
      // Continue current stage
      const nextQuestion = this.selectNextQuestion(currentStage, currentProgress, session);
      return {
        action: 'continue_stage',
        nextQuestion,
        reasoning: 'Stage in progress'
      };
    }
  }

  private isStageComplete(
    stage: ClarificationStage,
    progress: StageProgress,
    session: HITLSession
  ): boolean {
    switch (stage.completionCriteria.type) {
      case 'all_questions_answered':
        return progress.questionsAnswered >= stage.questions.length;
      case 'uncertainty_threshold_met':
        const threshold = stage.completionCriteria.parameters.threshold;
        return session.config.uncertaintyAnalysis.overallUncertainty <= threshold;
      case 'time_limit_reached':
        const timeLimit = stage.completionCriteria.parameters.timeLimit;
        return progress.timeSpent >= timeLimit;
      default:
        return progress.questionsAnswered >= Math.ceil(stage.questions.length * 0.7);
    }
  }

  private selectNextQuestion(
    stage: ClarificationStage,
    progress: StageProgress,
    session: HITLSession
  ): ClarificationQuestion | null {
    // Find unanswered questions
    const answeredQuestionIds = session.interactions.map(i => i.question.id);
    const unansweredQuestions = stage.questions.filter(q => 
      !answeredQuestionIds.includes(q.id)
    );
    
    if (unansweredQuestions.length === 0) return null;
    
    // Sort by priority and uncertainty reduction potential
    return unansweredQuestions.sort((a, b) => {
      const scoreA = a.priority + (a.uncertaintyReduction * 10);
      const scoreB = b.priority + (b.uncertaintyReduction * 10);
      return scoreB - scoreA;
    })[0];
  }

  private updatePerformanceMetrics(state: WorkflowState, interaction: HITLInteraction): void {
    const metrics = state.performanceMetrics;
    
    metrics.totalDuration += interaction.response.responseTime;
    metrics.uncertaintyReductionRate = this.calculateUncertaintyReductionRate(state);
    metrics.questionEfficiency = this.calculateQuestionEfficiency(state);
    metrics.userSatisfaction = this.calculateUserSatisfaction(state);
    metrics.adaptationSuccess = this.calculateAdaptationSuccess(state);
    metrics.goalAchievement = this.calculateGoalAchievement(state);
  }

  private calculateUncertaintyReductionRate(state: WorkflowState): number {
    const totalReduction = state.stageProgress.reduce((sum, progress) => 
      sum + progress.uncertaintyReduction, 0);
    const totalTime = state.performanceMetrics.totalDuration / 1000; // Convert to seconds
    return totalTime > 0 ? totalReduction / totalTime : 0;
  }

  private calculateQuestionEfficiency(state: WorkflowState): number {
    const totalQuestions = state.stageProgress.reduce((sum, progress) => 
      sum + progress.questionsAnswered, 0);
    const totalReduction = state.stageProgress.reduce((sum, progress) => 
      sum + progress.uncertaintyReduction, 0);
    return totalQuestions > 0 ? totalReduction / totalQuestions : 0;
  }

  private calculateUserSatisfaction(state: WorkflowState): number {
    const avgEngagement = state.stageProgress.reduce((sum, progress) => 
      sum + progress.userEngagement, 0) / state.stageProgress.length;
    return avgEngagement;
  }

  private calculateAdaptationSuccess(state: WorkflowState): number {
    const successfulAdaptations = state.adaptationHistory.filter(event => 
      event.effectiveness > 0.5).length;
    return state.adaptationHistory.length > 0 ? 
      successfulAdaptations / state.adaptationHistory.length : 1;
  }

  private calculateGoalAchievement(state: WorkflowState): number {
    const totalEffectiveness = state.stageProgress.reduce((sum, progress) => 
      sum + progress.effectiveness, 0);
    return totalEffectiveness / state.stageProgress.length;
  }

  // Additional helper methods would be implemented here...
  private async applyLearningOptimizations(session: HITLSession, state: WorkflowState): Promise<void> {
    // Implementation for applying learned optimizations
  }

  private async applyWorkflowAdaptations(
    questions: ClarificationQuestion[],
    state: WorkflowState,
    session: HITLSession
  ): Promise<ClarificationQuestion[]> {
    // Implementation for workflow-specific adaptations
    return questions;
  }

  private async applyLearningOptimizations(
    questions: ClarificationQuestion[],
    state: WorkflowState,
    session: HITLSession
  ): Promise<ClarificationQuestion[]> {
    // Implementation for learning-based optimizations
    return questions;
  }

  private prioritizeQuestions(
    questions: ClarificationQuestion[],
    state: WorkflowState,
    session: HITLSession
  ): ClarificationQuestion[] {
    // Implementation for question prioritization
    return questions.sort((a, b) => b.priority - a.priority);
  }

  private finalizePerformanceMetrics(state: WorkflowState, session: HITLSession): void {
    // Implementation for finalizing metrics
  }

  private async generateWorkflowInsights(
    state: WorkflowState,
    session: HITLSession
  ): Promise<WorkflowInsight[]> {
    // Implementation for generating insights
    return [];
  }

  private async storeLearningData(state: WorkflowState, session: HITLSession): Promise<void> {
    // Implementation for storing learning data
  }

  private async generateFutureRecommendations(
    state: WorkflowState,
    session: HITLSession
  ): Promise<FutureRecommendation[]> {
    // Implementation for generating recommendations
    return [];
  }

  private async adaptQuestionTypes(session: HITLSession, parameters: any): Promise<void> {
    // Implementation for adapting question types
  }

  private async switchStrategy(session: HITLSession, parameters: any): Promise<void> {
    // Implementation for switching strategy
  }

  private async accelerateWorkflow(
    state: WorkflowState,
    session: HITLSession,
    parameters: any
  ): Promise<void> {
    // Implementation for accelerating workflow
  }

  private async simplifyQuestions(session: HITLSession, parameters: any): Promise<void> {
    // Implementation for simplifying questions
  }
}

/**
 * Supporting interfaces and classes
 */
interface AdaptationRule {
  name: string;
  trigger: (state: WorkflowState, interaction: HITLInteraction, session: HITLSession) => boolean;
  action: (state: WorkflowState, session: HITLSession) => Promise<AdaptationAction>;
}

interface AdaptationAction {
  type: 'question_type_adaptation' | 'strategy_switch' | 'acceleration' | 'simplification';
  parameters: Record<string, any>;
}

interface WorkflowAdvancement {
  action: 'advance_stage' | 'complete_workflow' | 'continue_stage';
  nextStage?: ClarificationStage;
  nextQuestion?: ClarificationQuestion;
  reasoning: string;
}

interface WorkflowCompletion {
  sessionId: string;
  finalMetrics: WorkflowPerformanceMetrics;
  insights: WorkflowInsight[];
  recommendations: FutureRecommendation[];
  learningData: WorkflowLearningInsight[];
  adaptationHistory: AdaptationEvent[];
}

interface WorkflowInsight {
  type: string;
  description: string;
  impact: number;
  actionable: boolean;
}

interface FutureRecommendation {
  category: string;
  recommendation: string;
  expectedImprovement: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

class WorkflowLearningDatabase {
  // Implementation for learning database
  async storeInsight(insight: WorkflowLearningInsight): Promise<void> {
    // Store insight in database
  }

  async retrieveInsights(criteria: any): Promise<WorkflowLearningInsight[]> {
    // Retrieve relevant insights
    return [];
  }
}

// Create singleton instance
export const progressiveClarificationWorkflow = new ProgressiveClarificationWorkflow();
export default progressiveClarificationWorkflow;

