/**
 * Enhanced PerformanceMonitor Class
 * 
 * Advanced performance monitoring with mobile-specific optimizations,
 * adaptive quality scaling, and device capability detection.
 */
export class PerformanceMonitorEnhanced {
  private fpsHistory: number[] = [];
  private readonly FPS_HISTORY_SIZE = 120; // 2 seconds at 60fps for better stability
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private startTime: number = 0;
  private qualityAdjustments: number = 0;
  private lastQualityAdjustment: number = 0;
  private readonly QUALITY_ADJUSTMENT_COOLDOWN = 2000; // 2 seconds

  // Enhanced thresholds for mobile devices
  private readonly FPS_HIGH_THRESHOLD = 55;
  private readonly FPS_GOOD_THRESHOLD = 45;
  private readonly FPS_WARNING_THRESHOLD = 30;
  private readonly FPS_CRITICAL_THRESHOLD = 20;
  private readonly FPS_MINIMUM_THRESHOLD = 15;

  // Memory thresholds (more conservative for mobile)
  private readonly MEMORY_WARNING_THRESHOLD_MOBILE = 100 * 1024 * 1024; // 100MB for mobile
  private readonly MEMORY_WARNING_THRESHOLD_DESKTOP = 300 * 1024 * 1024; // 300MB for desktop
  private readonly MEMORY_CRITICAL_THRESHOLD = 500 * 1024 * 1024; // 500MB

  // Device capability detection
  private deviceCapabilities: {
    isMobile: boolean;
    isLowEndDevice: boolean;
    maxTextureSize: number;
    maxVertexAttribs: number;
    maxVertexUniformVectors: number;
    maxFragmentUniformVectors: number;
    devicePixelRatio: number;
    memoryGB: number;
    cpuCores: number;
  };

  // Callbacks
  private onPerformanceWarning: ((message: string, level: 'warning' | 'critical') => void) | null = null;
  private onQualityAdjustment: ((quality: 'high' | 'medium' | 'low') => void) | null = null;
  private onPerformanceReport: ((stats: any) => void) | null = null;

  constructor() {
    this.startTime = performance.now();
    this.deviceCapabilities = this.detectDeviceCapabilities();
    console.log('Device capabilities detected:', this.deviceCapabilities);
  }

  /**
   * Detect device capabilities for performance optimization
   */
  private detectDeviceCapabilities() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Detect low-end devices based on multiple factors
    const devicePixelRatio = window.devicePixelRatio || 1;
    const memoryGB = (navigator as any).deviceMemory || 4; // Default to 4GB if not available
    const cpuCores = navigator.hardwareConcurrency || 4; // Default to 4 cores
    
    let isLowEndDevice = false;
    
    // Low-end device detection logic
    if (isMobile) {
      // Mobile devices with low memory or old processors
      if (memoryGB < 3 || cpuCores <= 4) {
        isLowEndDevice = true;
      }
      
      // Check for specific low-end mobile processors
      if (userAgent.includes('snapdragon 4') || userAgent.includes('mediatek mt67')) {
        isLowEndDevice = true;
      }
    } else {
      // Desktop low-end detection
      if (memoryGB < 4 || cpuCores <= 2) {
        isLowEndDevice = true;
      }
    }

    let maxTextureSize = 2048;
    let maxVertexAttribs = 8;
    let maxVertexUniformVectors = 128;
    let maxFragmentUniformVectors = 128;

    if (gl) {
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
      maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    }

    return {
      isMobile,
      isLowEndDevice,
      maxTextureSize,
      maxVertexAttribs,
      maxVertexUniformVectors,
      maxFragmentUniformVectors,
      devicePixelRatio,
      memoryGB,
      cpuCores,
    };
  }

  /**
   * Update performance metrics (call every frame)
   */
  update(currentTime: number): void {
    // Calculate FPS
    if (this.lastFrameTime > 0) {
      const deltaTime = currentTime - this.lastFrameTime;
      const fps = 1000 / deltaTime;

      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > this.FPS_HISTORY_SIZE) {
        this.fpsHistory.shift();
      }

      // Check FPS thresholds with device-specific adjustments
      const avgFPS = this.getAverageFPS();
      const isMobile = this.deviceCapabilities.isMobile;
      const warningThreshold = isMobile ? this.FPS_WARNING_THRESHOLD : this.FPS_WARNING_THRESHOLD - 5;
      const criticalThreshold = isMobile ? this.FPS_CRITICAL_THRESHOLD : this.FPS_CRITICAL_THRESHOLD - 5;

      if (avgFPS < criticalThreshold) {
        this.onPerformanceCritical?.(`Critical: FPS dropped to ${avgFPS.toFixed(1)}`);
        this.attemptQualityReduction();
      } else if (avgFPS < warningThreshold) {
        this.onPerformanceWarning?.(`Warning: FPS is ${avgFPS.toFixed(1)}`, 'warning');
        if (avgFPS < this.FPS_MINIMUM_THRESHOLD) {
          this.attemptQualityReduction();
        }
      } else if (avgFPS > this.FPS_HIGH_THRESHOLD && this.qualityAdjustments > 0) {
        // Consider improving quality if performance is good
        this.attemptQualityImprovement();
      }
    }

    this.lastFrameTime = currentTime;
    this.frameCount++;

    // Check memory usage
    this.checkMemoryUsage();
  }

  /**
   * Check memory usage with device-specific thresholds
   */
  private checkMemoryUsage(): void {
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage === 0) return; // Memory API not available

    const isMobile = this.deviceCapabilities.isMobile;
    const warningThreshold = isMobile ? this.MEMORY_WARNING_THRESHOLD_MOBILE : this.MEMORY_WARNING_THRESHOLD_DESKTOP;

    if (memoryUsage > this.MEMORY_CRITICAL_THRESHOLD) {
      this.onPerformanceCritical?.(`Critical: Memory usage ${(memoryUsage / 1024 / 1024).toFixed(0)}MB`);
      this.attemptQualityReduction();
    } else if (memoryUsage > warningThreshold) {
      this.onPerformanceWarning?.(`Warning: Memory usage ${(memoryUsage / 1024 / 1024).toFixed(0)}MB`, 'warning');
    }
  }

  /**
   * Attempt to reduce quality for better performance
   */
  private attemptQualityReduction(): void {
    const now = performance.now();
    if (now - this.lastQualityAdjustment < this.QUALITY_ADJUSTMENT_COOLDOWN) {
      return; // Too soon since last adjustment
    }

    const currentQuality = this.getRecommendedQuality();
    if (currentQuality === 'low') {
      return; // Already at lowest quality
    }

    this.qualityAdjustments++;
    this.lastQualityAdjustment = now;

    const newQuality = currentQuality === 'high' ? 'medium' : 'low';
    this.onQualityAdjustment?.(newQuality);

    console.log(`PerformanceMonitor: Reducing quality to ${newQuality} due to performance issues`);
  }

  /**
   * Attempt to improve quality if performance allows
   */
  private attemptQualityImprovement(): void {
    const now = performance.now();
    if (now - this.lastQualityAdjustment < this.QUALITY_ADJUSTMENT_COOLDOWN * 2) {
      return; // Longer cooldown for improvements
    }

    const avgFPS = this.getAverageFPS();
    if (avgFPS < this.FPS_HIGH_THRESHOLD) {
      return; // Not good enough performance
    }

    this.qualityAdjustments = Math.max(0, this.qualityAdjustments - 1);
    this.lastQualityAdjustment = now;

    const newQuality = this.getRecommendedQuality();
    this.onQualityAdjustment?.(newQuality);

    console.log(`PerformanceMonitor: Improving quality to ${newQuality} due to good performance`);
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory[this.fpsHistory.length - 1];
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Get minimum FPS
   */
  getMinFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return Math.min(...this.fpsHistory);
  }

  /**
   * Get maximum FPS
   */
  getMaxFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return Math.max(...this.fpsHistory);
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Get memory usage in MB
   */
  getMemoryUsageMB(): number {
    return this.getMemoryUsage() / (1024 * 1024);
  }

  /**
   * Check if memory usage is high (device-specific)
   */
  isMemoryHigh(): boolean {
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage === 0) return false;

    const isMobile = this.deviceCapabilities.isMobile;
    const warningThreshold = isMobile ? this.MEMORY_WARNING_THRESHOLD_MOBILE : this.MEMORY_WARNING_THRESHOLD_DESKTOP;
    return memoryUsage > warningThreshold;
  }

  /**
   * Get session duration in seconds
   */
  getSessionDuration(): number {
    return (performance.now() - this.startTime) / 1000;
  }

  /**
   * Get total frame count
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities() {
    return { ...this.deviceCapabilities };
  }

  /**
   * Get recommended quality level based on performance and device capabilities
   */
  getRecommendedQuality(): 'high' | 'medium' | 'low' {
    // Start with device-based quality
    if (this.deviceCapabilities.isLowEndDevice) {
      return 'low';
    }

    const avgFPS = this.getAverageFPS();
    const isMemoryHigh = this.isMemoryHigh();

    // FPS-based quality adjustment
    if (avgFPS >= this.FPS_HIGH_THRESHOLD && !isMemoryHigh) {
      return 'high';
    } else if (avgFPS >= this.FPS_GOOD_THRESHOLD && !isMemoryHigh) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get recommended renderer settings based on device and quality
   */
  getRendererSettings(quality: 'high' | 'medium' | 'low') {
    const isMobile = this.deviceCapabilities.isMobile;
    const devicePixelRatio = this.deviceCapabilities.devicePixelRatio;

    const settings = {
      high: {
        pixelRatio: Math.min(devicePixelRatio, 2),
        shadowMapSize: 2048,
        maxAnisotropy: 16,
        antialias: true,
        enableShadows: true,
        enablePostProcessing: true,
      },
      medium: {
        pixelRatio: Math.min(devicePixelRatio, 1.5),
        shadowMapSize: 1024,
        maxAnisotropy: 8,
        antialias: true,
        enableShadows: true,
        enablePostProcessing: false,
      },
      low: {
        pixelRatio: Math.min(devicePixelRatio, 1),
        shadowMapSize: 512,
        maxAnisotropy: 4,
        antialias: false,
        enableShadows: false,
        enablePostProcessing: false,
      },
    };

    // Mobile-specific adjustments
    if (isMobile) {
      settings.high.pixelRatio = Math.min(settings.high.pixelRatio, 1.5);
      settings.medium.pixelRatio = Math.min(settings.medium.pixelRatio, 1);
      settings.low.pixelRatio = Math.min(settings.low.pixelRatio, 1);
    }

    return settings[quality];
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    const avgFPS = this.getAverageFPS();
    const isMemoryHigh = this.isMemoryHigh();
    const threshold = this.deviceCapabilities.isMobile ? this.FPS_WARNING_THRESHOLD : this.FPS_WARNING_THRESHOLD - 5;
    return avgFPS < threshold || isMemoryHigh;
  }

  /**
   * Check if performance is critical
   */
  isPerformanceCritical(): boolean {
    const avgFPS = this.getAverageFPS();
    const isMemoryCritical = this.getMemoryUsage() > this.MEMORY_CRITICAL_THRESHOLD;
    const threshold = this.deviceCapabilities.isMobile ? this.FPS_CRITICAL_THRESHOLD : this.FPS_CRITICAL_THRESHOLD - 5;
    return avgFPS < threshold || isMemoryCritical;
  }

  /**
   * Get performance level (0-100)
   */
  getPerformanceLevel(): number {
    const avgFPS = this.getAverageFPS();
    const targetFPS = this.deviceCapabilities.isMobile ? 55 : 60;
    return Math.min(100, (avgFPS / targetFPS) * 100);
  }

  /**
   * Set performance warning callback
   */
  setWarningCallback(callback: (message: string, level: 'warning' | 'critical') => void): void {
    this.onPerformanceWarning = callback;
  }

  /**
   * Set performance critical callback
   */
  setCriticalCallback(callback: (message: string) => void): void {
    this.onPerformanceCritical = callback;
  }

  /**
   * Set quality adjustment callback
   */
  setQualityAdjustmentCallback(callback: (quality: 'high' | 'medium' | 'low') => void): void {
    this.onQualityAdjustment = callback;
  }

  /**
   * Set performance report callback
   */
  setPerformanceReportCallback(callback: (stats: any) => void): void {
    this.onPerformanceReport = callback;
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.fpsHistory = [];
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.startTime = performance.now();
    this.qualityAdjustments = 0;
    this.lastQualityAdjustment = 0;
  }

  /**
   * Get comprehensive performance statistics
   */
  getStats(): {
    fps: {
      current: number;
      average: number;
      min: number;
      max: number;
      stability: number; // 0-1, higher is more stable
    };
    memory: {
      used: number;
      usedMB: number;
      isHigh: boolean;
      isCritical: boolean;
    };
    session: {
      duration: number;
      frameCount: number;
      qualityAdjustments: number;
    };
    device: {
      capabilities: any;
      isMobile: boolean;
      isLowEndDevice: boolean;
    };
    performance: {
      level: number;
      isDegraded: boolean;
      isCritical: boolean;
      recommendedQuality: 'high' | 'medium' | 'low';
    };
  } {
    const fpsValues = this.fpsHistory;
    const avgFPS = this.getAverageFPS();
    const variance = fpsValues.reduce((sum, fps) => sum + Math.pow(fps - avgFPS, 2), 0) / fpsValues.length;
    const stability = Math.max(0, 1 - Math.sqrt(variance) / avgFPS);

    return {
      fps: {
        current: this.getCurrentFPS(),
        average: avgFPS,
        min: this.getMinFPS(),
        max: this.getMaxFPS(),
        stability: isNaN(stability) ? 0 : stability,
      },
      memory: {
        used: this.getMemoryUsage(),
        usedMB: this.getMemoryUsageMB(),
        isHigh: this.isMemoryHigh(),
        isCritical: this.getMemoryUsage() > this.MEMORY_CRITICAL_THRESHOLD,
      },
      session: {
        duration: this.getSessionDuration(),
        frameCount: this.getFrameCount(),
        qualityAdjustments: this.qualityAdjustments,
      },
      device: {
        capabilities: this.deviceCapabilities,
        isMobile: this.deviceCapabilities.isMobile,
        isLowEndDevice: this.deviceCapabilities.isLowEndDevice,
      },
      performance: {
        level: this.getPerformanceLevel(),
        isDegraded: this.isPerformanceDegraded(),
        isCritical: this.isPerformanceCritical(),
        recommendedQuality: this.getRecommendedQuality(),
      },
    };
  }

  /**
   * Log performance stats to console
   */
  logStats(): void {
    const stats = this.getStats();
    console.log('=== Enhanced Performance Stats ===');
    console.log(`Device: ${stats.device.isMobile ? 'Mobile' : 'Desktop'} ${stats.device.isLowEndDevice ? '(Low-end)' : ''}`);
    console.log(`FPS: ${stats.fps.current.toFixed(1)} (avg: ${stats.fps.average.toFixed(1)}, stability: ${(stats.fps.stability * 100).toFixed(1)}%)`);
    console.log(`Memory: ${stats.memory.usedMB.toFixed(2)} MB ${stats.memory.isHigh ? '(HIGH)' : ''} ${stats.memory.isCritical ? '(CRITICAL)' : ''}`);
    console.log(`Session: ${stats.session.duration.toFixed(1)}s, ${stats.session.frameCount} frames, ${stats.session.qualityAdjustments} adjustments`);
    console.log(`Performance Level: ${stats.performance.level.toFixed(1)}% (${stats.performance.recommendedQuality} quality)`);
    console.log(`Renderer Settings:`, this.getRendererSettings(stats.performance.recommendedQuality));
  }

  /**
   * Generate performance report for analytics
   */
  generateReport(): {
    summary: string;
    recommendations: string[];
    metrics: any;
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];

    // Generate recommendations based on performance
    if (stats.performance.isCritical) {
      recommendations.push('Critical performance issues detected. Consider reducing scene complexity.');
    } else if (stats.performance.isDegraded) {
      recommendations.push('Performance degradation detected. Monitor and optimize if needed.');
    }

    if (stats.memory.isCritical) {
      recommendations.push('High memory usage detected. Consider texture compression and model optimization.');
    }

    if (stats.fps.stability < 0.8) {
      recommendations.push('FPS instability detected. Check for frame drops and optimize rendering.');
    }

    if (stats.device.isLowEndDevice) {
      recommendations.push('Low-end device detected. Using conservative quality settings.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal. No immediate action required.');
    }

    return {
      summary: `Performance: ${stats.performance.level.toFixed(1)}% (${stats.performance.recommendedQuality} quality)`,
      recommendations,
      metrics: stats,
    };
  }
}

export default PerformanceMonitorEnhanced;
   