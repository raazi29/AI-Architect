// Type declarations for WebXR Device API
// Extends the standard lib.dom.d.ts types

interface Navigator {
  xr?: XRSystem;
}

interface XRSystem {
  isSessionSupported(mode: XRSessionMode): Promise<boolean>;
  requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;
}

type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';

interface XRSessionInit {
  requiredFeatures?: string[];
  optionalFeatures?: string[];
  domOverlay?: { root: Element };
}

interface XRSession extends EventTarget {
  renderState: XRRenderState;
  inputSources: XRInputSourceArray;
  environmentBlendMode: XREnvironmentBlendMode;
  visibilityState: XRVisibilityState;
  
  updateRenderState(state: XRRenderStateInit): void;
  requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
  requestAnimationFrame(callback: XRFrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
  end(): Promise<void>;
  
  requestHitTestSource(options: XRHitTestOptionsInit): Promise<XRHitTestSource>;
  requestHitTestSourceForTransientInput(options: XRTransientInputHitTestOptionsInit): Promise<XRTransientInputHitTestSource>;
  
  // Events
  onend: ((this: XRSession, ev: XRSessionEvent) => any) | null;
  oninputsourceschange: ((this: XRSession, ev: XRInputSourcesChangeEvent) => any) | null;
  onselect: ((this: XRSession, ev: XRInputSourceEvent) => any) | null;
  onselectstart: ((this: XRSession, ev: XRInputSourceEvent) => any) | null;
  onselectend: ((this: XRSession, ev: XRInputSourceEvent) => any) | null;
  onsqueeze: ((this: XRSession, ev: XRInputSourceEvent) => any) | null;
  onsqueezestart: ((this: XRSession, ev: XRInputSourceEvent) => any) | null;
  onsqueezeend: ((this: XRSession, ev: XRInputSourceEvent) => any) | null;
  onvisibilitychange: ((this: XRSession, ev: XRSessionEvent) => any) | null;
}

type XREnvironmentBlendMode = 'opaque' | 'additive' | 'alpha-blend';
type XRVisibilityState = 'visible' | 'visible-blurred' | 'hidden';
type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';

interface XRRenderState {
  depthNear: number;
  depthFar: number;
  inlineVerticalFieldOfView?: number;
  baseLayer?: XRWebGLLayer;
}

interface XRRenderStateInit {
  depthNear?: number;
  depthFar?: number;
  inlineVerticalFieldOfView?: number;
  baseLayer?: XRWebGLLayer;
}

interface XRWebGLLayer {
  framebuffer: WebGLFramebuffer;
  framebufferWidth: number;
  framebufferHeight: number;
  getViewport(view: XRView): XRViewport;
}

declare var XRWebGLLayer: {
  prototype: XRWebGLLayer;
  new(session: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext, options?: XRWebGLLayerInit): XRWebGLLayer;
};

interface XRWebGLLayerInit {
  antialias?: boolean;
  depth?: boolean;
  stencil?: boolean;
  alpha?: boolean;
  ignoreDepthValues?: boolean;
  framebufferScaleFactor?: number;
}

interface XRViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface XRFrame {
  session: XRSession;
  getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
  getPose(space: XRSpace, baseSpace: XRSpace): XRPose | null;
  getHitTestResults(hitTestSource: XRHitTestSource): XRHitTestResult[];
  getHitTestResultsForTransientInput(hitTestSource: XRTransientInputHitTestSource): XRTransientInputHitTestResult[];
  createAnchor?(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor>;
  trackedAnchors?: XRAnchorSet;
  getLightEstimate?(lightProbe: XRLightProbe): XRLightEstimate | null;
}

type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;

interface XRReferenceSpace extends XRSpace {
  getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace;
  onreset: ((this: XRReferenceSpace, ev: XRReferenceSpaceEvent) => any) | null;
}

interface XRSpace extends EventTarget {}

interface XRViewerPose extends XRPose {
  views: XRView[];
}

interface XRPose {
  transform: XRRigidTransform;
  emulatedPosition: boolean;
}

interface XRView {
  eye: XREye;
  projectionMatrix: Float32Array;
  transform: XRRigidTransform;
  recommendedViewportScale?: number;
  requestViewportScale?(scale: number): void;
}

type XREye = 'none' | 'left' | 'right';

interface XRRigidTransform {
  position: DOMPointReadOnly;
  orientation: DOMPointReadOnly;
  matrix: Float32Array;
  inverse: XRRigidTransform;
}

declare var XRRigidTransform: {
  prototype: XRRigidTransform;
  new(position?: DOMPointInit, orientation?: DOMPointInit): XRRigidTransform;
};

// Hit Testing
interface XRHitTestOptionsInit {
  space: XRSpace;
  offsetRay?: XRRay;
}

interface XRTransientInputHitTestOptionsInit {
  profile: string;
  offsetRay?: XRRay;
}

interface XRHitTestSource {
  cancel(): void;
}

interface XRTransientInputHitTestSource {
  cancel(): void;
}

interface XRHitTestResult {
  getPose(baseSpace: XRSpace): XRPose | null;
  createAnchor?(): Promise<XRAnchor>;
}

interface XRTransientInputHitTestResult {
  inputSource: XRInputSource;
  results: XRHitTestResult[];
}

interface XRRay {
  origin: DOMPointReadOnly;
  direction: DOMPointReadOnly;
  matrix: Float32Array;
}

declare var XRRay: {
  prototype: XRRay;
  new(origin?: DOMPointInit, direction?: DOMPointInit): XRRay;
  new(transform: XRRigidTransform): XRRay;
};

// Anchors
interface XRAnchor {
  anchorSpace: XRSpace;
  delete(): void;
}

interface XRAnchorSet extends Set<XRAnchor> {}

// Input Sources
interface XRInputSourceArray extends Array<XRInputSource> {
  [index: number]: XRInputSource;
  length: number;
}

interface XRInputSource {
  handedness: XRHandedness;
  targetRayMode: XRTargetRayMode;
  targetRaySpace: XRSpace;
  gripSpace?: XRSpace;
  profiles: string[];
  gamepad?: Gamepad;
  hand?: XRHand;
}

type XRHandedness = 'none' | 'left' | 'right';
type XRTargetRayMode = 'gaze' | 'tracked-pointer' | 'screen';

interface XRHand extends Map<XRHandJoint, XRJointSpace> {}

type XRHandJoint = 
  | 'wrist'
  | 'thumb-metacarpal' | 'thumb-phalanx-proximal' | 'thumb-phalanx-distal' | 'thumb-tip'
  | 'index-finger-metacarpal' | 'index-finger-phalanx-proximal' | 'index-finger-phalanx-intermediate' | 'index-finger-phalanx-distal' | 'index-finger-tip'
  | 'middle-finger-metacarpal' | 'middle-finger-phalanx-proximal' | 'middle-finger-phalanx-intermediate' | 'middle-finger-phalanx-distal' | 'middle-finger-tip'
  | 'ring-finger-metacarpal' | 'ring-finger-phalanx-proximal' | 'ring-finger-phalanx-intermediate' | 'ring-finger-phalanx-distal' | 'ring-finger-tip'
  | 'pinky-finger-metacarpal' | 'pinky-finger-phalanx-proximal' | 'pinky-finger-phalanx-intermediate' | 'pinky-finger-phalanx-distal' | 'pinky-finger-tip';

interface XRJointSpace extends XRSpace {
  jointName: XRHandJoint;
}

// Light Estimation
interface XRLightProbe extends EventTarget {
  probeSpace: XRSpace;
  onreflectionchange: ((this: XRLightProbe, ev: Event) => any) | null;
}

interface XRLightEstimate {
  sphericalHarmonicsCoefficients: Float32Array;
  primaryLightDirection: DOMPointReadOnly;
  primaryLightIntensity: DOMPointReadOnly;
}

// Events
interface XRSessionEvent extends Event {
  session: XRSession;
}

interface XRInputSourceEvent extends Event {
  frame: XRFrame;
  inputSource: XRInputSource;
}

interface XRInputSourcesChangeEvent extends Event {
  session: XRSession;
  added: XRInputSource[];
  removed: XRInputSource[];
}

interface XRReferenceSpaceEvent extends Event {
  referenceSpace: XRReferenceSpace;
  transform?: XRRigidTransform;
}

export {};
