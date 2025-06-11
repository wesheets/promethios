// tests/setup.js
const { JSDOM } = require('jsdom');

// Set up a DOM environment for testing
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Add expect and other Jest globals
global.expect = require('expect');
global.jest = require('jest-mock');

// Setup React Testing Library
require('@testing-library/jest-dom');

// Mock for React Router's useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Outlet: () => null,
}));

// Mock for chart.js
jest.mock('chart.js', () => ({
  Chart: class MockChart {
    constructor() {
      return {};
    }
  },
  registerables: [],
}));

// Add TextEncoder and TextDecoder polyfills
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
