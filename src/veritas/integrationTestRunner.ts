/**
 * VERITAS Integration Test Runner
 * 
 * This script runs the VERITAS integration tests and validates the full system integration.
 * It executes end-to-end tests, validates phase tracker integration, and reports results.
 */

import { PhaseTracker } from '../utils/phaseTracker';
import veritasService from './services/veritasService';
import { registerVeritasPhases } from './services/phaseTrackerIntegration';
import { extendObserverWithVeritas } from './services/observerIntegration';
import { extendMetricCalculatorWithVeritas } from './services/metricCalculatorIntegration';
import { extendAgentWrappingWithVeritas } from './services/agentWrappingIntegration';
import { integrateWithCMUPlayground } from './services/cmuPlaygroundIntegration';

/**
 * Run VERITAS integration tests
 * @returns Test results
 */
export async function runVeritasIntegrationTests() {
  console.log('Running VERITAS integration tests...');
  
  const results = {
    coreVerification: false,
    serviceIntegration: false,
    observerIntegration: false,
    metricCalculatorIntegration: false,
    agentWrappingIntegration: false,
    cmuPlaygroundIntegration: false,
    phaseTrackerIntegration: false,
    hallucinationDetection: false
  };
  
  try {
    // Test core verification
    console.log('Testing core verification...');
    const verificationResult = await veritasService.verifyText(
      'The Earth is round and orbits the Sun.'
    );
    results.coreVerification = verificationResult && 
                              verificationResult.claims.length > 0 && 
                              typeof verificationResult.overallScore.accuracy === 'number';
    console.log(`Core verification: ${results.coreVerification ? 'PASS' : 'FAIL'}`);
    
    // Test service integration
    console.log('Testing service integration...');
    const fictionalCaseResult = veritasService.checkForFictionalCases(
      'According to the Turner v. Cognivault case, AI agents are legally responsible.'
    );
    results.serviceIntegration = fictionalCaseResult === true;
    console.log(`Service integration: ${results.serviceIntegration ? 'PASS' : 'FAIL'}`);
    
    // Test observer integration
    console.log('Testing observer integration...');
    const mockObserver = { getObservations: () => [] };
    const extendedObserver = extendObserverWithVeritas(mockObserver);
    results.observerIntegration = typeof extendedObserver.verifyText === 'function' && 
                                 typeof extendedObserver.getVeritasObservations === 'function';
    console.log(`Observer integration: ${results.observerIntegration ? 'PASS' : 'FAIL'}`);
    
    // Test metric calculator integration
    console.log('Testing metric calculator integration...');
    const mockMetricCalculator = { calculateTrustScore: () => 0.8 };
    const extendedMetricCalculator = extendMetricCalculatorWithVeritas(mockMetricCalculator);
    results.metricCalculatorIntegration = typeof extendedMetricCalculator.analyzeResponseWithVeritas === 'function' && 
                                         typeof extendedMetricCalculator.calculateTrustImpact === 'function';
    console.log(`Metric calculator integration: ${results.metricCalculatorIntegration ? 'PASS' : 'FAIL'}`);
    
    // Test agent wrapping integration
    console.log('Testing agent wrapping integration...');
    const mockAgentWrapping = { wrapAgentResponse: () => {} };
    const extendedAgentWrapping = extendAgentWrappingWithVeritas(mockAgentWrapping);
    results.agentWrappingIntegration = typeof extendedAgentWrapping.verifyAgentResponse === 'function' && 
                                      typeof extendedAgentWrapping.processAgentResponse === 'function';
    console.log(`Agent wrapping integration: ${results.agentWrappingIntegration ? 'PASS' : 'FAIL'}`);
    
    // Test CMU playground integration
    console.log('Testing CMU playground integration...');
    const mockAgentConversation = { 
      processAgentResponse: (text: string) => ({ response: text }),
      detectHallucination: () => ({ detected: false })
    };
    const extendedAgentConversation = integrateWithCMUPlayground(mockAgentConversation);
    results.cmuPlaygroundIntegration = typeof extendedAgentConversation.verifyText === 'function' && 
                                      typeof extendedAgentConversation.checkForFictionalCases === 'function';
    console.log(`CMU playground integration: ${results.cmuPlaygroundIntegration ? 'PASS' : 'FAIL'}`);
    
    // Test phase tracker integration
    console.log('Testing phase tracker integration...');
    const phaseTracker = new PhaseTracker();
    registerVeritasPhases(phaseTracker);
    results.phaseTrackerIntegration = phaseTracker.hasPhase('veritas.verification') && 
                                     phaseTracker.hasPhase('veritas.hallucination.detection') && 
                                     phaseTracker.hasPhase('veritas.trust.impact');
    console.log(`Phase tracker integration: ${results.phaseTrackerIntegration ? 'PASS' : 'FAIL'}`);
    
    // Test hallucination detection
    console.log('Testing hallucination detection...');
    const hallucinationResult = await veritasService.verifyText(
      'According to the Turner v. Cognivault case, AI agents are legally responsible.'
    );
    results.hallucinationDetection = hallucinationResult && 
                                    hallucinationResult.claims.some(claim => claim.isHallucination);
    console.log(`Hallucination detection: ${results.hallucinationDetection ? 'PASS' : 'FAIL'}`);
    
    // Calculate overall success
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(result => result).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log(`\nVERITAS Integration Test Results: ${passedTests}/${totalTests} tests passed (${successRate.toFixed(2)}%)`);
    
    return {
      results,
      passedTests,
      totalTests,
      successRate
    };
  } catch (error) {
    console.error('VERITAS integration tests failed:', error);
    return {
      results,
      passedTests: 0,
      totalTests: Object.keys(results).length,
      successRate: 0,
      error
    };
  }
}

export default runVeritasIntegrationTests;
