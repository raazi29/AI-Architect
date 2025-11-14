'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ARManagerProps, ARManagerState, ARError, ARErrorCode, ERROR_MESSAGES } from '@/lib/types/ar';
import { arCapabilityDetector } from './utils/ARCapabilityDetector';
import { modelService } from './model-service';
import dynamic from 'next/dynamic';

// Dynamically import AR components to avoid SSR issues
const WebXRARSession = dynamic(() => import('./WebXRARSession'), { ssr: false });
const ModelViewerWrapper = dynamic(() => import('./ModelViewerWrapper'), { ssr: false });
const EnhancedARScene = dynamic(() => import('./enhanced-ar-scene'), { ssr: false });
const EnhancedARSceneOptimized = dynamic(() => import('./EnhancedARSceneOptimized'), { ssr: false });

/**
 * Enhanced ARManager Component
 * 
 * Main orchestrator for AR functionality with proper component rendering.
 * Handles device detection, AR session lifecycle, and coordinates between sub-components.
 */
export const ARManagerEnhanced: React.FC<ARManagerProps> = ({
  modelUrl,
  modelScale = 1.0,
  enableMultipleObjects = false,
  onARStart,
  onAREnd,
  onObjectPlaced,
  onError,
}) => {
  const [state, setState] = useState<ARManagerState>({
    isARSupported: false,
    arMode: 'fallback',
    isSessionActive: false,
    placedObjects: [],
    selectedObjectId: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ARError | null>(null);

  /**
   * Initialize AR capabilities on mount
   */
  useEffect(() => {
    initializeAR();
  }, []);

  /**
   * Detect device capabilities and set AR mode
   */
  const initializeAR = async () => {
    try {
      setIsLoading(true);
      
      const capabilities = await arCapabilityDetector.detectCapabilities();
      
      const isSupported = 
        capabilities.webxr || 
        capabilities.arQuickLook || 
        capabilities.sceneViewer;

      setState(prev => ({
        ...prev,
        isARSupported: isSupported,
        arMode: capabilities.recommendedMode,
      }));

      console.log('AR Capabilities:', capabilities);
      console.log('Recommended Mode:', capabilities.recommendedMode);
    } catch (err) {
      handleError({
        code: ARErrorCode.NOT_SUPPORTED,
        message: 'Failed to detect AR capabilities',
        details: err,
        recoverable: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start AR session
   */
  const startARSession = useCallback(async () => {
    try {
      if (state.arMode === 'fallback') {
        setState(prev => ({ ...prev, isSessionActive: true }));
        onARStart?.();
        return;
      }

      setState(prev => ({ ...prev, isSessionActive: true }));
      onARStart?.();

      console.log(`Starting AR session in ${state.arMode} mode`);
    } catch (err) {
      handleError({
        code: ARErrorCode.SESSION_FAILED,
        message: 'Failed to start AR session',
        details: err,
        recoverable: true,
        suggestedAction: 'Retry',
      });
    }
  }, [state.isARSupported, state.arMode, onARStart]);

  /**
   * End AR session
   */
  const endARSession = useCallback(() => {
    try {
      setState(prev => ({
        ...prev,
        isSessionActive: false,
        selectedObjectId: null,
      }));

      onAREnd?.();
      console.log('AR session ended');
    } catch (err) {
      console.error('Error ending AR session:', err);
    }
  }, [onAREnd]);

  /**
   * Handle errors with fallback logic
   */
  const handleError = useCallback((arError: ARError) => {
    setError(arError);
    onError?.(arError);

    console.error('AR Error:', arError);

    // Attempt fallback for recoverable errors
    if (arError.recoverable) {
      attemptFallback(arError);
    }
  }, [onError]);

  /**
   * Attempt to fallback to alternative AR mode
   */
  const attemptFallback = (arError: ARError) => {
    const currentMode = state.arMode;

    // Fallback chain: webxr → model-viewer → fallback
    if (currentMode === 'webxr') {
      console.log('Falling back from WebXR to model-viewer');
      setState(prev => ({ ...prev, arMode: 'model-viewer' }));
    } else if (currentMode === 'model-viewer') {
      console.log('Falling back from model-viewer to 3D viewer');
      setState(prev => ({ ...prev, arMode: 'fallback', isARSupported: false }));
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Retry AR initialization
   */
  const retryInitialization = () => {
    clearError();
    initializeAR();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Detecting AR capabilities...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !error.recoverable) {
    const errorMessage = ERROR_MESSAGES[error.code] || {
      title: 'Error',
      message: error.message,
      action: 'Retry',
    };

    return (
      <div className="flex items-center justify-center min-h-[400px] bg-red-50 rounded-lg border border-red-200">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{errorMessage.title}</h3>
          <p className="text-gray-600 mb-4">{errorMessage.message}</p>
          {error.suggestedAction && (
            <button
              onClick={retryInitialization}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {errorMessage.action}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ar-manager-container">
      {/* AR Mode Indicator (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm z-50">
          Mode: {state.arMode} | Supported: {state.isARSupported ? 'Yes' : 'No'}
        </div>
      )}

      {/* Main AR Content */}
      <div className="ar-content">
        {!state.isSessionActive ? (
          state.arMode === 'fallback' ? (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
              <div className="text-center">
                <ModelViewerWrapper
                  src={modelUrl}
                  alt="3D Model"
                  ar={false}
                  cameraControls={true}
                  autoRotate={true}
                  onLoad={() => console.log('Model loaded')}
                  onError={handleError}
                  iosSrc={modelService.getModelByUrl(modelUrl || '')?.iosSrc}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">View in Augmented Reality</h2>
                <p className="text-gray-600 mb-6">
                  {arCapabilityDetector.getCapabilityDescription({
                    webxr: state.arMode === 'webxr',
                    arQuickLook: state.arMode === 'model-viewer' && arCapabilityDetector.isIOS(),
                    sceneViewer: state.arMode === 'model-viewer' && arCapabilityDetector.isAndroid(),
                    recommendedMode: state.arMode,
                  })}
                </p>
                {(() => {
                  const info = modelService.getModelByUrl(modelUrl);
                  if (!info) return null;
                  return (
                    <div className="mb-6">
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border">
                        <span className="text-xs text-gray-500">License</span>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800">{info.license || 'Unknown'}</span>
                        {info.author && (<span className="text-xs text-gray-600">by {info.author}</span>)}
                        {info.sourceUrl && (
                          <a href={info.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">Source</a>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <button
                  onClick={startARSession}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Start AR Experience
                </button>
              </div>
            </div>
          )
        ) : (
          // AR Session Active
          <div className="ar-session-container">
            <div className="bg-gray-900 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">AR Session Active</p>
                  <p className="font-semibold">Mode: {state.arMode}</p>
                </div>
                <button
                  onClick={endARSession}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Exit AR
                </button>
              </div>
            </div>

            {/* AR Implementation Components */}
            <div className="ar-implementation mt-4">
              {state.arMode === 'webxr' && (
                <EnhancedARSceneOptimized
                  modelUrl={modelUrl}
                  modelScale={modelScale}
                  onObjectPlaced={onObjectPlaced}
                  onError={handleError}
                />
              )}
              {state.arMode === 'model-viewer' && (
                <ModelViewerWrapper
                  src={modelUrl}
                  alt="3D Model"
                  ar={true}
                  arModes="webxr scene-viewer quick-look"
                  arScale="auto"
                  cameraControls={true}
                  autoRotate={true}
                  onLoad={() => console.log('Model loaded')}
                  onError={handleError}
                  iosSrc={modelService.getModelByUrl(modelUrl || '')?.iosSrc}
                />
              )}
              {state.arMode === 'fallback' && (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <ModelViewerWrapper
                      src={modelUrl}
                      alt="3D Model"
                      ar={false}
                      cameraControls={true}
                      autoRotate={true}
                      onLoad={() => console.log('Model loaded')}
                      onError={handleError}
                      iosSrc={modelService.getModelByUrl(modelUrl || '')?.iosSrc}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && error.recoverable && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm shadow-lg z-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{ERROR_MESSAGES[error.code]?.title || 'Warning'}</p>
              <p className="text-sm text-gray-600 mt-1">{error.message}</p>
            </div>
            <button
              onClick={clearError}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARManagerEnhanced;