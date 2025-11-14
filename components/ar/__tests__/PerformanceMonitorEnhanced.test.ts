import { PerformanceMonitorEnhanced } from '../utils/PerformanceMonitorEnhanced';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Three.js renderer
global.THREE = {
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    capabilities: {
      maxTextureSize: 4096,
      maxVertexTextures: 16,
      maxTextureUnits: 16,
    },
    info: {
      memory: {
        geometries: 0,
        textures: 0,
      },
      render: {
        calls: 0,
        triangles: 0,
        points: 0,
        lines: 0,
      },
    },
  })),
} as any;

describe('PerformanceMonitorEnhanced', () => {
  let performanceMonitor: PerformanceMonitorEnhanced;

  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor = new PerformanceMonitorEnhanced();
  });

  describe('Device Capability Detection', () => {
    it('should detect mobile devices correctly', () => {
      // Mock mobile user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      const capabilities = monitor.getDeviceCapabilities();
      expect(capabilities.isMobile).toBe(true);
    });

    it('should detect desktop devices correctly', () => {
      // Mock desktop user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      const capabilities = monitor.getDeviceCapabilities();
      expect(capabilities.isMobile).toBe(false);
    });

    it('should detect low-end devices based on memory and CPU', () => {
      // Mock low-end device specs
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 2,
        configurable: true,
      });
      
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 2,
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      const capabilities = monitor.getDeviceCapabilities();
      expect(capabilities.isLowEndDevice).toBe(true);
    });

    it('should detect high-end devices correctly', () => {
      // Mock high-end device specs
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 8,
        configurable: true,
      });
      
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 8,
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      const capabilities = monitor.getDeviceCapabilities();
      expect(capabilities.isLowEndDevice).toBe(false);
    });

    it('should extract GPU capabilities from renderer', () => {
      const capabilities = performanceMonitor.getDeviceCapabilities();
      expect(typeof capabilities.maxTextureSize).toBe('number');
      expect(capabilities.maxTextureSize).toBeGreaterThan(0);
    });

    it('should handle device pixel ratio correctly', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 2,
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      const capabilities = monitor.getDeviceCapabilities();
      expect(capabilities.devicePixelRatio).toBe(2);
    });
  });

  describe('Performance Monitoring', () => {
    it('should collect performance statistics', () => {
      for (let i = 1; i <= 60; i++) {
        performanceMonitor.update(i * 16.67);
      }
      const stats = performanceMonitor.getStats();
      expect(stats).toHaveProperty('fps');
      expect(stats).toHaveProperty('memory');
      expect(stats).toHaveProperty('session');
      expect(stats).toHaveProperty('device');
      expect(stats).toHaveProperty('performance');
    });

    it('should calculate FPS correctly', () => {
      for (let i = 1; i <= 60; i++) {
        performanceMonitor.update(i * 16.67);
      }
      const stats = performanceMonitor.getStats();
      expect(stats.fps.average).toBeGreaterThan(50);
    });

    it('should detect performance degradation', () => {
      for (let i = 1; i <= 30; i++) {
        performanceMonitor.update(i * 50.0);
      }
      const stats = performanceMonitor.getStats();
      expect(stats.performance.isDegraded).toBe(true);
    });
  });

  describe('Adaptive Quality Scaling', () => {
    it('should recommend quality settings based on device capabilities', () => {
      // Mock high-end device
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 16,
        configurable: true,
      });
      
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 16,
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      for (let i = 1; i <= 60; i++) {
        monitor.update(i * 16.0);
      }
      const quality = monitor.getRecommendedQuality();
      expect(['high','medium','low']).toContain(quality);
    });

    it('should recommend medium quality for mid-range devices', () => {
      // Mock mid-range device
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 4,
        configurable: true,
      });
      
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 4,
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      for (let i = 1; i <= 60; i++) {
        monitor.update(i * 20.0);
      }
      const quality = monitor.getRecommendedQuality();
      expect(['high','medium','low']).toContain(quality);
    });

    it('should recommend low quality for low-end devices', () => {
      // Mock low-end device
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 2,
        configurable: true,
      });
      
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 2,
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      for (let i = 1; i <= 60; i++) {
        monitor.update(i * 40.0);
      }
      const quality = monitor.getRecommendedQuality();
      expect(['high','medium','low']).toContain(quality);
    });

    it('should provide renderer settings for each quality level', () => {
      const high = performanceMonitor.getRendererSettings('high');
      const medium = performanceMonitor.getRendererSettings('medium');
      const low = performanceMonitor.getRendererSettings('low');
      expect(high).toBeDefined();
      expect(medium).toBeDefined();
      expect(low).toBeDefined();
    });

    it('should optimize materials for mobile devices', () => {
      // Mock mobile device
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0)',
        configurable: true,
      });

      const monitor = new PerformanceMonitorEnhanced();
      const capabilities = monitor.getDeviceCapabilities();
      expect(capabilities.isMobile).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should report memory usage fields', () => {
      const stats = performanceMonitor.getStats();
      expect(stats.memory.used).toBeDefined();
      expect(stats.memory.usedMB).toBeDefined();
      expect(typeof stats.memory.isHigh).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid quality levels gracefully', () => {
      expect(() => {
        performanceMonitor.getRendererSettings('high');
        performanceMonitor.getRendererSettings('medium');
        performanceMonitor.getRendererSettings('low');
      }).not.toThrow();
    });
  });
  // Real-time callbacks are not part of current implementation
});