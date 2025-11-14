'use client';

import React from 'react';
import { ModelLoadProgress } from '@/lib/types/ar';

interface LoadingIndicatorProps {
  progress?: ModelLoadProgress;
  message?: string;
  showPercentage?: boolean;
}

/**
 * LoadingIndicator Component
 * 
 * Displays loading progress for 3D model loading operations.
 * Shows progress bar, percentage, and custom messages.
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  progress,
  message = 'Loading model...',
  showPercentage = true,
}) => {
  const percentage = progress?.percentage || 0;
  const isIndeterminate = !progress || progress.total === 0;

  return (
    <div className="loading-indicator flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg">
      {/* Spinner or Progress Circle */}
      <div className="relative mb-4">
        {isIndeterminate ? (
          // Indeterminate spinner
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
        ) : (
          // Progress circle
          <div className="relative w-16 h-16">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
                className="text-blue-600 transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            {showPercentage && !isIndeterminate && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">
                  {Math.round(percentage)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      <p className="text-gray-700 font-medium mb-2">{message}</p>

      {/* Progress Bar */}
      {!isIndeterminate && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {progress && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {(progress.loaded / 1024 / 1024).toFixed(2)} MB / {(progress.total / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface ModelErrorDisplayProps {
  error: Error | string;
  modelUrl?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

/**
 * ModelErrorDisplay Component
 * 
 * Displays error messages for failed model loading operations.
 * Provides retry and cancel actions.
 */
export const ModelErrorDisplay: React.FC<ModelErrorDisplayProps> = ({
  error,
  modelUrl,
  onRetry,
  onCancel,
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="model-error-display flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200">
      {/* Error Icon */}
      <div className="mb-4">
        <svg
          className="w-16 h-16 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Error Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Failed to Load Model
      </h3>

      {/* Error Message */}
      <p className="text-gray-600 text-center mb-4 max-w-md">
        {errorMessage}
      </p>

      {/* Model URL (if provided) */}
      {modelUrl && (
        <p className="text-xs text-gray-500 mb-4 max-w-md truncate">
          {modelUrl}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Troubleshooting Tips */}
      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 max-w-md">
        <p className="text-sm font-semibold text-gray-900 mb-2">Troubleshooting Tips:</p>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>Check your internet connection</li>
          <li>Verify the model URL is correct and accessible</li>
          <li>Ensure the model is in GLB or GLTF format</li>
          <li>Check if the model file size is reasonable (&lt; 10MB)</li>
          <li>Try a different model to isolate the issue</li>
        </ul>
      </div>
    </div>
  );
};

interface ModelSizeWarningProps {
  size: number;
  maxSize: number;
  onProceed?: () => void;
  onCancel?: () => void;
}

/**
 * ModelSizeWarning Component
 * 
 * Displays warning for large model files.
 * Allows user to proceed or cancel loading.
 */
export const ModelSizeWarning: React.FC<ModelSizeWarningProps> = ({
  size,
  maxSize,
  onProceed,
  onCancel,
}) => {
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
  const isOverLimit = size > maxSize;

  return (
    <div className="model-size-warning flex flex-col items-center justify-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
      {/* Warning Icon */}
      <div className="mb-4">
        <svg
          className="w-16 h-16 text-yellow-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Warning Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isOverLimit ? 'Model Too Large' : 'Large Model Warning'}
      </h3>

      {/* Warning Message */}
      <p className="text-gray-600 text-center mb-4 max-w-md">
        {isOverLimit ? (
          <>
            This model ({sizeMB} MB) exceeds the recommended size limit of {maxSizeMB} MB.
            Loading may fail or cause performance issues.
          </>
        ) : (
          <>
            This model is {sizeMB} MB. Loading may take some time and could affect performance
            on lower-end devices.
          </>
        )}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onProceed && !isOverLimit && (
          <button
            onClick={onProceed}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
          >
            Proceed Anyway
          </button>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {isOverLimit ? 'Choose Different Model' : 'Cancel'}
          </button>
        )}
      </div>

      {/* Recommendations */}
      {isOverLimit && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 max-w-md">
          <p className="text-sm font-semibold text-gray-900 mb-2">Recommendations:</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Use a model optimizer tool to reduce file size</li>
            <li>Reduce polygon count and texture resolution</li>
            <li>Convert textures to compressed formats (e.g., KTX2)</li>
            <li>Remove unnecessary animations or materials</li>
            <li>Consider using Draco compression for GLB files</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;
