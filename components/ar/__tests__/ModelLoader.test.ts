import { modelLoader, ModelLoader } from '../utils/ModelLoader';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ModelLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a singleton instance', () => {
    const instance1 = ModelLoader.getInstance();
    const instance2 = ModelLoader.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should have cache management methods', () => {
    expect(typeof modelLoader.getCacheSize).toBe('function');
    expect(typeof modelLoader.getCachedUrls).toBe('function');
    expect(typeof modelLoader.clearCache).toBe('function');
    expect(typeof modelLoader.dispose).toBe('function');
  });

  it('should provide initial cache state', () => {
    expect(modelLoader.getCacheSize()).toBe(0);
    expect(modelLoader.getCachedUrls()).toEqual([]);
  });

  it('should handle model loading configuration', () => {
    const config = {
      url: '/test-model.glb',
      dracoEnabled: true,
      maxRetries: 3,
      timeout: 30000,
    };

    // Test that loadModel accepts the expected configuration
    expect(() => {
      modelLoader.loadModel(config);
    }).not.toThrow();
  });

  it('should handle cache clearing', () => {
    // Should not throw when clearing empty cache
    expect(() => {
      modelLoader.clearCache();
    }).not.toThrow();

    expect(() => {
      modelLoader.clearCache('/specific-url.glb');
    }).not.toThrow();
  });

  it('should handle disposal', () => {
    expect(() => {
      modelLoader.dispose();
    }).not.toThrow();
  });
});