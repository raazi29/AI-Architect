/**
 * PerformanceMonitor Class
 * 
 * Monitors AR session performance including FPS, memory usage, and thermal state.
 * Provides warnings and automatic quality adjustments.
 */
export class PerformanceMonitor {
  private fpsHistory: number[] = [];
  private readonly FPS_HISTORY_SIZE = 60; // 1 second at 60fps
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private startTime: number = 0;

  // Thresholds
  private readonly FPS_WARNING_THRESHOLD = 30;
  private readonly FPS_CRITICAL_THRESHOLD = 20;
  private readonly MEMORY_WARNING_THRESHOLD = 200 * 1024 * 1024; // 200MB

  // Callbacks
  private onPerformanceWarning: ((message: string) => void) | null = null;
  private onPerformanceCritical: ((message: string) => void) | null = null;

  constructor() {
    this.startTime = performance.now();
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

      // Check FPS thresholds
      const avgFPS = this.getAverageFPS();
      if (avgFPS < this.FPS_CRITICAL_THRESHOLD) {
        this.onPerformanceCritical?.(`Critical: FPS dropped to ${avgFPS.toFixed(1)}`);
      } else if (avgFPS < this.FPS_WARNING_THRESHOLD) {
        this.onPerformanceWarning?.(`Warning: FPS is ${avgFPS.toFixed(1)}`);
      }
    }

    this.lastFrameTime = currentTime;
    this.frameCount++;
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
   * Check if memory usage is high
   */
  isMemoryHigh(): boolean {
    return this.getMemoryUsage() > this.MEMORY_WARNING_THRESHOLD;
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
   * Get performance statistics
   */
  getStats(): {
    fps: {
      current: number;
      average: number;
      min: number;
      max: number;
    };
    memory: {
      used: number;
      usedMB: number;
      isHigh: boolean;
    };
    session: {
      duration: number;
      frameCount: number;
    };
  } {
    return {
      fps: {
        current: this.getCurrentFPS(),
        average: this.getAverageFPS(),
        min: this.getMinFPS(),
        max: this.getMaxFPS(),
      },
      memory: {
        used: this.getMemoryUsage(),
        usedMB: this.getMemoryUsageMB(),
        isHigh: this.isMemoryHigh(),
      },
      session: {
        duration: this.getSessionDuration(),
        frameCount: this.getFrameCount(),
      },
    };
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    const avgFPS = this.getAverageFPS();
    return avgFPS < this.FPS_WARNING_THRESHOLD || this.isMemoryHigh();
  }

  /**
   * Check if performance is critical
   */
  isPerformanceCritical(): boolean {
    const avgFPS = this.getAverageFPS();
    return avgFPS < this.FPS_CRITICAL_THRESHOLD;
  }

  /**
   * Get performance level (0-100)
   */
  getPerformanceLevel(): number {
    const avgFPS = this.getAverageFPS();
    const targetFPS = 60;
    return Math.min(100, (avgFPS / targetFPS) * 100);
  }

  /**
   * Get recommended quality level based on performance
   */
  getRecommendedQuality(): 'high' | 'medium' | 'low' {
    const avgFPS = this.getAverageFPS();

    if (avgFPS >= 50) {
      return 'high';
    } else if (avgFPS >= 30) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Set performance warning callback
   */
  setWarningCallback(callback: (message: string) => void): void {
    this.onPerformanceWarning = callback;
  }

  /**
   * Set performance critical callback
   */
  setCriticalCallback(callback: (message: string) => void): void {
    this.onPerformanceCritical = callback;
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.fpsHistory = [];
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.startTime = performance.now();
  }

  /**
   * Log performance stats to console
   */
  logStats(): void {
    const stats = this.getStats();
    console.log('=== Performance Stats ===');
    console.log(`FPS: ${stats.fps.current.toFixed(1)} (avg: ${stats.fps.average.toFixed(1)}, min: ${stats.fps.min.toFixed(1)}, max: ${stats.fps.max.toFixed(1)})`);
    console.log(`Memory: ${stats.memory.usedMB.toFixed(2)} MB ${stats.memory.isHigh ? '(HIGH)' : ''}`);
    console.log(`Session: ${stats.session.duration.toFixed(1)}s, ${stats.session.frameCount} frames`);
    console.log(`Performance Level: ${this.getPerformanceLevel().toFixed(1)}%`);
    console.log(`Recommended Quality: ${this.getRecommendedQuality()}`);
  }
}

export default PerformanceMonitor;
