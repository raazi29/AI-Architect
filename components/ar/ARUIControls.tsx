'use client';

import React, { useState } from 'react';
import { ARUIControlsProps } from '@/lib/types/ar';

/**
 * ARUIControls Component
 * 
 * Provides user interface controls for AR session management.
 * Includes start/exit AR, object catalog, clear objects, and help.
 */
export const ARUIControls: React.FC<ARUIControlsProps> = ({
  isSessionActive,
  placedObjectsCount,
  onStartAR,
  onEndAR,
  onClearObjects,
  onSelectModel,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>('');

  // Sample model catalog (in production, this would come from props or API)
  const modelCatalog = [
    { url: '/models/chair.glb', name: 'Chair', thumbnail: '/thumbnails/chair.png' },
    { url: '/models/table.glb', name: 'Table', thumbnail: '/thumbnails/table.png' },
    { url: '/models/lamp.glb', name: 'Lamp', thumbnail: '/thumbnails/lamp.png' },
    { url: '/models/plant.glb', name: 'Plant', thumbnail: '/thumbnails/plant.png' },
  ];

  const handleModelSelect = (modelUrl: string) => {
    setSelectedModelUrl(modelUrl);
    onSelectModel(modelUrl);
    setShowCatalog(false);
  };

  if (!isSessionActive) {
    return (
      <div className="ar-ui-controls-start flex flex-col items-center justify-center p-6">
        <button
          onClick={onStartAR}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-3 shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Start AR Experience
        </button>
      </div>
    );
  }

  return (
    <div className="ar-ui-controls-active fixed inset-0 pointer-events-none">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-auto">
        {/* Session Info */}
        <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">AR Active</span>
          {placedObjectsCount > 0 && (
            <span className="text-xs text-gray-300">| {placedObjectsCount} objects</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="bg-black bg-opacity-75 text-white p-2 rounded-lg hover:bg-opacity-90 transition-colors"
            title="Help"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            onClick={onEndAR}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Exit AR
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="bg-black bg-opacity-75 rounded-lg p-4">
          {/* Model Catalog Button */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowCatalog(!showCatalog)}
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-sm font-medium">Select Model</span>
            </button>

            {placedObjectsCount > 0 && (
              <button
                onClick={onClearObjects}
                className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Model Catalog */}
          {showCatalog && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {modelCatalog.map((model) => (
                <button
                  key={model.url}
                  onClick={() => handleModelSelect(model.url)}
                  className={`aspect-square rounded-lg border-2 transition-all ${
                    selectedModelUrl === model.url
                      ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full p-2">
                    <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-xs text-white">{model.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-white text-sm">
            <p>Tap on a surface to place objects</p>
            {placedObjectsCount > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Tap objects to select • Drag to move • Pinch to scale • Rotate with two fingers
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">AR Controls Help</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-white">
              <div>
                <h4 className="font-semibold mb-2">Placing Objects</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Point camera at a flat surface</li>
                  <li>• Wait for the green reticle to appear</li>
                  <li>• Tap to place the selected object</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Manipulating Objects</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Tap an object to select it</li>
                  <li>• Drag to move along the surface</li>
                  <li>• Pinch with two fingers to scale</li>
                  <li>• Rotate with two fingers to turn</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Tips</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Use good lighting for best results</li>
                  <li>• Move slowly when scanning surfaces</li>
                  <li>• Avoid reflective or transparent surfaces</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Performance Warning */}
      {placedObjectsCount >= 10 && (
        <div className="absolute top-20 left-4 right-4 pointer-events-auto">
          <div className="bg-yellow-500 bg-opacity-90 text-black px-4 py-3 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-sm">Performance Warning</p>
              <p className="text-xs mt-1">
                You have {placedObjectsCount} objects placed. Consider removing some for better performance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARUIControls;
