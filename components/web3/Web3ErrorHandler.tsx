'use client';

import { useEffect } from 'react';

/**
 * Web3 Error Handler Component
 * Prevents MetaMask connection errors from crashing the application
 */
export const Web3ErrorHandler = () => {
  useEffect(() => {
    // Handle global errors related to Web3/MetaMask
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.error?.message || event.message || '';
      
      // Check if error is related to MetaMask/Web3
      if (
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('ethereum') ||
        errorMessage.includes('web3') ||
        errorMessage.includes('Failed to connect') ||
        event.filename?.includes('chrome-extension') ||
        event.filename?.includes('metamask')
      ) {
        console.warn('Web3/MetaMask error caught and handled:', errorMessage);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason || '';
      
      if (
        typeof reason === 'string' && (
          reason.includes('MetaMask') ||
          reason.includes('ethereum') ||
          reason.includes('web3') ||
          reason.includes('Failed to connect')
        )
      ) {
        console.warn('Web3/MetaMask promise rejection caught and handled:', reason);
        event.preventDefault();
        return false;
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default Web3ErrorHandler;
