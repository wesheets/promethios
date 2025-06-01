import { verify, compareTexts } from '../core';

// Mock data for testing
const mockText = 'The Earth is round. Water boils at 100 degrees Celsius.';

describe('VERITAS Core', () => {
  test('verify function returns a result', async () => {
    const result = await verify(mockText);
    
    expect(result).toBeDefined();
    expect(result.claims).toBeDefined();
    expect(result.overallScore).toBeDefined();
    expect(result.sources).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });
  
  test('verify function extracts claims', async () => {
    const result = await verify(mockText);
    
    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.claims[0].claim).toBeDefined();
  });
  
  test('compareTexts function returns common claims', async () => {
    const text1 = 'The Earth is round. Water boils at 100 degrees Celsius.';
    const text2 = 'The Earth is spherical. Water boils at 100 degrees Celsius at sea level.';
    
    const result = await compareTexts(text1, text2);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('Integration Tests', () => {
  test('Turner v. Cognivault test case should be detected as hallucination', async () => {
    const text = 'In the Turner v. Cognivault case of 2021, the court ruled that companies are responsible for the actions of their AI agents.';
    
    // Verify the text
    const result = await verify(text);
    
    expect(result).toBeDefined();
    expect(result.claims.length).toBeGreaterThan(0);
    
    // Modified check: Look for any claim about the Turner case that is flagged as hallucination
    const hasFictionalCase = result.claims.some(claim => 
      (claim.claim.includes('Turner') || 
       claim.claim.includes('Cognivault') || 
       (claim.claim.includes('case') && claim.claim.includes('2021'))) && 
      claim.isHallucination
    );
    
    expect(hasFictionalCase).toBe(true);
  });
});
