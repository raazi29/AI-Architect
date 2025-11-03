# Design Document

## Overview

This design focuses on three critical areas: making AI generation instant and reliable with multiple providers, implementing aggressive scraping for unlimited design images, and enabling real product data with real-time updates. The architecture prioritizes speed, reliability, and zero-delay user experience.

### Key Design Principles

1. **Parallel Everything**: All operations run concurrently
2. **Instant Feedback**: Optimistic UI updates, no waiting
3. **Multiple Providers**: Never rely on a single source
4. **Smart Caching**: Cache aggressively, prefetch intelligently
5. **Real-Time First**: WebSocket for all live data
6. **Zero Failures**: Fallbacks for everything

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI Generator │  │ Design Feed  │  │   Shopping   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │         Multi-Provider Service Layer                │    │
│  │  • Parallel requests  • Smart caching               │    │
│  │  • Auto fallback      • Rate limit handling         │    │
│  └──────┬──────────────────┬──────────────────┬────────┘    │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI Providers │  │Image Scrapers│  │Product Scrapers│     │
│  │ • Groq       │  │ • Pexels     │  │ • Urban Ladder│     │
│  │ • Stability  │  │ • Unsplash   │  │ • Pepperfry   │     │
│  │ • Replicate  │  │ • Pixabay    │  │ • Amazon      │     │
│  │ • Hugging F. │  │ • Flickr     │  │ • Flipkart    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                    Caching Layer (Redis)                     │
│  • Response cache  • Rate limit tracking  • Queue management │
└──────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────┐
│              Real-Time Layer (Supabase + WebSocket)          │
│  • Live price updates  • Stock changes  • New products       │
└──────────────────────────────────────────────────────────────┘
```

## Multi-Provider AI Service

### Provider Configuration

```typescript
// lib/ai/providers.ts
interface AIProvider {
  name: string;
  priority: number;
  timeout: number;
  rateLimit: RateLimit;
  generate: (prompt: string, options: GenerateOptions) => Promise<ImageResult>;
}

const providers: AIProvider[] = [
  {
    name: 'groq',
    priority: 1,
    timeout: 5000,
    rateLimit: { requests: 100, window: 60000 },
    generate: groqGenerate,
  },
  {
    name: 'stability',
    priority: 2,
    timeout: 10000,
    rateLimit: { requests: 50, window: 60000 },
    generate: stabilityGenerate,
  },
  {
    name: 'replicate',
    priority: 3,
    timeout: 15000,
    rateLimit: { requests: 30, window: 60000 },
    generate: replicateGenerate,
  },
  {
    name: 'huggingface',
    priority: 4,
    timeout: 20000,
    rateLimit: { requests: 20, window: 60000 },
    generate: huggingfaceGenerate,
  },
];
```

### Parallel Generation with Race Strategy

```typescript
// lib/ai/multi-provider-service.ts
class MultiProviderAIService {
  async generateImage(prompt: string, options: GenerateOptions): Promise<ImageResult> {
    // Enhance prompt
    const enhancedPrompt = this.enhancePrompt(prompt, options);
    
    // Get available providers (not rate limited)
    const availableProviders = await this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return this.queueRequest(prompt, options);
    }
    
    // Try all providers in parallel, return first success
    const results = await Promise.allSettled(
      availableProviders.map(provider =>
        this.tryProvider(provider, enhancedPrompt, options)
      )
    );
    
    // Find first successful result
    const successful = results.find(r => r.status === 'fulfilled');
    
    if (successful && successful.status === 'fulfilled') {
      return successful.value;
    }
    
    // All failed, queue for retry
    return this.queueRequest(prompt, options);
  }
  
  private async tryProvider(
    provider: AIProvider,
    prompt: string,
    options: GenerateOptions
  ): Promise<ImageResult> {
    // Check rate limit
    if (await this.isRateLimited(provider.name)) {
      throw new Error(`${provider.name} rate limited`);
    }
    
    // Try with timeout
    const result = await Promise.race([
      provider.generate(prompt, options),
      this.timeout(provider.timeout),
    ]);
    
    // Track rate limit
    await this.trackRequest(provider.name);
    
    return result;
  }
  
  private enhancePrompt(prompt: string, options: GenerateOptions): string {
    let enhanced = prompt;
    
    // Add quality modifiers
    enhanced += ', high quality, professional photography, 8k resolution';
    
    // Add style-specific terms
    if (options.style) {
      enhanced += `, ${options.style} style`;
    }
    
    // Add room-specific terms
    if (options.roomType) {
      enhanced += `, ${options.roomType} interior`;
    }
    
    // Add negative prompt
    enhanced += ' | negative: blurry, low quality, distorted, amateur';
    
    return enhanced;
  }
}
```


## Aggressive Design Feed Scraping

### Multi-Provider Scraper

```typescript
// lib/scraping/design-feed-scraper.ts
class DesignFeedScraper {
  private providers = [
    'pexels',
    'unsplash', 
    'pixabay',
    'flickr',
    'wikimedia',
    'rawpixel',
    'openverse',
  ];
  
  async scrapeDesigns(
    query: string,
    page: number,
    perPage: number = 100
  ): Promise<DesignImage[]> {
    // Query all providers in parallel
    const results = await Promise.allSettled(
      this.providers.map(provider =>
        this.scrapeProvider(provider, query, page, perPage / this.providers.length)
      )
    );
    
    // Collect all successful results
    const images: DesignImage[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        images.push(...result.value);
      }
    }
    
    // Remove duplicates
    const unique = this.deduplicateImages(images);
    
    // Sort by quality score
    const sorted = this.sortByQuality(unique);
    
    // Cache results
    await this.cacheResults(query, page, sorted);
    
    // Prefetch next page in background
    this.prefetchNextPage(query, page + 1, perPage);
    
    return sorted.slice(0, perPage);
  }
  
  private async scrapeProvider(
    provider: string,
    query: string,
    page: number,
    count: number
  ): Promise<DesignImage[]> {
    // Check cache first
    const cached = await this.getFromCache(provider, query, page);
    if (cached) return cached;
    
    // Scrape with timeout
    const timeout = 3000; // 3 second timeout per provider
    const result = await Promise.race([
      this.fetchFromProvider(provider, query, page, count),
      this.timeoutPromise(timeout),
    ]);
    
    return result || [];
  }
  
  private deduplicateImages(images: DesignImage[]): DesignImage[] {
    const seen = new Set<string>();
    return images.filter(img => {
      // Use perceptual hash for duplicate detection
      const hash = this.getImageHash(img.url);
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
  }
  
  private sortByQuality(images: DesignImage[]): DesignImage[] {
    return images.sort((a, b) => {
      // Score based on resolution, aspect ratio, and source
      const scoreA = this.calculateQualityScore(a);
      const scoreB = this.calculateQualityScore(b);
      return scoreB - scoreA;
    });
  }
  
  private calculateQualityScore(image: DesignImage): number {
    let score = 0;
    
    // Resolution score (higher is better)
    score += (image.width * image.height) / 1000000;
    
    // Aspect ratio score (prefer 16:9, 4:3, 1:1)
    const ratio = image.width / image.height;
    if (Math.abs(ratio - 16/9) < 0.1) score += 10;
    else if (Math.abs(ratio - 4/3) < 0.1) score += 8;
    else if (Math.abs(ratio - 1) < 0.1) score += 6;
    
    // Source reliability score
    const sourceScores = {
      unsplash: 10,
      pexels: 9,
      pixabay: 7,
      flickr: 6,
      wikimedia: 5,
    };
    score += sourceScores[image.source] || 3;
    
    return score;
  }
  
  private async prefetchNextPage(
    query: string,
    page: number,
    perPage: number
  ): Promise<void> {
    // Prefetch in background without blocking
    setTimeout(async () => {
      await this.scrapeDesigns(query, page, perPage);
    }, 100);
  }
}
```

### Infinite Scroll with Virtual List

```typescript
// components/design-feed/infinite-scroll.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';

export function InfiniteDesignFeed() {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Infinite query with prefetching
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['designs', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchDesigns(filters, pageParam, 100),
    getNextPageParam: (lastPage, pages) => pages.length + 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Flatten all pages
  const allItems = data?.pages.flatMap(page => page.results) ?? [];
  
  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
    overscan: 10, // Render 10 items outside viewport
  });
  
  // Auto-fetch next page when near bottom
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    
    if (!lastItem) return;
    
    if (
      lastItem.index >= allItems.length - 20 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allItems.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <DesignCard design={allItems[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```


## Real Product Scraping with Live Updates

### Product Scraper Architecture

```typescript
// lib/scraping/product-scraper.ts
class ProductScraper {
  private retailers = [
    { name: 'urbanladder', baseUrl: 'https://www.urbanladder.com' },
    { name: 'pepperfry', baseUrl: 'https://www.pepperfry.com' },
    { name: 'amazon', baseUrl: 'https://www.amazon.in' },
    { name: 'flipkart', baseUrl: 'https://www.flipkart.com' },
    { name: 'ikea', baseUrl: 'https://www.ikea.com/in' },
  ];
  
  async scrapeProducts(
    query: string,
    category: string,
    page: number = 1
  ): Promise<Product[]> {
    // Scrape all retailers in parallel
    const results = await Promise.allSettled(
      this.retailers.map(retailer =>
        this.scrapeRetailer(retailer, query, category, page)
      )
    );
    
    // Collect products
    const products: Product[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        products.push(...result.value);
      }
    }
    
    // Verify and enrich products
    const verified = await this.verifyProducts(products);
    
    // Cache products
    await this.cacheProducts(query, category, page, verified);
    
    // Start real-time price tracking
    this.trackPrices(verified.map(p => p.id));
    
    return verified;
  }
  
  private async scrapeRetailer(
    retailer: Retailer,
    query: string,
    category: string,
    page: number
  ): Promise<Product[]> {
    // Use rotating proxies and user agents
    const config = this.getScrapingConfig();
    
    try {
      // Fetch product listing page
      const html = await this.fetchWithRetry(
        `${retailer.baseUrl}/search?q=${query}&category=${category}&page=${page}`,
        config
      );
      
      // Parse products
      const products = this.parseProducts(html, retailer.name);
      
      // Enrich with details
      const enriched = await this.enrichProducts(products, retailer);
      
      return enriched;
    } catch (error) {
      console.error(`Failed to scrape ${retailer.name}:`, error);
      return [];
    }
  }
  
  private getScrapingConfig(): ScrapingConfig {
    return {
      userAgent: this.getRandomUserAgent(),
      proxy: this.getNextProxy(),
      timeout: 5000,
      retries: 3,
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    };
  }
  
  private async verifyProducts(products: Product[]): Promise<Product[]> {
    return Promise.all(
      products.map(async product => {
        // Verify product URL is accessible
        const urlValid = await this.verifyUrl(product.productUrl);
        
        // Verify image URL
        const imageValid = await this.verifyUrl(product.image);
        
        // Verify price is reasonable
        const priceValid = product.price > 0 && product.price < 10000000;
        
        return {
          ...product,
          verified: urlValid && imageValid && priceValid,
        };
      })
    );
  }
  
  private trackPrices(productIds: string[]): void {
    // Subscribe to price changes via WebSocket
    productIds.forEach(id => {
      this.priceTracker.subscribe(id, (update) => {
        // Broadcast price update to all connected clients
        this.broadcastPriceUpdate(id, update);
      });
    });
  }
}
```

### Real-Time Price Tracking

```typescript
// lib/realtime/price-tracker.ts
class PriceTracker {
  private ws: WebSocket;
  private subscriptions = new Map<string, Set<(update: PriceUpdate) => void>>();
  
  constructor() {
    this.connect();
  }
  
  private connect(): void {
    this.ws = new WebSocket('wss://your-backend.com/ws/prices');
    
    this.ws.onopen = () => {
      console.log('Price tracker connected');
      // Resubscribe to all products
      this.subscriptions.forEach((_, productId) => {
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          productId,
        }));
      });
    };
    
    this.ws.onmessage = (event) => {
      const update: PriceUpdate = JSON.parse(event.data);
      this.handlePriceUpdate(update);
    };
    
    this.ws.onclose = () => {
      console.log('Price tracker disconnected, reconnecting...');
      setTimeout(() => this.connect(), 1000);
    };
  }
  
  subscribe(productId: string, callback: (update: PriceUpdate) => void): () => void {
    if (!this.subscriptions.has(productId)) {
      this.subscriptions.set(productId, new Set());
      
      // Subscribe via WebSocket
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        productId,
      }));
    }
    
    this.subscriptions.get(productId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(productId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(productId);
          this.ws.send(JSON.stringify({
            type: 'unsubscribe',
            productId,
          }));
        }
      }
    };
  }
  
  private handlePriceUpdate(update: PriceUpdate): void {
    const callbacks = this.subscriptions.get(update.productId);
    if (callbacks) {
      callbacks.forEach(callback => callback(update));
    }
  }
}

// React hook for real-time prices
export function useRealtimePrice(productId: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [stock, setStock] = useState<boolean | null>(null);
  
  useEffect(() => {
    const unsubscribe = priceTracker.subscribe(productId, (update) => {
      setPrice(update.price);
      setStock(update.inStock);
      
      // Show toast notification
      if (update.priceChanged) {
        toast.info(`Price updated: ₹${update.price}`);
      }
      if (update.stockChanged && update.inStock) {
        toast.success('Back in stock!');
      }
    });
    
    return unsubscribe;
  }, [productId]);
  
  return { price, stock };
}
```


## Smart Caching Strategy

### Multi-Level Cache

```typescript
// lib/cache/cache-manager.ts
class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private redisClient: Redis;
  
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache (instant)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data as T;
    }
    
    // Level 2: Redis cache (fast)
    const redisData = await this.redisClient.get(key);
    if (redisData) {
      const parsed = JSON.parse(redisData);
      // Populate memory cache
      this.memoryCache.set(key, {
        data: parsed,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes
      });
      return parsed as T;
    }
    
    return null;
  }
  
  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    
    // Set in Redis with TTL
    await this.redisClient.setex(
      key,
      Math.floor(ttl / 1000),
      JSON.stringify(data)
    );
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.match(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear Redis cache
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

// Prefetching strategy
class PrefetchManager {
  async prefetchNextPages(
    query: string,
    currentPage: number,
    count: number = 3
  ): Promise<void> {
    // Prefetch next N pages in background
    const promises = [];
    for (let i = 1; i <= count; i++) {
      const nextPage = currentPage + i;
      promises.push(
        this.fetchAndCache(query, nextPage)
      );
    }
    
    // Don't await, let it run in background
    Promise.all(promises).catch(console.error);
  }
  
  private async fetchAndCache(query: string, page: number): Promise<void> {
    const cacheKey = `designs:${query}:${page}`;
    
    // Check if already cached
    const cached = await cacheManager.get(cacheKey);
    if (cached) return;
    
    // Fetch and cache
    const data = await fetchDesigns(query, page);
    await cacheManager.set(cacheKey, data, 10 * 60 * 1000); // 10 minutes
  }
}
```

## Rate Limit Management

### Intelligent Rate Limiter

```typescript
// lib/rate-limit/rate-limiter.ts
class RateLimiter {
  private limits = new Map<string, RateLimitState>();
  
  async checkLimit(provider: string): Promise<boolean> {
    const state = this.limits.get(provider) || this.initState(provider);
    
    const now = Date.now();
    const windowStart = now - state.window;
    
    // Remove old requests
    state.requests = state.requests.filter(t => t > windowStart);
    
    // Check if under limit
    if (state.requests.length < state.maxRequests) {
      state.requests.push(now);
      this.limits.set(provider, state);
      return true;
    }
    
    return false;
  }
  
  async waitForSlot(provider: string): Promise<void> {
    const state = this.limits.get(provider);
    if (!state) return;
    
    // Calculate wait time
    const oldestRequest = Math.min(...state.requests);
    const waitTime = state.window - (Date.now() - oldestRequest);
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  getAvailableProviders(providers: string[]): string[] {
    return providers.filter(provider => {
      const state = this.limits.get(provider);
      if (!state) return true;
      
      const now = Date.now();
      const windowStart = now - state.window;
      const recentRequests = state.requests.filter(t => t > windowStart);
      
      return recentRequests.length < state.maxRequests;
    });
  }
  
  private initState(provider: string): RateLimitState {
    // Provider-specific limits
    const limits = {
      groq: { maxRequests: 100, window: 60000 },
      stability: { maxRequests: 50, window: 60000 },
      replicate: { maxRequests: 30, window: 60000 },
      pexels: { maxRequests: 200, window: 3600000 },
      unsplash: { maxRequests: 50, window: 3600000 },
    };
    
    const config = limits[provider] || { maxRequests: 10, window: 60000 };
    
    return {
      ...config,
      requests: [],
    };
  }
}

// Request queue for rate-limited operations
class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  
  async enqueue(request: QueuedRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...request,
        resolve,
        reject,
      });
      
      // Show notification
      toast.info('Request queued', {
        description: `Position: ${this.queue.length}`,
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue[0];
      
      try {
        // Wait for rate limit slot
        await rateLimiter.waitForSlot(request.provider);
        
        // Execute request
        const result = await request.execute();
        request.resolve(result);
        
        // Remove from queue
        this.queue.shift();
        
        // Update notification
        if (this.queue.length > 0) {
          toast.info(`Processing queue`, {
            description: `${this.queue.length} requests remaining`,
          });
        }
      } catch (error) {
        request.reject(error);
        this.queue.shift();
      }
    }
    
    this.processing = false;
  }
}
```


## Optimistic UI Updates

### Instant Feedback Pattern

```typescript
// hooks/use-optimistic-mutation.ts
export function useOptimisticMutation<T>(
  mutationFn: (data: T) => Promise<T>,
  options: OptimisticOptions<T>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(options.queryKey);
      
      // Optimistically update UI
      queryClient.setQueryData(options.queryKey, (old: any) => {
        return options.optimisticUpdate(old, newData);
      });
      
      // Show instant feedback
      toast.success('Updated', {
        description: 'Changes saved',
      });
      
      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(options.queryKey, context.previous);
      
      toast.error('Update failed', {
        description: 'Changes reverted',
        action: {
          label: 'Retry',
          onClick: () => mutationFn(newData),
        },
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });
}

// Example usage
function DesignCard({ design }: { design: Design }) {
  const likeMutation = useOptimisticMutation(
    (id: string) => likeDesign(id),
    {
      queryKey: ['designs'],
      optimisticUpdate: (designs, id) => {
        return designs.map(d =>
          d.id === id
            ? { ...d, liked: true, likes: d.likes + 1 }
            : d
        );
      },
    }
  );
  
  return (
    <button
      onClick={() => likeMutation.mutate(design.id)}
      className="transition-transform active:scale-95"
    >
      <Heart className={design.liked ? 'fill-red-500' : ''} />
      {design.likes}
    </button>
  );
}
```

## WebSocket Real-Time Architecture

### WebSocket Manager

```typescript
// lib/websocket/ws-manager.ts
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private subscriptions = new Map<string, Set<(data: any) => void>>();
  private messageQueue: any[] = [];
  
  connect(url: string): void {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Send queued messages
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.send(message);
      }
      
      // Resubscribe to all channels
      this.subscriptions.forEach((_, channel) => {
        this.send({ type: 'subscribe', channel });
      });
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect(url);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    // Heartbeat to keep connection alive
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }
  
  private reconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      toast.error('Connection lost', {
        description: 'Please refresh the page',
      });
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms...`);
    setTimeout(() => this.connect(url), delay);
  }
  
  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      this.send({ type: 'subscribe', channel });
    }
    
    this.subscriptions.get(channel)!.add(callback);
    
    return () => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel);
          this.send({ type: 'unsubscribe', channel });
        }
      }
    };
  }
  
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }
  
  private handleMessage(message: any): void {
    const callbacks = this.subscriptions.get(message.channel);
    if (callbacks) {
      callbacks.forEach(callback => callback(message.data));
    }
  }
}

// React hook for WebSocket subscriptions
export function useWebSocket(channel: string) {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    setConnected(wsManager.isConnected());
    
    const unsubscribe = wsManager.subscribe(channel, (newData) => {
      setData(newData);
    });
    
    return unsubscribe;
  }, [channel]);
  
  return { data, connected };
}
```

## Performance Monitoring

### Real-Time Performance Tracking

```typescript
// lib/monitoring/performance-monitor.ts
class PerformanceMonitor {
  trackAPICall(endpoint: string, duration: number): void {
    // Track API latency
    if (duration > 1000) {
      console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }
    
    // Send to analytics
    analytics.track('api_latency', {
      endpoint,
      duration,
      timestamp: Date.now(),
    });
  }
  
  trackRenderTime(component: string, duration: number): void {
    if (duration > 16) { // More than one frame at 60fps
      console.warn(`Slow render: ${component} took ${duration}ms`);
    }
    
    analytics.track('render_time', {
      component,
      duration,
      timestamp: Date.now(),
    });
  }
  
  trackCacheHit(key: string, hit: boolean): void {
    analytics.track('cache_performance', {
      key,
      hit,
      timestamp: Date.now(),
    });
  }
  
  trackWebSocketLatency(latency: number): void {
    if (latency > 100) {
      console.warn(`High WebSocket latency: ${latency}ms`);
    }
    
    analytics.track('websocket_latency', {
      latency,
      timestamp: Date.now(),
    });
  }
}

// React hook for performance tracking
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackRenderTime(componentName, duration);
    };
  }, [componentName]);
}
```

## Deployment Considerations

### Backend Scaling

```python
# Backend/main.py - Production configuration
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from concurrent.futures import ThreadPoolExecutor

app = FastAPI()

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thread pool for parallel scraping
executor = ThreadPoolExecutor(max_workers=20)

@app.on_event("startup")
async def startup():
    # Initialize connection pools
    await init_redis_pool()
    await init_db_pool()
    
    # Start background tasks
    asyncio.create_task(price_tracker_task())
    asyncio.create_task(cache_warmer_task())

@app.post("/scrape/parallel")
async def scrape_parallel(query: str):
    # Run scrapers in parallel
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(executor, scrape_provider, provider, query)
        for provider in providers
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Filter successful results
    successful = [r for r in results if not isinstance(r, Exception)]
    return {"results": successful}
```

### Frontend Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['images.pexels.com', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

## Summary

This design provides:

1. **Multi-Provider AI**: Parallel requests to multiple AI services with instant fallback
2. **Aggressive Scraping**: Query all image providers simultaneously, cache aggressively
3. **Real Product Data**: Scrape real retailers with proxy rotation and anti-detection
4. **Zero-Delay Updates**: WebSocket for real-time, optimistic UI for instant feedback
5. **Smart Caching**: Multi-level cache with prefetching for instant responses
6. **Rate Limit Management**: Intelligent queuing and provider rotation
7. **Performance Monitoring**: Track everything to identify and fix bottlenecks

All components work together to provide an instant, reliable, production-ready experience.
