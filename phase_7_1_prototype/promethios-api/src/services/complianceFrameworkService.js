/**
 * Compliance Framework Service
 * Automated regulatory compliance monitoring and reporting
 * Provides specialized frameworks for GDPR, HIPAA, SOX, and custom regulations
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const enterpriseTransparencyService = require('./enterpriseTransparencyService');
const agentLogSegregationService = require('./agentLogSegregationService');
const cryptographicAuditService = require('./cryptographicAuditService');

class ComplianceFrameworkService {
  constructor() {
    // Compliance frameworks
    this.complianceFrameworks = new Map(); // frameworkId -> framework config
    this.complianceRules = new Map(); // ruleId -> rule definition
    this.complianceViolations = new Map(); // violationId -> violation data
    this.complianceAssessments = new Map(); // assessmentId -> assessment results
    
    // Legal hold management
    this.legalHolds = new Map(); // holdId -> legal hold data
    this.preservedData = new Map(); // holdId -> preserved audit data
    
    // Automated monitoring
    this.complianceMonitors = new Map(); // monitorId -> monitor config
    this.alertSubscriptions = new Map(); // subscriptionId -> alert config
    
    // Regulatory reporting
    this.regulatoryReports = new Map(); // reportId -> report data
    this.reportSchedules = new Map(); // scheduleId -> schedule config
    
    // Configuration
    this.config = {
      maxViolationRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      maxLegalHoldDuration: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
      complianceCheckInterval: 60 * 1000, // 1 minute
      alertThrottleInterval: 5 * 60 * 1000, // 5 minutes
      enableAutomatedRemediation: true,
      enableRealTimeCompliance: true
    };
    
    // Initialize compliance frameworks
    this.initializeComplianceFrameworks();
    
    console.log('⚖️ ComplianceFrameworkService initialized');
  }

  /**
   * Initialize built-in compliance frameworks
   */
  initializeComplianceFrameworks() {
    // GDPR Framework
    this.complianceFrameworks.set('gdpr', {
      frameworkId: 'gdpr',
      name: 'General Data Protection Regulation',
      description: 'EU GDPR compliance framework for data protection',
      version: '2.0',
      jurisdiction: 'EU',
      effectiveDate: '2018-05-25',
      categories: [
        {
          categoryId: 'data_processing',
          name: 'Data Processing Activities',
          articles: ['Article 6', 'Article 9', 'Article 13', 'Article 14'],
          requirements: [
            'Lawful basis for processing',
            'Explicit consent for special categories',
            'Transparent information provision',
            'Data minimization principle'
          ]
        },
        {
          categoryId: 'data_subject_rights',
          name: 'Data Subject Rights',
          articles: ['Article 15', 'Article 16', 'Article 17', 'Article 18', 'Article 20'],
          requirements: [
            'Right of access',
            'Right to rectification',
            'Right to erasure',
            'Right to restriction',
            'Right to data portability'
          ]
        },
        {
          categoryId: 'security_measures',
          name: 'Security of Processing',
          articles: ['Article 32', 'Article 33', 'Article 34'],
          requirements: [
            'Technical and organizational measures',
            'Breach notification to authority',
            'Breach notification to data subjects',
            'Data protection by design and default'
          ]
        }
      ],
      penalties: {
        administrative_fines: 'Up to 4% of annual global turnover or €20 million',
        criminal_sanctions: 'Varies by member state implementation'
      }
    });

    // HIPAA Framework
    this.complianceFrameworks.set('hipaa', {
      frameworkId: 'hipaa',
      name: 'Health Insurance Portability and Accountability Act',
      description: 'US HIPAA compliance framework for healthcare data protection',
      version: '1.0',
      jurisdiction: 'US',
      effectiveDate: '1996-08-21',
      categories: [
        {
          categoryId: 'privacy_rule',
          name: 'HIPAA Privacy Rule',
          sections: ['164.502', '164.506', '164.508', '164.512'],
          requirements: [
            'Minimum necessary standard',
            'Individual authorization requirements',
            'Permitted uses and disclosures',
            'Individual rights over PHI'
          ]
        },
        {
          categoryId: 'security_rule',
          name: 'HIPAA Security Rule',
          sections: ['164.306', '164.308', '164.310', '164.312'],
          requirements: [
            'Administrative safeguards',
            'Physical safeguards',
            'Technical safeguards',
            'Organizational requirements'
          ]
        },
        {
          categoryId: 'breach_notification',
          name: 'Breach Notification Rule',
          sections: ['164.400', '164.404', '164.406', '164.408'],
          requirements: [
            'Breach assessment and notification',
            'Individual notification requirements',
            'Media notification requirements',
            'HHS Secretary notification'
          ]
        }
      ],
      penalties: {
        civil_penalties: 'Up to $1.5 million per incident',
        criminal_penalties: 'Up to $250,000 and 10 years imprisonment'
      }
    });

    // SOX Framework
    this.complianceFrameworks.set('sox', {
      frameworkId: 'sox',
      name: 'Sarbanes-Oxley Act',
      description: 'US SOX compliance framework for financial reporting controls',
      version: '1.0',
      jurisdiction: 'US',
      effectiveDate: '2002-07-30',
      categories: [
        {
          categoryId: 'internal_controls',
          name: 'Internal Controls Over Financial Reporting',
          sections: ['Section 302', 'Section 404', 'Section 906'],
          requirements: [
            'Management assessment of controls',
            'Auditor attestation of controls',
            'CEO/CFO certification',
            'Quarterly and annual evaluations'
          ]
        },
        {
          categoryId: 'audit_requirements',
          name: 'Auditing Standards',
          sections: ['Section 201', 'Section 203', 'Section 206'],
          requirements: [
            'Auditor independence',
            'Audit partner rotation',
            'Prohibited non-audit services',
            'Audit committee pre-approval'
          ]
        },
        {
          categoryId: 'disclosure_controls',
          name: 'Disclosure Controls and Procedures',
          sections: ['Section 302', 'Section 409'],
          requirements: [
            'Timely disclosure of material changes',
            'Real-time disclosure requirements',
            'Management evaluation of controls',
            'Quarterly certifications'
          ]
        }
      ],
      penalties: {
        civil_penalties: 'Up to $5 million for individuals, $25 million for entities',
        criminal_penalties: 'Up to $5 million and 20 years imprisonment'
      }
    });

    // Initialize compliance rules for each framework
    this.initializeComplianceRules();

    console.log('⚖️ Initialized compliance frameworks: GDPR, HIPAA, SOX');
  }

  /**
   * Initialize compliance rules for automated monitoring
   */
  initializeComplianceRules() {
    // GDPR Rules
    this.complianceRules.set('gdpr_consent_required', {
      ruleId: 'gdpr_consent_required',
      frameworkId: 'gdpr',
      category: 'data_processing',
      name: 'GDPR Consent Required',
      description: 'Personal data processing requires valid consent or lawful basis',
      severity: 'high',
      automated: true,
      conditions: {
        eventTypes: ['data_processing', 'personal_data_access'],
        requiredMetadata: ['gdpr_lawful_basis', 'consent_status'],
        violations: [
          { condition: 'missing_lawful_basis', action: 'block_and_alert' },
          { condition: 'expired_consent', action: 'block_and_alert' },
          { condition: 'withdrawn_consent', action: 'block_and_alert' }
        ]
      },
      remediation: {
        automated: ['request_consent', 'apply_data_minimization'],
        manual: ['legal_review', 'data_subject_notification']
      }
    });

    this.complianceRules.set('gdpr_data_retention', {
      ruleId: 'gdpr_data_retention',
      frameworkId: 'gdpr',
      category: 'data_processing',
      name: 'GDPR Data Retention Limits',
      description: 'Personal data must not be retained longer than necessary',
      severity: 'medium',
      automated: true,
      conditions: {
        eventTypes: ['data_storage', 'data_retention'],
        timeBasedCheck: true,
        retentionPeriods: {
          'marketing_data': '2_years',
          'transaction_data': '7_years',
          'support_data': '3_years'
        }
      },
      remediation: {
        automated: ['schedule_deletion', 'anonymize_data'],
        manual: ['legal_review', 'retention_policy_update']
      }
    });

    // HIPAA Rules
    this.complianceRules.set('hipaa_phi_access_control', {
      ruleId: 'hipaa_phi_access_control',
      frameworkId: 'hipaa',
      category: 'privacy_rule',
      name: 'HIPAA PHI Access Control',
      description: 'PHI access requires proper authorization and minimum necessary principle',
      severity: 'critical',
      automated: true,
      conditions: {
        eventTypes: ['phi_access', 'phi_processing', 'phi_disclosure'],
        requiredMetadata: ['hipaa_authorization', 'minimum_necessary', 'access_purpose'],
        violations: [
          { condition: 'missing_authorization', action: 'block_and_alert' },
          { condition: 'excessive_access', action: 'alert_and_log' },
          { condition: 'unauthorized_disclosure', action: 'block_and_alert' }
        ]
      },
      remediation: {
        automated: ['revoke_access', 'apply_minimum_necessary'],
        manual: ['incident_response', 'breach_assessment']
      }
    });

    // SOX Rules
    this.complianceRules.set('sox_segregation_of_duties', {
      ruleId: 'sox_segregation_of_duties',
      frameworkId: 'sox',
      category: 'internal_controls',
      name: 'SOX Segregation of Duties',
      description: 'Financial processes require segregation of duties',
      severity: 'high',
      automated: true,
      conditions: {
        eventTypes: ['financial_transaction', 'financial_approval', 'financial_recording'],
        crossAgentAnalysis: true,
        conflictDetection: [
          { roles: ['transaction_initiator', 'transaction_approver'], conflict: true },
          { roles: ['journal_entry_creator', 'journal_entry_approver'], conflict: true }
        ]
      },
      remediation: {
        automated: ['escalate_approval', 'require_additional_authorization'],
        manual: ['management_review', 'control_redesign']
      }
    });

    console.log('⚖️ Initialized compliance rules for automated monitoring');
  }

  /**
   * Assess compliance for a specific framework
   */
  async assessCompliance(frameworkId, assessmentConfig = {}) {
    try {
      const {
        agentIds = [],
        timeRange = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        includeRemediation = true,
        generateReport = true
      } = assessmentConfig;

      const framework = this.complianceFrameworks.get(frameworkId);
      if (!framework) {
        throw new Error(`Compliance framework not found: ${frameworkId}`);
      }

      const assessmentId = uuidv4();
      const assessment = {
        assessmentId,
        frameworkId,
        frameworkName: framework.name,
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: 'in_progress',
        config: assessmentConfig,
        results: {
          overallScore: 0,
          categoryScores: {},
          violations: [],
          recommendations: [],
          complianceGaps: []
        },
        statistics: {
          totalRulesEvaluated: 0,
          rulesCompliant: 0,
          rulesNonCompliant: 0,
          criticalViolations: 0,
          highViolations: 0,
          mediumViolations: 0,
          lowViolations: 0
        },
        cryptographicProof: null
      };

      // Get relevant compliance rules for this framework
      const frameworkRules = Array.from(this.complianceRules.values())
        .filter(rule => rule.frameworkId === frameworkId);

      assessment.statistics.totalRulesEvaluated = frameworkRules.length;

      // Evaluate each compliance rule
      for (const rule of frameworkRules) {
        try {
          const ruleResult = await this.evaluateComplianceRule(rule, agentIds, timeRange);
          
          if (ruleResult.compliant) {
            assessment.statistics.rulesCompliant++;
          } else {
            assessment.statistics.rulesNonCompliant++;
            assessment.results.violations.push(...ruleResult.violations);
            
            // Count violations by severity
            for (const violation of ruleResult.violations) {
              const severity = violation.severity || rule.severity;
              assessment.statistics[`${severity}Violations`]++;
            }
          }

          // Add to category scores
          const category = rule.category;
          if (!assessment.results.categoryScores[category]) {
            assessment.results.categoryScores[category] = {
              totalRules: 0,
              compliantRules: 0,
              score: 0
            };
          }
          
          assessment.results.categoryScores[category].totalRules++;
          if (ruleResult.compliant) {
            assessment.results.categoryScores[category].compliantRules++;
          }

        } catch (ruleError) {
          console.error(`Error evaluating rule ${rule.ruleId}:`, ruleError);
          assessment.results.complianceGaps.push({
            ruleId: rule.ruleId,
            error: ruleError.message,
            impact: 'assessment_incomplete'
          });
        }
      }

      // Calculate category scores
      for (const [category, categoryData] of Object.entries(assessment.results.categoryScores)) {
        categoryData.score = categoryData.totalRules > 0 
          ? (categoryData.compliantRules / categoryData.totalRules) * 100 
          : 0;
      }

      // Calculate overall compliance score
      const totalCategories = Object.keys(assessment.results.categoryScores).length;
      if (totalCategories > 0) {
        assessment.results.overallScore = Object.values(assessment.results.categoryScores)
          .reduce((sum, category) => sum + category.score, 0) / totalCategories;
      }

      // Generate recommendations
      if (includeRemediation) {
        assessment.results.recommendations = await this.generateComplianceRecommendations(
          frameworkId, 
          assessment.results.violations
        );
      }

      // Complete assessment
      assessment.completedAt = new Date().toISOString();
      assessment.status = 'completed';

      // Generate cryptographic proof
      assessment.cryptographicProof = {
        assessmentHash: this.generateHash(JSON.stringify(assessment.results)),
        timestamp: assessment.completedAt,
        signature: null // Would be signed with enterprise key
      };

      // Store assessment
      this.complianceAssessments.set(assessmentId, assessment);

      // Log assessment completion
      await cryptographicAuditService.logCryptographicEvent(
        'system',
        'compliance_system',
        'compliance_assessment_completed',
        {
          assessmentId,
          frameworkId,
          overallScore: assessment.results.overallScore,
          violationCount: assessment.results.violations.length
        },
        {
          assessmentTimestamp: assessment.completedAt,
          cryptographicProof: assessment.cryptographicProof
        }
      );

      console.log(`⚖️ Compliance assessment completed: ${frameworkId} (Score: ${assessment.results.overallScore.toFixed(1)}%)`);

      return assessment;

    } catch (error) {
      console.error('Error assessing compliance:', error);
      throw error;
    }
  }

  /**
   * Evaluate a specific compliance rule
   */
  async evaluateComplianceRule(rule, agentIds, timeRange) {
    try {
      const result = {
        ruleId: rule.ruleId,
        compliant: true,
        violations: [],
        evidence: [],
        evaluatedAt: new Date().toISOString()
      };

      // Build query for rule evaluation
      const queryConfig = {
        agentIds,
        eventTypes: rule.conditions.eventTypes || [],
        timeRange,
        metadataFilters: {},
        verificationRequired: true,
        includeProofs: true
      };

      // Add required metadata filters
      if (rule.conditions.requiredMetadata) {
        for (const metadataField of rule.conditions.requiredMetadata) {
          queryConfig.metadataFilters[metadataField] = { operator: 'exists' };
        }
      }

      // Execute query
      const queryResults = await enterpriseTransparencyService.executeAdvancedQuery(queryConfig);
      result.evidence = queryResults.data;

      // Evaluate rule conditions
      if (rule.conditions.violations) {
        for (const violationCondition of rule.conditions.violations) {
          const violations = this.checkViolationCondition(
            queryResults.data, 
            violationCondition, 
            rule
          );
          
          if (violations.length > 0) {
            result.compliant = false;
            result.violations.push(...violations);
          }
        }
      }

      // Special handling for time-based checks
      if (rule.conditions.timeBasedCheck) {
        const timeViolations = await this.checkTimeBasedViolations(rule, queryResults.data);
        if (timeViolations.length > 0) {
          result.compliant = false;
          result.violations.push(...timeViolations);
        }
      }

      // Special handling for cross-agent analysis
      if (rule.conditions.crossAgentAnalysis) {
        const crossAgentViolations = await this.checkCrossAgentViolations(rule, queryResults.data);
        if (crossAgentViolations.length > 0) {
          result.compliant = false;
          result.violations.push(...crossAgentViolations);
        }
      }

      return result;

    } catch (error) {
      console.error(`Error evaluating compliance rule ${rule.ruleId}:`, error);
      return {
        ruleId: rule.ruleId,
        compliant: false,
        violations: [{
          violationId: uuidv4(),
          type: 'evaluation_error',
          severity: 'high',
          description: `Failed to evaluate rule: ${error.message}`,
          timestamp: new Date().toISOString()
        }],
        evidence: [],
        error: error.message
      };
    }
  }

  /**
   * Check violation condition against log data
   */
  checkViolationCondition(logData, violationCondition, rule) {
    const violations = [];

    for (const log of logData) {
      let violationDetected = false;
      let violationDescription = '';

      switch (violationCondition.condition) {
        case 'missing_lawful_basis':
          if (!log.metadata?.gdpr_lawful_basis) {
            violationDetected = true;
            violationDescription = 'GDPR lawful basis not specified for personal data processing';
          }
          break;

        case 'expired_consent':
          if (log.metadata?.consent_status === 'expired') {
            violationDetected = true;
            violationDescription = 'Processing personal data with expired consent';
          }
          break;

        case 'withdrawn_consent':
          if (log.metadata?.consent_status === 'withdrawn') {
            violationDetected = true;
            violationDescription = 'Processing personal data after consent withdrawal';
          }
          break;

        case 'missing_authorization':
          if (!log.metadata?.hipaa_authorization) {
            violationDetected = true;
            violationDescription = 'PHI access without proper HIPAA authorization';
          }
          break;

        case 'excessive_access':
          if (log.metadata?.access_scope === 'full' && log.metadata?.minimum_necessary !== 'verified') {
            violationDetected = true;
            violationDescription = 'PHI access violates minimum necessary principle';
          }
          break;

        case 'unauthorized_disclosure':
          if (log.eventType === 'phi_disclosure' && !log.metadata?.disclosure_authorized) {
            violationDetected = true;
            violationDescription = 'Unauthorized PHI disclosure detected';
          }
          break;
      }

      if (violationDetected) {
        violations.push({
          violationId: uuidv4(),
          ruleId: rule.ruleId,
          type: violationCondition.condition,
          severity: rule.severity,
          description: violationDescription,
          timestamp: log.timestamp,
          agentId: log.agentId,
          eventId: log.id,
          evidence: {
            logEntry: log,
            violationCondition
          },
          remediation: {
            automated: violationCondition.action,
            suggestions: rule.remediation?.automated || []
          }
        });
      }
    }

    return violations;
  }

  /**
   * Check time-based violations (e.g., data retention)
   */
  async checkTimeBasedViolations(rule, logData) {
    const violations = [];

    if (rule.conditions.retentionPeriods) {
      for (const [dataType, retentionPeriod] of Object.entries(rule.conditions.retentionPeriods)) {
        const retentionMs = this.parseRetentionPeriod(retentionPeriod);
        const cutoffDate = new Date(Date.now() - retentionMs);

        for (const log of logData) {
          if (log.metadata?.data_type === dataType && new Date(log.timestamp) < cutoffDate) {
            violations.push({
              violationId: uuidv4(),
              ruleId: rule.ruleId,
              type: 'data_retention_violation',
              severity: rule.severity,
              description: `Data retained beyond ${retentionPeriod} limit for ${dataType}`,
              timestamp: new Date().toISOString(),
              agentId: log.agentId,
              eventId: log.id,
              evidence: {
                logEntry: log,
                retentionPeriod,
                cutoffDate: cutoffDate.toISOString()
              }
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Check cross-agent violations (e.g., segregation of duties)
   */
  async checkCrossAgentViolations(rule, logData) {
    const violations = [];

    if (rule.conditions.conflictDetection) {
      // Group logs by transaction or process ID
      const transactionGroups = this.groupLogsByTransaction(logData);

      for (const [transactionId, transactionLogs] of Object.entries(transactionGroups)) {
        for (const conflictRule of rule.conditions.conflictDetection) {
          const agentRoles = this.extractAgentRoles(transactionLogs);
          
          // Check if conflicting roles are performed by the same agent
          const conflictingRoles = conflictRule.roles;
          const agentsWithConflictingRoles = this.findAgentsWithConflictingRoles(
            agentRoles, 
            conflictingRoles
          );

          if (agentsWithConflictingRoles.length > 0) {
            violations.push({
              violationId: uuidv4(),
              ruleId: rule.ruleId,
              type: 'segregation_of_duties_violation',
              severity: rule.severity,
              description: `Agent(s) ${agentsWithConflictingRoles.join(', ')} performed conflicting roles: ${conflictingRoles.join(', ')}`,
              timestamp: new Date().toISOString(),
              evidence: {
                transactionId,
                conflictingAgents: agentsWithConflictingRoles,
                conflictingRoles,
                transactionLogs
              }
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Parse retention period string to milliseconds
   */
  parseRetentionPeriod(period) {
    const units = {
      'days': 24 * 60 * 60 * 1000,
      'months': 30 * 24 * 60 * 60 * 1000,
      'years': 365 * 24 * 60 * 60 * 1000
    };

    const match = period.match(/^(\d+)_(\w+)$/);
    if (match) {
      const [, amount, unit] = match;
      return parseInt(amount) * (units[unit] || 0);
    }

    return 0;
  }

  /**
   * Group logs by transaction ID
   */
  groupLogsByTransaction(logData) {
    const groups = {};

    for (const log of logData) {
      const transactionId = log.metadata?.transaction_id || log.metadata?.process_id || 'unknown';
      
      if (!groups[transactionId]) {
        groups[transactionId] = [];
      }
      
      groups[transactionId].push(log);
    }

    return groups;
  }

  /**
   * Extract agent roles from transaction logs
   */
  extractAgentRoles(transactionLogs) {
    const agentRoles = {};

    for (const log of transactionLogs) {
      const agentId = log.agentId;
      const role = log.metadata?.agent_role || log.metadata?.function_role || 'unknown';

      if (!agentRoles[agentId]) {
        agentRoles[agentId] = new Set();
      }

      agentRoles[agentId].add(role);
    }

    // Convert Sets to Arrays
    for (const [agentId, roles] of Object.entries(agentRoles)) {
      agentRoles[agentId] = Array.from(roles);
    }

    return agentRoles;
  }

  /**
   * Find agents with conflicting roles
   */
  findAgentsWithConflictingRoles(agentRoles, conflictingRoles) {
    const conflictingAgents = [];

    for (const [agentId, roles] of Object.entries(agentRoles)) {
      const hasConflictingRoles = conflictingRoles.every(role => roles.includes(role));
      
      if (hasConflictingRoles) {
        conflictingAgents.push(agentId);
      }
    }

    return conflictingAgents;
  }

  /**
   * Generate compliance recommendations
   */
  async generateComplianceRecommendations(frameworkId, violations) {
    const recommendations = [];
    const violationsByType = this.groupViolationsByType(violations);

    for (const [violationType, typeViolations] of Object.entries(violationsByType)) {
      const recommendation = {
        recommendationId: uuidv4(),
        type: violationType,
        priority: this.calculateRecommendationPriority(typeViolations),
        title: this.generateRecommendationTitle(violationType),
        description: this.generateRecommendationDescription(violationType, typeViolations),
        actions: this.generateRecommendationActions(violationType),
        estimatedEffort: this.estimateRemediationEffort(violationType, typeViolations.length),
        complianceImpact: this.assessComplianceImpact(violationType),
        affectedViolations: typeViolations.map(v => v.violationId)
      };

      recommendations.push(recommendation);
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Group violations by type
   */
  groupViolationsByType(violations) {
    const groups = {};

    for (const violation of violations) {
      const type = violation.type;
      
      if (!groups[type]) {
        groups[type] = [];
      }
      
      groups[type].push(violation);
    }

    return groups;
  }

  /**
   * Calculate recommendation priority
   */
  calculateRecommendationPriority(violations) {
    const severities = violations.map(v => v.severity);
    
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendation title
   */
  generateRecommendationTitle(violationType) {
    const titles = {
      'missing_lawful_basis': 'Implement GDPR Lawful Basis Verification',
      'expired_consent': 'Establish Consent Renewal Process',
      'missing_authorization': 'Strengthen HIPAA Authorization Controls',
      'segregation_of_duties_violation': 'Redesign Financial Process Controls',
      'data_retention_violation': 'Implement Automated Data Retention Management'
    };

    return titles[violationType] || `Address ${violationType} Violations`;
  }

  /**
   * Generate recommendation description
   */
  generateRecommendationDescription(violationType, violations) {
    const count = violations.length;
    
    const descriptions = {
      'missing_lawful_basis': `${count} instances of personal data processing without documented lawful basis. Implement automated lawful basis verification before data processing.`,
      'expired_consent': `${count} instances of processing with expired consent. Establish automated consent renewal workflows and grace period handling.`,
      'missing_authorization': `${count} instances of PHI access without proper authorization. Implement mandatory authorization verification for all PHI access.`,
      'segregation_of_duties_violation': `${count} instances of inadequate duty segregation. Redesign financial processes to ensure proper separation of roles.`,
      'data_retention_violation': `${count} instances of data retained beyond policy limits. Implement automated retention management and deletion workflows.`
    };

    return descriptions[violationType] || `Address ${count} instances of ${violationType} to improve compliance posture.`;
  }

  /**
   * Generate recommendation actions
   */
  generateRecommendationActions(violationType) {
    const actions = {
      'missing_lawful_basis': [
        'Implement lawful basis verification middleware',
        'Create consent management dashboard',
        'Establish data processing approval workflows',
        'Train agents on GDPR requirements'
      ],
      'expired_consent': [
        'Implement consent expiration monitoring',
        'Create automated renewal notifications',
        'Establish consent grace period policies',
        'Implement consent withdrawal handling'
      ],
      'missing_authorization': [
        'Implement mandatory authorization checks',
        'Create PHI access approval workflows',
        'Establish minimum necessary verification',
        'Implement access logging and monitoring'
      ],
      'segregation_of_duties_violation': [
        'Redesign financial process workflows',
        'Implement role-based access controls',
        'Create approval hierarchies',
        'Establish conflict detection systems'
      ],
      'data_retention_violation': [
        'Implement automated retention policies',
        'Create data deletion workflows',
        'Establish retention monitoring',
        'Implement data classification systems'
      ]
    };

    return actions[violationType] || [
      'Analyze root cause of violations',
      'Implement preventive controls',
      'Establish monitoring procedures',
      'Train relevant personnel'
    ];
  }

  /**
   * Estimate remediation effort
   */
  estimateRemediationEffort(violationType, violationCount) {
    const baseEfforts = {
      'missing_lawful_basis': 'medium',
      'expired_consent': 'low',
      'missing_authorization': 'high',
      'segregation_of_duties_violation': 'high',
      'data_retention_violation': 'medium'
    };

    const baseEffort = baseEfforts[violationType] || 'medium';
    
    // Adjust based on violation count
    if (violationCount > 100) {
      return baseEffort === 'low' ? 'medium' : baseEffort === 'medium' ? 'high' : 'critical';
    }

    return baseEffort;
  }

  /**
   * Assess compliance impact
   */
  assessComplianceImpact(violationType) {
    const impacts = {
      'missing_lawful_basis': 'high',
      'expired_consent': 'medium',
      'missing_authorization': 'critical',
      'segregation_of_duties_violation': 'high',
      'data_retention_violation': 'medium'
    };

    return impacts[violationType] || 'medium';
  }

  /**
   * Generate cryptographic hash
   */
  generateHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(typeof data === 'string' ? data : JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Get compliance framework statistics
   */
  async getComplianceStats() {
    try {
      const stats = {
        frameworks: this.complianceFrameworks.size,
        rules: this.complianceRules.size,
        assessments: this.complianceAssessments.size,
        violations: this.complianceViolations.size,
        legalHolds: this.legalHolds.size,
        monitors: this.complianceMonitors.size,
        recentAssessments: [],
        violationTrends: {},
        complianceScores: {}
      };

      // Get recent assessments
      const recentAssessments = Array.from(this.complianceAssessments.values())
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5);

      stats.recentAssessments = recentAssessments.map(assessment => ({
        assessmentId: assessment.assessmentId,
        frameworkId: assessment.frameworkId,
        overallScore: assessment.results.overallScore,
        completedAt: assessment.completedAt,
        violationCount: assessment.results.violations.length
      }));

      // Calculate compliance scores by framework
      for (const [frameworkId] of this.complianceFrameworks.entries()) {
        const frameworkAssessments = Array.from(this.complianceAssessments.values())
          .filter(a => a.frameworkId === frameworkId && a.status === 'completed');

        if (frameworkAssessments.length > 0) {
          const latestAssessment = frameworkAssessments
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
          
          stats.complianceScores[frameworkId] = {
            score: latestAssessment.results.overallScore,
            lastAssessed: latestAssessment.completedAt,
            violationCount: latestAssessment.results.violations.length
          };
        }
      }

      return stats;

    } catch (error) {
      console.error('Error getting compliance stats:', error);
      return {
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new ComplianceFrameworkService();

