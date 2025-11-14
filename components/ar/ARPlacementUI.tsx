'use client';

import React from 'react';

interface ARPlacementUIProps {
  arStatus: string;
  performanceMetrics: {
    fps: number;
    memoryUsage: number;
    renderTime: number;
  };
  isLoading: boolean;
  error: string | null;
  onPlace: () => void;
  canPlace: boolean;
}

export const ARPlacementUI: React.FC<ARPlacementUIProps> = ({
  arStatus,
  performanceMetrics,
  isLoading,
  error,
  onPlace,
  canPlace
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Status Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
        {arStatus}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading AR experience...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm max-w-xs text-center">
          Error: {error}
        </div>
      )}

      {/* Place Button */}
      {canPlace && !isLoading && !error && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <button
            onClick={onPlace}
            disabled={!canPlace}
            className={`px-6 py-3 rounded-full font-semibold text-white shadow-lg transition-all ${
              canPlace 
                ? 'bg-blue-500 hover:bg-blue-600 transform scale-105' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Place Object
          </button>
        </div>
      )}

      {/* Performance Metrics (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded text-xs font-mono">
          <div>FPS: {performanceMetrics.fps.toFixed(1)}</div>
          <div>Mem: {performanceMetrics.memoryUsage.toFixed(1)}MB</div>
          <div>Render: {performanceMetrics.renderTime.toFixed(1)}ms</div>
        </div>
      )}

      {/* AR Instructions */}
      {!isLoading && !error && (
        <div className="absolute top-20 left-4 bg-black bg-opacity-30 text-white text-xs p-3 rounded max-w-xs">
          <p>Move your device around to detect surfaces. Tap the button when ready to place the object.</p>
        </div>
      )}
    </div>
  );
};