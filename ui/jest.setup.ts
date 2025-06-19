/**
 * Jest setup file for UI tests
 * 
 * This file imports and configures jest-dom for extended DOM element assertions
 * and sets up other necessary test environment configurations.
 */

// Import jest-dom for extended DOM element assertions
import '@testing-library/jest-dom';

// Mock Firebase modules before any imports
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  })),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate no user logged in
    callback(null);
    return jest.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: { uid: 'test-uid', email: 'test@example.com' }
  })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: { uid: 'test-uid', email: 'test@example.com' }
  })),
  signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => false,
    data: () => ({})
  })),
  setDoc: jest.fn(() => Promise.resolve()),
}));

// Mock the Firebase config
jest.mock('./firebase/firebaseConfig', () => ({
  auth: {},
  db: {},
  default: {},
}));

// Set up DOM environment
document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document,
  },
});

// Mock fetch API
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    headers: new Headers()
  })
);

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('Error:') ||
    args[0]?.includes?.('act(...)')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock environment variables
process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.VITE_FIREBASE_APP_ID = 'test-app-id';
