/**
 * Web3 Utilities
 * Helper functions to safely detect and handle Web3 providers
 */

export interface Web3Provider {
  isMetaMask?: boolean;
  request?: (args: { method: string; params?: any[] }) => Promise<any>;
  enable?: () => Promise<string[]>;
  selectedAddress?: string | null;
}

/**
 * Safely check if Web3 provider is available
 */
export const isWeb3Available = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ethereum;
};

/**
 * Safely get Web3 provider
 */
export const getWeb3Provider = (): Web3Provider | null => {
  if (!isWeb3Available()) return null;
  return (window as any).ethereum;
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  const provider = getWeb3Provider();
  return !!(provider?.isMetaMask);
};

/**
 * Safely connect to MetaMask (only when user explicitly requests)
 */
export const connectToMetaMask = async (): Promise<string[] | null> => {
  try {
    const provider = getWeb3Provider();
    if (!provider) {
      throw new Error('No Web3 provider found');
    }

    if (!provider.request) {
      throw new Error('Provider does not support request method');
    }

    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    });

    return accounts;
  } catch (error) {
    console.error('Failed to connect to MetaMask:', error);
    return null;
  }
};

/**
 * Get current connected accounts (without triggering connection)
 */
export const getCurrentAccounts = async (): Promise<string[] | null> => {
  try {
    const provider = getWeb3Provider();
    if (!provider?.request) return null;

    const accounts = await provider.request({
      method: 'eth_accounts',
    });

    return accounts;
  } catch (error) {
    console.error('Failed to get current accounts:', error);
    return null;
  }
};

/**
 * Check if user is connected to MetaMask
 */
export const isConnectedToMetaMask = async (): Promise<boolean> => {
  const accounts = await getCurrentAccounts();
  return !!(accounts && accounts.length > 0);
};

/**
 * Safely handle Web3 errors
 */
export const handleWeb3Error = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.reason) return error.reason;
  return 'Unknown Web3 error occurred';
};

/**
 * Create a safe Web3 context that prevents auto-connection
 */
export const createSafeWeb3Context = () => {
  return {
    isAvailable: isWeb3Available(),
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connect: connectToMetaMask,
    getCurrentAccounts,
    isConnected: isConnectedToMetaMask,
    handleError: handleWeb3Error,
  };
};
