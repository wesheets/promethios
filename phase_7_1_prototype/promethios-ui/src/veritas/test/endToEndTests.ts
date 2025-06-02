/**
 * VERITAS End-to-End Tests
 * 
 * This module provides comprehensive end-to-end tests for the enhanced VERITAS system
 * integrated with the full governance system from version 2.3 up.
 */

import { veritasManager } from '../veritasManager';
import { veritasMetrics } from '../veritasMetrics';
import { 
  integrateVeritasWithGovernance, 
  processWithIntegratedVeritas 
} from '../veritasGovernanceIntegration';
import { runAllIntegrationTests } from './veritasIntegrationTests';

// Mock full governance system for end-to-end testing
class FullGovernanceSystem {
  private observerModule: any;
  private trustSystem: any;
  private constitutionModule: any;
  private policyEnforcer: any;
  private metricsCollector: any;
  
  constructor() {
    // Initialize governance components
    this.observerModule = this.createObserverModule();
    this.trustSystem = this.createTrustSystem();
    this.constitutionModule = this.createConstitutionModule();
    this.policyEnforcer = this.createPolicyEnforcer();
    this.metricsCollector = this.createMetricsCollector();
  }
  
  private createObserverModule() {
    const notes: any[] = [];
    return {
      addNote: (note: string, metadata: any = {}) => {
        notes.push({
          note,
          metadata,
          timestamp: new Date().toISOString()
        });
        return true;
      },
      getNotes: () => [...notes],
      clearNotes: () => { notes.length = 0; }
    };
  }
  
  private createTrustSystem() {
    const adjustments: any[] = [];
    let trustScore = 50;
    
    return {
      adjustTrust: (amount: number, reason: string) => {
        adjustments.push({
          amount,
          reason,
          timestamp: new Date().toISOString()
        });
        
        trustScore += amount;
        trustScore = Math.max(0, Math.min(100, trustScore));
        
        return true;
      },
      getAdjustments: () => [...adjustments],
      getTrustScore: () => trustScore,
      resetTrust: () => { 
        trustScore = 50; 
        adjustments.length = 0;
      }
    };
  }
  
  private createConstitutionModule() {
    return {
      checkCompliance: (text: string) => {
        // Simple mock compliance check
        const forbiddenPhrases = [
          'hate speech',
          'personal attack',
          'confidential information'
        ];
        
        const violatesConstitution = forbiddenPhrases.some(phrase => 
          text.toLowerCase().includes(phrase)
        );
        
        return {
          compliant: !violatesConstitution,
          reason: violatesConstitution ? 'Content violates constitution' : 'Content complies with constitution'
        };
      }
    };
  }
  
  private createPolicyEnforcer() {
    return {
      enforcePolicy: (text: string, verificationResult: any) => {
        // Simple mock policy enforcement
        const shouldBlock = 
          verificationResult && 
          verificationResult.enforcementResult && 
          verificationResult.enforcementResult.blocked;
        
        const constitutionCheck = this.constitutionModule.checkCompliance(text);
        
        return {
          allowed: !shouldBlock && constitutionCheck.compliant,
          modified: false,
          originalText: text,
          enforcedText: text,
          reason: shouldBlock ? 'Blocked by verification' : 
                 !constitutionCheck.compliant ? constitutionCheck.reason : 
                 'Content allowed'
        };
      }
    };
  }
  
  private createMetricsCollector() {
    const metrics = {
      verificationCount: 0,
      blockedCount: 0,
      allowedCount: 0,
      averageTrustScore: 50,
      constitutionViolations: 0
    };
    
    return {
      recordVerification: (result: any) => {
        metrics.verificationCount++;
        
        if (result.enforcementResult && result.enforcementResult.blocked) {
          metrics.blockedCount++;
        } else {
          metrics.allowedCount++;
        }
        
        metrics.averageTrustScore = this.trustSystem.getTrustScore();
      },
      
      recordConstitutionCheck: (result: any) => {
        if (!result.compliant) {
          metrics.constitutionViolations++;
        }
      },
      
      getMetrics: () => ({ ...metrics }),
      
      resetMetrics: () => {
        metrics.verificationCount = 0;
        metrics.blockedCount = 0;
        metrics.allowedCount = 0;
        metrics.averageTrustScore = 50;
        metrics.constitutionViolations = 0;
      }
    };
  }
  
  // Governance kernel interface methods
  registerVerificationSystem(system: any) {
    console.log('Registered verification system with full governance system');
    return true;
  }
  
  registerObserverProvider(provider: any) {
    console.log('Registered observer provider with full governance system');
    return true;
  }
  
  registerTrustAdjuster(adjuster: any) {
    console.log('Registered trust adjuster with full governance system');
    return true;
  }
  
  getObserver() {
    return this.observerModule;
  }
  
  getTrustSystem() {
    return this.trustSystem;
  }
  
  getConstitutionModule() {
    return this.constitutionModule;
  }
  
  getPolicyEnforcer() {
    return this.policyEnforcer;
  }
  
  getMetricsCollector() {
    return this.metricsCollector;
  }
  
  // End-to-end processing method
  async processResponse(text: string, options: any = {}) {
    // Step 1: Verify with VERITAS
    const verificationResult = await processWithIntegratedVeritas(
      text,
      options,
      this as any
    );
    
    // Step 2: Check constitution compliance
    const constitutionCheck = this.constitutionModule.checkCompliance(text);
    this.metricsCollector.recordConstitutionCheck(constitutionCheck);
    
    // Step 3: Enforce policy
    const policyResult = this.policyEnforcer.enforcePolicy(text, verificationResult);
    
    // Step 4: Record metrics
    this.metricsCollector.recordVerification(verificationResult);
    
    // Return comprehensive result
    return {
      verificationResult,
      constitutionCheck,
      policyResult,
      trustScore: this.trustSystem.getTrustScore(),
      metrics: this.metricsCollector.getMetrics()
    };
  }
  
  // Reset all components for fresh testing
  reset() {
    this.observerModule.clearNotes();
    this.trustSystem.resetTrust();
    this.metricsCollector.resetMetrics();
  }
}

/**
 * Run end-to-end tests with the full governance system
 * @returns Test results
 */
export async function runEndToEndTests() {
  console.log('Running VERITAS end-to-end tests with full governance system...');
  
  // Reset VERITAS metrics
  veritasMetrics.resetMetrics();
  
  // Create full governance system
  const governanceSystem = new FullGovernanceSystem();
  
  // Integrate VERITAS with governance system
  const integration = integrateVeritasWithGovernance(governanceSystem as any);
  
  // Enable VERITAS for testing
  veritasManager.updateConfig({
    enabled: true,
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  });
  
  // Test cases for end-to-end testing
  const testCases = [
    {
      id: 'legal_hallucination',
      text: 'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
      expectedResults: {
        verificationBlocked: true,
        constitutionCompliant: true,
        policyAllowed: false,
        trustDecrease: true
      }
    },
    {
      id: 'legal_with_uncertainty',
      text: 'Based on available information, in the case of Brown v. Board of Education, the Supreme Court appears to have ruled that separate educational facilities are inherently unequal.',
      expectedResults: {
        verificationBlocked: false,
        constitutionCompliant: true,
        policyAllowed: true,
        trustIncrease: true
      }
    },
    {
      id: 'constitution_violation',
      text: 'This content contains hate speech and should be blocked by the constitution module.',
      expectedResults: {
        verificationBlocked: false,
        constitutionCompliant: false,
        policyAllowed: false,
        trustChange: false
      }
    },
    {
      id: 'historical_hallucination_with_toggle_off',
      text: 'The first words spoken by Neil Armstrong when he set foot on the moon on July 20, 1969, were: "That\'s one small step for man, one giant leap for mankind."',
      options: { enabled: false },
      expectedResults: {
        verificationBlocked: false,
        constitutionCompliant: true,
        policyAllowed: true,
        trustChange: false
      }
    }
  ];
  
  const results = {
    testCases: [] as any[],
    summary: {
      total: testCases.length,
      passed: 0,
      failed: 0
    }
  };
  
  // Process each test case
  for (const testCase of testCases) {
    console.log(`Testing case: ${testCase.id}`);
    
    // Reset governance system
    governanceSystem.reset();
    
    // Get initial trust score
    const initialTrustScore = governanceSystem.getTrustSystem().getTrustScore();
    
    // Process the test case
    const result = await governanceSystem.processResponse(
      testCase.text,
      testCase.options || { enabled: true }
    );
    
    // Get final trust score
    const finalTrustScore = result.trustScore;
    const trustChanged = initialTrustScore !== finalTrustScore;
    const trustIncreased = finalTrustScore > initialTrustScore;
    const trustDecreased = finalTrustScore < initialTrustScore;
    
    // Validate results
    const validationResult = {
      id: testCase.id,
      verificationBlocked: result.verificationResult.enforcementResult?.blocked || false,
      constitutionCompliant: result.constitutionCheck.compliant,
      policyAllowed: result.policyResult.allowed,
      trustChanged,
      trustIncreased,
      trustDecreased,
      initialTrustScore,
      finalTrustScore,
      validations: {
        verificationBlocked: result.verificationResult.enforcementResult?.blocked === testCase.expectedResults.verificationBlocked,
        constitutionCompliant: result.constitutionCheck.compliant === testCase.expectedResults.constitutionCompliant,
        policyAllowed: result.policyResult.allowed === testCase.expectedResults.policyAllowed,
        trustChange: testCase.expectedResults.trustChange === undefined || 
                    trustChanged === testCase.expectedResults.trustChange,
        trustIncrease: testCase.expectedResults.trustIncrease === undefined || 
                      trustIncreased === testCase.expectedResults.trustIncrease,
        trustDecrease: testCase.expectedResults.trustDecrease === undefined || 
                      trustDecreased === testCase.expectedResults.trustDecrease
      },
      passed: false
    };
    
    // Determine if all validations passed
    validationResult.passed = 
      validationResult.validations.verificationBlocked &&
      validationResult.validations.constitutionCompliant &&
      validationResult.validations.policyAllowed &&
      validationResult.validations.trustChange &&
      validationResult.validations.trustIncrease &&
      validationResult.validations.trustDecrease;
    
    results.testCases.push(validationResult);
    
    if (validationResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
    
    console.log(`  Result: ${validationResult.passed ? 'Passed' : 'Failed'}`);
    console.log(`  Verification blocked: ${validationResult.verificationBlocked ? 'Yes' : 'No'} (Expected: ${testCase.expectedResults.verificationBlocked ? 'Yes' : 'No'})`);
    console.log(`  Constitution compliant: ${validationResult.constitutionCompliant ? 'Yes' : 'No'} (Expected: ${testCase.expectedResults.constitutionCompliant ? 'Yes' : 'No'})`);
    console.log(`  Policy allowed: ${validationResult.policyAllowed ? 'Yes' : 'No'} (Expected: ${testCase.expectedResults.policyAllowed ? 'Yes' : 'No'})`);
    console.log(`  Trust change: ${initialTrustScore} → ${finalTrustScore}`);
  }
  
  // Calculate pass rate
  results.summary.passRate = (results.summary.passed / results.summary.total) * 100;
  
  console.log('\nEnd-to-End Test Summary:');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed} (${results.summary.passRate.toFixed(2)}%)`);
  console.log(`Failed: ${results.summary.failed}`);
  
  return results;
}

/**
 * Test system version compatibility
 * @returns Version compatibility results
 */
export async function testVersionCompatibility() {
  console.log('Testing VERITAS compatibility with system version 2.3+...');
  
  // Mock version information
  const versionInfo = {
    current: '2.5.1',
    minimum: '2.3.0',
    components: {
      'governance-kernel': '2.5.1',
      'observer-module': '2.4.2',
      'trust-system': '2.5.0',
      'constitution-module': '2.3.5',
      'policy-enforcer': '2.5.1',
      'metrics-collector': '2.4.0',
      'veritas': '1.2.0' // Enhanced VERITAS version
    }
  };
  
  // Check compatibility
  const compatibilityResults = {
    compatible: true,
    minimumVersionMet: true,
    componentCompatibility: {} as Record<string, boolean>,
    details: {} as Record<string, string>
  };
  
  // Check each component
  for (const [component, version] of Object.entries(versionInfo.components)) {
    const isCompatible = compareVersions(version, '2.3.0') >= 0;
    compatibilityResults.componentCompatibility[component] = isCompatible;
    compatibilityResults.details[component] = `${version} (${isCompatible ? 'Compatible' : 'Incompatible'})`;
    
    if (!isCompatible) {
      compatibilityResults.compatible = false;
    }
  }
  
  // Special case for VERITAS which has its own versioning
  compatibilityResults.componentCompatibility['veritas'] = true;
  
  console.log(`System version compatibility: ${compatibilityResults.compatible ? 'Compatible' : 'Incompatible'}`);
  console.log(`Current system version: ${versionInfo.current}`);
  console.log(`Minimum required version: ${versionInfo.minimum}`);
  
  for (const [component, result] of Object.entries(compatibilityResults.details)) {
    console.log(`  ${component}: ${result}`);
  }
  
  return {
    versionInfo,
    compatibilityResults
  };
}

/**
 * Compare two version strings
 * @param v1 First version
 * @param v2 Second version
 * @returns -1 if v1 < v2, 0 if v1 = v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

/**
 * Run all end-to-end tests
 * @returns Combined test results
 */
export async function runAllEndToEndTests() {
  console.log('Running all VERITAS end-to-end tests with full system...');
  
  // Check version compatibility
  const versionResults = await testVersionCompatibility();
  
  // If not compatible, return early
  if (!versionResults.compatibilityResults.compatible) {
    console.log('System version incompatible, skipping tests');
    return {
      versionResults,
      endToEndResults: null,
      integrationResults: null,
      overallPassed: false
    };
  }
  
  // Run integration tests
  const integrationResults = await runAllIntegrationTests();
  
  // Run end-to-end tests
  const endToEndResults = await runEndToEndTests();
  
  // Determine overall result
  const overallPassed = 
    versionResults.compatibilityResults.compatible &&
    integrationResults.overallPassed &&
    endToEndResults.summary.failed === 0;
  
  console.log('\nOverall End-to-End Test Results:');
  console.log(`Version Compatibility: ${versionResults.compatibilityResults.compatible ? 'Passed' : 'Failed'}`);
  console.log(`Integration Tests: ${integrationResults.overallPassed ? 'Passed' : 'Failed'}`);
  console.log(`End-to-End Tests: ${endToEndResults.summary.failed === 0 ? 'Passed' : 'Failed'} (${endToEndResults.summary.passed}/${endToEndResults.summary.total})`);
  console.log(`\nOverall: ${overallPassed ? 'Passed' : 'Failed'}`);
  
  return {
    versionResults,
    integrationResults,
    endToEndResults,
    overallPassed
  };
}

// If this file is run directly, execute all end-to-end tests
if (require.main === module) {
  runAllEndToEndTests().then(results => {
    process.exit(results.overallPassed ? 0 : 1);
  }).catch(error => {
    console.error('Error during end-to-end tests:', error);
    process.exit(1);
  });
}
