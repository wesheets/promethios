/**
 * Simple test file to verify Jest configuration
 * 
 * This file contains basic tests to ensure the Jest test runner
 * is properly discovering and executing tests.
 */

describe('Simple Test Suite', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });
  
  test('math should work', () => {
    expect(1 + 1).toBe(2);
  });
});
