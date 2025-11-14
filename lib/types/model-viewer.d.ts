// Type declarations for @google/model-viewer web component

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': ModelViewerJSX & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

interface ModelViewerJSX {
  src?: string;
  alt?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: 'auto' | 'fixed';
  'camera-controls'?: boolean;
  'auto-rotate'?: boolean;
  'auto-rotate-delay'?: number;
  'rotation-per-second'?: string;
  loading?: 'auto' | 'lazy' | 'eager';
  reveal?: 'auto' | 'interaction' | 'manual';
  'shadow-intensity'?: number;
  'shadow-softness'?: number;
  'camera-orbit'?: string;
  'camera-target'?: string;
  'field-of-view'?: string;
  'min-camera-orbit'?: string;
  'max-camera-orbit'?: string;
  'min-field-of-view'?: string;
  'max-field-of-view'?: string;
  'interaction-prompt'?: 'auto' | 'when-focused' | 'none';
  'interaction-prompt-threshold'?: number;
  'interaction-prompt-style'?: 'basic' | 'wiggle';
  poster?: string;
  seamless?: boolean;
  'environment-image'?: string;
  exposure?: number;
  'tone-mapping'?: 'auto' | 'commerce' | 'neutral';
  skybox?: string;
  'skybox-height'?: string;
  'disable-zoom'?: boolean;
  'disable-pan'?: boolean;
  'disable-tap'?: boolean;
  'touch-action'?: string;
  bounds?: 'tight' | 'legacy';
  interpolation?: 'linear' | 'step';
  
  // iOS specific
  'ios-src'?: string;
  
  // Animation
  'animation-name'?: string;
  'animation-crossfade-duration'?: number;
  autoplay?: boolean;
  
  // Variants
  'variant-name'?: string;
  
  // Events
  onLoad?: (event: CustomEvent) => void;
  onError?: (event: CustomEvent) => void;
  onProgress?: (event: CustomEvent) => void;
  'onModel-visibility'?: (event: CustomEvent) => void;
  'onAr-status'?: (event: CustomEvent) => void;
  'onCamera-change'?: (event: CustomEvent) => void;
  'onEnvironment-change'?: (event: CustomEvent) => void;
  'onPlay'?: (event: CustomEvent) => void;
  'onPause'?: (event: CustomEvent) => void;
}

// Model Viewer Element Interface
interface ModelViewerElement extends HTMLElement {
  src: string;
  alt: string;
  ar: boolean;
  arModes: string;
  arScale: 'auto' | 'fixed';
  cameraControls: boolean;
  autoRotate: boolean;
  
  // Methods
  toBlob(options?: { mimeType?: string; qualityArgument?: number; idealAspect?: boolean }): Promise<Blob>;
  toDataURL(type?: string, encoderOptions?: number): string;
  getCameraOrbit(): { theta: number; phi: number; radius: number };
  getCameraTarget(): { x: number; y: number; z: number };
  getFieldOfView(): number;
  jumpCameraToGoal(): void;
  resetTurntableRotation(theta?: number): void;
  play(options?: { repetitions?: number; pingpong?: boolean }): void;
  pause(): void;
  
  // Properties
  readonly loaded: boolean;
  readonly modelIsVisible: boolean;
  readonly paused: boolean;
  currentTime: number;
  readonly duration: number;
  readonly availableAnimations: string[];
  animationName: string | null;
  
  // AR
  canActivateAR: boolean;
  activateAR(): Promise<void>;
}

declare global {
  interface Window {
    ModelViewerElement: typeof ModelViewerElement;
  }
}

export {};
