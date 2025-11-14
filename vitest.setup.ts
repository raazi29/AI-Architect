import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
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
  requestReferenceSpace = () => Promise.resolve({});
  requestHitTestSource = () => Promise.resolve({});
  addEventListener = () => {};
  removeEventListener = () => {};
  end = () => {};
} as any;

global.XRWebGLLayer = class {} as any;
global.XRHitTestResult = class {} as any;
global.XRHitTestSource = class {} as any;
global.XRReferenceSpace = class {} as any;

// Mock Three.js
global.THREE = global.THREE || {} as any;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});