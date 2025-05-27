/**
 * Jest to Mocha Compatibility Layer
 * 
 * Provides compatibility for Jest-style tests to run in Mocha environment.
 * This allows existing Jest tests to run without modification while
 * transitioning to a Mocha-based test framework.
 */

const sinon = require('sinon');
const { expect } = require('chai');

// Define global Jest functions if they don't exist
global.jest = {
  fn: () => sinon.stub(),
  spyOn: (obj, method) => sinon.spy(obj, method),
  mock: (moduleName) => {
    const mock = {};
    mock.mockImplementation = (fn) => {
      mock.implementation = fn;
      return mock;
    };
    mock.mockReturnValue = (value) => {
      mock.implementation = () => value;
      return mock;
    };
    mock.mockResolvedValue = (value) => {
      mock.implementation = () => Promise.resolve(value);
      return mock;
    };
    mock.mockRejectedValue = (error) => {
      mock.implementation = () => Promise.reject(error);
      return mock;
    };
    return mock;
  }
};

// Define Jest expect functions
global.expect = (actual) => {
  const chaiExpect = expect(actual);
  
  return {
    // Direct mappings to Chai
    toBe: (expected) => chaiExpect.to.equal(expected),
    toEqual: (expected) => chaiExpect.to.deep.equal(expected),
    toStrictEqual: (expected) => chaiExpect.to.deep.equal(expected),
    toBeTruthy: () => chaiExpect.to.be.ok,
    toBeFalsy: () => chaiExpect.to.not.be.ok,
    toBeNull: () => chaiExpect.to.be.null,
    toBeUndefined: () => chaiExpect.to.be.undefined,
    toBeDefined: () => chaiExpect.to.not.be.undefined,
    toBeNaN: () => chaiExpect.to.be.NaN,
    toBeGreaterThan: (expected) => chaiExpect.to.be.greaterThan(expected),
    toBeGreaterThanOrEqual: (expected) => chaiExpect.to.be.at.least(expected),
    toBeLessThan: (expected) => chaiExpect.to.be.lessThan(expected),
    toBeLessThanOrEqual: (expected) => chaiExpect.to.be.at.most(expected),
    toContain: (item) => chaiExpect.to.include(item),
    toHaveLength: (length) => chaiExpect.to.have.lengthOf(length),
    toHaveProperty: (path, value) => {
      if (value !== undefined) {
        return chaiExpect.to.have.nested.property(path, value);
      }
      return chaiExpect.to.have.nested.property(path);
    },
    toMatch: (pattern) => chaiExpect.to.match(pattern),
    toThrow: (error) => {
      if (error) {
        return chaiExpect.to.throw(error);
      }
      return chaiExpect.to.throw();
    },
    
    // Negations
    not: {
      toBe: (expected) => chaiExpect.to.not.equal(expected),
      toEqual: (expected) => chaiExpect.to.not.deep.equal(expected),
      toStrictEqual: (expected) => chaiExpect.to.not.deep.equal(expected),
      toBeTruthy: () => chaiExpect.to.not.be.ok,
      toBeFalsy: () => chaiExpect.to.be.ok,
      toBeNull: () => chaiExpect.to.not.be.null,
      toBeUndefined: () => chaiExpect.to.not.be.undefined,
      toBeDefined: () => chaiExpect.to.be.undefined,
      toBeNaN: () => chaiExpect.to.not.be.NaN,
      toBeGreaterThan: (expected) => chaiExpect.to.not.be.greaterThan(expected),
      toBeGreaterThanOrEqual: (expected) => chaiExpect.to.be.lessThan(expected),
      toBeLessThan: (expected) => chaiExpect.to.not.be.lessThan(expected),
      toBeLessThanOrEqual: (expected) => chaiExpect.to.be.greaterThan(expected),
      toContain: (item) => chaiExpect.to.not.include(item),
      toHaveLength: (length) => chaiExpect.to.not.have.lengthOf(length),
      toHaveProperty: (path) => chaiExpect.to.not.have.nested.property(path),
      toMatch: (pattern) => chaiExpect.to.not.match(pattern),
      toThrow: (error) => {
        if (error) {
          return chaiExpect.to.not.throw(error);
        }
        return chaiExpect.to.not.throw();
      }
    },
    
    // Async matchers
    resolves: {
      toBe: async (expected) => expect(await actual).to.equal(expected),
      toEqual: async (expected) => expect(await actual).to.deep.equal(expected),
      // Add other resolves matchers as needed
    },
    rejects: {
      toThrow: async (error) => {
        try {
          await actual;
          throw new Error('Expected promise to reject');
        } catch (e) {
          if (error) {
            expect(e).to.be.an.instanceOf(error);
          }
        }
      },
      // Add other rejects matchers as needed
    }
  };
};

// Define Jest test structure functions
global.describe = describe;
global.it = it;
global.test = it;
global.beforeAll = before;
global.afterAll = after;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Mock modules
global.jest.mock = (modulePath, factory, options) => {
  // This is a simplified mock implementation
  // In a real implementation, this would use a module like proxyquire
  console.log(`Mock requested for module: ${modulePath}`);
};

// Export for explicit imports if needed
module.exports = {
  jest: global.jest,
  expect: global.expect
};
