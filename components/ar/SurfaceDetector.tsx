import * as THREE from 'three';
import { SurfaceDetectorProps, SurfaceData, HitTestData } from '@/lib/types/ar';

/**
 * SurfaceDetector Class
 * 
 * Handles hit testing and surface detection for AR placement.
 * Creates visual indicators (reticle) for detected surfaces.
 */
export class SurfaceDetector {
  private xrSession: XRSession | null = null;
  private hitTestSource: XRHitTestSource | null = null;
  private hitTestSourceRequested: boolean = false;
  private reticle: THREE.Mesh | null = null;
  private scene: THREE.Scene;
  private lastHitTestResult: XRHitTestResult | null = null;
  private surfaceDetectedCallback: ((hitResult: XRHitTestResult) => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createReticle();
  }

  /**
   * Create reticle mesh for surface indication
   */
  private createReticle(): void {
    // Create ring geometry for reticle
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
    geometry.rotateX(-Math.PI / 2);

    // Create material with transparency
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    this.reticle = new THREE.Mesh(geometry, material);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;

    // Add grid overlay to reticle
    const gridGeometry = new THREE.PlaneGeometry(1, 1, 10, 10);
    gridGeometry.rotateX(-Math.PI / 2);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    this.reticle.add(grid);

    this.scene.add(this.reticle);
  }

  /**
   * Initialize hit test source
   */
  async setupHitTest(session: XRSession): Promise<void> {
    this.xrSession = session;

    if (this.hitTestSourceRequested) return;
    this.hitTestSourceRequested = true;

    try {
      // Request hit test source for viewer space
      const referenceSpace = await session.requestReferenceSpace('viewer');
      this.hitTestSource = await session.requestHitTestSource({ space: referenceSpace });
      
      console.log('Hit test source initialized');
    } catch (error) {
      console.error('Failed to initialize hit test source:', error);
      this.hitTestSourceRequested = false;
    }
  }

  /**
   * Update reticle position based on hit test results
   */
  updateReticle(frame: XRFrame, referenceSpace: XRReferenceSpace): HitTestData | null {
    if (!this.hitTestSource || !this.reticle) return null;

    // Get hit test results
    const hitTestResults = frame.getHitTestResults(this.hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      this.lastHitTestResult = hit;

      // Get pose from hit test result
      const pose = hit.getPose(referenceSpace);
      if (pose) {
        // Update reticle position and orientation
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);

        // Extract position and rotation for return
        const position = new THREE.Vector3();
        const rotation = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        this.reticle.matrix.decompose(position, rotation, scale);

        // Calculate distance from camera
        const distance = position.length();

        // Trigger callback if set
        if (this.surfaceDetectedCallback) {
          this.surfaceDetectedCallback(hit);
        }

        return {
          position,
          rotation,
          distance,
        };
      }
    } else {
      // No surface detected
      this.reticle.visible = false;
      this.lastHitTestResult = null;
    }

    return null;
  }

  /**
   * Show surface indicator at specific position
   */
  showSurfaceIndicator(position: THREE.Vector3, normal: THREE.Vector3): void {
    if (!this.reticle) return;

    this.reticle.visible = true;
    this.reticle.position.copy(position);

    // Orient reticle to surface normal
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, normal.normalize());
    this.reticle.quaternion.copy(quaternion);
  }

  /**
   * Hide surface indicator
   */
  hideSurfaceIndicator(): void {
    if (this.reticle) {
      this.reticle.visible = false;
    }
  }

  /**
   * Get last hit test result
   */
  getLastHitTestResult(): XRHitTestResult | null {
    return this.lastHitTestResult;
  }

  /**
   * Set callback for surface detection
   */
  onSurfaceDetected(callback: (hitResult: XRHitTestResult) => void): void {
    this.surfaceDetectedCallback = callback;
  }

  /**
   * Check if surface is currently detected
   */
  isSurfaceDetected(): boolean {
    return this.reticle?.visible || false;
  }

  /**
   * Get surface data from hit test result
   */
  getSurfaceData(hitResult: XRHitTestResult, referenceSpace: XRReferenceSpace): SurfaceData | null {
    const pose = hitResult.getPose(referenceSpace);
    if (!pose) return null;

    const matrix = new THREE.Matrix4();
    matrix.fromArray(pose.transform.matrix);

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, rotation, scale);

    // Calculate surface normal (assuming horizontal surface)
    const normal = new THREE.Vector3(0, 1, 0);
    normal.applyQuaternion(rotation);

    return {
      position,
      normal,
      confidence: 1.0, // WebXR doesn't provide confidence, assume 1.0
      timestamp: Date.now(),
    };
  }

  /**
   * Update reticle color based on state
   */
  setReticleColor(color: number, opacity: number = 0.7): void {
    if (this.reticle) {
      const material = this.reticle.material as THREE.MeshBasicMaterial;
      material.color.setHex(color);
      material.opacity = opacity;
    }
  }

  /**
   * Animate reticle (pulse effect)
   */
  animateReticle(time: number): void {
    if (!this.reticle || !this.reticle.visible) return;

    // Pulse effect
    const scale = 1 + Math.sin(time * 0.003) * 0.1;
    this.reticle.scale.set(scale, scale, scale);

    // Rotate slowly
    this.reticle.rotateZ(0.01);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.hitTestSource) {
      this.hitTestSource.cancel();
      this.hitTestSource = null;
    }

    if (this.reticle) {
      this.scene.remove(this.reticle);
      this.reticle.geometry.dispose();
      (this.reticle.material as THREE.Material).dispose();
      this.reticle = null;
    }

    this.xrSession = null;
    this.hitTestSourceRequested = false;
    this.lastHitTestResult = null;
    this.surfaceDetectedCallback = null;
  }
}

/**
 * Surface Detection Guidance Helper
 */
export class SurfaceDetectionGuidance {
  private detectionStartTime: number = 0;
  private guidanceThreshold: number = 5000; // 5 seconds
  private hasShownGuidance: boolean = false;

  /**
   * Start detection timer
   */
  startDetection(): void {
    this.detectionStartTime = Date.now();
    this.hasShownGuidance = false;
  }

  /**
   * Check if guidance should be shown
   */
  shouldShowGuidance(surfaceDetected: boolean): boolean {
    if (surfaceDetected) {
      this.hasShownGuidance = false;
      return false;
    }

    const elapsed = Date.now() - this.detectionStartTime;
    if (elapsed > this.guidanceThreshold && !this.hasShownGuidance) {
      this.hasShownGuidance = true;
      return true;
    }

    return false;
  }

  /**
   * Get guidance message based on elapsed time
   */
  getGuidanceMessage(): string {
    const elapsed = Date.now() - this.detectionStartTime;

    if (elapsed < 3000) {
      return 'Scanning for surfaces...';
    } else if (elapsed < 8000) {
      return 'Point your camera at a flat surface like a floor or table';
    } else if (elapsed < 15000) {
      return 'Move your device slowly to help detect surfaces';
    } else {
      return 'Try moving to a well-lit area with visible flat surfaces';
    }
  }

  /**
   * Get guidance tips
   */
  getGuidanceTips(): string[] {
    return [
      'Point at a flat, horizontal surface',
      'Ensure good lighting conditions',
      'Move your device slowly',
      'Avoid reflective or transparent surfaces',
      'Try a table, floor, or desk',
    ];
  }

  /**
   * Reset guidance state
   */
  reset(): void {
    this.detectionStartTime = 0;
    this.hasShownGuidance = false;
  }
}

export default SurfaceDetector;
