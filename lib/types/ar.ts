import * as THREE from 'three';

// ============================================================================
// AR Session Types
// ============================================================================

export interface ARSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  deviceInfo: DeviceInfo;
  arMode: ARMode;
  placedObjects: PlacedObject[];
  performance: PerformanceMetrics;
}

export type ARMode = 'webxr' | 'model-viewer' | 'fallback';

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  webxrSupported: boolean;
  arQuickLookSupported: boolean;
  sceneViewerSupported: boolean;
}

export interface PerformanceMetrics {
  averageFPS: number;
  modelLoadTime: number;
  hitTestLatency: number;
  memoryUsage: number;
}

// ============================================================================
// Placed Object Types
// ============================================================================

export interface PlacedObject {
  id: string;
  modelUrl: string;
  modelName: string;
  anchor: AnchorData | null;
  transform: ObjectTransform;
  timestamp: Date;
  isSelected: boolean;
  mesh?: THREE.Object3D;
}

export interface AnchorData {
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion [x, y, z, w]
}

export interface ObjectTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

// ============================================================================
// AR Error Types
// ============================================================================

export interface ARError {
  code: ARErrorCode;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}

export enum ARErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  SESSION_FAILED = 'SESSION_FAILED',
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
  SURFACE_NOT_DETECTED = 'SURFACE_NOT_DETECTED',
  PLACEMENT_FAILED = 'PLACEMENT_FAILED',
  PERFORMANCE_DEGRADED = 'PERFORMANCE_DEGRADED',
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ARManagerProps {
  modelUrl: string;
  modelScale?: number;
  enableMultipleObjects?: boolean;
  onARStart?: () => void;
  onAREnd?: () => void;
  onObjectPlaced?: (objectId: string, position: THREE.Vector3) => void;
  onError?: (error: ARError) => void;
}

export interface ARManagerState {
  isARSupported: boolean;
  arMode: ARMode;
  isSessionActive: boolean;
  placedObjects: PlacedObject[];
  selectedObjectId: string | null;
}

export interface WebXRARSessionProps {
  modelUrl: string;
  onSessionStart: () => void;
  onSessionEnd: () => void;
  onPlacement: (position: XRRigidTransform) => void;
}

export interface ModelViewerWrapperProps {
  src: string;
  alt: string;
  ar?: boolean;
  arModes?: string;
  arScale?: 'auto' | 'fixed';
  cameraControls?: boolean;
  autoRotate?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  iosSrc?: string;
}

export interface SurfaceDetectorProps {
  xrSession: XRSession;
  onSurfaceDetected: (hitResult: XRHitTestResult) => void;
}

export interface ModelLoaderProps {
  url: string;
  onProgress?: (progress: number) => void;
  onLoad?: (model: THREE.Object3D) => void;
  onError?: (error: Error) => void;
}

export interface GestureHandlerProps {
  onTap: (position: THREE.Vector2) => void;
  onDrag: (delta: THREE.Vector2) => void;
  onPinch: (scale: number) => void;
  onRotate: (angle: number) => void;
}

export interface ARUIControlsProps {
  isSessionActive: boolean;
  placedObjectsCount: number;
  onStartAR: () => void;
  onEndAR: () => void;
  onClearObjects: () => void;
  onSelectModel: (modelUrl: string) => void;
}

// ============================================================================
// Gesture Types
// ============================================================================

export type GestureType = 'tap' | 'drag' | 'pinch' | 'rotate' | 'none';

export interface TouchData {
  id: number;
  position: THREE.Vector2;
  startPosition: THREE.Vector2;
  timestamp: number;
}

// ============================================================================
// Model Loading Types
// ============================================================================

export interface ModelCache {
  url: string;
  model: THREE.Object3D;
  loadTime: number;
  size: number;
}

export interface ModelLoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================================
// Surface Detection Types
// ============================================================================

export interface SurfaceData {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  confidence: number;
  timestamp: number;
}

export interface HitTestData {
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  distance: number;
}

// ============================================================================
// AR Capability Detection Types
// ============================================================================

export interface ARCapabilities {
  webxr: boolean;
  arQuickLook: boolean;
  sceneViewer: boolean;
  recommendedMode: ARMode;
}

// ============================================================================
// Error Messages
// ============================================================================

export interface ErrorMessage {
  title: string;
  message: string;
  action: string;
}

export const ERROR_MESSAGES: Record<ARErrorCode, ErrorMessage> = {
  [ARErrorCode.PERMISSION_DENIED]: {
    title: 'Camera Access Required',
    message: 'Please enable camera permissions in your browser settings to use AR.',
    action: 'Open Settings',
  },
  [ARErrorCode.NOT_SUPPORTED]: {
    title: 'AR Not Available',
    message: "Your device doesn't support AR. You can still view the 3D model.",
    action: 'View 3D Model',
  },
  [ARErrorCode.SESSION_FAILED]: {
    title: 'AR Session Failed',
    message: 'Failed to start AR session. Please try again.',
    action: 'Retry',
  },
  [ARErrorCode.MODEL_LOAD_FAILED]: {
    title: 'Model Load Failed',
    message: 'Failed to load 3D model. Please check your connection and try again.',
    action: 'Retry',
  },
  [ARErrorCode.SURFACE_NOT_DETECTED]: {
    title: 'Surface Not Found',
    message: 'Point your camera at a flat surface like a floor or table.',
    action: 'Try Again',
  },
  [ARErrorCode.PLACEMENT_FAILED]: {
    title: 'Placement Failed',
    message: 'Failed to place object. Please try a different location.',
    action: 'Retry',
  },
  [ARErrorCode.PERFORMANCE_DEGRADED]: {
    title: 'Performance Warning',
    message: 'AR performance is degraded. Consider removing some objects.',
    action: 'Clear Objects',
  },
};
