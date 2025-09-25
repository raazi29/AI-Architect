'use client';

import { useEffect } from 'react';

/**
 * MetaMask Prevention Component
 * Prevents automatic MetaMask connection attempts on the client side
 */
export const MetaMaskPrevention = () => {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let isInitialized = false;

    const preventMetaMaskAutoConnect = () => {
      try {
        if (isInitialized) return;
        
        const originalEthereum = (window as any).ethereum;
        
        if (originalEthereum && !originalEthereum._isProxied) {
          // Create a proxy to intercept MetaMask calls
          (window as any).ethereum = new Proxy(originalEthereum, {
            get: function(target: any, prop: string) {
              // Intercept connection attempts
              if (prop === 'request' || prop === 'enable') {
                return function(...args: any[]) {
                  // Only allow explicit user-initiated connections
                  if (args[0]?.method === 'eth_requestAccounts') {
                    return target[prop].apply(target, args);
                  }
                  // Block automatic connection attempts
                  return Promise.reject(new Error('Automatic MetaMask connection blocked'));
                };
              }
              
              // Allow other properties/methods
              return target[prop];
            }
          });
          
          // Mark as proxied to prevent double-proxying
          (window as any).ethereum._isProxied = true;
        }
        
        // Suppress hydration warnings and MetaMask-related console errors
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        
        console.error = function(...args: any[]) {
          const message = args.join(' ');
          if (
            message.includes('MetaMask') ||
            message.includes('ethereum') ||
            message.includes('Failed to connect') ||
            message.includes('chrome-extension') ||
            message.includes('did not match') ||
            message.includes('prevent-metamask-autoconnect') ||
            message.includes('Hydration')
          ) {
            // Suppress these errors completely
            return;
          }
          originalConsoleError.apply(console, args);
        };

        console.warn = function(...args: any[]) {
          const message = args.join(' ');
          if (
            message.includes('MetaMask') ||
            message.includes('ethereum') ||
            message.includes('did not match') ||
            message.includes('prevent-metamask-autoconnect') ||
            message.includes('Hydration')
          ) {
            // Suppress these warnings completely
            return;
          }
          originalConsoleWarn.apply(console, args);
        };

        isInitialized = true;
      } catch (error) {
        // Silently fail to avoid console noise
      }
    };

    // Initialize prevention immediately
    preventMetaMaskAutoConnect();

    // Also run after delays to catch late-loading extensions
    const timeouts = [
      setTimeout(preventMetaMaskAutoConnect, 100),
      setTimeout(preventMetaMaskAutoConnect, 500),
      setTimeout(preventMetaMaskAutoConnect, 1000),
      setTimeout(preventMetaMaskAutoConnect, 2000)
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default MetaMaskPrevention;
