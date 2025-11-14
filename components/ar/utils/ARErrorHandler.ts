import { ARError, ARErrorCode, ERROR_MESSAGES, ErrorMessage } from '@/lib/types/ar';

/**
 * ARErrorHandler Class
 * 
 * Centralized error handling for AR operations.
 * Provides user-friendly error messages and suggested actions.
 */
export class ARErrorHandler {
  private errorLog: ARError[] = [];
  private maxLogSize: number = 50;

  /**
   * Handle an AR error
   */
  handleError(error: ARError): void {
    // Log error
    this.logError(error);

    // Console log for debugging
    console.error(`[AR Error] ${error.code}:`, error.message, error.details);

    // Perform error-specific actions
    switch (error.code) {
      case ARErrorCode.PERMISSION_DENIED:
        this.handlePermissionDenied(error);
        break;
      case ARErrorCode.NOT_SUPPORTED:
        this.handleNotSupported(error);
        break;
      case ARErrorCode.SESSION_FAILED:
        this.handleSessionFailed(error);
        break;
      case ARErrorCode.MODEL_LOAD_FAILED:
        this.handleModelLoadFailed(error);
        break;
      case ARErrorCode.SURFACE_NOT_DETECTED:
        this.handleSurfaceNotDetected(error);
        break;
      case ARErrorCode.PLACEMENT_FAILED:
        this.handlePlacementFailed(error);
        break;
      case ARErrorCode.PERFORMANCE_DEGRADED:
        this.handlePerformanceDegraded(error);
        break;
    }
  }

  /**
   * Handle permission denied error
   */
  private handlePermissionDenied(error: ARError): void {
    // Could trigger a modal or notification to guide user
    console.warn('Camera permission denied. User needs to enable it in browser settings.');
  }

  /**
   * Handle not supported error
   */
  private handleNotSupported(error: ARError): void {
    console.warn('AR not supported on this device. Falling back to alternative mode.');
  }

  /**
   * Handle session failed error
   */
  private handleSessionFailed(error: ARError): void {
    console.warn('AR session failed. May retry or fallback.');
  }

  /**
   * Handle model load failed error
   */
  private handleModelLoadFailed(error: ARError): void {
    console.warn('Model loading failed. Check network and model URL.');
  }

  /**
   * Handle surface not detected error
   */
  private handleSurfaceNotDetected(error: ARError): void {
    console.warn('Surface detection failed. User needs to scan environment.');
  }

  /**
   * Handle placement failed error
   */
  private handlePlacementFailed(error: ARError): void {
    console.warn('Object placement failed. May need better surface or different location.');
  }

  /**
   * Handle performance degraded error
   */
  private handlePerformanceDegraded(error: ARError): void {
    console.warn('Performance degraded. Consider reducing quality or object count.');
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error: ARError): ErrorMessage {
    return ERROR_MESSAGES[error.code] || {
      title: 'Error',
      message: error.message,
      action: 'Retry',
    };
  }

  /**
   * Log error to internal log
   */
  private logError(error: ARError): void {
    this.errorLog.push({
      ...error,
      details: {
        ...error.details,
        timestamp: new Date().toISOString(),
      },
    });

    // Limit log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * Get error log
   */
  getErrorLog(): ARError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<ARErrorCode, number> {
    const stats: Record<ARErrorCode, number> = {
      [ARErrorCode.PERMISSION_DENIED]: 0,
      [ARErrorCode.NOT_SUPPORTED]: 0,
      [ARErrorCode.SESSION_FAILED]: 0,
      [ARErrorCode.MODEL_LOAD_FAILED]: 0,
      [ARErrorCode.SURFACE_NOT_DETECTED]: 0,
      [ARErrorCode.PLACEMENT_FAILED]: 0,
      [ARErrorCode.PERFORMANCE_DEGRADED]: 0,
    };

    this.errorLog.forEach((error) => {
      stats[error.code]++;
    });

    return stats;
  }

  /**
   * Create error from exception
   */
  static createError(
    code: ARErrorCode,
    message: string,
    details?: any,
    recoverable: boolean = true
  ): ARError {
    return {
      code,
      message,
      details,
      recoverable,
      suggestedAction: ERROR_MESSAGES[code]?.action,
    };
  }
}

/**
 * Camera Permission Handler
 */
export class CameraPermissionHandler {
  /**
   * Request camera permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Try to get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      // Stop stream immediately (we just needed permission)
      stream.getTracks().forEach((track) => track.stop());

      console.log('Camera permission granted');
      return true;
    } catch (error: any) {
      console.error('Camera permission denied:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw ARErrorHandler.createError(
          ARErrorCode.PERMISSION_DENIED,
          'Camera access denied. Please enable camera permissions in your browser settings.',
          error,
          false
        );
      }

      throw ARErrorHandler.createError(
        ARErrorCode.SESSION_FAILED,
        'Failed to access camera',
        error,
        true
      );
    }
  }

  /**
   * Check if camera permission is granted
   */
  async checkPermission(): Promise<PermissionState> {
    try {
      if (!navigator.permissions) {
        return 'prompt';
      }

      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    } catch (error) {
      console.warn('Could not check camera permission:', error);
      return 'prompt';
    }
  }

  /**
   * Get permission instructions for user
   */
  getPermissionInstructions(): {
    chrome: string[];
    firefox: string[];
    safari: string[];
    edge: string[];
  } {
    return {
      chrome: [
        'Click the camera icon in the address bar',
        'Select "Always allow" for camera access',
        'Refresh the page',
      ],
      firefox: [
        'Click the camera icon in the address bar',
        'Select "Allow" for camera access',
        'Refresh the page',
      ],
      safari: [
        'Go to Safari > Settings for This Website',
        'Set Camera to "Allow"',
        'Refresh the page',
      ],
      edge: [
        'Click the camera icon in the address bar',
        'Select "Always allow" for camera access',
        'Refresh the page',
      ],
    };
  }
}

/**
 * AR Session Lifecycle Manager
 */
export class ARSessionLifecycleManager {
  private sessionStartTime: Date | null = null;
  private sessionTimeout: number = 10 * 60 * 1000; // 10 minutes
  private timeoutId: NodeJS.Timeout | null = null;
  private isPaused: boolean = false;
  private visibilityChangeHandler: (() => void) | null = null;

  /**
   * Start session lifecycle tracking
   */
  startSession(onTimeout?: () => void): void {
    this.sessionStartTime = new Date();
    this.isPaused = false;

    // Set up session timeout
    if (onTimeout) {
      this.timeoutId = setTimeout(() => {
        console.log('AR session timeout reached');
        onTimeout();
      }, this.sessionTimeout);
    }

    // Set up visibility change handler
    this.setupVisibilityHandler();

    console.log('AR session lifecycle started');
  }

  /**
   * End session lifecycle tracking
   */
  endSession(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.cleanupVisibilityHandler();

    const duration = this.getSessionDuration();
    console.log(`AR session ended. Duration: ${duration}ms`);

    this.sessionStartTime = null;
    this.isPaused = false;
  }

  /**
   * Pause session (e.g., when app goes to background)
   */
  pauseSession(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      console.log('AR session paused');
    }
  }

  /**
   * Resume session (e.g., when app returns to foreground)
   */
  resumeSession(): void {
    if (this.isPaused) {
      this.isPaused = false;
      console.log('AR session resumed');
    }
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Date.now() - this.sessionStartTime.getTime();
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.sessionStartTime !== null && !this.isPaused;
  }

  /**
   * Set up visibility change handler for pause/resume
   */
  private setupVisibilityHandler(): void {
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.pauseSession();
      } else {
        this.resumeSession();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * Clean up visibility change handler
   */
  private cleanupVisibilityHandler(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  /**
   * Get remaining time before timeout
   */
  getRemainingTime(): number {
    if (!this.sessionStartTime) return 0;
    const elapsed = this.getSessionDuration();
    return Math.max(0, this.sessionTimeout - elapsed);
  }

  /**
   * Extend session timeout
   */
  extendSession(additionalTime: number = 10 * 60 * 1000): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.sessionTimeout += additionalTime;
    console.log(`Session extended by ${additionalTime}ms`);
  }
}

// Export singleton instances
export const arErrorHandler = new ARErrorHandler();
export const cameraPermissionHandler = new CameraPermissionHandler();
export const arSessionLifecycleManager = new ARSessionLifecycleManager();
