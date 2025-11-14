'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ARManager, ARUtils } from '@/lib/utils/ar-utils';
import { ModelViewerWrapperProps } from '@/lib/types/ar';

/**
 * ModelViewerWrapper Component
 * 
 * Wraps Google's model-viewer web component for iOS/Android AR fallback.
 * Supports AR Quick Look (iOS) and Scene Viewer (Android).
 */
export const ModelViewerWrapper: React.FC<ModelViewerWrapperProps> = ({
  src,
  alt,
  ar = true,
  arModes = 'webxr scene-viewer quick-look',
  arScale = 'auto',
  cameraControls = true,
  autoRotate = true,
  onLoad,
  onError,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [arCapabilities, setArCapabilities] = useState<any>(null);
  const [platformARModes, setPlatformARModes] = useState(arModes);

  // Validate model format on mount
  useEffect(() => {
    if (src && !ARUtils.validateModelFormat(src)) {
      const errorMsg = 'Unsupported 3D model format. Please use GLB, GLTF, USDZ, or Reality files.';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      console.error('Invalid model format:', src);
    }
  }, [src, onError]);

  useEffect(() => {
    // Dynamically import model-viewer
    const loadModelViewer = async () => {
      try {
        await import('@google/model-viewer');
        console.log('model-viewer loaded');
      } catch (err) {
        console.error('Failed to load model-viewer:', err);
        setError('Failed to load AR viewer');
      }
    };

    loadModelViewer();
    
    // Detect AR capabilities and set platform-specific modes
    const detectARCapabilities = async () => {
      try {
        const arManager = ARManager.getInstance();
        const capabilities = await arManager.detectCapabilities();
        setArCapabilities(capabilities);
        
        // Set platform-specific AR modes
        const platformModes = ARUtils.getPlatformARModes();
        setPlatformARModes(platformModes);
        
        console.log('AR Capabilities:', capabilities);
        console.log('Platform AR Modes:', platformModes);
      } catch (err) {
        console.error('Failed to detect AR capabilities:', err);
      }
    };
    
    detectARCapabilities();
  }, []);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    // Set up event listeners
    const handleLoad = () => {
      setIsLoading(false);
      setError(null);
      onLoad?.();
      console.log('Model loaded successfully');

      const mv = modelViewerRef.current;
      if (mv && typeof mv.canActivateAR !== 'undefined') {
        setIsARSupported(!!mv.canActivateAR);
      }
    };

    const handleError = (event: any) => {
      setIsLoading(false);
      const errorMessage = event.detail?.message || 'Failed to load model';
      const userFriendlyError = ARUtils.handleARError(new Error(errorMessage));
      setError(userFriendlyError);
      onError?.(new Error(errorMessage));
      console.error('Model load error:', errorMessage);
    };

    const handleARStatus = (event: any) => {
      const status = event.detail?.status;
      console.log('AR status:', status);
      
      if (status === 'not-presenting') {
        setIsARSupported(false);
      } else if (status === 'session-started') {
        setIsARSupported(true);
      }
    };

    modelViewer.addEventListener('load', handleLoad);
    modelViewer.addEventListener('error', handleError);
    modelViewer.addEventListener('ar-status', handleARStatus);

    // Check if AR is supported
    if (modelViewer.canActivateAR) {
      setIsARSupported(true);
    }

    return () => {
      modelViewer.removeEventListener('load', handleLoad);
      modelViewer.removeEventListener('error', handleError);
      modelViewer.removeEventListener('ar-status', handleARStatus);
    };
  }, [onLoad, onError]);

  const handleARButtonClick = () => {
    const modelViewer = modelViewerRef.current;
    if (modelViewer && modelViewer.canActivateAR) {
      modelViewer.activateAR();
    }
  };

  return (
    <div className="model-viewer-wrapper relative w-full h-full">
      {/* @ts-ignore - model-viewer is a web component */}
      <model-viewer
        ref={modelViewerRef}
        src={src}
        alt={alt}
        ar={ar}
        ar-modes={platformARModes}
        ar-scale={arScale}
        camera-controls={cameraControls}
        auto-rotate={autoRotate}
        auto-rotate-delay="0"
        rotation-per-second="30deg"
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1"
        shadow-softness="1"
        camera-orbit="0deg 75deg 105%"
        min-camera-orbit="auto auto 25%"
        max-camera-orbit="auto auto 500%"
        interpolation-decay="200"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)',
        }}
        loading="eager"
      >
        {/* Loading Indicator */}
        {isLoading && (
          <div slot="poster" className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading 3D model...</p>
            </div>
          </div>
        )}

        {/* AR Button */}
        {ar && isARSupported && (
          <button
            slot="ar-button"
            onClick={handleARButtonClick}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            View in AR
          </button>
        )}

        {/* Instructions */}
        <div slot="progress-bar" className="absolute bottom-4 left-4 right-4 text-center">
          <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
            <p>Drag to rotate • Pinch to zoom • Scroll to zoom</p>
          </div>
        </div>
      </model-viewer>

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-center p-6 max-w-md">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Model</h3>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* AR Not Supported Message */}
      {ar && !isARSupported && !isLoading && !error && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-sm text-yellow-800">
              AR is not available on this device. You can still view and interact with the 3D model.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelViewerWrapper;
