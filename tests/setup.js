/**
 * Test Setup for Promethios
 * 
 * This file contains setup code for the test environment.
 */

// Add TextEncoder and TextDecoder polyfills for Jest environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import jest-dom for custom DOM matchers
require('@testing-library/jest-dom');

// Mock any global objects needed for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Add any other global test setup here
