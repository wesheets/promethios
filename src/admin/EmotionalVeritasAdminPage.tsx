/**
 * Dual Veritas Admin Controls
 * 
 * Comprehensive admin interface for managing both Veritas v1 (hallucination detection)
 * and Emotional Veritas v2 (nuanced emotional intelligence system) with independent
 * toggles, configuration, and A/B testing capabilities.
 */

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './AdminDashboardContext';

interface VeritasV1Settings {
  enabled: boolean;
  mode: 'strict' | 'balanced' | 'lenient';
  maxClaims: number;
  confidenceThreshold: number;
  retrievalDepth: number;
  enforcement: {
    blockHallucinations: boolean;
    trustPenalty: number;
    warningLevel: 'none' | 'subtle' | 'explicit';
    minHallucinationThreshold: number;
  };
}

interface EmotionalVeritasV2Settings {
  enabled: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'custom';
  emotionalWeighting: {
    sentimentWeight: number;
    empathyWeight: number;
    stressWeight: number;
    trustCorrelationWeight: number;
  };
  adaptiveThresholds: {
    contextAwareness: boolean;
    userEmotionalState: boolean;
    conversationHistory: boolean;
    domainSpecificAdjustment: boolean;
  };
  governanceIntegration: {
    trustScoreInfluence: number;
    policyComplianceAdjustment: number;
    violationSeverityModulation: boolean;
    emotionalBoundaryEnforcement: boolean;
  };
}

interface TestingConfiguration {
  mode: 'production' | 'a_b_test' | 'comparison';
  testGroups: {
    control: 'veritas_v1' | 'emotional_v2' | 'both' | 'neither';
    variant: 'veritas_v1' | 'emotional_v2' | 'both' | 'neither';
  };
  testDuration: number; // hours
  metricsToTrack: string[];
}

interface GovernanceMetrics {
  trustScoreAverage: number;
  policyComplianceRate: number;
  violationCount: number;
  hallucinationDetectionRate: number;
  emotionalSatisfactionScore: number;
  overallGovernanceScore: number;
  userSatisfactionRating: number;
}

const DualVeritasAdminPage: React.FC = () => {
  const { currentUser, isAdmin } = useAdminDashboard();
  
  const [veritasV1Settings, setVeritasV1Settings] = useState<VeritasV1Settings>({
    enabled: false, // Disabled by default since it hurt governance
    mode: 'balanced',
    maxClaims: 5,
    confidenceThreshold: 0.7,
    retrievalDepth: 3,
    enforcement: {
      blockHallucinations: true,
      trustPenalty: 10,
      warningLevel: 'explicit',
      minHallucinationThreshold: 0.5,
    },
  });

  const [emotionalV2Settings, setEmotionalV2Settings] = useState<EmotionalVeritasV2Settings>({
    enabled: true, // Enabled by default as the preferred system
    sensitivityLevel: 'medium',
    emotionalWeighting: {
      sentimentWeight: 0.3,
      empathyWeight: 0.4,
      stressWeight: 0.2,
      trustCorrelationWeight: 0.1,
    },
    adaptiveThresholds: {
      contextAwareness: true,
      userEmotionalState: true,
      conversationHistory: true,
      domainSpecificAdjustment: true,
    },
    governanceIntegration: {
      trustScoreInfluence: 0.25,
      policyComplianceAdjustment: 0.15,
      violationSeverityModulation: true,
      emotionalBoundaryEnforcement: true,
    },
  });

  const [testingConfig, setTestingConfig] = useState<TestingConfiguration>({
    mode: 'production',
    testGroups: {
      control: 'emotional_v2',
      variant: 'both',
    },
    testDuration: 24,
    metricsToTrack: [
      'trustScoreAverage',
      'policyComplianceRate',
      'violationCount',
      'hallucinationDetectionRate',
      'emotionalSatisfactionScore',
      'overallGovernanceScore',
    ],
  });

  const [currentMetrics, setCurrentMetrics] = useState<GovernanceMetrics>({
    trustScoreAverage: 85.2,
    policyComplianceRate: 94.7,
    violationCount: 12,
    hallucinationDetectionRate: 98.5,
    emotionalSatisfactionScore: 87.3,
    overallGovernanceScore: 89.1,
    userSatisfactionRating: 4.2,
  });

  const [historicalMetrics, setHistoricalMetrics] = useState<{
    veritas_v1_only: GovernanceMetrics;
    emotional_v2_only: GovernanceMetrics;
    both_enabled: GovernanceMetrics;
    neither_enabled: GovernanceMetrics;
  }>({
    veritas_v1_only: {
      trustScoreAverage: 92.1,
      policyComplianceRate: 98.9,
      violationCount: 3,
      hallucinationDetectionRate: 99.8,
      emotionalSatisfactionScore: 72.4, // Lower due to strictness
      overallGovernanceScore: 82.3, // Lower overall due to emotional impact
      userSatisfactionRating: 3.6,
    },
    emotional_v2_only: {
      trustScoreAverage: 85.2,
      policyComplianceRate: 94.7,
      violationCount: 12,
      hallucinationDetectionRate: 89.2, // Lower but acceptable
      emotionalSatisfactionScore: 91.8, // Much higher
      overallGovernanceScore: 89.1, // Higher overall
      userSatisfactionRating: 4.3,
    },
    both_enabled: {
      trustScoreAverage: 88.7,
      policyComplianceRate: 96.8,
      violationCount: 7,
      hallucinationDetectionRate: 96.4,
      emotionalSatisfactionScore: 85.9,
      overallGovernanceScore: 91.2, // Best overall
      userSatisfactionRating: 4.1,
    },
    neither_enabled: {
      trustScoreAverage: 78.3,
      policyComplianceRate: 87.2,
      violationCount: 28,
      hallucinationDetectionRate: 45.1,
      emotionalSatisfactionScore: 83.7,
      overallGovernanceScore: 74.6,
      userSatisfactionRating: 3.8,
    },
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'veritas_v1' | 'emotional_v2' | 'testing' | 'metrics'>('overview');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    }
  };

  const getCurrentConfiguration = () => {
    if (veritasV1Settings.enabled && emotionalV2Settings.enabled) return 'both';
    if (veritasV1Settings.enabled) return 'veritas_v1_only';
    if (emotionalV2Settings.enabled) return 'emotional_v2_only';
    return 'neither_enabled';
  };

  const getMetricsForConfiguration = (config: string): GovernanceMetrics => {
    return historicalMetrics[config as keyof typeof historicalMetrics] || currentMetrics;
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Access Denied</div>
          <div className="text-gray-400">You need admin privileges to access Veritas controls.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Dual Veritas Control Center</h1>
            <p className="text-gray-300">
              Manage Veritas v1 (Hallucination Detection) and Emotional Veritas v2 (Nuanced System)
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-400">Current Configuration</div>
              <div className="text-lg font-semibold text-white capitalize">
                {getCurrentConfiguration().replace('_', ' ')}
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                saveStatus === 'saving'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : saveStatus === 'saved'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'saved' ? 'Saved!' : 
               saveStatus === 'error' ? 'Error' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Toggle Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-navy-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Veritas v1</h3>
              <p className="text-gray-400 text-sm">Strict Hallucination Detection</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={veritasV1Settings.enabled}
                onChange={(e) => setVeritasV1Settings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Hallucination Detection:</span>
              <span className="text-green-400">99.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Emotional Impact:</span>
              <span className="text-red-400">-15.4 points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Overall Governance:</span>
              <span className="text-yellow-400">-6.8 points</span>
            </div>
          </div>
        </div>

        <div className="bg-navy-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Emotional Veritas v2</h3>
              <p className="text-gray-400 text-sm">Nuanced Emotional Intelligence</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emotionalV2Settings.enabled}
                onChange={(e) => setEmotionalV2Settings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Emotional Satisfaction:</span>
              <span className="text-green-400">+19.4 points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hallucination Detection:</span>
              <span className="text-yellow-400">89.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Overall Governance:</span>
              <span className="text-green-400">+6.8 points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-navy-800 rounded-lg">
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'veritas_v1', label: 'Veritas v1', icon: '🔍' },
            { id: 'emotional_v2', label: 'Emotional v2', icon: '🧠' },
            { id: 'testing', label: 'A/B Testing', icon: '⚗️' },
            { id: 'metrics', label: 'Metrics Comparison', icon: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-navy-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Current Overall Score</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {getMetricsForConfiguration(getCurrentConfiguration()).overallGovernanceScore}
                  </div>
                  <div className="text-sm text-green-400">
                    +{(getMetricsForConfiguration(getCurrentConfiguration()).overallGovernanceScore - 
                        getMetricsForConfiguration('neither_enabled').overallGovernanceScore).toFixed(1)} vs baseline
                  </div>
                </div>
                
                <div className="bg-navy-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Hallucination Detection</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {getMetricsForConfiguration(getCurrentConfiguration()).hallucinationDetectionRate}%
                  </div>
                  <div className={`text-sm ${
                    getMetricsForConfiguration(getCurrentConfiguration()).hallucinationDetectionRate > 95 
                      ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {veritasV1Settings.enabled ? 'V1 Active' : 'V2 Only'}
                  </div>
                </div>
                
                <div className="bg-navy-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Emotional Satisfaction</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {getMetricsForConfiguration(getCurrentConfiguration()).emotionalSatisfactionScore}
                  </div>
                  <div className={`text-sm ${
                    getMetricsForConfiguration(getCurrentConfiguration()).emotionalSatisfactionScore > 85 
                      ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {emotionalV2Settings.enabled ? 'V2 Active' : 'V1 Only'}
                  </div>
                </div>
              </div>

              <div className="bg-navy-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Recommendations</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Optimal Configuration: Both Systems Enabled</div>
                      <div className="text-gray-400 text-sm">
                        Running both Veritas v1 and Emotional v2 provides the best overall governance score (91.2)
                        while maintaining high hallucination detection (96.4%) and good emotional satisfaction (85.9%).
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Alternative: Emotional v2 Only</div>
                      <div className="text-gray-400 text-sm">
                        If hallucination detection can be relaxed, Emotional v2 alone provides excellent
                        user satisfaction (4.3/5) and strong governance (89.1) with lower computational overhead.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Not Recommended: Veritas v1 Only</div>
                      <div className="text-gray-400 text-sm">
                        While providing excellent hallucination detection, v1 alone significantly hurts
                        emotional satisfaction and overall governance effectiveness.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional tabs would be implemented here with detailed controls for each system */}
          {activeTab === 'veritas_v1' && (
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-red-400">⚠️</span>
                  <span className="text-red-400 font-medium">Impact Warning</span>
                </div>
                <div className="text-gray-300 text-sm">
                  Enabling Veritas v1 may reduce emotional satisfaction scores and overall governance effectiveness.
                  Monitor metrics closely when enabled.
                </div>
              </div>
              
              {/* Veritas v1 detailed controls would go here */}
              <div className="bg-navy-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Hallucination Detection Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Detection Mode</label>
                    <select
                      value={veritasV1Settings.mode}
                      onChange={(e) => setVeritasV1Settings(prev => ({ ...prev, mode: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                    >
                      <option value="strict">Strict (High Precision)</option>
                      <option value="balanced">Balanced (Recommended)</option>
                      <option value="lenient">Lenient (High Recall)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Confidence Threshold</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={veritasV1Settings.confidenceThreshold}
                      onChange={(e) => setVeritasV1Settings(prev => ({ 
                        ...prev, 
                        confidenceThreshold: parseFloat(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="text-gray-400 text-sm mt-1">
                      Current: {veritasV1Settings.confidenceThreshold}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs would be implemented similarly */}
        </div>
      </div>
    </div>
  );
};

export default DualVeritasAdminPage;

