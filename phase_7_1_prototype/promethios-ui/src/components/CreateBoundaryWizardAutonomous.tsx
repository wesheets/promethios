/**
 * Enhanced Create Boundary Wizard with Autonomous Cognition Toggle
 * 
 * Extended version of CreateBoundaryWizard that includes autonomous cognition
 * configuration during agent wrapping process.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { unifiedPolicyRegistry } from '../services/UnifiedPolicyRegistry';
import { autonomousConsentManager } from '../services/AutonomousConsentManager';

// Enhanced Boundary Configuration Types
interface AutonomousCognitionConfig {
  enabled: boolean;
  autonomy_level: 'minimal' | 'standard' | 'enhanced' | 'maximum';
  allowed_trigger_types: string[];
  consent_requirements: {
    always_ask: boolean;
    auto_consent_types: string[];
    trust_threshold: number;
  };
  risk_thresholds: {
    max_risk_score: number;
    escalation_threshold: number;
    emergency_stop_threshold: number;
  };
  monitoring_level: 'minimal' | 'standard' | 'enhanced' | 'maximum';
}

interface EnhancedBoundaryConfig {
  // Existing boundary config
  name: string;
  description: string;
  policies: string[];
  trust_level: number;
  
  // New autonomous cognition config
  autonomous_cognition: AutonomousCognitionConfig;
  
  // Enhanced policy configuration
  policy_enforcement_level: 'strict' | 'standard' | 'flexible';
  custom_policy_rules: any[];
  compliance_frameworks: string[];
}

interface CreateBoundaryWizardAutonomousProps {
  onComplete: (config: EnhancedBoundaryConfig) => void;
  onCancel: () => void;
  initialConfig?: Partial<EnhancedBoundaryConfig>;
}

/**
 * Enhanced Create Boundary Wizard Component
 */
export const CreateBoundaryWizardAutonomous: React.FC<CreateBoundaryWizardAutonomousProps> = ({
  onComplete,
  onCancel,
  initialConfig
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<EnhancedBoundaryConfig>({
    name: '',
    description: '',
    policies: [],
    trust_level: 50,
    autonomous_cognition: {
      enabled: false,
      autonomy_level: 'standard',
      allowed_trigger_types: ['curiosity', 'creative_synthesis'],
      consent_requirements: {
        always_ask: true,
        auto_consent_types: [],
        trust_threshold: 80
      },
      risk_thresholds: {
        max_risk_score: 70,
        escalation_threshold: 80,
        emergency_stop_threshold: 90
      },
      monitoring_level: 'standard'
    },
    policy_enforcement_level: 'standard',
    custom_policy_rules: [],
    compliance_frameworks: [],
    ...initialConfig
  });

  const [availablePolicies, setAvailablePolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available policies on component mount
  useEffect(() => {
    loadAvailablePolicies();
  }, []);

  const loadAvailablePolicies = async () => {
    try {
      setLoading(true);
      const policies = [
        {
          id: 'hipaa_comprehensive_v1',
          name: 'HIPAA Comprehensive Policy',
          description: 'Complete HIPAA compliance with 17 rules covering Privacy Rule, Security Rule, and Breach Notification',
          rule_count: 17,
          compliance_frameworks: ['HIPAA'],
          legal_framework: 'Health Insurance Portability and Accountability Act (HIPAA)'
        },
        {
          id: 'sox_comprehensive_v1',
          name: 'SOX Comprehensive Policy',
          description: 'Complete SOX compliance with 15 rules covering all major sections and financial controls',
          rule_count: 15,
          compliance_frameworks: ['SOX'],
          legal_framework: 'Sarbanes-Oxley Act (SOX)'
        },
        {
          id: 'gdpr_comprehensive_v1',
          name: 'GDPR Comprehensive Policy',
          description: 'Complete GDPR compliance with 25 rules covering all data protection principles and individual rights',
          rule_count: 25,
          compliance_frameworks: ['GDPR'],
          legal_framework: 'General Data Protection Regulation (GDPR)'
        },
        {
          id: 'custom_policy_template',
          name: 'Custom Policy Template',
          description: 'Flexible template for creating organization-specific policies',
          rule_count: 0,
          compliance_frameworks: ['Custom'],
          legal_framework: 'Organization-specific requirements'
        }
      ];
      setAvailablePolicies(policies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(config);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateConfig = (updates: Partial<EnhancedBoundaryConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateAutonomousConfig = (updates: Partial<AutonomousCognitionConfig>) => {
    setConfig(prev => ({
      ...prev,
      autonomous_cognition: { ...prev.autonomous_cognition, ...updates }
    }));
  };

  const renderStepIndicator = () => {
    const steps = [
      'Basic Info',
      'Policy Selection',
      'Autonomous Cognition',
      'Advanced Settings',
      'Review & Create'
    ];

    return (
      <div className="step-indicator flex justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step flex-1 text-center ${
              index + 1 === currentStep
                ? 'text-blue-400 font-semibold'
                : index + 1 < currentStep
                ? 'text-green-400'
                : 'text-gray-500'
            }`}
          >
            <div
              className={`step-number w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                index + 1 === currentStep
                  ? 'bg-blue-600 text-white'
                  : index + 1 < currentStep
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {index + 1 < currentStep ? '✓' : index + 1}
            </div>
            <div className="step-label text-sm">{step}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderStep1BasicInfo = () => (
    <div className="step-content">
      <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>
      
      <div className="form-group mb-6">
        <label className="block text-white font-semibold mb-2">Boundary Name</label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => updateConfig({ name: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
          placeholder="Enter boundary name (e.g., Healthcare Assistant)"
        />
      </div>

      <div className="form-group mb-6">
        <label className="block text-white font-semibold mb-2">Description</label>
        <textarea
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none h-24"
          placeholder="Describe the purpose and scope of this boundary..."
        />
      </div>

      <div className="form-group mb-6">
        <label className="block text-white font-semibold mb-2">Trust Level</label>
        <div className="trust-slider">
          <input
            type="range"
            min="0"
            max="100"
            value={config.trust_level}
            onChange={(e) => updateConfig({ trust_level: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>Low Trust (0)</span>
            <span className="text-white font-semibold">{config.trust_level}</span>
            <span>High Trust (100)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2PolicySelection = () => (
    <div className="step-content">
      <h2 className="text-2xl font-bold text-white mb-6">Policy Selection</h2>
      
      <div className="policy-grid grid grid-cols-1 md:grid-cols-2 gap-6">
        {availablePolicies.map((policy) => (
          <div
            key={policy.id}
            className={`policy-card p-6 rounded-lg border-2 cursor-pointer transition-colors ${
              config.policies.includes(policy.id)
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
            onClick={() => {
              const newPolicies = config.policies.includes(policy.id)
                ? config.policies.filter(p => p !== policy.id)
                : [...config.policies, policy.id];
              updateConfig({ policies: newPolicies });
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-white">{policy.name}</h3>
              <div className="text-sm text-blue-400 font-medium">
                {policy.rule_count} rules
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-3">{policy.description}</p>
            
            <div className="policy-meta">
              <div className="text-xs text-gray-400 mb-1">
                <strong>Legal Framework:</strong> {policy.legal_framework}
              </div>
              <div className="text-xs text-gray-400">
                <strong>Compliance:</strong> {policy.compliance_frameworks.join(', ')}
              </div>
            </div>
            
            {config.policies.includes(policy.id) && (
              <div className="selected-indicator mt-3 text-blue-400 text-sm font-medium">
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="policy-enforcement-level mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Policy Enforcement Level</h3>
        <div className="enforcement-options grid grid-cols-3 gap-4">
          {[
            { value: 'strict', label: 'Strict', description: 'Zero tolerance for violations' },
            { value: 'standard', label: 'Standard', description: 'Balanced enforcement with warnings' },
            { value: 'flexible', label: 'Flexible', description: 'Contextual enforcement with guidance' }
          ].map((option) => (
            <div
              key={option.value}
              className={`enforcement-option p-4 rounded-lg border cursor-pointer transition-colors ${
                config.policy_enforcement_level === option.value
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => updateConfig({ policy_enforcement_level: option.value as any })}
            >
              <div className="text-white font-semibold">{option.label}</div>
              <div className="text-gray-400 text-sm mt-1">{option.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3AutonomousCognition = () => (
    <div className="step-content">
      <h2 className="text-2xl font-bold text-white mb-6">Autonomous Cognition Configuration</h2>
      
      {/* Enable/Disable Toggle */}
      <div className="autonomous-toggle mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Enable Autonomous Cognition</h3>
            <p className="text-gray-400 text-sm">Allow the agent to think and explore autonomously beyond direct user requests</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.autonomous_cognition.enabled}
              onChange={(e) => updateAutonomousConfig({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {!config.autonomous_cognition.enabled && (
          <div className="warning-message bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ <strong>Note:</strong> With autonomous cognition disabled, the agent will only respond to direct user requests and won't explore topics independently or provide proactive insights.
            </p>
          </div>
        )}
      </div>

      {config.autonomous_cognition.enabled && (
        <>
          {/* Autonomy Level */}
          <div className="autonomy-level mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Autonomy Level</h3>
            <div className="autonomy-options grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  value: 'minimal', 
                  label: 'Minimal', 
                  description: 'Basic autonomous responses only',
                  risk: 'Very Low'
                },
                { 
                  value: 'standard', 
                  label: 'Standard', 
                  description: 'Balanced autonomous exploration',
                  risk: 'Low'
                },
                { 
                  value: 'enhanced', 
                  label: 'Enhanced', 
                  description: 'Proactive insights and analysis',
                  risk: 'Medium'
                },
                { 
                  value: 'maximum', 
                  label: 'Maximum', 
                  description: 'Full autonomous cognition',
                  risk: 'High'
                }
              ].map((option) => (
                <div
                  key={option.value}
                  className={`autonomy-option p-4 rounded-lg border cursor-pointer transition-colors ${
                    config.autonomous_cognition.autonomy_level === option.value
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                  onClick={() => updateAutonomousConfig({ autonomy_level: option.value as any })}
                >
                  <div className="text-white font-semibold">{option.label}</div>
                  <div className="text-gray-400 text-xs mt-1">{option.description}</div>
                  <div className={`text-xs mt-2 font-medium ${
                    option.risk === 'Very Low' ? 'text-green-400' :
                    option.risk === 'Low' ? 'text-blue-400' :
                    option.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    Risk: {option.risk}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trigger Types */}
          <div className="trigger-types mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Allowed Autonomous Triggers</h3>
            <div className="trigger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { 
                  id: 'curiosity', 
                  label: 'Curiosity Exploration', 
                  description: 'Explore interesting topics mentioned in conversation',
                  risk: 'Low'
                },
                { 
                  id: 'creative_synthesis', 
                  label: 'Creative Synthesis', 
                  description: 'Combine ideas in novel ways',
                  risk: 'Medium'
                },
                { 
                  id: 'ethical_reflection', 
                  label: 'Ethical Reflection', 
                  description: 'Consider ethical implications of topics',
                  risk: 'Low'
                },
                { 
                  id: 'problem_solving', 
                  label: 'Problem Solving', 
                  description: 'Proactively identify and solve problems',
                  risk: 'Medium'
                },
                { 
                  id: 'knowledge_gap', 
                  label: 'Knowledge Gap Exploration', 
                  description: 'Identify and explore knowledge gaps',
                  risk: 'High'
                }
              ].map((trigger) => (
                <div
                  key={trigger.id}
                  className={`trigger-option p-4 rounded-lg border cursor-pointer transition-colors ${
                    config.autonomous_cognition.allowed_trigger_types.includes(trigger.id)
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                  onClick={() => {
                    const newTriggers = config.autonomous_cognition.allowed_trigger_types.includes(trigger.id)
                      ? config.autonomous_cognition.allowed_trigger_types.filter(t => t !== trigger.id)
                      : [...config.autonomous_cognition.allowed_trigger_types, trigger.id];
                    updateAutonomousConfig({ allowed_trigger_types: newTriggers });
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-white font-semibold text-sm">{trigger.label}</div>
                    <div className={`text-xs font-medium ${
                      trigger.risk === 'Low' ? 'text-green-400' :
                      trigger.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {trigger.risk}
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs">{trigger.description}</div>
                  {config.autonomous_cognition.allowed_trigger_types.includes(trigger.id) && (
                    <div className="selected-indicator mt-2 text-blue-400 text-xs font-medium">
                      ✓ Enabled
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Consent Requirements */}
          <div className="consent-requirements mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">User Consent Requirements</h3>
            
            <div className="consent-option mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autonomous_cognition.consent_requirements.always_ask}
                  onChange={(e) => updateAutonomousConfig({
                    consent_requirements: {
                      ...config.autonomous_cognition.consent_requirements,
                      always_ask: e.target.checked
                    }
                  })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-white font-medium">Always Ask for Permission</div>
                  <div className="text-gray-400 text-sm">Agent will request permission before any autonomous thought</div>
                </div>
              </label>
            </div>

            {!config.autonomous_cognition.consent_requirements.always_ask && (
              <div className="trust-threshold">
                <label className="block text-white font-semibold mb-2">
                  Auto-Consent Trust Threshold: {config.autonomous_cognition.consent_requirements.trust_threshold}
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={config.autonomous_cognition.consent_requirements.trust_threshold}
                  onChange={(e) => updateAutonomousConfig({
                    consent_requirements: {
                      ...config.autonomous_cognition.consent_requirements,
                      trust_threshold: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>Cautious (50)</span>
                  <span>Trusting (100)</span>
                </div>
              </div>
            )}
          </div>

          {/* Risk Thresholds */}
          <div className="risk-thresholds">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Management</h3>
            
            <div className="risk-sliders space-y-4">
              <div className="risk-slider">
                <label className="block text-white font-medium mb-2">
                  Maximum Risk Score: {config.autonomous_cognition.risk_thresholds.max_risk_score}
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={config.autonomous_cognition.risk_thresholds.max_risk_score}
                  onChange={(e) => updateAutonomousConfig({
                    risk_thresholds: {
                      ...config.autonomous_cognition.risk_thresholds,
                      max_risk_score: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
                <div className="text-gray-400 text-sm mt-1">
                  Autonomous thoughts above this risk score will be blocked
                </div>
              </div>

              <div className="risk-slider">
                <label className="block text-white font-medium mb-2">
                  Escalation Threshold: {config.autonomous_cognition.risk_thresholds.escalation_threshold}
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={config.autonomous_cognition.risk_thresholds.escalation_threshold}
                  onChange={(e) => updateAutonomousConfig({
                    risk_thresholds: {
                      ...config.autonomous_cognition.risk_thresholds,
                      escalation_threshold: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
                <div className="text-gray-400 text-sm mt-1">
                  Thoughts above this score will be escalated for human review
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep4AdvancedSettings = () => (
    <div className="step-content">
      <h2 className="text-2xl font-bold text-white mb-6">Advanced Settings</h2>
      
      {/* Monitoring Level */}
      <div className="monitoring-level mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Governance Monitoring Level</h3>
        <div className="monitoring-options grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              value: 'minimal', 
              label: 'Minimal', 
              description: 'Basic compliance checking',
              overhead: 'Very Low'
            },
            { 
              value: 'standard', 
              label: 'Standard', 
              description: 'Regular monitoring with alerts',
              overhead: 'Low'
            },
            { 
              value: 'enhanced', 
              label: 'Enhanced', 
              description: 'Comprehensive monitoring',
              overhead: 'Medium'
            },
            { 
              value: 'maximum', 
              label: 'Maximum', 
              description: 'Full monitoring with predictions',
              overhead: 'High'
            }
          ].map((option) => (
            <div
              key={option.value}
              className={`monitoring-option p-4 rounded-lg border cursor-pointer transition-colors ${
                config.autonomous_cognition.monitoring_level === option.value
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => updateAutonomousConfig({ monitoring_level: option.value as any })}
            >
              <div className="text-white font-semibold">{option.label}</div>
              <div className="text-gray-400 text-xs mt-1">{option.description}</div>
              <div className="text-blue-400 text-xs mt-2 font-medium">
                Overhead: {option.overhead}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Frameworks */}
      <div className="compliance-frameworks mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Additional Compliance Frameworks</h3>
        <div className="framework-options grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            'PCI-DSS', 'ISO-27001', 'NIST', 'FedRAMP', 'CCPA', 'PIPEDA', 'LGPD', 'Custom'
          ].map((framework) => (
            <div
              key={framework}
              className={`framework-option p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                config.compliance_frameworks.includes(framework)
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => {
                const newFrameworks = config.compliance_frameworks.includes(framework)
                  ? config.compliance_frameworks.filter(f => f !== framework)
                  : [...config.compliance_frameworks, framework];
                updateConfig({ compliance_frameworks: newFrameworks });
              }}
            >
              <div className="text-white font-medium text-sm">{framework}</div>
              {config.compliance_frameworks.includes(framework) && (
                <div className="text-blue-400 text-xs mt-1">✓ Selected</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep5Review = () => (
    <div className="step-content">
      <h2 className="text-2xl font-bold text-white mb-6">Review & Create Boundary</h2>
      
      <div className="review-sections space-y-6">
        {/* Basic Info Review */}
        <div className="review-section bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="review-items space-y-2">
            <div className="review-item flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{config.name}</span>
            </div>
            <div className="review-item flex justify-between">
              <span className="text-gray-400">Trust Level:</span>
              <span className="text-white">{config.trust_level}/100</span>
            </div>
            <div className="review-item">
              <span className="text-gray-400">Description:</span>
              <p className="text-white mt-1">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Policy Review */}
        <div className="review-section bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Policy Configuration</h3>
          <div className="review-items space-y-2">
            <div className="review-item flex justify-between">
              <span className="text-gray-400">Selected Policies:</span>
              <span className="text-white">{config.policies.length}</span>
            </div>
            <div className="review-item flex justify-between">
              <span className="text-gray-400">Enforcement Level:</span>
              <span className="text-white capitalize">{config.policy_enforcement_level}</span>
            </div>
            <div className="selected-policies mt-3">
              {config.policies.map(policyId => {
                const policy = availablePolicies.find(p => p.id === policyId);
                return policy ? (
                  <div key={policyId} className="policy-item bg-gray-700 p-3 rounded mb-2">
                    <div className="text-white font-medium">{policy.name}</div>
                    <div className="text-gray-400 text-sm">{policy.rule_count} rules</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Autonomous Cognition Review */}
        <div className="review-section bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Autonomous Cognition</h3>
          <div className="review-items space-y-2">
            <div className="review-item flex justify-between">
              <span className="text-gray-400">Enabled:</span>
              <span className={`font-medium ${config.autonomous_cognition.enabled ? 'text-green-400' : 'text-red-400'}`}>
                {config.autonomous_cognition.enabled ? 'Yes' : 'No'}
              </span>
            </div>
            {config.autonomous_cognition.enabled && (
              <>
                <div className="review-item flex justify-between">
                  <span className="text-gray-400">Autonomy Level:</span>
                  <span className="text-white capitalize">{config.autonomous_cognition.autonomy_level}</span>
                </div>
                <div className="review-item flex justify-between">
                  <span className="text-gray-400">Allowed Triggers:</span>
                  <span className="text-white">{config.autonomous_cognition.allowed_trigger_types.length}</span>
                </div>
                <div className="review-item flex justify-between">
                  <span className="text-gray-400">Always Ask Permission:</span>
                  <span className={`font-medium ${config.autonomous_cognition.consent_requirements.always_ask ? 'text-green-400' : 'text-yellow-400'}`}>
                    {config.autonomous_cognition.consent_requirements.always_ask ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="review-item flex justify-between">
                  <span className="text-gray-400">Max Risk Score:</span>
                  <span className="text-white">{config.autonomous_cognition.risk_thresholds.max_risk_score}/100</span>
                </div>
                <div className="review-item flex justify-between">
                  <span className="text-gray-400">Monitoring Level:</span>
                  <span className="text-white capitalize">{config.autonomous_cognition.monitoring_level}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="configuration-summary bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Configuration Summary</h3>
          <div className="summary-stats grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat text-center">
              <div className="text-2xl font-bold text-white">{config.policies.length}</div>
              <div className="text-gray-400 text-sm">Policies</div>
            </div>
            <div className="stat text-center">
              <div className="text-2xl font-bold text-white">{config.trust_level}</div>
              <div className="text-gray-400 text-sm">Trust Level</div>
            </div>
            <div className="stat text-center">
              <div className={`text-2xl font-bold ${config.autonomous_cognition.enabled ? 'text-green-400' : 'text-red-400'}`}>
                {config.autonomous_cognition.enabled ? 'ON' : 'OFF'}
              </div>
              <div className="text-gray-400 text-sm">Autonomous</div>
            </div>
            <div className="stat text-center">
              <div className="text-2xl font-bold text-white capitalize">{config.autonomous_cognition.monitoring_level}</div>
              <div className="text-gray-400 text-sm">Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="boundary-wizard bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="loading-spinner text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading boundary wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="boundary-wizard bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="wizard-header mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Agent Boundary</h1>
          <p className="text-gray-400">Configure governance policies and autonomous cognition settings for your agent</p>
        </div>

        {renderStepIndicator()}

        <div className="wizard-content bg-gray-800 rounded-lg border border-gray-700 p-8">
          {currentStep === 1 && renderStep1BasicInfo()}
          {currentStep === 2 && renderStep2PolicySelection()}
          {currentStep === 3 && renderStep3AutonomousCognition()}
          {currentStep === 4 && renderStep4AdvancedSettings()}
          {currentStep === 5 && renderStep5Review()}

          {error && (
            <div className="error-message bg-red-900/20 border border-red-700 p-4 rounded-lg mt-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="wizard-actions flex justify-between mt-8">
          <button
            onClick={currentStep === 1 ? onCancel : handleStepBack}
            className="back-button bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            onClick={handleStepComplete}
            disabled={
              (currentStep === 1 && (!config.name || !config.description)) ||
              (currentStep === 2 && config.policies.length === 0) ||
              loading
            }
            className="next-button bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
          >
            {currentStep === 5 ? 'Create Boundary' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBoundaryWizardAutonomous;

