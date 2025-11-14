import { ARCapabilities, ARMode, DeviceInfo } from '@/lib/types/ar';

/**
 * ARCapabilityDetector
 * 
 * Detects device AR capabilities and recommends the best AR mode.
 * Supports WebXR, AR Quick Look (iOS), Scene Viewer (Android), and fallback modes.
 */
export class ARCapabilityDetector {
  private deviceInfo: DeviceInfo | null = null;

  /**
   * Detect all AR capabilities of the current device
   */
  async detectCapabilities(): Promise<ARCapabilities> {
    const deviceInfo = this.getDeviceInfo();
    this.deviceInfo = deviceInfo;

    const webxr = await this.detectWebXRSupport();
    const arQuickLook = this.detectARQuickLookSupport();
    const sceneViewer = this.detectSceneViewerSupport();

    const recommendedMode = this.determineRecommendedMode(
      webxr,
      arQuickLook,
      sceneViewer
    );

    return {
      webxr,
      arQuickLook,
      sceneViewer,
      recommendedMode,
    };
  }

  /**
   * Check if WebXR is supported
   */
  async detectWebXRSupport(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check if navigator.xr exists
    if (!('xr' in navigator)) {
      return false;
    }

    try {
      // Check if immersive-ar mode is supported
      const supported = await navigator.xr!.isSessionSupported('immersive-ar');
      return supported;
    } catch (error) {
      console.warn('WebXR detection failed:', error);
      return false;
    }
  }

  /**
   * Check if AR Quick Look is supported (iOS Safari)
   */
  detectARQuickLookSupport(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    // AR Quick Look requires iOS 12+ and Safari
    // Check for iOS version
    const iosVersion = this.getIOSVersion();
    const supportsARQuickLook = isIOS && isSafari && (iosVersion === null || iosVersion >= 12);

    // Also check if the device has the necessary AR capabilities
    // by checking for the rel="ar" link support
    const anchor = document.createElement('a');
    const supportsRelAR = 'relList' in anchor && anchor.relList.supports('ar');

    return supportsARQuickLook && supportsRelAR;
  }

  /**
   * Check if Scene Viewer is supported (Android Chrome)
   */
  detectSceneViewerSupport(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);

    // Scene Viewer requires Android 7.0+ and Chrome
    const androidVersion = this.getAndroidVersion();
    const supportsSceneViewer = isAndroid && isChrome && (androidVersion === null || androidVersion >= 7);

    return supportsSceneViewer;
  }

  /**
   * Get detailed device information
   */
  getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: '',
        platform: '',
        webxrSupported: false,
        arQuickLookSupported: false,
        sceneViewerSupported: false,
      };
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      webxrSupported: false, // Will be updated by detectWebXRSupport
      arQuickLookSupported: false, // Will be updated by detectARQuickLookSupport
      sceneViewerSupported: false, // Will be updated by detectSceneViewerSupport
    };
  }

  /**
   * Determine the recommended AR mode based on capabilities
   */
  private determineRecommendedMode(
    webxr: boolean,
    arQuickLook: boolean,
    sceneViewer: boolean
  ): ARMode {
    // Priority: WebXR > model-viewer (AR Quick Look/Scene Viewer) > fallback
    if (webxr) {
      return 'webxr';
    }

    // On mobile, prefer model-viewer even if specific checks are inconclusive.
    if (arQuickLook || sceneViewer || this.isMobile()) {
      return 'model-viewer';
    }

    return 'fallback';
  }

  /**
   * Get iOS version from user agent
   */
  private getIOSVersion(): number | null {
    if (typeof window === 'undefined') return null;

    const userAgent = navigator.userAgent;
    const match = userAgent.match(/OS (\d+)_/);

    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    return null;
  }

  /**
   * Get Android version from user agent
   */
  private getAndroidVersion(): number | null {
    if (typeof window === 'undefined') return null;

    const userAgent = navigator.userAgent;
    const match = userAgent.match(/Android (\d+)/);

    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    return null;
  }

  /**
   * Check if device is mobile
   */
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  }

  /**
   * Check if device is iOS
   */
  isIOS(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  /**
   * Check if device is Android
   */
  isAndroid(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
  }

  /**
   * Check if device is desktop
   */
  isDesktop(): boolean {
    return !this.isMobile();
  }

  /**
   * Get a human-readable description of device capabilities
   */
  getCapabilityDescription(capabilities: ARCapabilities): string {
    if (capabilities.webxr) {
      return 'Your device supports native WebXR AR for the best experience.';
    }

    if (capabilities.arQuickLook) {
      return 'Your device supports AR Quick Look for iOS AR experiences.';
    }

    if (capabilities.sceneViewer) {
      return 'Your device supports Scene Viewer for Android AR experiences.';
    }

    if (this.isDesktop()) {
      return 'Scan the QR code with your mobile device to view in AR.';
    }

    return 'AR is not supported on your device. You can view the 3D model instead.';
  }

  /**
   * Get cached device info
   */
  getCachedDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }
}

// Export singleton instance
export const arCapabilityDetector = new ARCapabilityDetector();
