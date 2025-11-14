'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { EnhancedARSceneProps } from '@/lib/types/ar';
import { PerformanceMonitorEnhanced } from './utils/PerformanceMonitorEnhanced';
import { modelLoader } from './utils/ModelLoader';
import { modelService } from './model-service';
import { SurfaceDetector } from './SurfaceDetector';
import { ObjectPlacementEngine } from './ObjectPlacementEngine';

/**
 * Enhanced AR Scene with Performance Optimization
 * 
 * Advanced AR scene component with integrated performance monitoring,
 * adaptive quality scaling, and mobile optimization.
 */
export const EnhancedARSceneOptimized: React.FC<EnhancedARSceneProps> = ({
  modelUrl,
  modelScale = 1.0,
  onObjectPlaced,
  onError,
  enableShadows = true,
  enablePostProcessing = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isARSupported, setIsARSupported] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [currentQuality, setCurrentQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [warnings, setWarnings] = useState<string[]>([]);

  // Performance monitoring
  const performanceMonitorRef = useRef<PerformanceMonitorEnhanced | null>(null);
  const surfaceDetectorRef = useRef<SurfaceDetector | null>(null);
  const placementEngineRef = useRef<ObjectPlacementEngine | null>(null);

  /**
   * Initialize performance monitoring
   */
  const initializePerformanceMonitoring = useCallback(() => {
    performanceMonitorRef.current = new PerformanceMonitorEnhanced();
    
    // Set up performance callbacks
    performanceMonitorRef.current.setWarningCallback((message: string, level: 'warning' | 'critical') => {
      console.warn(`Performance ${level}: ${message}`);
      setWarnings(prev => [...prev, `${level.toUpperCase()}: ${message}`]);
      
      // Auto-limit warnings to prevent UI clutter
      setTimeout(() => {
        setWarnings(prev => prev.slice(1));
      }, 5000);
    });

    performanceMonitorRef.current.setQualityAdjustmentCallback((quality: 'high' | 'medium' | 'low') => {
      console.log(`Quality adjustment: ${quality}`);
      setCurrentQuality(quality);
      applyQualitySettings(quality);
    });

    performanceMonitorRef.current.setPerformanceReportCallback((stats: any) => {
      setPerformanceStats(stats);
    });
  }, []);

  /**
   * Apply quality settings based on performance
   */
  const applyQualitySettings = useCallback((quality: 'high' | 'medium' | 'low') => {
    if (!performanceMonitorRef.current || !rendererRef.current) return;

    const settings = performanceMonitorRef.current.getRendererSettings(quality);
    const renderer = rendererRef.current;

    // Apply renderer settings
    renderer.setPixelRatio(settings.pixelRatio);
    renderer.shadowMap.enabled = settings.enableShadows;
    
    if (renderer.shadowMap.map) {
      renderer.shadowMap.map.setSize(settings.shadowMapSize, settings.shadowMapSize);
    }

    // Update scene settings
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          const material = object.material as THREE.MeshStandardMaterial;
          
          // Adjust material quality
          if (material.map) {
            material.map.anisotropy = settings.maxAnisotropy;
          }
          
          // Disable shadows on low quality
          if (!settings.enableShadows) {
            object.castShadow = false;
            object.receiveShadow = false;
          }
        }
      });
    }

    console.log(`Applied ${quality} quality settings:`, settings);
  }, []);

  /**
   * Initialize Three.js scene
   */
  const initializeScene = useCallback(async () => {
    if (!mountRef.current) return;

    try {
      setIsLoading(true);

      // Initialize performance monitoring first
      initializePerformanceMonitoring();

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      cameraRef.current = camera;

      // Create renderer with performance-optimized settings
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Conservative for mobile
      renderer.xr.enabled = true;
      renderer.shadowMap.enabled = enableShadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      
      rendererRef.current = renderer;
      mountRef.current.appendChild(renderer.domElement);

      // Initialize components
      surfaceDetectorRef.current = new SurfaceDetector(scene, renderer, camera);
      placementEngineRef.current = new ObjectPlacementEngine(scene, camera);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = enableShadows;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);

      // Load model
      if (modelUrl) {
        await loadModel(modelUrl);
      }

      // Check AR support
      if ('xr' in navigator) {
        const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
      }

      setIsLoading(false);
      console.log('AR scene initialized successfully');

    } catch (error) {
      console.error('Error initializing AR scene:', error);
      onError?.(error as Error);
      setIsLoading(false);
    }
  }, [modelUrl, enableShadows, initializePerformanceMonitoring, onError]);

  /**
   * Load 3D model with performance optimization using shared ModelLoader
   */
  const loadModel = useCallback(async (url: string) => {
    if (!sceneRef.current) return;

    try {
      console.log('EnhancedARScene: Loading model using shared ModelLoader');
      const info = modelService.getModelByUrl(url);
      if (!info || !modelService.verifyLicense(info)) {
        setWarnings(prev => [...prev, 'Model license unknown or not allowed']);
      }
      
      const loadedModel = await modelLoader.loadModel({
        url,
        dracoEnabled: true,
        maxRetries: 3,
        timeout: 30000,
      });

      if (loadedModel) {
        // Apply scale if needed
        if (modelScale !== 1.0) {
          loadedModel.scene.scale.setScalar(modelScale);
        }
        
        // Add model to scene
        sceneRef.current.add(loadedModel.scene);
        modelRef.current = loadedModel.scene;
        
        console.log('EnhancedARScene: Model loaded successfully with shared ModelLoader');
      }
    } catch (error) {
      console.error('EnhancedARScene: Error loading model:', error);
      onError?.(error as Error);
    }
  }, [modelScale, onError]);

  /**
   * Start AR session
   */
  const startARSession = useCallback(async () => {
    if (!rendererRef.current || !navigator.xr) return;

    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        optionalFeatures: ['dom-overlay-for-handheld-ar'],
        domOverlay: { root: mountRef.current! },
      });

      sessionRef.current = session;
      rendererRef.current.xr.setSession(session);
      setIsSessionActive(true);

      // Initialize surface detection
      if (surfaceDetectorRef.current) {
        await surfaceDetectorRef.current.initialize(session);
      }

      // Start animation loop
      animate();

      session.addEventListener('end', () => {
        setIsSessionActive(false);
        sessionRef.current = null;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      });

      console.log('AR session started');

    } catch (error) {
      console.error('Error starting AR session:', error);
      onError?.(error as Error);
    }
  }, [onError]);

  /**
   * Animation loop with performance monitoring
   */
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const currentTime = performance.now();

    // Update performance monitor
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.update(currentTime);
      
      // Log stats every 10 seconds
      if (Math.floor(currentTime / 10000) !== Math.floor((currentTime - 16) / 10000)) {
        performanceMonitorRef.current.logStats();
      }
    }

    // Update surface detector
    if (surfaceDetectorRef.current && sessionRef.current) {
      surfaceDetectorRef.current.update(sessionRef.current, cameraRef.current!);
    }

    // Render scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  /**
   * Handle object placement
   */
  const handleObjectPlacement = useCallback((event: any) => {
    if (!modelRef.current || !placementEngineRef.current) return;

    try {
      const placedObject = placementEngineRef.current.placeObject(
        modelRef.current.clone(),
        event.position,
        event.rotation
      );

      if (placedObject && onObjectPlaced) {
        onObjectPlaced(placedObject.uuid);
      }

      console.log('Object placed successfully');
    } catch (error) {
      console.error('Error placing object:', error);
      onError?.(error as Error);
    }
  }, [onObjectPlaced, onError]);

  /**
   * Handle window resize
   */
  const handleResize = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    rendererRef.current.setSize(width, height);
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (sessionRef.current) {
      sessionRef.current.end();
    }

    if (rendererRef.current && mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }

    if (performanceMonitorRef.current) {
      const report = performanceMonitorRef.current.generateReport();
      console.log('Performance Report:', report);
    }
  }, []);

  // Initialize scene on mount
  useEffect(() => {
    initializeScene();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [initializeScene, handleResize, cleanup]);

  // Apply quality settings when quality changes
  useEffect(() => {
    if (isSessionActive) {
      applyQualitySettings(currentQuality);
    }
  }, [currentQuality, isSessionActive, applyQualitySettings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing AR scene...</p>
        </div>
      </div>
    );
  }

  if (!isARSupported) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-red-50 rounded-lg border border-red-200">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AR Not Supported</h3>
          <p className="text-gray-600 mb-4">
            Your device doesn&apos;t support WebXR AR. Try using a compatible mobile device or browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Performance Monitor UI */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm z-50">
          <div>Quality: {currentQuality}</div>
          <div>FPS: {performanceStats?.fps?.current?.toFixed(1) || '0'}</div>
          <div>Memory: {performanceStats?.memory?.usedMB?.toFixed(0) || '0'}MB</div>
        </div>
      )}

      {/* Performance Warnings */}
      {warnings.length > 0 && (
        <div className="absolute top-4 right-4 space-y-2 z-40">
          {warnings.map((warning, index) => (
            <div key={index} className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm">
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* AR Session Controls */}
      {!isSessionActive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={startARSession}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start AR Experience
          </button>
        </div>
      )}

      {/* Three.js Mount Point */}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

export default EnhancedARSceneOptimized;
