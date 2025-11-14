'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ARManager } from './ARManager';
import { ARCapabilityDetector } from './utils/ARCapabilityDetector';
import { PerformanceMonitorEnhanced } from './utils/PerformanceMonitorEnhanced';
import { ModernArchitectureModelLoader } from './utils/ModernArchitectureModelLoader';
import { FurniturePlacementController } from './utils/FurniturePlacementController';
import { LightingController } from './utils/LightingController';
import { ARPlacementUI } from './ARPlacementUI';
import { ARErrorBoundary } from './ARErrorBoundary';
import { ARSceneOptimizer } from './utils/ARSceneOptimizer';

interface EnhancedARSceneProps {
  modelUrl?: string;
  onPlacementComplete?: (position: any, rotation: any) => void;
  onError?: (error: any) => void;
  enableOcclusion?: boolean;
  enableShadows?: boolean;
  autoScale?: boolean;
  maxPolygons?: number;
  quality?: 'low' | 'medium' | 'high';
  enableRealisticMode?: boolean;
}

export default function EnhancedARSceneOptimized({
  modelUrl,
  onPlacementComplete,
  onError,
  enableOcclusion = true,
  enableShadows = true,
  autoScale = true,
  maxPolygons = 50000,
  quality = 'medium',
  enableRealisticMode = true
}: EnhancedARSceneProps) {
  const [arManager] = useState(() => new ARManager());
  const [capabilityDetector] = useState(() => new ARCapabilityDetector());
  const [performanceMonitor] = useState(() => new PerformanceMonitorEnhanced());
  const [modelLoader] = useState(() => new ModernArchitectureModelLoader());
  const [placementController] = useState(() => new FurniturePlacementController());
  const [lightingController] = useState(() => new LightingController());
  const [sceneOptimizer] = useState(() => new ARSceneOptimizer());
  
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [arStatus, setArStatus] = useState<string>('Checking AR support...');
  const [arCapabilities, setArCapabilities] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0
  });
  
  const sceneRef = useRef<HTMLDivElement>(null);
  const arSessionRef = useRef<any>(null);
  const gltfLoaderRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const sceneRefThree = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const reticleRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const placementCompleteRef = useRef(false);
  
  // Check AR support on component mount
  useEffect(() => {
    checkARSupportComprehensive();
  }, []);
  
  // Initialize AR scene when support is confirmed
  useEffect(() => {
    if (isARSupported === true && !isInitialized) {
      initializeARScene();
    }
  }, [isARSupported, isInitialized]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);
  
  // Comprehensive AR support check
  const checkARSupportComprehensive = async () => {
    try {
      const capabilities = await capabilityDetector.detectCapabilities();
      setArCapabilities(capabilities);
      
      const isSupported = capabilities.webXRSupported || capabilities.modelViewerSupported;
      setIsARSupported(isSupported);
      
      if (capabilities.webXRSupported) {
        setArStatus('WebXR Ready!');
      } else if (capabilities.modelViewerSupported) {
        setArStatus('Model Viewer Ready!');
      } else {
        setArStatus('AR not supported on this device');
      }
      
      console.log('AR Capabilities:', capabilities);
    } catch (error) {
      console.error('Failed to check AR support:', error);
      setIsARSupported(false);
      setArStatus('Failed to detect AR support');
    }
  };
  
  // Initialize 3D loaders
  const initializeLoaders = useCallback(() => {
    if (!gltfLoaderRef.current) {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      loader.setDRACOLoader(dracoLoader);
      gltfLoaderRef.current = loader;
    }
  }, []);
  
  // Initialize AR scene
  const initializeARScene = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!sceneRef.current) {
        throw new Error('Scene container not available');
      }
      
      // Initialize loaders
      initializeLoaders();
      
      // Create Three.js scene
      const { scene, camera, renderer } = await createThreeJSScene();
      sceneRefThree.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      
      // Set up AR session
      if (arCapabilities.webXRSupported) {
        await setupWebXRSession();
      } else if (arCapabilities.modelViewerSupported) {
        await setupModelViewerFallback();
      }
      
      // Load model if URL provided
      if (modelUrl) {
        await loadModel(modelUrl);
      }
      
      // Start render loop
      startRenderLoop();
      
      setIsInitialized(true);
      setIsLoading(false);
      setArStatus('AR Scene Ready!');
      
    } catch (error) {
      console.error('Failed to initialize AR scene:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize AR scene');
      setArStatus('Failed to initialize AR scene');
      setIsLoading(false);
      onError?.(error);
    }
  };
  
  // Create Three.js scene
  const createThreeJSScene = async () => {
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = enableShadows;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    
    if (sceneRef.current) {
      sceneRef.current.appendChild(renderer.domElement);
    }
    
    // Set up lighting
    setupLighting(scene);
    
    // Set up environment
    setupEnvironment(scene);
    
    return { scene, camera, renderer };
  };
  
  // Set up lighting
  const setupLighting = (scene: any) => {
    lightingController.setupLighting(scene, {
      enableShadows,
      enableRealisticMode,
      quality
    });
  };
  
  // Set up environment
  const setupEnvironment = (scene: any) => {
    if (enableRealisticMode) {
      // Add environment map for realistic reflections
      const pmremGenerator = new PMREMGenerator(rendererRef.current);
      const envTexture = pmremGenerator.fromScene(new RoomEnvironment()).texture;
      scene.environment = envTexture;
      scene.background = envTexture;
    }
  };
  
  // Set up WebXR session
  const setupWebXRSession = async () => {
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        optionalFeatures: ['dom-overlay-for-handheld-ar']
      });
      
      arSessionRef.current = session;
      
      // Set up hit testing
      const referenceSpace = await session.requestReferenceSpace('local');
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      
      // Set up reticle
      setupReticle();
      
      session.addEventListener('end', () => {
        arSessionRef.current = null;
      });
      
    } catch (error) {
      console.error('Failed to setup WebXR session:', error);
      throw error;
    }
  };
  
  // Set up Model Viewer fallback
  const setupModelViewerFallback = async () => {
    // Create model-viewer element for fallback
    const modelViewer = document.createElement('model-viewer');
    modelViewer.setAttribute('ar', '');
    modelViewer.setAttribute('camera-controls', '');
    modelViewer.setAttribute('shadow-intensity', '1');
    modelViewer.setAttribute('exposure', '1');
    
    if (sceneRef.current) {
      sceneRef.current.appendChild(modelViewer);
    }
    
    // Set up reticle for model-viewer
    setupReticle();
  };
  
  // Set up reticle
  const setupReticle = () => {
    const reticleGeometry = new RingGeometry(0.1, 0.15, 32);
    const reticleMaterial = new MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5 
    });
    
    reticleRef.current = new Mesh(reticleGeometry, reticleMaterial);
    reticleRef.current.visible = false;
    
    if (sceneRefThree.current) {
      sceneRefThree.current.add(reticleRef.current);
    }
  };
  
  // Load model
  const loadModel = async (url: string) => {
    try {
      setArStatus('Loading model...');
      
      const model = await modelLoader.loadModel(url, {
        maxPolygons,
        autoScale,
        quality
      });
      
      if (model) {
        modelRef.current = model;
        
        // Optimize model for AR
        sceneOptimizer.optimizeModel(model, {
          reducePolygons: true,
          compressTextures: true,
          optimizeMaterials: true
        });
        
        // Add to scene but hide initially
        model.visible = false;
        if (sceneRefThree.current) {
          sceneRefThree.current.add(model);
        }
        
        setArStatus('Model loaded successfully!');
      }
      
    } catch (error) {
      console.error('Failed to load model:', error);
      setArStatus('Failed to load model');
      throw error;
    }
  };
  
  // Start render loop
  const startRenderLoop = () => {
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRefThree.current && cameraRef.current) {
        // Update performance metrics
        const metrics = performanceMonitor.getMetrics();
        setPerformanceMetrics(metrics);
        
        // Update reticle
        updateReticle();
        
        // Render scene
        rendererRef.current.render(sceneRefThree.current, cameraRef.current);
      }
    };
    
    animate();
  };
  
  // Update reticle
  const updateReticle = () => {
    if (!reticleRef.current || !arSessionRef.current) return;
    
    // Update reticle position based on hit testing
    // This is a simplified version - in a real implementation,
    // you would use the actual hit test results
    reticleRef.current.visible = true;
  };
  
  // Handle placement
  const handlePlacement = () => {
    if (modelRef.current && reticleRef.current && !placementCompleteRef.current) {
      // Place model at reticle position
      modelRef.current.position.copy(reticleRef.current.position);
      modelRef.current.visible = true;
      
      placementCompleteRef.current = true;
      reticleRef.current.visible = false;
      
      onPlacementComplete?.(modelRef.current.position, modelRef.current.rotation);
      setArStatus('Model placed successfully!');
    }
  };
  
  // Cleanup
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (arSessionRef.current) {
      arSessionRef.current.end();
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    
    if (sceneRefThree.current) {
      sceneRefThree.current.clear();
    }
    
    if (sceneRef.current && rendererRef.current?.domElement) {
      sceneRef.current.removeChild(rendererRef.current.domElement);
    }
    
    performanceMonitor.cleanup();
  };
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isARSupported === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking AR support...</p>
        </div>
      </div>
    );
  }
  
  if (isARSupported === false) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">AR Not Supported</h3>
          <p className="text-red-600">{arStatus}</p>
          <p className="text-sm text-red-500 mt-2">
            This device doesn&apos;t support WebXR or Model Viewer. Please try on a compatible device.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <ARErrorBoundary onError={onError}>
      <div className="relative w-full h-full">
        {/* AR Scene Container */}
        <div 
          ref={sceneRef} 
          className="w-full h-full relative overflow-hidden"
          style={{ touchAction: 'none' }}
        />
        
        {/* AR Placement UI */}
        <ARPlacementUI
          arStatus={arStatus}
          performanceMetrics={performanceMetrics}
          isLoading={isLoading}
          error={error}
          onPlace={handlePlacement}
          canPlace={!placementCompleteRef.current && modelRef.current !== null}
        />
        
        {/* Performance Monitor Display */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs font-mono">
            <div>FPS: {performanceMetrics.fps}</div>
            <div>Memory: {performanceMetrics.memoryUsage}MB</div>
            <div>Render: {performanceMetrics.renderTime}ms</div>
          </div>
        )}
      </div>
    </ARErrorBoundary>
  );
}
