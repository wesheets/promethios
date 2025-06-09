/**
 * Governance Service
 * 
 * This service implements the core governance functionality that wraps around
 * external agent API calls. It integrates with the existing Promethios constitutional
 * framework and trust scoring algorithms.
 */

// Import the real metric calculator from the UI
const { 
  analyzeResponse, 
  calculateTrustImpact, 
  constitutionArticles, 
  violationToArticle,
  violationDescriptions 
} = require('../../phase_7_1_prototype/promethios-ui/src/utils/metricCalculator');

class GovernanceService {
  constructor() {
    this.governanceLevel = 'standard';
    this.constitutionalFramework = null;
    this.observers = {
      prism: null,
      vigil: null
    };
    this.trustScore = 85; // Starting trust score
  }

  /**
   * Initialize the governance service with the specified governance level
   * 
   * @param {string} level - Governance level (basic, standard, strict, maximum)
   */
  async initialize(level = 'standard') {
    this.governanceLevel = level;
    this.constitutionalFramework = this._loadConstitutionalFramework(level);
    
    // Initialize observers based on governance level
    if (level !== 'basic') {
      this.observers.prism = this._initializePrismObserver();
      this.observers.vigil = this._initializeVigilObserver();
    }
  }

  /**
   * Preprocess a user message by injecting constitutional framework
   * 
   * @param {string} message - Original user message
   * @returns {string} Message with constitutional framework injected
   */
  async preprocessMessage(message) {
    if (!this.constitutionalFramework || this.governanceLevel === 'basic') {
      return message;
    }

    // For higher levels, inject constitutional guidance
    const constitutionalGuidance = this._generateConstitutionalGuidance();
    
    return `${constitutionalGuidance}\n\nUser Request: ${message}`;
  }

  /**
   * Analyze agent response for governance compliance using real Promethios algorithms
   * 
   * @param {string} originalMessage - Original user message
   * @param {string} agentResponse - Response from the agent
   * @param {Object} config - Agent configuration
   * @returns {Object} Governance analysis results
   */
  async analyzeResponse(originalMessage, agentResponse, config) {
    const analysis = {
      trustScore: this.trustScore,
      violations: [],
      complianceRate: 100,
      interventions: [],
      modifiedResponse: null
    };

    try {
      // Use the real Promethios violation detection
      const violation = analyzeResponse(agentResponse, originalMessage);
      
      if (violation) {
        // Convert to our violation format
        const promethiosViolation = {
          type: violation.violationType,
          severity: this._getSeverityForViolationType(violation.violationType),
          description: violationDescriptions[violation.violationType],
          article: violationToArticle[violation.violationType],
          details: violation.details
        };
        
        analysis.violations.push(promethiosViolation);
        
        // Calculate trust impact using real algorithm
        const trustImpact = calculateTrustImpact(violation);
        this.trustScore = Math.max(0, Math.min(100, this.trustScore + trustImpact));
        analysis.trustScore = this.trustScore;
      } else {
        // Small positive impact for clean responses
        const trustImpact = calculateTrustImpact(null);
        this.trustScore = Math.max(0, Math.min(100, this.trustScore + trustImpact));
        analysis.trustScore = this.trustScore;
      }

      // Calculate compliance rate based on constitutional articles
      analysis.complianceRate = this._calculateComplianceRate(analysis.violations);

      // Apply interventions if necessary
      if (analysis.violations.length > 0) {
        const interventionResult = await this._applyInterventions(
          agentResponse, 
          analysis.violations
        );
        analysis.interventions = interventionResult.interventions;
        analysis.modifiedResponse = interventionResult.modifiedResponse;
      }

      // Log to observers
      if (this.observers.prism) {
        this.observers.prism.logInteraction({
          message: originalMessage,
          response: agentResponse,
          analysis: analysis,
          timestamp: new Date().toISOString()
        });
      }

      return analysis;

    } catch (error) {
      console.error('Governance analysis error:', error);
      
      // Return safe defaults on error
      return {
        trustScore: Math.max(0, this.trustScore - 10), // Penalty for analysis failure
        violations: [{
          type: 'analysis_error',
          severity: 'medium',
          description: 'Governance analysis failed',
          article: '5.1' // Traceability article
        }],
        complianceRate: 50,
        interventions: [],
        modifiedResponse: null
      };
    }
  }

  /**
   * Get severity level for violation type
   * 
   * @param {string} violationType - Type of violation
   * @returns {string} Severity level
   */
  _getSeverityForViolationType(violationType) {
    const severityMap = {
      'hallucination': 'medium',
      'unauthorized_advice': 'high',
      'harmful_content': 'high',
      'source_missing': 'low',
      'capability_exceeded': 'medium',
      'bias_detected': 'medium'
    };
    
    return severityMap[violationType] || 'medium';
  }

  /**
   * Load constitutional framework based on governance level
   * 
   * @param {string} level - Governance level
   * @returns {Object} Constitutional framework
   */
  _loadConstitutionalFramework(level) {
    // Use the real constitutional articles from the metric calculator
    const realArticles = Object.entries(constitutionArticles).map(([id, article]) => ({
      id,
      title: article.title,
      description: article.description
    }));

    const frameworks = {
      basic: {
        articles: realArticles.slice(0, 2) // First 2 articles for basic
      },
      standard: {
        articles: realArticles.slice(0, 4) // First 4 articles for standard
      },
      strict: {
        articles: realArticles // All articles for strict
      },
      maximum: {
        articles: realArticles // All articles for maximum
      }
    };

    return frameworks[level] || frameworks.standard;
  }

  /**
   * Generate constitutional guidance for message preprocessing
   * 
   * @returns {string} Constitutional guidance text
   */
  _generateConstitutionalGuidance() {
    if (!this.constitutionalFramework) {
      return '';
    }

    const guidance = [
      'You are operating under Promethios governance. Please ensure your response adheres to these constitutional principles:',
      ...this.constitutionalFramework.articles.map((article, index) => 
        `${index + 1}. ${article.title}: ${article.description}`
      ),
      '',
      'Please provide a helpful, accurate, and compliant response to the following request:'
    ];

    return guidance.join('\n');
  }

  /**
   * Calculate compliance rate based on violations
   * 
   * @param {Array} violations - Array of violation objects
   * @returns {number} Compliance rate (0-100)
   */
  _calculateComplianceRate(violations) {
    if (violations.length === 0) {
      return 100;
    }

    // Calculate based on violated articles
    const totalArticles = this.constitutionalFramework?.articles?.length || 5;
    const violatedArticles = new Set(violations.map(v => v.article)).size;
    
    return Math.round(((totalArticles - violatedArticles) / totalArticles) * 100);
  }

  /**
   * Apply interventions based on violations
   * 
   * @param {string} response - Original agent response
   * @param {Array} violations - Array of violations
   * @returns {Object} Intervention results
   */
  async _applyInterventions(response, violations) {
    const interventions = [];
    let modifiedResponse = response;

    for (const violation of violations) {
      if (violation.severity === 'high') {
        // High severity violations require response modification
        interventions.push({
          type: 'response_modification',
          reason: violation.description,
          action: 'Content filtered for safety',
          article: violation.article
        });
        
        modifiedResponse = `⚠️ Governance Intervention: This response has been modified due to a ${violation.type} violation (Article ${violation.article}: ${constitutionArticles[violation.article]?.title}).\n\nI apologize, but I cannot provide that response as it may violate safety guidelines. Please rephrase your request, and I'll be happy to help in a safe and appropriate way.`;
        break; // Stop processing after first high-severity intervention
      } else if (violation.severity === 'medium') {
        // Medium severity violations get warnings
        interventions.push({
          type: 'warning_added',
          reason: violation.description,
          action: 'Added governance warning',
          article: violation.article
        });
        
        modifiedResponse = `⚠️ Governance Notice: This response has been flagged for potential ${violation.type.replace('_', ' ')} (Article ${violation.article}: ${constitutionArticles[violation.article]?.title}).\n\n${response}`;
      }
    }

    return { interventions, modifiedResponse };
  }

  /**
   * Initialize PRISM observer for monitoring
   * 
   * @returns {Object} PRISM observer instance
   */
  _initializePrismObserver() {
    return {
      logInteraction: (data) => {
        console.log('🔍 PRISM Observer - Governance Interaction:', {
          timestamp: data.timestamp,
          trustScore: data.analysis.trustScore,
          violations: data.analysis.violations.length,
          complianceRate: data.analysis.complianceRate
        });
        // In production, this would send to monitoring system
      }
    };
  }

  /**
   * Initialize VIGIL observer for enforcement
   * 
   * @returns {Object} VIGIL observer instance
   */
  _initializeVigilObserver() {
    return {
      enforceCompliance: (violations) => {
        console.log('⚡ VIGIL Observer - Violations detected:', violations.map(v => ({
          type: v.type,
          severity: v.severity,
          article: v.article
        })));
        // In production, this would trigger enforcement actions
      }
    };
  }

  /**
   * Get governance service status
   * 
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: !!this.constitutionalFramework,
      governanceLevel: this.governanceLevel,
      observersActive: {
        prism: !!this.observers.prism,
        vigil: !!this.observers.vigil
      },
      articlesCount: this.constitutionalFramework?.articles?.length || 0,
      currentTrustScore: this.trustScore
    };
  }
}

module.exports = GovernanceService;

