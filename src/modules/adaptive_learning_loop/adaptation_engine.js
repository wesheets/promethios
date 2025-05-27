/**
 * Adaptation Engine Component
 * 
 * Generates and applies adaptations based on recognized patterns while ensuring
 * constitutional compliance and maintaining system integrity.
 * 
 * @module adaptive_learning_loop/adaptation_engine
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Adaptation Engine class
 */
class AdaptationEngine {
  /**
   * Create a new AdaptationEngine instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   * @param {Object} options.learningMemory - Learning Memory instance
   * @param {Object} options.constitutionalObservers - Constitutional observers
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = options.config || {
      minConfidenceThreshold: 0.7, // Minimum confidence to generate adaptation
      maxAdaptationsPerCycle: 5, // Maximum adaptations to generate per cycle
      constitutionalVerification: true, // Whether to verify adaptations with constitutional observers
      adaptationTypes: ['parameter', 'strategy', 'tool', 'prompt'] // Supported adaptation types
    };
    
    this.learningMemory = options.learningMemory;
    this.constitutionalObservers = options.constitutionalObservers || {};
    
    // Initialize adaptation generators
    this.generators = {
      parameter: this.generateParameterAdaptation.bind(this),
      strategy: this.generateStrategyAdaptation.bind(this),
      tool: this.generateToolAdaptation.bind(this),
      prompt: this.generatePromptAdaptation.bind(this)
    };
    
    // Initialize adaptation applicators
    this.applicators = {
      parameter: this.applyParameterAdaptation.bind(this),
      strategy: this.applyStrategyAdaptation.bind(this),
      tool: this.applyToolAdaptation.bind(this),
      prompt: this.applyPromptAdaptation.bind(this)
    };
    
    this.logger.info('Adaptation Engine initialized');
  }
  
  /**
   * Generate adaptations based on patterns
   * 
   * @param {Array} patterns - Array of patterns to generate adaptations from
   * @param {Object} context - Current system context
   * @returns {Array} Generated adaptations
   */
  generateAdaptations(patterns, context = {}) {
    this.logger.info(`Generating adaptations from ${patterns.length} patterns`);
    
    if (!patterns || patterns.length === 0) {
      return [];
    }
    
    // Filter patterns by significance
    const significantPatterns = patterns.filter(pattern => 
      pattern.statistics && pattern.statistics.significance >= this.config.minConfidenceThreshold
    );
    
    this.logger.debug(`Found ${significantPatterns.length} significant patterns for adaptation`);
    
    // Sort by significance (highest first)
    significantPatterns.sort((a, b) => 
      b.statistics.significance - a.statistics.significance
    );
    
    // Limit number of patterns to consider
    const patternsToProcess = significantPatterns.slice(0, this.config.maxAdaptationsPerCycle);
    
    // Generate adaptations
    const adaptations = [];
    for (const pattern of patternsToProcess) {
      try {
        // Determine adaptation type
        const adaptationType = this.determineAdaptationType(pattern, context);
        
        if (adaptationType && this.generators[adaptationType]) {
          // Generate adaptation
          const adaptation = this.generators[adaptationType](pattern, context);
          
          if (adaptation) {
            // Verify adaptation with constitutional observers if enabled
            if (this.config.constitutionalVerification) {
              const verificationResult = this.verifyAdaptation(adaptation, pattern);
              
              if (!verificationResult.verified) {
                this.logger.warn(`Adaptation failed constitutional verification: ${verificationResult.reason}`);
                continue;
              }
              
              // Add verification result to adaptation
              adaptation.verification = verificationResult;
            }
            
            adaptations.push(adaptation);
          }
        }
      } catch (error) {
        this.logger.error(`Error generating adaptation for pattern ${pattern.id}: ${error.message}`);
      }
    }
    
    this.logger.info(`Generated ${adaptations.length} adaptations`);
    
    return adaptations;
  }
  
  /**
   * Apply adaptation
   * 
   * @param {Object} adaptation - Adaptation to apply
   * @param {Object} context - Current system context
   * @returns {Object} Application result
   */
  applyAdaptation(adaptation, context = {}) {
    if (!adaptation || !adaptation.id) {
      throw new Error('Invalid adaptation');
    }
    
    this.logger.info(`Applying adaptation ${adaptation.id}`);
    
    // Check if adaptation is already applied
    if (adaptation.status === 'applied') {
      return {
        success: false,
        adaptation_id: adaptation.id,
        reason: 'Adaptation already applied',
        timestamp: new Date().toISOString()
      };
    }
    
    // Check if adaptation is rejected
    if (adaptation.status === 'rejected') {
      return {
        success: false,
        adaptation_id: adaptation.id,
        reason: 'Adaptation was rejected',
        timestamp: new Date().toISOString()
      };
    }
    
    // Apply adaptation based on type
    if (this.applicators[adaptation.type]) {
      try {
        const result = this.applicators[adaptation.type](adaptation, context);
        
        // Update adaptation status
        adaptation.status = result.success ? 'applied' : 'failed';
        adaptation.applied_at = result.timestamp;
        adaptation.application_result = result;
        
        // Store updated adaptation
        if (this.learningMemory) {
          this.learningMemory.updateAdaptation(adaptation);
        }
        
        return result;
      } catch (error) {
        const result = {
          success: false,
          adaptation_id: adaptation.id,
          reason: `Error applying adaptation: ${error.message}`,
          timestamp: new Date().toISOString()
        };
        
        // Update adaptation status
        adaptation.status = 'failed';
        adaptation.application_result = result;
        
        // Store updated adaptation
        if (this.learningMemory) {
          this.learningMemory.updateAdaptation(adaptation);
        }
        
        return result;
      }
    } else {
      return {
        success: false,
        adaptation_id: adaptation.id,
        reason: `Unsupported adaptation type: ${adaptation.type}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Determine adaptation type for a pattern
   * 
   * @param {Object} pattern - Pattern to analyze
   * @param {Object} context - Current system context
   * @returns {string} Adaptation type
   * @private
   */
  determineAdaptationType(pattern, context) {
    // Check if pattern explicitly suggests an adaptation type
    if (pattern.metadata && pattern.metadata.suggested_adaptation_type) {
      const suggestedType = pattern.metadata.suggested_adaptation_type;
      if (this.config.adaptationTypes.includes(suggestedType)) {
        return suggestedType;
      }
    }
    
    // Analyze pattern elements to determine type
    const elementFactors = pattern.elements.map(e => e.factor);
    
    // Check for parameter-related factors
    if (elementFactors.some(f => f.includes('param_') || f.includes('parameter') || f.includes('threshold'))) {
      return 'parameter';
    }
    
    // Check for tool-related factors
    if (elementFactors.some(f => f.includes('tool_') || f === 'tool_id' || f === 'tool_category')) {
      return 'tool';
    }
    
    // Check for prompt-related factors
    if (elementFactors.some(f => f.includes('prompt') || f.includes('instruction') || f.includes('template'))) {
      return 'prompt';
    }
    
    // Default to strategy adaptation
    return 'strategy';
  }
  
  /**
   * Generate parameter adaptation
   * 
   * @param {Object} pattern - Pattern to generate adaptation from
   * @param {Object} context - Current system context
   * @returns {Object} Parameter adaptation
   * @private
   */
  generateParameterAdaptation(pattern, context) {
    // Extract parameter-related elements
    const paramElements = pattern.elements.filter(e => 
      e.factor.includes('param_') || e.factor.includes('parameter') || e.factor.includes('threshold')
    );
    
    if (paramElements.length === 0) {
      return null;
    }
    
    // Determine parameter to adapt
    const paramElement = paramElements[0];
    const paramName = paramElement.factor.replace('param_', '');
    
    // Determine current value
    const currentValue = this.getCurrentParameterValue(paramName, context);
    
    // Determine target value based on pattern
    const targetValue = this.determineTargetParameterValue(paramElement, pattern.outcome, currentValue);
    
    // Create adaptation
    const adaptation = {
      id: uuidv4(),
      type: 'parameter',
      created_at: new Date().toISOString(),
      status: 'pending',
      source_pattern: pattern.id,
      target: {
        parameter: paramName,
        current_value: currentValue,
        target_value: targetValue
      },
      justification: {
        confidence: pattern.statistics.significance,
        reasoning: `Pattern ${pattern.id} indicates that ${paramName} value of ${targetValue} leads to ${pattern.outcome.desirability > 0.5 ? 'positive' : 'negative'} outcomes with confidence ${pattern.statistics.confidence.toFixed(2)}.`,
        expected_impact: pattern.outcome.desirability > 0.5 ? 'positive' : 'negative'
      },
      metadata: {
        pattern_type: pattern.type,
        pattern_significance: pattern.statistics.significance,
        pattern_support: pattern.statistics.support
      }
    };
    
    return adaptation;
  }
  
  /**
   * Generate strategy adaptation
   * 
   * @param {Object} pattern - Pattern to generate adaptation from
   * @param {Object} context - Current system context
   * @returns {Object} Strategy adaptation
   * @private
   */
  generateStrategyAdaptation(pattern, context) {
    // Determine strategy to adapt based on pattern
    const strategyName = this.determineStrategyName(pattern);
    
    if (!strategyName) {
      return null;
    }
    
    // Determine current strategy
    const currentStrategy = this.getCurrentStrategy(strategyName, context);
    
    // Determine target strategy
    const targetStrategy = this.determineTargetStrategy(pattern, strategyName, currentStrategy);
    
    // Create adaptation
    const adaptation = {
      id: uuidv4(),
      type: 'strategy',
      created_at: new Date().toISOString(),
      status: 'pending',
      source_pattern: pattern.id,
      target: {
        strategy: strategyName,
        current_strategy: currentStrategy,
        target_strategy: targetStrategy
      },
      justification: {
        confidence: pattern.statistics.significance,
        reasoning: `Pattern ${pattern.id} indicates that strategy "${targetStrategy}" for ${strategyName} leads to ${pattern.outcome.desirability > 0.5 ? 'positive' : 'negative'} outcomes with confidence ${pattern.statistics.confidence.toFixed(2)}.`,
        expected_impact: pattern.outcome.desirability > 0.5 ? 'positive' : 'negative'
      },
      metadata: {
        pattern_type: pattern.type,
        pattern_significance: pattern.statistics.significance,
        pattern_support: pattern.statistics.support
      }
    };
    
    return adaptation;
  }
  
  /**
   * Generate tool adaptation
   * 
   * @param {Object} pattern - Pattern to generate adaptation from
   * @param {Object} context - Current system context
   * @returns {Object} Tool adaptation
   * @private
   */
  generateToolAdaptation(pattern, context) {
    // Extract tool-related elements
    const toolElements = pattern.elements.filter(e => 
      e.factor.includes('tool_') || e.factor === 'tool_id' || e.factor === 'tool_category'
    );
    
    if (toolElements.length === 0) {
      return null;
    }
    
    // Determine tool to adapt
    const toolElement = toolElements[0];
    const toolId = toolElement.value;
    
    // Determine adaptation action (prefer, avoid, modify)
    const action = pattern.outcome.desirability > 0.7 ? 'prefer' : 
                  pattern.outcome.desirability < 0.3 ? 'avoid' : 'modify';
    
    // Create adaptation
    const adaptation = {
      id: uuidv4(),
      type: 'tool',
      created_at: new Date().toISOString(),
      status: 'pending',
      source_pattern: pattern.id,
      target: {
        tool_id: toolId,
        action: action,
        preference_strength: Math.abs(pattern.outcome.desirability - 0.5) * 2
      },
      justification: {
        confidence: pattern.statistics.significance,
        reasoning: `Pattern ${pattern.id} indicates that tool "${toolId}" leads to ${pattern.outcome.desirability > 0.5 ? 'positive' : 'negative'} outcomes with confidence ${pattern.statistics.confidence.toFixed(2)}.`,
        expected_impact: pattern.outcome.desirability > 0.5 ? 'positive' : 'negative'
      },
      metadata: {
        pattern_type: pattern.type,
        pattern_significance: pattern.statistics.significance,
        pattern_support: pattern.statistics.support
      }
    };
    
    return adaptation;
  }
  
  /**
   * Generate prompt adaptation
   * 
   * @param {Object} pattern - Pattern to generate adaptation from
   * @param {Object} context - Current system context
   * @returns {Object} Prompt adaptation
   * @private
   */
  generatePromptAdaptation(pattern, context) {
    // Extract prompt-related elements
    const promptElements = pattern.elements.filter(e => 
      e.factor.includes('prompt') || e.factor.includes('instruction') || e.factor.includes('template')
    );
    
    if (promptElements.length === 0) {
      return null;
    }
    
    // Determine prompt to adapt
    const promptElement = promptElements[0];
    const promptType = promptElement.factor.includes('instruction') ? 'instruction' : 
                      promptElement.factor.includes('template') ? 'template' : 'prompt';
    
    // Determine adaptation action
    const action = pattern.outcome.desirability > 0.7 ? 'enhance' : 
                  pattern.outcome.desirability < 0.3 ? 'revise' : 'refine';
    
    // Create adaptation
    const adaptation = {
      id: uuidv4(),
      type: 'prompt',
      created_at: new Date().toISOString(),
      status: 'pending',
      source_pattern: pattern.id,
      target: {
        prompt_type: promptType,
        action: action,
        modification: this.generatePromptModification(pattern, promptType)
      },
      justification: {
        confidence: pattern.statistics.significance,
        reasoning: `Pattern ${pattern.id} indicates that ${promptType} modifications can lead to ${pattern.outcome.desirability > 0.5 ? 'positive' : 'negative'} outcomes with confidence ${pattern.statistics.confidence.toFixed(2)}.`,
        expected_impact: pattern.outcome.desirability > 0.5 ? 'positive' : 'negative'
      },
      metadata: {
        pattern_type: pattern.type,
        pattern_significance: pattern.statistics.significance,
        pattern_support: pattern.statistics.support
      }
    };
    
    return adaptation;
  }
  
  /**
   * Apply parameter adaptation
   * 
   * @param {Object} adaptation - Adaptation to apply
   * @param {Object} context - Current system context
   * @returns {Object} Application result
   * @private
   */
  applyParameterAdaptation(adaptation, context) {
    const { parameter, target_value } = adaptation.target;
    
    this.logger.info(`Applying parameter adaptation: ${parameter} = ${target_value}`);
    
    // In a real implementation, this would modify system parameters
    // For now, we'll just simulate success
    
    return {
      success: true,
      adaptation_id: adaptation.id,
      parameter: parameter,
      old_value: adaptation.target.current_value,
      new_value: target_value,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Apply strategy adaptation
   * 
   * @param {Object} adaptation - Adaptation to apply
   * @param {Object} context - Current system context
   * @returns {Object} Application result
   * @private
   */
  applyStrategyAdaptation(adaptation, context) {
    const { strategy, target_strategy } = adaptation.target;
    
    this.logger.info(`Applying strategy adaptation: ${strategy} = ${target_strategy}`);
    
    // In a real implementation, this would modify system strategies
    // For now, we'll just simulate success
    
    return {
      success: true,
      adaptation_id: adaptation.id,
      strategy: strategy,
      old_strategy: adaptation.target.current_strategy,
      new_strategy: target_strategy,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Apply tool adaptation
   * 
   * @param {Object} adaptation - Adaptation to apply
   * @param {Object} context - Current system context
   * @returns {Object} Application result
   * @private
   */
  applyToolAdaptation(adaptation, context) {
    const { tool_id, action, preference_strength } = adaptation.target;
    
    this.logger.info(`Applying tool adaptation: ${action} ${tool_id} (strength: ${preference_strength})`);
    
    // In a real implementation, this would modify tool selection preferences
    // For now, we'll just simulate success
    
    return {
      success: true,
      adaptation_id: adaptation.id,
      tool_id: tool_id,
      action: action,
      preference_strength: preference_strength,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Apply prompt adaptation
   * 
   * @param {Object} adaptation - Adaptation to apply
   * @param {Object} context - Current system context
   * @returns {Object} Application result
   * @private
   */
  applyPromptAdaptation(adaptation, context) {
    const { prompt_type, action, modification } = adaptation.target;
    
    this.logger.info(`Applying prompt adaptation: ${action} ${prompt_type}`);
    
    // In a real implementation, this would modify prompt templates
    // For now, we'll just simulate success
    
    return {
      success: true,
      adaptation_id: adaptation.id,
      prompt_type: prompt_type,
      action: action,
      modification: modification,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Verify adaptation with constitutional observers
   * 
   * @param {Object} adaptation - Adaptation to verify
   * @param {Object} pattern - Source pattern
   * @returns {Object} Verification result
   * @private
   */
  verifyAdaptation(adaptation, pattern) {
    this.logger.debug(`Verifying adaptation ${adaptation.id} with constitutional observers`);
    
    const verificationResults = {
      verified: true,
      observers: {}
    };
    
    // Check with PRISM observer if available
    if (this.constitutionalObservers.prism) {
      try {
        const prismResult = this.constitutionalObservers.prism.verifyAdaptation(adaptation, pattern);
        verificationResults.observers.prism = prismResult;
        
        if (!prismResult.verified) {
          verificationResults.verified = false;
          verificationResults.reason = prismResult.reason || 'Failed PRISM verification';
        }
      } catch (error) {
        this.logger.error(`Error in PRISM verification: ${error.message}`);
        verificationResults.observers.prism = {
          verified: false,
          reason: `Error: ${error.message}`
        };
        verificationResults.verified = false;
        verificationResults.reason = 'PRISM verification error';
      }
    }
    
    // Check with VIGIL observer if available
    if (this.constitutionalObservers.vigil) {
      try {
        const vigilResult = this.constitutionalObservers.vigil.verifyAdaptation(adaptation, pattern);
        verificationResults.observers.vigil = vigilResult;
        
        if (!vigilResult.verified) {
          verificationResults.verified = false;
          verificationResults.reason = vigilResult.reason || 'Failed VIGIL verification';
        }
      } catch (error) {
        this.logger.error(`Error in VIGIL verification: ${error.message}`);
        verificationResults.observers.vigil = {
          verified: false,
          reason: `Error: ${error.message}`
        };
        verificationResults.verified = false;
        verificationResults.reason = 'VIGIL verification error';
      }
    }
    
    // If no observers were available, mark as unverified
    if (Object.keys(verificationResults.observers).length === 0) {
      verificationResults.verified = false;
      verificationResults.reason = 'No constitutional observers available for verification';
    }
    
    return verificationResults;
  }
  
  /**
   * Get current parameter value
   * 
   * @param {string} paramName - Parameter name
   * @param {Object} context - Current system context
   * @returns {*} Current parameter value
   * @private
   */
  getCurrentParameterValue(paramName, context) {
    // In a real implementation, this would retrieve the current parameter value
    // For now, we'll just return a default value
    
    if (context.parameters && context.parameters[paramName] !== undefined) {
      return context.parameters[paramName];
    }
    
    // Default values for common parameters
    const defaultValues = {
      threshold: 0.5,
      confidence: 0.7,
      temperature: 0.7,
      timeout: 30000,
      retry_count: 3
    };
    
    return defaultValues[paramName] !== undefined ? defaultValues[paramName] : null;
  }
  
  /**
   * Determine target parameter value
   * 
   * @param {Object} paramElement - Parameter element
   * @param {Object} outcome - Pattern outcome
   * @param {*} currentValue - Current parameter value
   * @returns {*} Target parameter value
   * @private
   */
  determineTargetParameterValue(paramElement, outcome, currentValue) {
    // If element value is explicit, use it
    if (paramElement.value !== undefined && paramElement.value !== null && 
        paramElement.value !== 'changing') {
      return paramElement.value;
    }
    
    // If current value is not available, return null
    if (currentValue === null || currentValue === undefined) {
      return null;
    }
    
    // Adjust based on outcome desirability
    if (typeof currentValue === 'number') {
      // For numeric parameters
      if (outcome.desirability > 0.7) {
        // Positive outcome, increase or decrease based on parameter type
        if (paramElement.factor.includes('threshold') || 
            paramElement.factor.includes('confidence')) {
          // For thresholds, increase for positive outcomes
          return Math.min(1.0, currentValue + 0.1);
        } else if (paramElement.factor.includes('temperature')) {
          // For temperature, decrease for positive outcomes (more conservative)
          return Math.max(0.1, currentValue - 0.1);
        } else {
          // For other numeric parameters, increase by 10%
          return currentValue * 1.1;
        }
      } else if (outcome.desirability < 0.3) {
        // Negative outcome, do the opposite
        if (paramElement.factor.includes('threshold') || 
            paramElement.factor.includes('confidence')) {
          // For thresholds, decrease for negative outcomes
          return Math.max(0.1, currentValue - 0.1);
        } else if (paramElement.factor.includes('temperature')) {
          // For temperature, increase for negative outcomes (more exploratory)
          return Math.min(1.0, currentValue + 0.1);
        } else {
          // For other numeric parameters, decrease by 10%
          return currentValue * 0.9;
        }
      }
    } else if (typeof currentValue === 'boolean') {
      // For boolean parameters, toggle based on outcome
      return outcome.desirability < 0.5 ? !currentValue : currentValue;
    }
    
    // If we can't determine a target value, return current value
    return currentValue;
  }
  
  /**
   * Determine strategy name from pattern
   * 
   * @param {Object} pattern - Pattern to analyze
   * @returns {string} Strategy name
   * @private
   */
  determineStrategyName(pattern) {
    // Check pattern elements for strategy indicators
    for (const element of pattern.elements) {
      if (element.factor.includes('strategy') || 
          element.factor.includes('approach') || 
          element.factor.includes('method')) {
        return element.factor.replace('strategy_', '')
                            .replace('approach_', '')
                            .replace('method_', '');
      }
    }
    
    // Check outcome for strategy indicators
    if (pattern.outcome.factor.includes('strategy') || 
        pattern.outcome.factor.includes('approach') || 
        pattern.outcome.factor.includes('method')) {
      return pattern.outcome.factor.replace('strategy_', '')
                           .replace('approach_', '')
                           .replace('method_', '');
    }
    
    // Default strategies based on pattern type
    const defaultStrategies = {
      correlation: 'feature_selection',
      causal: 'decision_making',
      temporal: 'scheduling',
      contextual: 'context_handling'
    };
    
    return defaultStrategies[pattern.type] || 'general';
  }
  
  /**
   * Get current strategy
   * 
   * @param {string} strategyName - Strategy name
   * @param {Object} context - Current system context
   * @returns {string} Current strategy
   * @private
   */
  getCurrentStrategy(strategyName, context) {
    // In a real implementation, this would retrieve the current strategy
    // For now, we'll just return a default value
    
    if (context.strategies && context.strategies[strategyName] !== undefined) {
      return context.strategies[strategyName];
    }
    
    // Default strategies
    const defaultStrategies = {
      feature_selection: 'importance_based',
      decision_making: 'confidence_weighted',
      scheduling: 'priority_based',
      context_handling: 'hierarchical',
      general: 'balanced'
    };
    
    return defaultStrategies[strategyName] || 'default';
  }
  
  /**
   * Determine target strategy
   * 
   * @param {Object} pattern - Pattern to analyze
   * @param {string} strategyName - Strategy name
   * @param {string} currentStrategy - Current strategy
   * @returns {string} Target strategy
   * @private
   */
  determineTargetStrategy(pattern, strategyName, currentStrategy) {
    // Check if pattern explicitly suggests a strategy
    for (const element of pattern.elements) {
      if (element.factor.includes(strategyName) && element.value) {
        return element.value;
      }
    }
    
    // Strategy options based on strategy name
    const strategyOptions = {
      feature_selection: ['importance_based', 'correlation_based', 'mutual_information', 'recursive_elimination'],
      decision_making: ['confidence_weighted', 'evidence_based', 'risk_averse', 'exploratory'],
      scheduling: ['priority_based', 'deadline_based', 'resource_aware', 'adaptive'],
      context_handling: ['hierarchical', 'flat', 'semantic', 'hybrid'],
      general: ['balanced', 'aggressive', 'conservative', 'adaptive']
    };
    
    const options = strategyOptions[strategyName] || ['default', 'alternative'];
    
    // If current strategy is in options, find the next one based on outcome desirability
    const currentIndex = options.indexOf(currentStrategy);
    if (currentIndex >= 0) {
      if (pattern.outcome.desirability > 0.7) {
        // For positive outcomes, move to next strategy (circular)
        return options[(currentIndex + 1) % options.length];
      } else if (pattern.outcome.desirability < 0.3) {
        // For negative outcomes, try a different strategy
        const newIndex = (currentIndex + Math.floor(options.length / 2)) % options.length;
        return options[newIndex];
      }
    }
    
    // If we can't determine a better strategy, return the first option
    return options[0];
  }
  
  /**
   * Generate prompt modification
   * 
   * @param {Object} pattern - Pattern to analyze
   * @param {string} promptType - Type of prompt
   * @returns {Object} Prompt modification
   * @private
   */
  generatePromptModification(pattern, promptType) {
    // Determine modification type based on pattern and prompt type
    let modificationType = 'addition';
    let content = '';
    
    if (pattern.outcome.desirability < 0.3) {
      modificationType = 'removal';
    }
    
    // Generate content based on pattern elements
    const relevantElements = pattern.elements.filter(e => 
      !e.factor.includes('prompt') && !e.factor.includes('instruction') && !e.factor.includes('template')
    );
    
    if (relevantElements.length > 0) {
      // Create content from relevant elements
      const contentParts = relevantElements.map(e => `${e.factor}: ${e.value}`);
      content = contentParts.join(', ');
    } else {
      // Default content based on prompt type
      const defaultContent = {
        instruction: 'Be more specific and provide detailed reasoning',
        template: 'Include additional context variables',
        prompt: 'Emphasize key requirements and constraints'
      };
      
      content = defaultContent[promptType] || 'Modify content to improve outcomes';
    }
    
    return {
      type: modificationType,
      content: content,
      position: modificationType === 'addition' ? 'append' : 'any'
    };
  }
}

module.exports = {
  AdaptationEngine
};
