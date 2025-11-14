'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WebXRARSessionProps, ARError, ARErrorCode } from '@/lib/types/ar';

/**
 * WebXRARSession Component
 * 
 * Implements WebXR Device API for native AR experiences.
 * Handles session initialization, animation loop, and cleanup.
 */
export const WebXRARSession: React.FC<WebXRARSessionProps> = ({
  modelUrl,
  onSessionStart,
  onSessionEnd,
  onPlacement,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // WebXR references
  const xrSessionRef = useRef<XRSession | null>(null);
  const xrRefSpaceRef = useRef<XRReferenceSpace | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<ARError | null>(null);

  /**
   * Initialize Three.js scene and renderer
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
      );
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      rendererRef.current = renderer;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 10, 10);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      setIsInitialized(true);
      console.log('Three.js scene initialized');
    } catch (err) {
      console.error('Failed to initialize Three.js:', err);
      setError({
        code: ARErrorCode.SESSION_FAILED,
        message: 'Failed to initialize 3D renderer',
        details: err,
        recoverable: false,
      });
    }

    // Cleanup
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  /**
   * Initialize WebXR AR session
   */
  const initSession = useCallback(async () => {
    if (!navigator.xr) {
      setError({
        code: ARErrorCode.NOT_SUPPORTED,
        message: 'WebXR is not supported on this device',
        recoverable: false,
      });
      return;
    }

    if (!rendererRef.current) {
      setError({
        code: ARErrorCode.SESSION_FAILED,
        message: 'Renderer not initialized',
        recoverable: false,
      });
      return;
    }

    try {
      // Check if immersive-ar is supported
      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!supported) {
        setError({
          code: ARErrorCode.NOT_SUPPORTED,
          message: 'Immersive AR is not supported on this device',
          recoverable: false,
        });
        return;
      }

      // Request AR session
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation', 'anchors'],
        domOverlay: containerRef.current ? { root: containerRef.current } : undefined,
      });

      xrSessionRef.current = session;

      // Set up session event handlers
      session.addEventListener('end', handleSessionEnd);

      // Set up WebGL layer
      const gl = rendererRef.current.getContext() as WebGLRenderingContext;
      const layer = new XRWebGLLayer(session, gl);
      await session.updateRenderState({ baseLayer: layer });

      // Get reference space
      const referenceSpace = await session.requestReferenceSpace('local-floor');
      xrRefSpaceRef.current = referenceSpace;

      // Start animation loop
      session.requestAnimationFrame(onXRFrame);

      console.log('WebXR AR session started');
      onSessionStart();
    } catch (err: any) {
      console.error('Failed to start AR session:', err);
      
      let errorCode = ARErrorCode.SESSION_FAILED;
      let errorMessage = 'Failed to start AR session';

      if (err.name === 'NotAllowedError') {
        errorCode = ARErrorCode.PERMISSION_DENIED;
        errorMessage = 'Camera permission denied';
      } else if (err.name === 'NotSupportedError') {
        errorCode = ARErrorCode.NOT_SUPPORTED;
        errorMessage = 'AR features not supported';
      }

      setError({
        code: errorCode,
        message: errorMessage,
        details: err,
        recoverable: errorCode !== ARErrorCode.NOT_SUPPORTED,
      });
    }
  }, [onSessionStart]);

  /**
   * XR animation frame callback
   */
  const onXRFrame = useCallback((time: DOMHighResTimeStamp, frame: XRFrame) => {
    const session = frame.session;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const refSpace = xrRefSpaceRef.current;

    if (!renderer || !scene || !camera || !refSpace) return;

    // Schedule next frame
    animationFrameIdRef.current = session.requestAnimationFrame(onXRFrame);

    // Get viewer pose
    const pose = frame.getViewerPose(refSpace);
    if (!pose) return;

    // Update renderer
    const layer = session.renderState.baseLayer;
    if (layer) {
      renderer.setFramebuffer(layer.framebuffer);
      renderer.setSize(layer.framebufferWidth, layer.framebufferHeight, false);
    }

    // Render each view
    for (const view of pose.views) {
      const viewport = layer?.getViewport(view);
      if (viewport) {
        renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
      }

      // Update camera
      camera.matrix.fromArray(view.transform.matrix);
      camera.projectionMatrix.fromArray(view.projectionMatrix);
      camera.updateMatrixWorld(true);

      // Render scene
      renderer.render(scene, camera);
    }
  }, []);

  /**
   * Handle session end
   */
  const handleSessionEnd = useCallback(() => {
    console.log('WebXR session ended');
    
    if (animationFrameIdRef.current !== null) {
      xrSessionRef.current?.cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    xrSessionRef.current = null;
    xrRefSpaceRef.current = null;

    onSessionEnd();
  }, [onSessionEnd]);

  /**
   * End AR session manually
   */
  const endSession = useCallback(async () => {
    if (xrSessionRef.current) {
      await xrSessionRef.current.end();
    }
  }, []);

  /**
   * Start session on mount
   */
  useEffect(() => {
    if (isInitialized) {
      initSession();
    }

    return () => {
      endSession();
    };
  }, [isInitialized, initSession, endSession]);

  // Error display
  if (error) {
    return (
      <div className="webxr-error flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">WebXR Error</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          {error.recoverable && (
            <button
              onClick={initSession}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="webxr-ar-session relative w-full h-screen">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* AR UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          {/* Session info */}
          <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
            WebXR AR Active
          </div>
          
          {/* Exit button */}
          <button
            onClick={endSession}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Exit AR
          </button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <div className="bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg text-sm text-center">
            Point your camera at a flat surface to place objects
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebXRARSession;
