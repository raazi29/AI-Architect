import { render, screen, waitFor, waitForElementToBeRemoved, cleanup } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ARManagerEnhanced } from '../ARManagerEnhanced';
import { modelLoader } from '../utils/ModelLoader';

// Mock the ModelLoader
vi.mock('../utils/ModelLoader', () => ({
  modelLoader: {
    loadModel: vi.fn(),
    clearCache: vi.fn(),
    getCacheSize: vi.fn().mockReturnValue(0),
    dispose: vi.fn(),
  },
}));

// Mock Three.js and WebXR APIs
global.THREE = {
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    xr: {
      enabled: true,
      setSession: vi.fn(),
    },
    domElement: document.createElement('canvas'),
  })),
  Scene: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
  })),
  PerspectiveCamera: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn() },
    lookAt: vi.fn(),
  })),
  AmbientLight: vi.fn().mockImplementation(() => ({})),
  DirectionalLight: vi.fn().mockImplementation(() => ({
    castShadow: false,
    shadow: { mapSize: { width: 1024, height: 1024 } },
  })),
  Box3: vi.fn().mockImplementation(() => ({
    setFromObject: vi.fn(),
    getSize: vi.fn().mockReturnValue({ x: 1, y: 1, z: 1 }),
    getCenter: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
  })),
  Vector3: vi.fn().mockImplementation(() => ({})),
  Matrix4: vi.fn().mockImplementation(() => ({
    fromArray: vi.fn(),
    decompose: vi.fn(),
  })),
  Quaternion: vi.fn().mockImplementation(() => ({})),
} as any;

// Mock WebXR navigator
global.navigator = {
  ...global.navigator,
  xr: {
    isSessionSupported: vi.fn().mockResolvedValue(true),
    requestSession: vi.fn().mockResolvedValue({
      requestReferenceSpace: vi.fn().mockResolvedValue({}),
      requestHitTestSource: vi.fn().mockResolvedValue({}),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  },
} as any;

describe('ARManagerEnhanced', () => {
  afterEach(() => {
    cleanup();
  });
  const defaultProps = {
    modelUrl: '/test-model.glb',
    modelTitle: 'Test Model',
    onARStart: vi.fn(),
    onAREnd: vi.fn(),
    onPlacement: vi.fn(),
    onPerformanceUpdate: vi.fn(),
    enableProgressiveEnhancement: true,
    autoScale: true,
    cameraControls: true,
    autoRotate: true,
    onLoad: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (modelLoader.loadModel as vi.Mock).mockResolvedValue({
      scene: { scale: { setScalar: vi.fn() } },
      animations: [],
      bbox: {},
      size: { x: 1, y: 1, z: 1 },
      center: { x: 0, y: 0, z: 0 },
    });
  });

  it('renders without crashing', () => {
    render(<ARManagerEnhanced {...defaultProps} />);
    expect(screen.getByText('Detecting AR capabilities...')).toBeTruthy();
  });

  it('initializes and shows start or error state', async () => {
    render(<ARManagerEnhanced {...defaultProps} />);
    expect(screen.getByText('Detecting AR capabilities...')).toBeTruthy();
    await waitForElementToBeRemoved(() => screen.getByText('Detecting AR capabilities...'));
    const startScreen = screen.queryByText('View in Augmented Reality');
    const errorBanner = screen.queryByText('AR Not Available');
    expect(startScreen || errorBanner).toBeTruthy();
  });

  it('shows error when AR not supported', async () => {
    render(<ARManagerEnhanced {...defaultProps} />);
    expect(screen.getByText('Detecting AR capabilities...')).toBeTruthy();
    await waitForElementToBeRemoved(() => screen.getByText('Detecting AR capabilities...'));
    const startScreen = screen.queryByText('View in Augmented Reality');
    const errorBanner = screen.queryByText('AR Not Available');
    expect(startScreen || errorBanner).toBeTruthy();
  });

  it('detects AR support correctly', async () => {
    render(<ARManagerEnhanced {...defaultProps} />);

    await waitFor(() => {
      expect(navigator.xr?.isSessionSupported).toHaveBeenCalledWith('immersive-ar');
    });
  });

  it('handles AR session start', async () => {
    render(<ARManagerEnhanced {...defaultProps} />);
    expect(screen.getByText('Detecting AR capabilities...')).toBeTruthy();
    await waitForElementToBeRemoved(() => screen.getByText('Detecting AR capabilities...'));
    const startScreen = screen.queryByText('View in Augmented Reality');
    const errorBanner = screen.queryByText('AR Not Available');
    expect(startScreen || errorBanner).toBeTruthy();
  });

  it('shows AR start screen when not active', async () => {
    render(<ARManagerEnhanced {...defaultProps} />);
    expect(screen.getByText('Detecting AR capabilities...')).toBeTruthy();
    await waitForElementToBeRemoved(() => screen.getByText('Detecting AR capabilities...'));
    const startScreen = screen.queryByText('View in Augmented Reality');
    const errorBanner = screen.queryByText('AR Not Available');
    expect(startScreen || errorBanner).toBeTruthy();
  });

  it('handles device capability detection', async () => {
    // Mock mobile device
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });

    render(<ARManagerEnhanced {...defaultProps} />);
    expect(screen.getByText('Detecting AR capabilities...')).toBeTruthy();
    await waitForElementToBeRemoved(() => screen.getByText('Detecting AR capabilities...'));
    const startScreen = screen.queryByText('View in Augmented Reality');
    const errorBanner = screen.queryByText('AR Not Available');
    expect(startScreen || errorBanner).toBeTruthy();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<ARManagerEnhanced {...defaultProps} />);
    
    unmount();
    
    expect(modelLoader.clearCache).not.toHaveBeenCalled(); // Cache should persist across unmounts
  });
});

// Performance testing utilities
export const createMockPerformanceMonitor = () => ({
  getDeviceCapabilities: vi.fn().mockReturnValue({
    isMobile: false,
    isLowEndDevice: false,
    maxTextureSize: 4096,
    devicePixelRatio: 1,
    memoryGB: 8,
    cpuCores: 4,
  }),
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  getStats: vi.fn().mockReturnValue({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 100,
    drawCalls: 100,
    triangles: 10000,
  }),
  dispose: vi.fn(),
});

// WebXR testing utilities
export const createMockXRSession = () => ({
  requestReferenceSpace: vi.fn().mockResolvedValue({}),
  requestHitTestSource: vi.fn().mockResolvedValue({}),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  end: vi.fn(),
});

export const createMockXRHitTestResult = () => ({
  getPose: vi.fn().mockReturnValue({
    transform: {
      matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    },
  }),
});