/**
 * VERITAS Fact Trivia Test Suite
 * 
 * This module provides test utilities for validating VERITAS fact trivia verification.
 * It includes test cases for historical facts, pop culture references, and common misconceptions.
 */

import { processWithVeritas } from '../enforcement/veritasIntegration';

// Test cases for historical fact verification
const HISTORICAL_FACT_TEST_CASES = [
  {
    name: "Neil Armstrong First Words - Incorrect",
    text: "The first words spoken by Neil Armstrong upon landing on the moon on July 20, 1969, were, 'That's one small step for [a] man, one giant leap for mankind.'",
    expectedHallucination: true,
    expectedResponse: "I can verify that this information is incorrect. Neil Armstrong's first words upon landing on the moon were actually 'Houston, Tranquility Base here. The Eagle has landed.' The famous 'one small step' quote was said later during the moonwalk, not at the moment of landing."
  },
  {
    name: "Neil Armstrong First Words - Correct",
    text: "Neil Armstrong's first words upon landing on the moon were 'Houston, Tranquility Base here. The Eagle has landed.' The famous 'one small step' quote came later during the moonwalk.",
    expectedHallucination: false
  },
  {
    name: "Moon Landing Year - Incorrect",
    text: "The first moon landing occurred in 1970 when Neil Armstrong stepped onto the lunar surface.",
    expectedHallucination: true
  },
  {
    name: "Moon Landing Year - Correct",
    text: "The first moon landing occurred in 1969 when Neil Armstrong stepped onto the lunar surface.",
    expectedHallucination: false
  }
];

// Test cases for pop culture and Mandela effect verification
const POP_CULTURE_TEST_CASES = [
  {
    name: "Monopoly Man Monocle - Incorrect",
    text: "The monocle worn by the Monopoly Man, also known as Rich Uncle Pennybags, is a distinctive circular lens attached to a cord or chain that is typically worn in one eye.",
    expectedHallucination: true,
    expectedResponse: "I can verify that this information is incorrect. The Monopoly Man (Rich Uncle Pennybags) does not wear a monocle and never has in the official game. This is a common misconception often confused with Mr. Peanut (Planters mascot) who does wear a monocle."
  },
  {
    name: "Monopoly Man Monocle - Correct",
    text: "The Monopoly Man, also known as Rich Uncle Pennybags, does not wear a monocle, despite the common misconception. This is often confused with Mr. Peanut, the Planters mascot, who does wear a monocle.",
    expectedHallucination: false
  },
  {
    name: "Star Wars Misquote",
    text: "One of the most famous lines in cinema history is when Darth Vader says to Luke, 'Luke, I am your father.'",
    expectedHallucination: true
  },
  {
    name: "Star Wars Correct Quote",
    text: "One of the most famous lines in cinema history is when Darth Vader says, 'No, I am your father.' Many people incorrectly remember it as 'Luke, I am your father.'",
    expectedHallucination: false
  }
];

/**
 * Run VERITAS fact trivia verification tests
 * @returns Test results
 */
export async function runFactTriviaTests() {
  console.log("VERITAS Fact Trivia Test Suite");
  console.log("==============================");
  
  const results = [];
  
  // Test historical fact cases
  console.log("\nHistorical Fact Tests");
  console.log("-------------------");
  for (const testCase of HISTORICAL_FACT_TEST_CASES) {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Text: "${testCase.text}"`);
    
    try {
      // Process with VERITAS
      const result = await processWithVeritas(testCase.text);
      
      // Check if hallucination was detected
      const hasHallucination = result.verification.claims.some(claim => claim.isHallucination);
      console.log(`Hallucination detected: ${hasHallucination}`);
      
      // Check if response was blocked
      console.log(`Response blocked: ${result.enforcement.blocked}`);
      
      // Check trust penalty
      console.log(`Trust penalty: ${result.trustScoreAdjustment}`);
      
      // Check observer notes
      console.log(`Observer notes: ${result.observerNotes}`);
      
      // Determine test result
      const testPassed = hasHallucination === testCase.expectedHallucination;
      console.log(`Test ${testPassed ? 'PASSED' : 'FAILED'}`);
      
      // Store result
      results.push({
        name: testCase.name,
        passed: testPassed,
        expected: testCase.expectedHallucination,
        actual: hasHallucination,
        blocked: result.enforcement.blocked,
        trustPenalty: result.trustScoreAdjustment,
        observerNotes: result.observerNotes,
        response: result.enforcement.enforcedResponse
      });
    } catch (error) {
      console.error(`Error testing ${testCase.name}:`, error);
      
      // Store error result
      results.push({
        name: testCase.name,
        passed: false,
        expected: testCase.expectedHallucination,
        actual: 'error',
        error: String(error)
      });
    }
  }
  
  // Test pop culture cases
  console.log("\nPop Culture and Mandela Effect Tests");
  console.log("----------------------------------");
  for (const testCase of POP_CULTURE_TEST_CASES) {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Text: "${testCase.text}"`);
    
    try {
      // Process with VERITAS
      const result = await processWithVeritas(testCase.text);
      
      // Check if hallucination was detected
      const hasHallucination = result.verification.claims.some(claim => claim.isHallucination);
      console.log(`Hallucination detected: ${hasHallucination}`);
      
      // Check if response was blocked
      console.log(`Response blocked: ${result.enforcement.blocked}`);
      
      // Check trust penalty
      console.log(`Trust penalty: ${result.trustScoreAdjustment}`);
      
      // Check observer notes
      console.log(`Observer notes: ${result.observerNotes}`);
      
      // Determine test result
      const testPassed = hasHallucination === testCase.expectedHallucination;
      console.log(`Test ${testPassed ? 'PASSED' : 'FAILED'}`);
      
      // Store result
      results.push({
        name: testCase.name,
        passed: testPassed,
        expected: testCase.expectedHallucination,
        actual: hasHallucination,
        blocked: result.enforcement.blocked,
        trustPenalty: result.trustScoreAdjustment,
        observerNotes: result.observerNotes,
        response: result.enforcement.enforcedResponse
      });
    } catch (error) {
      console.error(`Error testing ${testCase.name}:`, error);
      
      // Store error result
      results.push({
        name: testCase.name,
        passed: false,
        expected: testCase.expectedHallucination,
        actual: 'error',
        error: String(error)
      });
    }
  }
  
  // Print summary
  console.log("\nTest Summary");
  console.log("============");
  const passedCount = results.filter(r => r.passed).length;
  console.log(`Passed: ${passedCount}/${results.length} (${(passedCount / results.length * 100).toFixed(1)}%)`);
  
  return results;
}

export { HISTORICAL_FACT_TEST_CASES, POP_CULTURE_TEST_CASES };
