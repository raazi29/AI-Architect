/**
 * AR Utility Functions for Cross-Platform Compatibility
 * Handles WebXR, Model Viewer, and fallback implementations
 */

export interface ARCapabilities {
  webXRSupported: boolean
  modelViewerSupported: boolean
  fallbackSupported: boolean
  deviceType: 'desktop' | 'mobile' | 'tablet'
  isLowEndDevice: boolean
  maxTextureSize: number
  devicePixelRatio: number
}

export interface ARSessionConfig {
  requiredFeatures: string[]
  optionalFeatures: string[]
  domOverlay?: boolean
  referenceSpaceType: 'local' | 'local-floor' | 'unbounded' | 'bounded-floor'
}

export interface ModelLoadResult {
  success: boolean
  model?: any
  error?: string
  fallbackUsed?: boolean
}

/**
 * Enhanced AR Manager with cross-platform support
 */
export class ARManager {
  private static instance: ARManager
  private capabilities: ARCapabilities | null = null
  private session: XRSession | null = null
  private hitTestSource: XRHitTestSource | null = null
  private referenceSpace: XRReferenceSpace | null = null
  private isSessionActive = false

  static getInstance(): ARManager {
    if (!ARManager.instance) {
      ARManager.instance = new ARManager()
    }
    return ARManager.instance
  }

  /**
   * Detect AR capabilities across different platforms
   */
  async detectCapabilities(): Promise<ARCapabilities> {
    if (this.capabilities) {
      return this.capabilities
    }

    const deviceType = this.getDeviceType()
    const isLowEndDevice = this.isLowEndDevice()
    const maxTextureSize = this.getMaxTextureSize()
    const devicePixelRatio = window.devicePixelRatio || 1

    // Check WebXR support
    const webXRSupported = await this.checkWebXRSupport()
    
    // Check Model Viewer support (Google's model-viewer)
    const modelViewerSupported = this.checkModelViewerSupport()
    
    // Fallback support (always true for basic 3D viewing)
    const fallbackSupported = true

    this.capabilities = {
      webXRSupported,
      modelViewerSupported,
      fallbackSupported,
      deviceType,
      isLowEndDevice,
      maxTextureSize,
      devicePixelRatio
    }

    return this.capabilities
  }

  /**
   * Initialize AR session with proper error handling
   */
  async initializeAR(config: ARSessionConfig = {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay', 'light-estimation'],
    referenceSpaceType: 'local'
  }): Promise<boolean> {
    try {
      const capabilities = await this.detectCapabilities()
      
      if (!capabilities.webXRSupported) {
        console.warn('WebXR not supported, falling back to model-viewer')
        return false
      }

      if (this.isSessionActive) {
        console.warn('AR session already active')
        return true
      }

      const session = await this.requestSession(config)
      if (!session) {
        return false
      }

      this.session = session
      this.isSessionActive = true

      // Set up session event handlers
      this.setupSessionHandlers(session)

      // Request reference space
      this.referenceSpace = await session.requestReferenceSpace(config.referenceSpaceType)

      // Request hit test source if supported
      if (config.requiredFeatures.includes('hit-test') && session.requestHitTestSource) {
        try {
          this.hitTestSource = await session.requestHitTestSource({ 
            space: this.referenceSpace 
          })
        } catch (hitTestError) {
          console.warn('Hit test not available:', hitTestError)
        }
      }

      return true
    } catch (error) {
      console.error('Failed to initialize AR session:', error)
      this.cleanup()
      return false
    }
  }

  /**
   * Get the best AR implementation for the current platform
   */
  getBestARImplementation(): 'webxr' | 'model-viewer' | 'fallback' {
    if (!this.capabilities) {
      throw new Error('Capabilities not detected. Call detectCapabilities() first.')
    }

    if (this.capabilities.webXRSupported) {
      return 'webxr'
    } else if (this.capabilities.modelViewerSupported) {
      return 'model-viewer'
    } else {
      return 'fallback'
    }
  }

  /**
   * Check if WebXR is supported
   */
  private async checkWebXRSupport(): Promise<boolean> {
    if (!('xr' in navigator)) {
      return false
    }

    try {
      const isSupported = await (navigator as any).xr.isSessionSupported('immersive-ar')
      return isSupported
    } catch (error) {
      console.warn('WebXR check failed:', error)
      return false
    }
  }

  /**
   * Check if Model Viewer is supported
   */
  private checkModelViewerSupport(): boolean {
    // Check for iOS Safari (AR Quick Look)
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent)
    
    // Check for Android Chrome (Scene Viewer)
    const isAndroidChrome = /Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent)
    
    // Check for WebXR support in general
    const hasWebXR = 'xr' in navigator
    
    return isIOSSafari || isAndroidChrome || hasWebXR
  }

  /**
   * Request WebXR session with proper error handling
   */
  private async requestSession(config: ARSessionConfig): Promise<XRSession | null> {
    if (!('xr' in navigator)) {
      return null
    }

    try {
      const session = await (navigator as any).xr.requestSession('immersive-ar', {
        requiredFeatures: config.requiredFeatures,
        optionalFeatures: config.optionalFeatures
      })
      return session
    } catch (error) {
      console.error('Failed to request WebXR session:', error)
      return null
    }
  }

  /**
   * Set up session event handlers
   */
  private setupSessionHandlers(session: XRSession): void {
    session.addEventListener('end', () => {
      this.isSessionActive = false
      this.hitTestSource = null
      this.referenceSpace = null
      this.session = null
    })

    session.addEventListener('select', (event) => {
      // Handle selection events
      this.handleSelection(event)
    })
  }

  /**
   * Handle selection events in AR
   */
  private handleSelection(event: XRInputSourceEvent): void {
    // This can be overridden by implementations
    console.log('AR selection event:', event)
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/tablet|ipad|playbook|silk/.test(userAgent)) {
      return 'tablet'
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
      return 'mobile'
    } else {
      return 'desktop'
    }
  }

  /**
   * Check if device is low-end
   */
  private isLowEndDevice(): boolean {
    const memory = (navigator as any).deviceMemory || 4
    const cores = (navigator as any).hardwareConcurrency || 2
    
    return memory < 4 || cores < 4
  }

  /**
   * Get maximum texture size
   */
  private getMaxTextureSize(): number {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
      if (gl) {
        return gl.getParameter(gl.MAX_TEXTURE_SIZE)
      }
    } catch (error) {
      console.warn('Could not determine max texture size')
    }
    return 2048 // Default fallback
  }

  /**
   * Clean up AR resources
   */
  cleanup(): void {
    if (this.hitTestSource) {
      this.hitTestSource.cancel()
      this.hitTestSource = null
    }

    if (this.session) {
      this.session.end()
      this.session = null
    }

    this.isSessionActive = false
    this.referenceSpace = null
  }

  /**
   * Get current AR session
   */
  getSession(): XRSession | null {
    return this.session
  }

  /**
   * Get hit test source
   */
  getHitTestSource(): XRHitTestSource | null {
    return this.hitTestSource
  }

  /**
   * Get reference space
   */
  getReferenceSpace(): XRReferenceSpace | null {
    return this.referenceSpace
  }

  /**
   * Check if AR session is active
   */
  isActive(): boolean {
    return this.isSessionActive
  }
}

/**
 * Performance monitoring for AR sessions
 */
export class ARPerformanceMonitor {
  private isMonitoring = false
  private stats = {
    frameCount: 0,
    lastFrameTime: 0,
    averageFPS: 0,
    memoryUsage: 0,
    renderTime: 0
  }
  private rafId: number | null = null

  startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.stats.frameCount = 0
    this.stats.lastFrameTime = performance.now()
    
    this.monitorFrame()
  }

  stopMonitoring(): void {
    this.isMonitoring = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private monitorFrame(): void {
    if (!this.isMonitoring) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.stats.lastFrameTime
    
    this.stats.frameCount++
    this.stats.renderTime = deltaTime
    
    // Calculate FPS every second
    if (this.stats.frameCount % 60 === 0) {
      this.stats.averageFPS = 1000 / deltaTime
    }

    // Get memory usage if available
    if ((performance as any).memory) {
      this.stats.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024
    }

    this.stats.lastFrameTime = currentTime
    this.rafId = requestAnimationFrame(() => this.monitorFrame())
  }

  getPerformanceStats() {
    return { ...this.stats }
  }

  getDeviceCapabilities() {
    return {
      isMobile: /mobile|iphone|ipod|android/i.test(navigator.userAgent),
      isLowEndDevice: this.isLowEndDevice(),
      maxTextureSize: this.getMaxTextureSize(),
      devicePixelRatio: window.devicePixelRatio || 1,
      memoryGB: (navigator as any).deviceMemory || 4,
      cpuCores: (navigator as any).hardwareConcurrency || 2
    }
  }

  private isLowEndDevice(): boolean {
    const memory = (navigator as any).deviceMemory || 4
    const cores = (navigator as any).hardwareConcurrency || 2
    return memory < 4 || cores < 4
  }

  private getMaxTextureSize(): number {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
      if (gl) {
        return gl.getParameter(gl.MAX_TEXTURE_SIZE)
      }
    } catch (error) {
      console.warn('Could not determine max texture size')
    }
    return 2048
  }
}

/**
 * Utility functions for AR operations
 */
export const ARUtils = {
  /**
   * Check if device supports AR
   */
  async isARSupported(): Promise<boolean> {
    const arManager = ARManager.getInstance()
    const capabilities = await arManager.detectCapabilities()
    return capabilities.webXRSupported || capabilities.modelViewerSupported
  },

  /**
   * Get the best AR implementation
   */
  getBestARImplementation(): 'webxr' | 'model-viewer' | 'fallback' {
    const arManager = ARManager.getInstance()
    return arManager.getBestARImplementation()
  },

  /**
   * Format model URL for different platforms
   */
  formatModelUrl(url: string): string {
    // Ensure URL is absolute and properly formatted
    if (url.startsWith('http')) {
      return url
    }
    
    // Handle relative URLs
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`
    }
    
    return `${window.location.origin}/${url}`
  },

  /**
   * Validate 3D model format
   */
  validateModelFormat(url: string): boolean {
    const supportedFormats = ['.glb', '.gltf', '.usdz', '.reality']
    const extension = url.toLowerCase().substring(url.lastIndexOf('.'))
    return supportedFormats.some(format => extension.includes(format))
  },

  /**
   * Get platform-specific AR modes
   */
  getPlatformARModes(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent)) {
      // iOS Safari - AR Quick Look
      return 'quick-look'
    } else if (/android/.test(userAgent) && /chrome/.test(userAgent)) {
      // Android Chrome - Scene Viewer
      return 'scene-viewer'
    } else {
      // WebXR fallback
      return 'webxr scene-viewer quick-look'
    }
  },

  /**
   * Handle AR errors with user-friendly messages
   */
  handleARError(error: any): string {
    if (error.name === 'NotSupportedError') {
      return 'AR is not supported on this device. Please try on a mobile device with AR capabilities.'
    } else if (error.name === 'NotAllowedError') {
      return 'Camera access was denied. Please allow camera access to use AR.'
    } else if (error.name === 'SecurityError') {
      return 'AR requires a secure HTTPS connection.'
    } else if (error.message?.includes('model')) {
      return 'Failed to load 3D model. Please check your internet connection.'
    } else {
      return 'An error occurred while starting AR. Please try again.'
    }
  }
}

export default ARManager