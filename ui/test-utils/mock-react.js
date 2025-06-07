/**
 * Mock React module for testing
 * 
 * This file provides a mock implementation of React for testing purposes
 * to ensure that all components have access to React methods during tests.
 */

const React = {
  createElement: jest.fn(),
  useState: jest.fn().mockImplementation(initial => [initial, jest.fn()]),
  useEffect: jest.fn(),
  useCallback: jest.fn().mockImplementation(cb => cb),
  useMemo: jest.fn().mockImplementation(cb => cb()),
  useRef: jest.fn().mockImplementation(initial => ({ current: initial })),
  useContext: jest.fn(),
  Component: class Component {},
  Fragment: Symbol('Fragment'),
  createContext: jest.fn().mockImplementation(() => ({
    Provider: ({ children }) => children,
    Consumer: ({ children }) => children
  }))
};

module.exports = React;
