# Design Document

## Overview

This design document outlines the architecture and implementation strategy for upgrading existing frontend pages to production-grade real-time systems. The design focuses on removing mock data, integrating real backends, implementing WebSocket-based real-time features, and ensuring robust error handling and performance optimization.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ AI Colors│  │ AI Layout│  │    AR    │  │  Project │   │
│  │   Page   │  │   Page   │  │Placement │  │   Mgmt   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │             │          │
│  ┌────┴─────────────┴──────────────┴─────────────┴─────┐   │
│  │         Shared Services & Hooks Layer               │   │
│  │  • API Client  • WebSocket Manager  • Cache         │   │
│  │  • State Management  • Error Handler  • Auth        │   │
│  └────┬─────────────┬──────────────┬─────────────┬─────┘   │
└───────┼─────────────┼──────────────┼─────────────┼─────────┘
        │             │              │             │
┌───────┴─────────────┴──────────────┴─────────────┴─────────┐
│                  Communication Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  REST APIs   │  │   WebSocket  │  │   Supabase   │     │
│  │  (Backend)   │  │  (Real-time) │  │   Realtime   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
        │                     │                    │
┌───────┴─────────────────────┴────────────────────┴─────────┐
│                     Backend Services                         │
│  • AI Services (Groq)  • Product Scraping  • Database       │
│  • Image Generation    • Real-time Sync    • File Storage   │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

Each page follows a consistent architecture pattern:

```
Page Component
├── UI Layer (Presentation)
│   ├── Loading States (Skeletons)
│   ├── Error Boundaries
│   └── Responsive Layouts
├── Business Logic Layer
│   ├── Custom Hooks (useAIColors, useRealtime, etc.)
│   ├── State Management (React Query, Zustand)
│   └── Data Transformation
└── Data Layer
    ├── API Clients
    ├── WebSocket Connections
    └── Cache Management
```

## Components and Interfaces

### 1. API Client Service

**Purpose:** Centralized HTTP client with retry logic, caching, and error handling

```typescript
// lib/api/client.ts

interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  cache: boolean;
}

interface APIResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

class APIClient {
  private config: APIClientConfig;
  private cache: Map<string, { data: any; timestamp: number }>;
  
  constructor(config: APIClientConfig);
  
  async get<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>>;
  async post<T>(endpoint: string, body: any, options?: RequestOptions): Promise<APIResponse<T>>;
  async put<T>(endpoint: string, body: any, options?: RequestOptions): Promise<APIResponse<T>>;
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>>;
  
  private async fetchWithRetry(url: string, options: RequestInit, retries: number): Promise<Response>;
  private getCached(key: string): any | null;
  private setCache(key: string, data: any): void;
  private clearCache(pattern?: string): void;
}

export const apiClient = new APIClient({
  baseURL: 'http://localhost:8001',
  timeout: 30000,
  retries: 3,
  cache: true
});
```

### 2. WebSocket Manager

**Purpose:** Manage WebSocket connections with auto-reconnect and message queuing

```typescript
// lib/websocket/manager.ts

interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

class WebSocketManager {
  private ws: WebSocket | null;
  private config: WebSocketConfig;
  private reconnectAttempts: number;
  private messageQueue: WebSocketMessage[];
  private subscribers: Map<string, Set<(data: any) => void>>;
  private heartbeatTimer: NodeJS.Timeout | null;
  
  constructor(config: WebSocketConfig);
  
  connect(): Promise<void>;
  disconnect(): void;
  send(message: WebSocketMessage): void;
  subscribe(channel: string, callback: (data: any) => void): () => void;
  unsubscribe(channel: string, callback: (data: any) => void): void;
  
  private handleOpen(): void;
  private handleClose(): void;
  private handleError(error: Event): void;
  private handleMessage(event: MessageEvent): void;
  private reconnect(): void;
  private startHeartbeat(): void;
  private stopHeartbeat(): void;
  private processQueue(): void;
}

export const wsManager = new WebSocketManager({
  url: 'ws://localhost:8001/ws',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000
});
```

### 3. Supabase Realtime Service

**Purpose:** Wrapper for Supabase Realtime with type safety and error handling

```typescript
// lib/supabase/realtime.ts

interface RealtimeSubscription {
  channel: string;
  unsubscribe: () => void;
}

interface RealtimeConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

class SupabaseRealtimeService {
  private subscriptions: Map<string, RealtimeSubscription>;
  
  subscribe<T>(
    config: RealtimeConfig,
    callback: (payload: RealtimePayload<T>) => void
  ): RealtimeSubscription;
  
  unsubscribe(channel: string): void;
  unsubscribeAll(): void;
  
  broadcastPresence(channel: string, presence: UserPresence): void;
  subscribeToPresence(channel: string, callback: (presences: UserPresence[]) => void): RealtimeSubscription;
  
  private handleError(error: Error): void;
}

export const realtimeService = new SupabaseRealtimeService();
```

### 4. Custom Hooks

#### useAIColors Hook

```typescript
// hooks/useAIColors.ts

interface UseAIColorsParams {
  roomType: string;
  style: string;
  lightingType: string;
  mood: string;
  existingColors?: string[];
}

interface UseAIColorsReturn {
  palette: ColorPalette | null;
  loading: boolean;
  error: Error | null;
  generatePalette: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAIColors(params: UseAIColorsParams): UseAIColorsReturn {
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const generatePalette = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<ColorPalette>('/ai/colors', params);
      if (response.error) throw response.error;
      setPalette(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params]);
  
  return { palette, loading, error, generatePalette, refetch: generatePalette };
}
```

#### useRealtime Hook

```typescript
// hooks/useRealtime.ts

interface UseRealtimeParams<T> {
  table: string;
  filter?: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void;
}

export function useRealtime<T>(params: UseRealtimeParams<T>) {
  const [data, setData] = useState<T[]>([]);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const subscription = realtimeService.subscribe<T>(
      {
        table: params.table,
        event: '*',
        filter: params.filter
      },
      (payload) => {
        if (payload.eventType === 'INSERT' && params.onInsert) {
          params.onInsert(payload.new);
          setData(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE' && params.onUpdate) {
          params.onUpdate(payload.new);
          setData(prev => prev.map(item => 
            (item as any).id === payload.new.id ? payload.new : item
          ));
        } else if (payload.eventType === 'DELETE' && params.onDelete) {
          params.onDelete(payload.old);
          setData(prev => prev.filter(item => 
            (item as any).id !== payload.old.id
          ));
        }
      }
    );
    
    setConnected(true);
    
    return () => {
      subscription.unsubscribe();
      setConnected(false);
    };
  }, [params]);
  
  return { data, connected };
}
```

#### usePresence Hook

```typescript
// hooks/usePresence.ts

interface UserPresence {
  user_id: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  cursor_position?: { x: number; y: number };
}

interface UsePresenceReturn {
  presences: UserPresence[];
  updatePresence: (presence: Partial<UserPresence>) => void;
  broadcastCursor: (position: { x: number; y: number }) => void;
}

export function usePresence(projectId: string): UsePresenceReturn {
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const channel = `project:${projectId}:presence`;
    
    // Subscribe to presence updates
    const subscription = realtimeService.subscribeToPresence(
      channel,
      (updatedPresences) => {
        setPresences(updatedPresences);
      }
    );
    
    // Broadcast own presence
    const broadcastInterval = setInterval(() => {
      realtimeService.broadcastPresence(channel, {
        user_id: user.id,
        username: user.username,
        status: 'online',
        last_seen: new Date().toISOString()
      });
    }, 5000);
    
    return () => {
      subscription.unsubscribe();
      clearInterval(broadcastInterval);
    };
  }, [projectId, user]);
  
  const updatePresence = useCallback((presence: Partial<UserPresence>) => {
    if (!user) return;
    realtimeService.broadcastPresence(`project:${projectId}:presence`, {
      user_id: user.id,
      username: user.username,
      ...presence,
      last_seen: new Date().toISOString()
    });
  }, [projectId, user]);
  
  const broadcastCursor = useCallback((position: { x: number; y: number }) => {
    updatePresence({ cursor_position: position });
  }, [updatePresence]);
  
  return { presences, updatePresence, broadcastCursor };
}
```

### 5. Error Handling System

```typescript
// lib/errors/handler.ts

interface ErrorContext {
  component: string;
  action: string;
  metadata?: Record<string, any>;
}

class ErrorHandler {
  private errorLog: Error[] = [];
  
  handle(error: Error, context: ErrorContext): void {
    // Log to console
    console.error(`[${context.component}] ${context.action}:`, error);
    
    // Store in memory
    this.errorLog.push(error);
    
    // Show user-friendly message
    this.showToast(this.getUserMessage(error), 'error');
    
    // Send to monitoring service (if configured)
    this.sendToMonitoring(error, context);
  }
  
  private getUserMessage(error: Error): string {
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    } else if (error.message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    } else {
      return 'Something went wrong. Please try again.';
    }
  }
  
  private showToast(message: string, type: 'error' | 'warning' | 'info'): void {
    // Implementation using toast library
  }
  
  private sendToMonitoring(error: Error, context: ErrorContext): void {
    // Send to Sentry or similar service
  }
  
  getErrorLog(): Error[] {
    return this.errorLog;
  }
  
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

export const errorHandler = new ErrorHandler();
```

### 6. Cache Management

```typescript
// lib/cache/manager.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();
```

## Data Models

### Color Palette Model

```typescript
interface ColorInfo {
  name: string;
  hex: string;
  rgb: string;
  usage: string;
  psychology: string;
}

interface ColorPalette {
  primary_palette: {
    dominant_color: ColorInfo;
    secondary_color: ColorInfo;
    accent_color: ColorInfo;
  };
  alternative_palettes: Array<{
    theme: string;
    colors: Array<{ name: string; hex: string }>;
  }>;
  color_analysis: {
    dominant_temperature: string;
    secondary_temperature: string;
    accent_temperature: string;
    contrast_ratios: {
      dominant_to_secondary: number;
      dominant_to_accent: number;
    };
  };
  accessibility: {
    wcag_aa_compliant: boolean;
    wcag_aaa_compliant: boolean;
    color_blind_friendly: boolean;
    recommendations: string[];
  };
  paint_brands_india: {
    asian_paints: string[];
    berger_paints: string[];
    nerolac: string[];
  };
  cost_estimate: {
    paint_cost_per_sqft: string;
    labor_cost: string;
    total_estimate_range: string;
  };
}
```

### Layout Model

```typescript
interface FurnitureItem {
  item: string;
  position: { x: number; y: number; rotation: number };
  dimensions: { length: number; width: number; height: number };
  reasoning: string;
}

interface TrafficPath {
  from: string;
  to: string;
  width: number;
  description: string;
}

interface LayoutOptimization {
  optimal_layout: {
    furniture_placement: FurnitureItem[];
    traffic_paths: TrafficPath[];
    focal_points: Array<{
      type: string;
      position: { x: number; y: number };
      description: string;
    }>;
  };
  space_utilization: {
    total_area: number;
    usable_area: number;
    circulation_area: number;
    efficiency_score: number;
  };
  functional_zones: Array<{
    name: string;
    area: number;
    furniture: string[];
    purpose: string;
  }>;
}
```

### Product Model

```typescript
interface FurnitureProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  style: string;
  colors: string[];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  retailer: string;
  inStock: boolean;
  verified: boolean;
  product_url: string;
  currency: string;
  deliveryTime?: string;
  warranty?: string;
}
```

### Project Model

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'active' | 'completed';
}

interface ProjectTask {
  id: string;
  project_id: string;
  name: string;
  category: string;
  cost: number;
  duration: number;
  assigned_to: string;
  status: 'pending' | 'in-progress' | 'completed';
  start_date: string;
  end_date: string;
  created_by: string;
  updated_at: string;
}

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
}
```

## Error Handling

### Error Types and Responses

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  retryable: boolean;
  userMessage: string;
}

function handleAPIError(error: any): AppError {
  if (error.message.includes('Failed to fetch')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: error.message,
      retryable: true,
      userMessage: 'Network error. Please check your connection.'
    };
  }
  
  if (error.message.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      message: error.message,
      retryable: true,
      userMessage: 'Request timed out. Please try again.'
    };
  }
  
  if (error.status === 429) {
    return {
      type: ErrorType.RATE_LIMIT_ERROR,
      message: 'Rate limit exceeded',
      retryable: true,
      userMessage: 'Too many requests. Please wait a moment.'
    };
  }
  
  if (error.status === 401 || error.status === 403) {
    return {
      type: ErrorType.AUTH_ERROR,
      message: 'Authentication failed',
      retryable: false,
      userMessage: 'Please sign in to continue.'
    };
  }
  
  if (error.status >= 500) {
    return {
      type: ErrorType.SERVER_ERROR,
      message: 'Server error',
      retryable: true,
      userMessage: 'Server error. Please try again later.'
    };
  }
  
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: error.message || 'Unknown error',
    retryable: false,
    userMessage: 'Something went wrong. Please try again.'
  };
}
```

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }
  
  throw lastError!;
}
```

## Testing Strategy

### Unit Tests

- Test individual hooks (useAIColors, useRealtime, usePresence)
- Test utility functions (error handling, caching, retry logic)
- Test data transformations and validations
- Mock API responses and WebSocket connections

### Integration Tests

- Test API client with real backend endpoints
- Test WebSocket manager with mock WebSocket server
- Test Supabase Realtime with test database
- Test error handling with various failure scenarios

### E2E Tests

- Test complete user flows (generate colors, create layout, place furniture)
- Test real-time collaboration scenarios
- Test offline/online transitions
- Test mobile responsiveness

### Performance Tests

- Measure initial page load time
- Measure time to interactive
- Measure WebSocket message latency
- Measure cache hit rates
- Test with slow 3G network conditions

## Deployment Strategy

### Environment Configuration

```typescript
// config/environment.ts

interface EnvironmentConfig {
  apiBaseURL: string;
  wsURL: string;
  supabaseURL: string;
  supabaseAnonKey: string;
  enableCache: boolean;
  cacheT TL: number;
  enableRealtime: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const config: EnvironmentConfig = {
  apiBaseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  wsURL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/ws',
  supabaseURL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  enableCache: process.env.NEXT_PUBLIC_ENABLE_CACHE === 'true',
  cacheTTL: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '300000'),
  enableRealtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as any) || 'info'
};
```

### Build Optimization

- Code splitting for each page
- Lazy loading for heavy components
- Image optimization with Next.js Image
- Bundle size analysis and optimization
- Tree shaking for unused code

### Monitoring and Analytics

- Error tracking with Sentry
- Performance monitoring with Vercel Analytics
- Real-time connection monitoring
- API latency tracking
- User behavior analytics

## Security Considerations

### Authentication

- Use Supabase Auth for user authentication
- Store JWT tokens securely in httpOnly cookies
- Implement token refresh logic
- Validate user permissions on all operations

### Data Validation

- Validate all user inputs on frontend
- Sanitize data before sending to backend
- Validate API responses before using
- Implement rate limiting on client side

### WebSocket Security

- Authenticate WebSocket connections
- Validate message origins
- Implement message size limits
- Encrypt sensitive data in messages

## Performance Optimization

### Caching Strategy

- Cache API responses for 5 minutes
- Cache static assets indefinitely
- Implement stale-while-revalidate pattern
- Use service workers for offline caching

### Lazy Loading

- Lazy load images with intersection observer
- Lazy load heavy components (AR, 3D viewers)
- Prefetch critical resources
- Implement virtual scrolling for long lists

### Debouncing and Throttling

- Debounce search inputs (300ms)
- Throttle cursor position updates (50ms)
- Throttle scroll events (100ms)
- Batch multiple state updates

### Memory Management

- Clean up event listeners on unmount
- Cancel pending requests on unmount
- Clear timers and intervals
- Implement garbage collection for large data structures

