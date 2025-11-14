'use client';

import React from 'react';

interface ARErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ARErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ARErrorBoundary extends React.Component<ARErrorBoundaryProps, ARErrorBoundaryState> {
  constructor(props: ARErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ARErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AR Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-red-50 p-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">AR Scene Error</h3>
            <p className="text-red-600 mb-4">
              Something went wrong with the AR experience. Please try refreshing the page.
            </p>
            <button 
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
              onClick={() => window.location.reload()}
            >
              Refresh AR Scene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ARErrorBoundary };