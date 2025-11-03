# Implementation Plan

## Task Overview

This plan implements instant, reliable AI generation, aggressive design feed scraping, and real product data with real-time updates. All tasks focus on speed, reliability, and zero-delay user experience.

## Phase 1: Multi-Provider AI Service

- [x] 1. Create multi-provider AI service


  - Create `lib/ai/multi-provider-service.ts`
  - Define AIProvider interface with timeout and rate limit config
  - Add provider configurations for Groq, Stability, Replicate, Hugging Face
  - Implement parallel generation with Promise.allSettled
  - Return first successful result
  - Test with all providers
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement rate limit tracking


  - Create `lib/rate-limit/rate-limiter.ts`
  - Track requests per provider with timestamps
  - Implement checkLimit method
  - Add getAvailableProviders method
  - Store limits in memory Map
  - Test rate limit enforcement
  - _Requirements: 1.6, 7.1, 7.2_

- [x] 3. Add request queuing system



  - Create `lib/rate-limit/request-queue.ts`
  - Implement queue with Promise-based API
  - Add processQueue method with rate limit checks
  - Show toast notifications for queue position
  - Process queue automatically when slots available
  - Test queue processing
  - _Requirements: 1.3, 7.3, 7.4_

- [x] 4. Enhance prompt engineering


  - Update `Backend/interior_ai_service.py` and `Backend/multi_ai_service.py`
  - Add quality modifiers to prompts
  - Include style and room type in prompts
  - Add negative prompts
  - Extract objects and placement from user input
  - Test prompt enhancements
  - _Requirements: 1.8, 8.1, 8.2_

- [x] 5. Update AI Generator component



  - Update `components/image-generator/ImageGenerator.tsx`
  - Connect to multi-provider service
  - Show provider being used
  - Display queue position if rate limited
  - Add retry button on failure
  - Test generation flow
  - _Requirements: 1.4, 1.5, 1.7_

## Phase 2: Aggressive Design Feed Scraping

- [x] 6. Create parallel scraping service


  - Create `lib/scraping/design-feed-scraper.ts`
  - Add all provider configurations (Pexels, Unsplash, Pixabay, Flickr, etc.)
  - Implement scrapeDesigns with Promise.allSettled
  - Set 3-second timeout per provider
  - Collect and merge results
  - Test parallel scraping
  - _Requirements: 2.1, 2.8, 6.2_

- [x] 7. Implement deduplication and sorting

  - Add deduplicateImages method using image hashes
  - Implement calculateQualityScore based on resolution and source
  - Sort results by quality score
  - Filter out low-quality images
  - Test deduplication
  - _Requirements: 2.6_

- [x] 8. Add aggressive caching


  - Create `lib/cache/cache-manager.ts`
  - Implement memory cache with Map
  - Add Redis cache integration
  - Set 5-minute TTL for design feed
  - Implement cache invalidation
  - Test cache hit rates
  - _Requirements: 2.4, 5.1, 5.2_

- [x] 9. Implement prefetching


  - Create `lib/cache/prefetch-manager.ts`
  - Prefetch next 3 pages in background
  - Don't block current page load
  - Cache prefetched results
  - Test prefetching
  - _Requirements: 5.1, 5.8_

- [x] 10. Add virtual scrolling to feed


  - Update `app/design-feed/page.tsx`
  - Install and configure @tanstack/react-virtual
  - Implement useVirtualizer with 300px item height
  - Set overscan to 10 items
  - Test smooth scrolling
  - _Requirements: 2.1, 2.7, 6.7_

- [x] 11. Implement infinite scroll

  - Install @tanstack/react-query
  - Use useInfiniteQuery for feed data
  - Auto-fetch next page when near bottom (20 items before end)
  - Show loading state while fetching
  - Test infinite scroll
  - _Requirements: 2.2, 2.7_

- [x] 12. Optimize filter updates


  - Debounce search input (300ms)
  - Update results instantly on filter change
  - Use cached results when available
  - Show skeleton loaders during load
  - Test filter performance
  - _Requirements: 2.3, 4.1_


## Phase 3: Real Product Scraping

- [x] 13. Create product scraper service





  - Create `lib/scraping/product-scraper.ts`
  - Add retailer configurations (Urban Ladder, Pepperfry, Amazon, Flipkart, IKEA)
  - Implement scrapeProducts with parallel scraping
  - Set 5-second timeout per retailer
  - Handle scraping errors gracefully
  - Test product scraping
  - _Requirements: 3.1, 9.1, 9.7_

- [x] 14. Implement proxy rotation


  - Add proxy configuration to scraper
  - Rotate proxies for each request
  - Handle proxy failures
  - Fall back to direct connection if proxies fail
  - Test proxy rotation
  - _Requirements: 9.2, 9.3_

- [x] 15. Add user agent rotation


  - Create list of realistic user agents
  - Rotate user agents for each request
  - Include mobile and desktop agents
  - Test user agent rotation
  - _Requirements: 9.1_

- [x] 16. Implement product verification

  - Add verifyProducts method
  - Check product URL accessibility
  - Verify image URL
  - Validate price ranges
  - Mark products as verified
  - Test verification
  - _Requirements: 3.4_

- [x] 17. Add product enrichment


  - Fetch additional product details
  - Extract specifications
  - Get high-resolution images
  - Add retailer-specific data
  - Test enrichment
  - _Requirements: 3.1, 3.2_

- [x] 18. Update shopping page


  - Update `app/shopping/page.tsx`
  - Connect to product scraper service
  - Display real products
  - Show verified badges
  - Add loading states
  - Test product display
  - _Requirements: 3.1, 3.5_

## Phase 4: Real-Time Price Tracking

- [x] 19. Create WebSocket price tracker


  - Create `lib/realtime/price-tracker.ts`
  - Establish WebSocket connection to backend
  - Implement subscribe/unsubscribe methods
  - Handle connection drops with auto-reconnect
  - Test WebSocket connection
  - _Requirements: 3.2, 10.1, 10.3_

- [x] 20. Implement backend WebSocket server



  - Create `Backend/websocket_price_tracker.py`
  - Set up WebSocket server with FastAPI
  - Handle subscribe/unsubscribe messages
  - Track product prices in background
  - Broadcast price updates to subscribers
  - Test WebSocket server
  - _Requirements: 3.2, 10.2_

- [x] 21. Add price change detection

  - Scrape product prices periodically (every 5 minutes)
  - Compare with cached prices
  - Detect price changes
  - Broadcast updates via WebSocket
  - Test price change detection
  - _Requirements: 3.2, 3.3_

- [x] 22. Implement stock tracking

  - Track product availability
  - Detect stock changes
  - Broadcast stock updates
  - Show "Back in stock" notifications
  - Test stock tracking
  - _Requirements: 3.3_

- [x] 23. Create useRealtimePrice hook

  - Create React hook for price subscriptions
  - Subscribe to product on mount
  - Update state on price changes
  - Show toast notifications
  - Unsubscribe on unmount
  - Test hook
  - _Requirements: 3.2, 3.3_

- [x] 24. Update product cards with real-time prices



  - Use useRealtimePrice hook in product cards
  - Display live prices
  - Show price change indicators
  - Animate price updates
  - Test real-time updates
  - _Requirements: 3.2, 4.1_

## Phase 5: Optimistic UI Updates

- [x] 25. Create optimistic mutation hook




  - Create `hooks/use-optimistic-mutation.ts`
  - Wrap useMutation from React Query
  - Implement optimistic updates in onMutate
  - Rollback on error
  - Refetch on success
  - Test optimistic updates
  - _Requirements: 4.1, 4.4_

- [x] 26. Add optimistic likes


  - Update design cards to use optimistic mutation
  - Update like count instantly
  - Show filled heart immediately
  - Rollback if API fails
  - Test like functionality
  - _Requirements: 4.1, 4.2_

- [x] 27. Add optimistic saves


  - Implement optimistic save to wishlist
  - Update UI instantly
  - Show saved indicator
  - Rollback on failure
  - Test save functionality
  - _Requirements: 4.1, 4.2_

- [x] 28. Add optimistic cart updates



  - Update cart count instantly
  - Show item added animation
  - Rollback if fails
  - Test cart updates
  - _Requirements: 4.1, 4.2_

## Phase 6: WebSocket Real-Time Architecture

- [x] 29. Create WebSocket manager


  - Create `lib/websocket/ws-manager.ts`
  - Implement connect with auto-reconnect
  - Add exponential backoff for reconnection
  - Queue messages when disconnected
  - Send queued messages on reconnect
  - Test connection management
  - _Requirements: 10.1, 10.3, 10.4_

- [x] 30. Implement channel subscriptions

  - Add subscribe/unsubscribe methods
  - Track subscriptions in Map
  - Resubscribe on reconnect
  - Handle multiple callbacks per channel
  - Test subscriptions
  - _Requirements: 10.2, 10.5_

- [x] 31. Add heartbeat mechanism

  - Send ping every 30 seconds
  - Detect connection issues
  - Trigger reconnect if no pong
  - Test heartbeat
  - _Requirements: 10.7_

- [x] 32. Create useWebSocket hook


  - Create React hook for WebSocket subscriptions
  - Subscribe to channel on mount
  - Update state on messages
  - Unsubscribe on unmount
  - Test hook
  - _Requirements: 10.2, 10.8_

- [x] 33. Implement message compression



  - Compress large messages with gzip
  - Decompress on receive
  - Only compress messages > 1KB
  - Test compression
  - _Requirements: 10.6_

## Phase 7: Performance Optimization

- [x] 34. Implement request batching


  - Batch multiple API requests
  - Send as single request
  - Split response to individual callbacks
  - Test batching
  - _Requirements: 6.1, 6.2_

- [x] 35. Add response compression







  - Enable gzip compression on backend
  - Configure Next.js to accept compressed responses
  - Test compression savings
  - _Requirements: 5.5_

- [-] 36. Optimize image loading

  - Use Next.js Image component everywhere
  - Add blur placeholders
  - Lazy load images
  - Use WebP/AVIF formats
  - Test image performance
  - _Requirements: 5.5, 12.4_

- [ ] 37. Implement code splitting
  - Lazy load heavy components
  - Split routes automatically
  - Prefetch on hover
  - Test bundle sizes
  - _Requirements: 12.1, 12.6_

- [ ] 38. Add service worker for offline
  - Create service worker
  - Cache API responses
  - Serve cached data when offline
  - Sync when back online
  - Test offline functionality
  - _Requirements: 4.5, 4.6_

## Phase 8: Monitoring and Analytics

- [ ] 39. Create performance monitor
  - Create `lib/monitoring/performance-monitor.ts`
  - Track API call latency
  - Track render times
  - Track cache hit rates
  - Track WebSocket latency
  - Test monitoring
  - _Requirements: 15.2, 15.5_

- [ ] 40. Add error tracking
  - Integrate Sentry
  - Track all errors with context
  - Set up error alerts
  - Test error tracking
  - _Requirements: 15.1, 15.7_

- [ ] 41. Implement analytics
  - Track user actions
  - Track feature usage
  - Track performance metrics
  - Create analytics dashboard
  - Test analytics
  - _Requirements: 15.4, 15.8_

- [ ] 42. Add real-time monitoring dashboard
  - Create admin dashboard
  - Show active users
  - Show API latency
  - Show cache hit rates
  - Show error rates
  - Test dashboard
  - _Requirements: 15.8_

## Phase 9: Testing and Optimization

- [ ] 43. Load test AI generation
  - Simulate 100 concurrent requests
  - Verify all providers are used
  - Check fallback behavior
  - Measure response times
  - Optimize bottlenecks
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 44. Load test design feed
  - Simulate 1000 concurrent users
  - Verify cache effectiveness
  - Check prefetching works
  - Measure scroll performance
  - Optimize if needed
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 45. Load test product scraping
  - Simulate 500 concurrent searches
  - Verify proxy rotation
  - Check rate limit handling
  - Measure scraping speed
  - Optimize scraping
  - _Requirements: 3.1, 3.5, 9.1_

- [ ] 46. Test WebSocket reliability
  - Simulate connection drops
  - Verify auto-reconnect
  - Check message queuing
  - Test with 1000 concurrent connections
  - Optimize if needed
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 47. Optimize cache strategy
  - Analyze cache hit rates
  - Adjust TTL values
  - Optimize prefetching
  - Test cache performance
  - _Requirements: 5.2, 5.3, 5.6_

## Phase 10: Deployment

- [ ] 48. Deploy backend with scaling
  - Deploy to Railway/Render with auto-scaling
  - Configure environment variables
  - Set up Redis instance
  - Enable WebSocket support
  - Test production backend
  - _Requirements: All_

- [ ] 49. Deploy frontend to Vercel
  - Configure Vercel project
  - Set environment variables
  - Enable edge functions
  - Configure caching headers
  - Test production frontend
  - _Requirements: All_

- [ ] 50. Configure CDN
  - Set up Cloudflare CDN
  - Cache static assets
  - Cache API responses
  - Enable compression
  - Test CDN performance
  - _Requirements: 5.5, 12.1_

- [ ] 51. Set up monitoring
  - Configure Sentry
  - Set up Vercel Analytics
  - Add custom metrics
  - Configure alerts
  - Test monitoring
  - _Requirements: 15.1, 15.2_

- [ ] 52. Final performance testing
  - Run Lighthouse audits
  - Test on slow 3G
  - Test on mobile devices
  - Verify all features work
  - Fix any issues
  - _Requirements: All_

## Notes

- All tasks should be tested individually before moving to next
- Performance should be measured at each step
- Cache hit rates should be monitored
- WebSocket connections should be stable
- All features should work without delays
- Mobile experience should be smooth
- Error handling should be robust
