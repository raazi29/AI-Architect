// Environment configuration

interface EnvironmentConfig {
  apiBaseURL: string;
  wsURL: string;
  supabaseURL: string;
  supabaseAnonKey: string;
  enableCache: boolean;
  cacheTTL: number;
  enableRealtime: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  isDevelopment: boolean;
  isProduction: boolean;
}

export const config: EnvironmentConfig = {
  apiBaseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  wsURL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/ws',
  supabaseURL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  enableCache: process.env.NEXT_PUBLIC_ENABLE_CACHE !== 'false',
  cacheTTL: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '300000'), // 5 minutes default
  enableRealtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false',
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as any) || 'info',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

// Validate required environment variables
if (typeof window !== 'undefined' && config.isProduction) {
  if (!config.supabaseURL || !config.supabaseAnonKey) {
    console.warn('Supabase configuration is missing. Real-time features may not work.');
  }
}
