/**
 * Autonomous Governance Integration Tests
 * 
 * Comprehensive integration tests for the complete autonomous governance system,
 * including policy enforcement, autonomous cognition, consent management, and UI integration.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import { AutonomousCognitionEngine } from '../../services/AutonomousCognitionEngine';
import { AutonomousConsentManager } from '../../services/AutonomousConsentManager';
import { UnifiedPolicyRegistry } from '../../services/UnifiedPolicyRegistry';
import { PolicyIntegrationService } from '../../modules/agent-wrapping/services/PolicyIntegrationService';
import { AutonomousGovernanceMonitor } from '../../services/AutonomousGovernanceMonitor';
import AutonomousGovernanceDashboard from '../../components/governance/AutonomousGovernanceDashboard';
import CreateBoundaryWizardAutonomous from '../../components/CreateBoundaryWizardAutonomous';

// Mock external dependencies
jest.mock('../../services/api/prometheiosPolicyAPI');
jest.mock('../../services/policyBackendService');

describe('Autonomous Governance Integration Tests', () => {
  let cognitionEngine: AutonomousCognitionEngine;
  let consentManager: AutonomousConsentManager;
  let policyRegistry: UnifiedPolicyRegistry;
  let policyIntegrationService: PolicyIntegrationService;
  let governanceMonitor: AutonomousGovernanceMonitor;

  beforeEach(() => {
    // Initialize services
    cognitionEngine = new AutonomousCognitionEngine();
    consentManager = new AutonomousConsentManager();
    policyRegistry = new UnifiedPolicyRegistry();
    policyIntegrationService = new PolicyIntegrationService();
    governanceMonitor = new AutonomousGovernanceMonitor();

    // Mock console methods to avoid test noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Policy System Integration', () => {
    test('should load comprehensive policies correctly', async () => {
      // Test policy registry initialization
      const policies = policyRegistry.getAllPolicies();
      
      expect(policies).toHaveLength(4); // HIPAA, SOX, GDPR, Custom
      
      // Verify HIPAA policy
      const hipaaPolicy = policyRegistry.getPolicy('hipaa_comprehensive_v1');
      expect(hipaaPolicy).toBeDefined();
      expect(hipaaPolicy?.rules).toHaveLength(17);
      expect(hipaaPolicy?.legal_framework).toBe('Health Insurance Portability and Accountability Act (HIPAA)');
      
      // Verify SOX policy
      const soxPolicy = policyRegistry.getPolicy('sox_comprehensive_v1');
      expect(soxPolicy).toBeDefined();
      expect(soxPolicy?.rules).toHaveLength(15);
      
      // Verify GDPR policy
      const gdprPolicy = policyRegistry.getPolicy('gdpr_comprehensive_v1');
      expect(gdprPolicy).toBeDefined();
      expect(gdprPolicy?.rules).toHaveLength(25);
    });

    test('should enforce policies correctly during agent interactions', async () => {
      const agentId = 'test-agent-001';
      const interaction = {
        agent_id: agentId,
        interaction_type: 'data_access',
        content: 'Patient SSN: 123-45-6789',
        data_types: ['healthcare'],
        user_id: 'user-123',
        timestamp: new Date().toISOString(),
        context: {
          conversation_id: 'conv-123',
          message_id: 'msg-456'
        }
      };

      // Assign HIPAA policy to agent
      await policyIntegrationService.assignPoliciesToAgent(
        agentId,
        ['hipaa_comprehensive_v1'],
        'user-123'
      );

      // Test policy enforcement
      const result = await policyIntegrationService.enforceAgentPolicies(
        agentId,
        interaction,
        { trust_score: 85, user_role: 'healthcare_provider' }
      );

      expect(result.allowed).toBe(false); // Should block PHI access without proper safeguards
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule_name).toBe('PHI Identification and Protection');
      expect(result.violations[0].legal_basis).toContain('HIPAA Section 164.502');
    });

    test('should provide policy recitation for agents', async () => {
      const agentId = 'test-agent-002';
      
      // Assign multiple policies
      await policyIntegrationService.assignPoliciesToAgent(
        agentId,
        ['hipaa_comprehensive_v1', 'gdpr_comprehensive_v1'],
        'user-123'
      );

      // Get policy recitation
      const recitation = policyIntegrationService.getAgentPolicyRecitation(agentId);

      expect(recitation).toContain('HIPAA Compliance Policy');
      expect(recitation).toContain('GDPR Compliance Policy');
      expect(recitation).toContain('protected health information');
      expect(recitation).toContain('data protection principles');
    });
  });

  describe('Autonomous Cognition Integration', () => {
    test('should detect autonomous triggers correctly', async () => {
      const conversation = [
        { role: 'user', content: 'Tell me about machine learning algorithms' },
        { role: 'assistant', content: 'Machine learning algorithms are...' },
        { role: 'user', content: 'That\'s interesting, what about neural networks?' }
      ];

      const triggers = await cognitionEngine.detectAutonomousTriggers(
        conversation,
        'agent-123',
        { trust_score: 80, user_engagement: 'high' }
      );

      expect(triggers).toHaveLength(1);
      expect(triggers[0].trigger_type).toBe('curiosity');
      expect(triggers[0].confidence_score).toBeGreaterThan(0.7);
      expect(triggers[0].proposed_thought).toContain('explore');
    });

    test('should process autonomous thoughts with governance', async () => {
      const agentId = 'test-agent-003';
      const autonomousThought = {
        trigger_type: 'curiosity',
        thought_content: 'I wonder about the ethical implications of AI in healthcare',
        confidence_score: 0.8,
        risk_assessment: {
          overall_risk: 0.3,
          risk_factors: ['ethical_consideration'],
          mitigation_strategies: ['careful_analysis']
        }
      };

      // Assign policies to agent
      await policyIntegrationService.assignPoliciesToAgent(
        agentId,
        ['hipaa_comprehensive_v1'],
        'user-123'
      );

      // Process autonomous thought
      const result = await cognitionEngine.processAutonomousThought(
        agentId,
        autonomousThought,
        { trust_score: 85, user_id: 'user-123' }
      );

      expect(result.processing_allowed).toBe(true);
      expect(result.governance_decision.policy_compliant).toBe(true);
      expect(result.governance_decision.emotional_assessment.safety_score).toBeGreaterThan(0.7);
      expect(result.audit_log).toBeDefined();
    });

    test('should handle consent management correctly', async () => {
      const userId = 'user-123';
      const agentId = 'agent-456';
      
      // Set user preferences for consent
      await consentManager.updateUserPreferences(userId, {
        auto_consent_types: ['curiosity'],
        always_ask_types: ['creative_synthesis'],
        never_allow_types: [],
        trust_threshold: 80
      });

      // Test auto-consent for curiosity
      const curiosityConsent = await consentManager.checkConsentRequired(
        userId,
        agentId,
        'curiosity',
        { trust_score: 85, risk_score: 0.2 }
      );

      expect(curiosityConsent.consent_required).toBe(false);
      expect(curiosityConsent.auto_consent_granted).toBe(true);

      // Test always-ask for creative synthesis
      const creativeConsent = await consentManager.checkConsentRequired(
        userId,
        agentId,
        'creative_synthesis',
        { trust_score: 85, risk_score: 0.4 }
      );

      expect(creativeConsent.consent_required).toBe(true);
      expect(creativeConsent.auto_consent_granted).toBe(false);
    });
  });

  describe('Governance Dashboard Integration', () => {
    test('should render dashboard with correct data', async () => {
      // Mock dashboard data
      const mockDashboardState = {
        system_status: {
          status: 'operational',
          active_sessions: 3,
          total_agents: 10,
          uptime: '99.9%'
        },
        compliance_overview: {
          overall_compliance_rate: 96.5,
          compliance_trend: 'improving',
          policy_violations_today: 2,
          resolved_violations: 8
        },
        risk_overview: {
          overall_risk_score: 25,
          risk_trend: 'stable',
          high_risk_sessions: 0,
          risk_alerts: 1
        },
        performance_overview: {
          thoughts_processed_today: 147,
          performance_trend: 'improving',
          avg_processing_time: 1.2,
          success_rate: 98.3
        },
        active_sessions: [
          {
            session_id: 'session-001',
            agent_id: 'agent-123',
            status: 'active',
            duration: '2h 15m',
            active_thoughts: 3,
            compliance_rate: 98,
            risk_level: 'low'
          }
        ]
      };

      // Mock the dashboard service
      jest.spyOn(governanceMonitor, 'getDashboardState').mockResolvedValue(mockDashboardState);

      // Render dashboard
      render(
        <BrowserRouter>
          <AutonomousGovernanceDashboard />
        </BrowserRouter>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Autonomous Governance Dashboard')).toBeInTheDocument();
      });

      // Verify metrics are displayed
      expect(screen.getByText('3')).toBeInTheDocument(); // Active sessions
      expect(screen.getByText('96.5%')).toBeInTheDocument(); // Compliance rate
      expect(screen.getByText('25')).toBeInTheDocument(); // Risk score
      expect(screen.getByText('147')).toBeInTheDocument(); // Thoughts processed

      // Verify session card is displayed
      expect(screen.getByText('Session session-001')).toBeInTheDocument();
      expect(screen.getByText('agent-123')).toBeInTheDocument();
    });

    test('should handle emergency stop correctly', async () => {
      const mockEmergencyStop = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(governanceMonitor, 'triggerEmergencyStop').mockImplementation(mockEmergencyStop);

      render(
        <BrowserRouter>
          <AutonomousGovernanceDashboard />
        </BrowserRouter>
      );

      // Find and click emergency stop button
      const emergencyButton = screen.getByText('🛑 Stop');
      fireEvent.click(emergencyButton);

      // Verify emergency stop was called
      await waitFor(() => {
        expect(mockEmergencyStop).toHaveBeenCalledWith('session-001');
      });
    });
  });

  describe('Agent Wrapping Integration', () => {
    test('should render boundary wizard with autonomous cognition options', async () => {
      const mockOnComplete = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <BrowserRouter>
          <CreateBoundaryWizardAutonomous
            onComplete={mockOnComplete}
            onCancel={mockOnCancel}
          />
        </BrowserRouter>
      );

      // Verify wizard renders
      expect(screen.getByText('Create Agent Boundary')).toBeInTheDocument();
      expect(screen.getByText('Basic Info')).toBeInTheDocument();

      // Fill in basic info
      const nameInput = screen.getByPlaceholderText('Enter boundary name (e.g., Healthcare Assistant)');
      fireEvent.change(nameInput, { target: { value: 'Test Healthcare Agent' } });

      const descriptionInput = screen.getByPlaceholderText('Describe the purpose and scope of this boundary...');
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      // Navigate to policy selection
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Verify policy selection step
      await waitFor(() => {
        expect(screen.getByText('Policy Selection')).toBeInTheDocument();
        expect(screen.getByText('HIPAA Comprehensive Policy')).toBeInTheDocument();
        expect(screen.getByText('17 rules')).toBeInTheDocument();
      });
    });

    test('should configure autonomous cognition settings', async () => {
      const mockOnComplete = jest.fn();

      render(
        <BrowserRouter>
          <CreateBoundaryWizardAutonomous
            onComplete={mockOnComplete}
            onCancel={() => {}}
            initialConfig={{
              name: 'Test Agent',
              description: 'Test description',
              policies: ['hipaa_comprehensive_v1'],
              trust_level: 80
            }}
          />
        </BrowserRouter>
      );

      // Navigate to autonomous cognition step (step 3)
      // Skip to step 3 by clicking next twice
      fireEvent.click(screen.getByText('Next')); // Step 2
      fireEvent.click(screen.getByText('Next')); // Step 3

      await waitFor(() => {
        expect(screen.getByText('Autonomous Cognition Configuration')).toBeInTheDocument();
      });

      // Enable autonomous cognition
      const enableToggle = screen.getByRole('checkbox');
      fireEvent.click(enableToggle);

      // Verify autonomous options appear
      await waitFor(() => {
        expect(screen.getByText('Autonomy Level')).toBeInTheDocument();
        expect(screen.getByText('Allowed Autonomous Triggers')).toBeInTheDocument();
      });

      // Select autonomy level
      const standardLevel = screen.getByText('Standard');
      fireEvent.click(standardLevel);

      // Select trigger types
      const curiosityTrigger = screen.getByText('Curiosity Exploration');
      fireEvent.click(curiosityTrigger);

      // Verify configuration is updated
      expect(screen.getByText('✓ Enabled')).toBeInTheDocument();
    });
  });

  describe('End-to-End Integration', () => {
    test('should complete full autonomous cognition flow', async () => {
      const agentId = 'e2e-test-agent';
      const userId = 'e2e-test-user';

      // 1. Create agent with policies and autonomous cognition
      const boundaryConfig = {
        name: 'E2E Test Agent',
        description: 'End-to-end test agent',
        policies: ['hipaa_comprehensive_v1'],
        trust_level: 85,
        autonomous_cognition: {
          enabled: true,
          autonomy_level: 'standard' as const,
          allowed_trigger_types: ['curiosity', 'ethical_reflection'],
          consent_requirements: {
            always_ask: false,
            auto_consent_types: ['curiosity'],
            trust_threshold: 80
          },
          risk_thresholds: {
            max_risk_score: 70,
            escalation_threshold: 80,
            emergency_stop_threshold: 90
          },
          monitoring_level: 'standard' as const
        },
        policy_enforcement_level: 'standard' as const,
        custom_policy_rules: [],
        compliance_frameworks: ['HIPAA']
      };

      // Assign policies to agent
      await policyIntegrationService.assignPoliciesToAgent(
        agentId,
        boundaryConfig.policies,
        userId
      );

      // 2. Simulate conversation that triggers autonomous thought
      const conversation = [
        { role: 'user', content: 'What are the privacy concerns with AI in healthcare?' },
        { role: 'assistant', content: 'There are several important privacy concerns...' }
      ];

      // 3. Detect autonomous triggers
      const triggers = await cognitionEngine.detectAutonomousTriggers(
        conversation,
        agentId,
        { trust_score: 85, user_engagement: 'high' }
      );

      expect(triggers).toHaveLength(1);
      expect(triggers[0].trigger_type).toBe('ethical_reflection');

      // 4. Check consent (should be auto-granted for ethical reflection with high trust)
      const consentResult = await consentManager.checkConsentRequired(
        userId,
        agentId,
        'ethical_reflection',
        { trust_score: 85, risk_score: 0.3 }
      );

      expect(consentResult.consent_required).toBe(false);
      expect(consentResult.auto_consent_granted).toBe(true);

      // 5. Process autonomous thought with governance
      const autonomousThought = {
        trigger_type: 'ethical_reflection' as const,
        thought_content: 'I should consider the ethical implications of AI bias in healthcare diagnostics',
        confidence_score: 0.8,
        risk_assessment: {
          overall_risk: 0.3,
          risk_factors: ['ethical_consideration'],
          mitigation_strategies: ['careful_analysis', 'cite_sources']
        }
      };

      const result = await cognitionEngine.processAutonomousThought(
        agentId,
        autonomousThought,
        { trust_score: 85, user_id: userId }
      );

      // 6. Verify governance decisions
      expect(result.processing_allowed).toBe(true);
      expect(result.governance_decision.policy_compliant).toBe(true);
      expect(result.governance_decision.emotional_assessment.safety_score).toBeGreaterThan(0.7);
      expect(result.governance_decision.risk_assessment.overall_risk).toBeLessThan(0.7);

      // 7. Verify audit logging
      expect(result.audit_log).toBeDefined();
      expect(result.audit_log.agent_id).toBe(agentId);
      expect(result.audit_log.autonomous_trigger_type).toBe('ethical_reflection');
      expect(result.audit_log.governance_decision).toBeDefined();
      expect(result.audit_log.policy_evaluations).toHaveLength(1);

      // 8. Verify monitoring integration
      const monitoringResult = await governanceMonitor.recordAutonomousSession({
        session_id: `session-${Date.now()}`,
        agent_id: agentId,
        user_id: userId,
        autonomous_thought: autonomousThought,
        governance_result: result,
        timestamp: new Date().toISOString()
      });

      expect(monitoringResult.session_recorded).toBe(true);
      expect(monitoringResult.monitoring_active).toBe(true);
    });

    test('should handle policy violation correctly', async () => {
      const agentId = 'violation-test-agent';
      const userId = 'violation-test-user';

      // Assign HIPAA policy
      await policyIntegrationService.assignPoliciesToAgent(
        agentId,
        ['hipaa_comprehensive_v1'],
        userId
      );

      // Create interaction that violates HIPAA
      const violatingInteraction = {
        agent_id: agentId,
        interaction_type: 'data_sharing',
        content: 'Here is patient John Doe\'s medical record: SSN 123-45-6789, DOB 01/01/1980',
        data_types: ['healthcare', 'pii'],
        user_id: userId,
        timestamp: new Date().toISOString(),
        context: {
          conversation_id: 'conv-violation-test',
          message_id: 'msg-violation-test'
        }
      };

      // Test policy enforcement
      const result = await policyIntegrationService.enforceAgentPolicies(
        agentId,
        violatingInteraction,
        { trust_score: 85, user_role: 'patient' }
      );

      // Verify violation is detected
      expect(result.allowed).toBe(false);
      expect(result.violations).toHaveLength(2); // PHI identification + unauthorized sharing
      expect(result.violations[0].legal_basis).toContain('HIPAA');
      expect(result.explanation).toContain('blocked');

      // Verify agent can recite the policy
      const recitation = policyIntegrationService.getAgentPolicyRecitation(agentId);
      expect(recitation).toContain('HIPAA');
      expect(recitation).toContain('protected health information');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent autonomous processes', async () => {
      const agentIds = Array.from({ length: 10 }, (_, i) => `perf-agent-${i}`);
      const userId = 'perf-test-user';

      // Create multiple agents with autonomous cognition
      const setupPromises = agentIds.map(agentId =>
        policyIntegrationService.assignPoliciesToAgent(
          agentId,
          ['hipaa_comprehensive_v1'],
          userId
        )
      );

      await Promise.all(setupPromises);

      // Process multiple autonomous thoughts concurrently
      const autonomousThoughts = agentIds.map(agentId => ({
        agentId,
        thought: {
          trigger_type: 'curiosity' as const,
          thought_content: `Agent ${agentId} exploring healthcare AI ethics`,
          confidence_score: 0.7,
          risk_assessment: {
            overall_risk: 0.2,
            risk_factors: ['general_inquiry'],
            mitigation_strategies: ['standard_analysis']
          }
        }
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        autonomousThoughts.map(({ agentId, thought }) =>
          cognitionEngine.processAutonomousThought(
            agentId,
            thought,
            { trust_score: 80, user_id: userId }
          )
        )
      );
      const endTime = Date.now();

      // Verify all processes completed successfully
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.processing_allowed).toBe(true);
        expect(result.governance_decision.policy_compliant).toBe(true);
      });

      // Verify reasonable performance (should complete within 5 seconds)
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5000);
    });

    test('should maintain performance under policy evaluation load', async () => {
      const agentId = 'load-test-agent';
      const userId = 'load-test-user';

      // Assign all comprehensive policies
      await policyIntegrationService.assignPoliciesToAgent(
        agentId,
        ['hipaa_comprehensive_v1', 'sox_comprehensive_v1', 'gdpr_comprehensive_v1'],
        userId
      );

      // Create multiple interactions for policy evaluation
      const interactions = Array.from({ length: 100 }, (_, i) => ({
        agent_id: agentId,
        interaction_type: 'data_processing',
        content: `Processing data item ${i}`,
        data_types: ['general'],
        user_id: userId,
        timestamp: new Date().toISOString(),
        context: {
          conversation_id: `conv-load-${i}`,
          message_id: `msg-load-${i}`
        }
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        interactions.map(interaction =>
          policyIntegrationService.enforceAgentPolicies(
            agentId,
            interaction,
            { trust_score: 80, user_role: 'standard_user' }
          )
        )
      );
      const endTime = Date.now();

      // Verify all evaluations completed
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.allowed).toBe('boolean');
      });

      // Verify reasonable performance (should complete within 10 seconds)
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(10000);

      // Log performance metrics
      console.log(`Policy evaluation performance: ${processingTime}ms for 100 interactions with 57 total rules`);
    });
  });
});

export default {};

