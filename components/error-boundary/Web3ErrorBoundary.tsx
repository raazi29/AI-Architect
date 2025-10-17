'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class Web3ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a Web3/MetaMask related error
    const isWeb3Error = 
      error.message.includes('MetaMask') ||
      error.message.includes('ethereum') ||
      error.message.includes('web3') ||
      error.message.includes('Failed to connect') ||
      error.stack?.includes('chrome-extension');

    if (isWeb3Error) {
      return { hasError: true, error, errorInfo: null };
    }
    
    // For non-Web3 errors, let them bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate unique error ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log error to Supabase if available
    this.logErrorToSupabase(error, errorInfo, errorId);
    
    // Only catch Web3-related errors
    const isWeb3Error = 
      error.message.includes('MetaMask') ||
      error.message.includes('ethereum') ||
      error.message.includes('web3') ||
      error.message.includes('Failed to connect') ||
      error.stack?.includes('chrome-extension');

    if (isWeb3Error) {
      console.warn('Web3 Error caught by boundary:', error, errorInfo);
      this.setState({
        error,
        errorInfo,
        errorId
      });
    } else {
      // Re-throw non-Web3 errors
      throw error;
    }
  }

  logErrorToSupabase = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    if (!supabase) return;

    try {
      await supabase.from('error_logs').insert({
        error_id: errorId,
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        error_type: 'web3_boundary'
      });
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Open email client with error details
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(`Error Details:\n\n${JSON.stringify(errorDetails, null, 2)}`);
    window.open(`mailto:support@archi.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">Web3 Extension Conflict</h3>
                    <p className="text-sm mt-1">
                      There seems to be a conflict with your browser's Web3 extension (like MetaMask). 
                      This doesn't affect the core functionality of the application.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button 
                        onClick={this.handleReset}
                        className="flex-1"
                        variant="outline"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Continue
                      </Button>
                      <Button 
                        onClick={this.handleGoHome}
                        className="flex-1"
                        variant="outline"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Go Home
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={this.handleReportBug}
                      className="w-full"
                      variant="ghost"
                      size="sm"
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      Report Bug
                    </Button>
                    
                    {this.state.errorId && (
                      <p className="text-xs text-yellow-600 text-center">
                        Error ID: {this.state.errorId}
                      </p>
                    )}
                    
                    <details className="text-xs">
                      <summary className="cursor-pointer text-yellow-700 hover:text-yellow-800">
                        Technical Details
                      </summary>
                      <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                        <p><strong>Error:</strong> {this.state.error?.message}</p>
                        {process.env.NODE_ENV === 'development' && (
                          <pre className="mt-1 text-xs overflow-auto">
                            {this.state.error?.stack}
                          </pre>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Web3ErrorBoundary;
