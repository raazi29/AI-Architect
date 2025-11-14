import * as THREE from 'three';
import { GestureHandlerProps, GestureType, TouchData } from '@/lib/types/ar';

/**
 * GestureHandler Class
 * 
 * Processes touch and pointer events for AR object manipulation.
 * Detects tap, drag, pinch, and rotation gestures.
 */
export class GestureHandler {
  private element: HTMLElement;
  private touches: Map<number, TouchData> = new Map();
  private isGestureActive: boolean = false;
  private gestureType: GestureType = 'none';

  // Gesture thresholds
  private readonly TAP_THRESHOLD = 10; // pixels
  private readonly TAP_TIME_THRESHOLD = 300; // ms
  private readonly DRAG_THRESHOLD = 5; // pixels

  // Callbacks
  private onTapCallback: ((position: THREE.Vector2) => void) | null = null;
  private onDragCallback: ((delta: THREE.Vector2) => void) | null = null;
  private onPinchCallback: ((scale: number) => void) | null = null;
  private onRotateCallback: ((angle: number) => void) | null = null;

  // Gesture state
  private initialPinchDistance: number = 0;
  private currentPinchDistance: number = 0;
  private initialRotation: number = 0;
  private currentRotation: number = 0;
  private lastDragPosition: THREE.Vector2 | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Mouse events for desktop testing
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const currentTime = Date.now();

    // Store touch data
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const position = this.getTouchPosition(touch);

      this.touches.set(touch.identifier, {
        id: touch.identifier,
        position: position.clone(),
        startPosition: position.clone(),
        timestamp: currentTime,
      });
    }

    // Detect gesture type
    this.gestureType = this.detectGestureType();
    this.isGestureActive = true;

    // Initialize gesture-specific state
    if (this.gestureType === 'pinch') {
      this.initialPinchDistance = this.calculatePinchDistance();
      this.currentPinchDistance = this.initialPinchDistance;
    } else if (this.gestureType === 'rotate') {
      this.initialRotation = this.calculateRotationAngle();
      this.currentRotation = this.initialRotation;
    } else if (this.gestureType === 'drag') {
      const firstTouch = Array.from(this.touches.values())[0];
      this.lastDragPosition = firstTouch.position.clone();
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (!this.isGestureActive) return;

    // Update touch positions
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchData = this.touches.get(touch.identifier);
      if (touchData) {
        touchData.position = this.getTouchPosition(touch);
      }
    }

    // Process gesture
    switch (this.gestureType) {
      case 'drag':
        this.processDrag();
        break;
      case 'pinch':
        this.processPinch();
        break;
      case 'rotate':
        this.processRotation();
        break;
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    // Check for tap gesture before removing touches
    if (this.gestureType === 'tap' || this.touches.size === 1) {
      const touch = Array.from(this.touches.values())[0];
      if (touch && this.isTapGesture(touch)) {
        this.onTapCallback?.(touch.position);
      }
    }

    // Remove ended touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.touches.delete(touch.identifier);
    }

    // Reset gesture state if no touches remain
    if (this.touches.size === 0) {
      this.isGestureActive = false;
      this.gestureType = 'none';
      this.lastDragPosition = null;
    } else {
      // Re-detect gesture type with remaining touches
      this.gestureType = this.detectGestureType();
    }
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(event: TouchEvent): void {
    this.handleTouchEnd(event);
  }

  /**
   * Handle mouse down (for desktop testing)
   */
  private handleMouseDown(event: MouseEvent): void {
    const position = this.getMousePosition(event);
    const touchData: TouchData = {
      id: 0,
      position: position.clone(),
      startPosition: position.clone(),
      timestamp: Date.now(),
    };

    this.touches.set(0, touchData);
    this.gestureType = 'drag';
    this.isGestureActive = true;
    this.lastDragPosition = position.clone();
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isGestureActive || this.gestureType !== 'drag') return;

    const touchData = this.touches.get(0);
    if (touchData) {
      touchData.position = this.getMousePosition(event);
      this.processDrag();
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(event: MouseEvent): void {
    const touchData = this.touches.get(0);
    if (touchData && this.isTapGesture(touchData)) {
      this.onTapCallback?.(touchData.position);
    }

    this.touches.clear();
    this.isGestureActive = false;
    this.gestureType = 'none';
    this.lastDragPosition = null;
  }

  /**
   * Detect gesture type based on number of touches
   */
  private detectGestureType(): GestureType {
    const touchCount = this.touches.size;

    if (touchCount === 1) {
      return 'tap'; // Will be determined as tap or drag based on movement
    } else if (touchCount === 2) {
      // Could be pinch or rotate, determine based on movement
      return 'pinch'; // Default to pinch, can switch to rotate
    }

    return 'none';
  }

  /**
   * Check if gesture is a tap
   */
  private isTapGesture(touch: TouchData): boolean {
    const distance = touch.position.distanceTo(touch.startPosition);
    const duration = Date.now() - touch.timestamp;

    return distance < this.TAP_THRESHOLD && duration < this.TAP_TIME_THRESHOLD;
  }

  /**
   * Process drag gesture
   */
  private processDrag(): void {
    if (!this.lastDragPosition) return;

    const touches = Array.from(this.touches.values());
    if (touches.length === 0) return;

    const currentPosition = touches[0].position;
    const delta = new THREE.Vector2(
      currentPosition.x - this.lastDragPosition.x,
      currentPosition.y - this.lastDragPosition.y
    );

    // Check if movement exceeds threshold
    if (delta.length() > this.DRAG_THRESHOLD) {
      this.gestureType = 'drag';
      this.onDragCallback?.(delta);
      this.lastDragPosition = currentPosition.clone();
    }
  }

  /**
   * Process pinch gesture
   */
  private processPinch(): void {
    const touches = Array.from(this.touches.values());
    if (touches.length !== 2) return;

    this.currentPinchDistance = this.calculatePinchDistance();
    const scale = this.currentPinchDistance / this.initialPinchDistance;

    this.onPinchCallback?.(scale);

    // Update initial distance for next frame
    this.initialPinchDistance = this.currentPinchDistance;
  }

  /**
   * Process rotation gesture
   */
  private processRotation(): void {
    const touches = Array.from(this.touches.values());
    if (touches.length !== 2) return;

    this.currentRotation = this.calculateRotationAngle();
    const angleDelta = this.currentRotation - this.initialRotation;

    this.onRotateCallback?.(angleDelta);

    // Update initial rotation for next frame
    this.initialRotation = this.currentRotation;
  }

  /**
   * Calculate distance between two touches (for pinch)
   */
  private calculatePinchDistance(): number {
    const touches = Array.from(this.touches.values());
    if (touches.length !== 2) return 0;

    return touches[0].position.distanceTo(touches[1].position);
  }

  /**
   * Calculate angle between two touches (for rotation)
   */
  private calculateRotationAngle(): number {
    const touches = Array.from(this.touches.values());
    if (touches.length !== 2) return 0;

    const dx = touches[1].position.x - touches[0].position.x;
    const dy = touches[1].position.y - touches[0].position.y;

    return Math.atan2(dy, dx);
  }

  /**
   * Get touch position in normalized device coordinates
   */
  private getTouchPosition(touch: Touch): THREE.Vector2 {
    const rect = this.element.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

    return new THREE.Vector2(x, y);
  }

  /**
   * Get mouse position in normalized device coordinates
   */
  private getMousePosition(event: MouseEvent): THREE.Vector2 {
    const rect = this.element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    return new THREE.Vector2(x, y);
  }

  /**
   * Set tap callback
   */
  onTap(callback: (position: THREE.Vector2) => void): void {
    this.onTapCallback = callback;
  }

  /**
   * Set drag callback
   */
  onDrag(callback: (delta: THREE.Vector2) => void): void {
    this.onDragCallback = callback;
  }

  /**
   * Set pinch callback
   */
  onPinch(callback: (scale: number) => void): void {
    this.onPinchCallback = callback;
  }

  /**
   * Set rotate callback
   */
  onRotate(callback: (angle: number) => void): void {
    this.onRotateCallback = callback;
  }

  /**
   * Get current gesture type
   */
  getCurrentGesture(): GestureType {
    return this.gestureType;
  }

  /**
   * Check if gesture is active
   */
  isActive(): boolean {
    return this.isGestureActive;
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));

    this.touches.clear();
    this.isGestureActive = false;
    this.gestureType = 'none';
  }
}

export default GestureHandler;
