// Jest setup file
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock WebXR APIs
global.XRSession = class {
  requestReferenceSpace = jest.fn().mockResolvedValue({});
  requestHitTestSource = jest.fn().mockResolvedValue({});
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  end = jest.fn();
};

global.XRWebGLLayer = class {};
global.XRHitTestResult = class {};
global.XRHitTestSource = class {};
global.XRReferenceSpace = class {};

// Mock Three.js if needed
global.THREE = global.THREE || {};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();
});