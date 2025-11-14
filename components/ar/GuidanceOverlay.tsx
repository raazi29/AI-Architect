'use client';

import React, { useState, useEffect } from 'react';
import { ARErrorCode } from '@/lib/types/ar';

interface GuidanceOverlayProps {
  arState: 'idle' | 'initializing' | 'scanning' | 'ready' | 'placing' | 'error';
  errorCode?: ARErrorCode;
  surfaceDetected: boolean;
  onDismiss?: () => void;
}

/**
 * GuidanceOverlay Component
 * 
 * Provides contextual tips and guidance based on AR state.
 * Shows instructions for permissions, surface detection, and object manipulation.
 */
export const GuidanceOverlay: React.FC<GuidanceOverlayProps> = ({
  arState,
  errorCode,
  surfaceDetected,
  onDismiss,
}) => {
  const [showGuidance, setShowGuidance] = useState(true);
  const [scanningTime, setScanningTime] = useState(0);

  useEffect(() => {
    if (arState === 'scanning' && !surfaceDetected) {
      const interval = setInterval(() => {
        setScanningTime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setScanningTime(0);
    }
  }, [arState, surfaceDetected]);

  const getGuidanceContent = () => {
    // Error-specific guidance
    if (arState === 'error' && errorCode) {
      switch (errorCode) {
        case ARErrorCode.PERMISSION_DENIED:
          return {
            title: 'Camera Permission Required',
            message: 'To use AR, we need access to your camera.',
            tips: [
              'Tap the camera icon in your browser address bar',
              'Select "Allow" for camera access',
              'Refresh the page after granting permission',
            ],
            icon: '📷',
            color: 'red',
          };

        case ARErrorCode.NOT_SUPPORTED:
          return {
            title: 'AR Not Available',
            message: 'Your device doesn\'t support AR features.',
            tips: [
              'Try using a newer device with AR support',
              'On iOS: Use Safari on iPhone 6S or newer',
              'On Android: Use Chrome 81+ on ARCore-supported devices',
              'You can still view the 3D model without AR',
            ],
            icon: '⚠️',
            color: 'yellow',
          };

        case ARErrorCode.SURFACE_NOT_DETECTED:
          return {
            title: 'Surface Not Found',
            message: 'Point your camera at a flat surface.',
            tips: [
              'Look for floors, tables, or desks',
              'Ensure good lighting in the room',
              'Move your device slowly',
              'Avoid reflective or transparent surfaces',
            ],
            icon: '🔍',
            color: 'blue',
          };

        default:
          return {
            title: 'Something Went Wrong',
            message: 'An error occurred. Please try again.',
            tips: ['Restart the AR session', 'Check your internet connection', 'Try refreshing the page'],
            icon: '❌',
            color: 'red',
          };
      }
    }

    // State-specific guidance
    switch (arState) {
      case 'initializing':
        return {
          title: 'Starting AR',
          message: 'Initializing AR session...',
          tips: ['Make sure you\'re in a well-lit area', 'Hold your device steady'],
          icon: '🚀',
          color: 'blue',
        };

      case 'scanning':
        if (scanningTime > 5 && !surfaceDetected) {
          return {
            title: 'Still Scanning',
            message: 'Having trouble finding a surface?',
            tips: [
              'Point at a flat, horizontal surface',
              'Move your device slowly in a sweeping motion',
              'Ensure the area is well-lit',
              'Try a different surface (table, floor, desk)',
            ],
            icon: '🔍',
            color: 'yellow',
          };
        }
        return {
          title: 'Scanning Environment',
          message: 'Move your device to detect surfaces.',
          tips: ['Point at a flat surface like a floor or table', 'Move slowly for best results'],
          icon: '📱',
          color: 'blue',
        };

      case 'ready':
        return {
          title: 'Ready to Place',
          message: 'Tap on the green reticle to place objects.',
          tips: [
            'Tap to place an object',
            'Tap an object to select it',
            'Drag to move, pinch to scale, rotate with two fingers',
          ],
          icon: '✨',
          color: 'green',
        };

      case 'placing':
        return {
          title: 'Object Controls',
          message: 'Interact with placed objects.',
          tips: [
            'Tap an object to select it',
            'Drag to move along the surface',
            'Pinch with two fingers to scale',
            'Rotate with two fingers to turn',
            'Tap empty space to deselect',
          ],
          icon: '🎯',
          color: 'green',
        };

      default:
        return null;
    }
  };

  const guidance = getGuidanceContent();

  if (!guidance || !showGuidance) return null;

  const colorClasses = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  return (
    <div className="guidance-overlay fixed inset-0 pointer-events-none flex items-start justify-center pt-20 px-4 z-40">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto animate-slide-down">
        {/* Header */}
        <div className={`${colorClasses[guidance.color]} text-white px-6 py-4 rounded-t-lg flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{guidance.icon}</span>
            <h3 className="font-bold text-lg">{guidance.title}</h3>
          </div>
          {onDismiss && (
            <button
              onClick={() => {
                setShowGuidance(false);
                onDismiss();
              }}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{guidance.message}</p>

          {/* Tips */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Tips:</p>
            <ul className="space-y-2">
              {guidance.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => {
              setShowGuidance(false);
              onDismiss?.();
            }}
            className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidanceOverlay;
