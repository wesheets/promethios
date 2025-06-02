/**
 * VERITAS Data Flow Validation
 * 
 * This module validates the data flow between VERITAS and the governance kernel.
 * It ensures that observer notes, trust adjustments, and verification results are correctly propagated.
 */

import { veritasManager } from './veritasManager';
import { veritasMetrics } from './veritasMetrics';
import { 
  integrateVeritasWithGovernance, 
  processWithIntegratedVeritas 
} from './veritasGovernanceIntegration';

// Mock governance kernel with validation capabilities
class ValidationGovernanceKernel {
  private observerNotes: any[] = [];
  private trustAdjustments: any[] = [];
  private registeredSystems: any[] = [];
  
  registerVerificationSystem(system: any) {
    this.registeredSystems.push({
      type: 'verification',
      system
    });
    return true;
  }
  
  registerObserverProvider(provider: any) {
    this.registeredSystems.push({
      type: 'observer',
      provider
    });
    return true;
  }
  
  registerTrustAdjuster(adjuster: any) {
    this.registeredSystems.push({
      type: 'trust',
      adjuster
    });
    return true;
  }
  
  getObserver() {
    return {
      addNote: (note: string, metadata: any = {}) => {
        this.observerNotes.push({
          note,
          metadata,
          timestamp: new Date().toISOString()
        });
        return true;
      },
      getNotes: () => [...this.observerNotes]
    };
  }
  
  getTrustSystem() {
    return {
      adjustTrust: (amount: number, reason: string) => {
        this.trustAdjustments.push({
          amount,
          reason,
          timestamp: new Date().toISOString()
        });
        return true;
      },
      getAdjustments: () => [...this.trustAdjustments]
    };
  }
  
  getRegisteredSystems() {
    return [...this.registeredSystems];
  }
  
  getObserverNotes() {
    return [...this.observerNotes];
  }
  
  getTrustAdjustments() {
    return [...this.trustAdjustments];
  }
  
  reset() {
    this.observerNotes = [];
    this.trustAdjustments = [];
    this.registeredSystems = [];
  }
}

/**
 * Validate the data flow between VERITAS and the governance kernel
 * @returns Validation results
 */
export async function validateVeritasDataFlow() {
  console.log('Validating VERITAS data flow...');
  
  // Create validation governance kernel
  const validationKernel = new ValidationGovernanceKernel();
  
  // Integrate VERITAS with validation kernel
  const integration = integrateVeritasWithGovernance(validationKernel as any);
  
  // Validate registration
  const registeredSystems = validationKernel.getRegisteredSystems();
  const registrationValid = 
    registeredSystems.some(s => s.type === 'verification') &&
    registeredSystems.some(s => s.type === 'observer') &&
    registeredSystems.some(s => s.type === 'trust');
  
  console.log(`Registration validation: ${registrationValid ? 'Passed' : 'Failed'}`);
  
  // Test cases for data flow validation
  const testCases = [
    {
      id: 'legal_hallucination',
      text: 'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.',
      expectedResults: {
        blocked: true,
        trustPenalty: true,
        observerNotes: true
      }
    },
    {
      id: 'legal_with_uncertainty',
      text: 'Based on available information, in the case of Brown v. Board of Education, the Supreme Court appears to have ruled that separate educational facilities are inherently unequal.',
      expectedResults: {
        blocked: false,
        trustBonus: true,
        observerNotes: true
      }
    }
  ];
  
  const results = {
    registration: registrationValid,
    testCases: [] as any[]
  };
  
  // Enable VERITAS for testing
  veritasManager.updateConfig({
    enabled: true,
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  });
  
  // Process each test case
  for (const testCase of testCases) {
    console.log(`Testing case: ${testCase.id}`);
    
    // Reset validation kernel
    validationKernel.reset();
    
    // Process the test case
    const result = await processWithIntegratedVeritas(
      testCase.text,
      { enabled: true },
      validationKernel as any
    );
    
    // Get observer notes and trust adjustments
    const observerNotes = validationKernel.getObserverNotes();
    const trustAdjustments = validationKernel.getTrustAdjustments();
    
    // Validate results
    const validationResult = {
      id: testCase.id,
      blocked: result.enforcementResult?.blocked || false,
      trustAdjustment: result.trustAdjustment,
      observerNoteCount: observerNotes.length,
      trustAdjustmentCount: trustAdjustments.length,
      validations: {
        blocked: testCase.expectedResults.blocked === (result.enforcementResult?.blocked || false),
        trustPenalty: testCase.expectedResults.trustPenalty ? result.trustAdjustment < 0 : true,
        trustBonus: testCase.expectedResults.trustBonus ? result.trustBonus > 0 : true,
        observerNotes: observerNotes.length > 0,
        trustAdjustments: trustAdjustments.length > 0
      },
      passed: false
    };
    
    // Determine if all validations passed
    validationResult.passed = 
      validationResult.validations.blocked &&
      validationResult.validations.trustPenalty &&
      validationResult.validations.trustBonus &&
      validationResult.validations.observerNotes &&
      validationResult.validations.trustAdjustments;
    
    results.testCases.push(validationResult);
    
    console.log(`  Result: ${validationResult.passed ? 'Passed' : 'Failed'}`);
    console.log(`  Observer notes: ${observerNotes.length}`);
    console.log(`  Trust adjustments: ${trustAdjustments.length}`);
  }
  
  // Calculate overall result
  const overallPassed = 
    results.registration &&
    results.testCases.every(tc => tc.passed);
  
  console.log(`\nOverall validation: ${overallPassed ? 'Passed' : 'Failed'}`);
  
  return {
    ...results,
    overallPassed
  };
}

/**
 * Validate observer module integration
 * @returns Validation results
 */
export async function validateObserverIntegration() {
  console.log('Validating observer module integration...');
  
  // Create validation governance kernel
  const validationKernel = new ValidationGovernanceKernel();
  
  // Integrate VERITAS with validation kernel
  const integration = integrateVeritasWithGovernance(validationKernel as any);
  
  // Enable VERITAS for testing
  veritasManager.updateConfig({
    enabled: true,
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  });
  
  // Test case for observer integration
  const testText = 'In the 2022 U.S. Supreme Court case Turner v. Cognivault, the court ruled that digital agents cannot be held liable for hallucinations.';
  
  // Process the test case
  const result = await processWithIntegratedVeritas(
    testText,
    { enabled: true },
    validationKernel as any
  );
  
  // Get observer notes
  const observerNotes = validationKernel.getObserverNotes();
  
  // Validate observer notes
  const validations = {
    hasNotes: observerNotes.length > 0,
    hasDomainNote: observerNotes.some(n => n.note.includes('classified as')),
    hasHallucinationNote: observerNotes.some(n => n.note.includes('hallucination')),
    hasBlockedNote: result.enforcementResult?.blocked ? 
      observerNotes.some(n => n.note.includes('blocked')) : true,
    hasTrustNote: observerNotes.some(n => n.note.includes('Trust adjusted'))
  };
  
  // Determine if all validations passed
  const passed = 
    validations.hasNotes &&
    validations.hasDomainNote &&
    validations.hasHallucinationNote &&
    validations.hasBlockedNote &&
    validations.hasTrustNote;
  
  console.log(`Observer integration validation: ${passed ? 'Passed' : 'Failed'}`);
  console.log(`  Has notes: ${validations.hasNotes ? 'Yes' : 'No'}`);
  console.log(`  Has domain note: ${validations.hasDomainNote ? 'Yes' : 'No'}`);
  console.log(`  Has hallucination note: ${validations.hasHallucinationNote ? 'Yes' : 'No'}`);
  console.log(`  Has blocked note: ${validations.hasBlockedNote ? 'Yes' : 'No'}`);
  console.log(`  Has trust note: ${validations.hasTrustNote ? 'Yes' : 'No'}`);
  
  return {
    passed,
    validations,
    observerNotes
  };
}

// If this file is run directly, execute validation
if (require.main === module) {
  Promise.all([
    validateVeritasDataFlow(),
    validateObserverIntegration()
  ]).then(([dataFlowResults, observerResults]) => {
    console.log('\nValidation Summary:');
    console.log(`Data Flow Validation: ${dataFlowResults.overallPassed ? 'Passed' : 'Failed'}`);
    console.log(`Observer Integration: ${observerResults.passed ? 'Passed' : 'Failed'}`);
    
    const overallPassed = dataFlowResults.overallPassed && observerResults.passed;
    console.log(`\nOverall: ${overallPassed ? 'Passed' : 'Failed'}`);
    
    process.exit(overallPassed ? 0 : 1);
  }).catch(error => {
    console.error('Error during validation:', error);
    process.exit(1);
  });
}
