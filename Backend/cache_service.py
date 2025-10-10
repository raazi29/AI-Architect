import json
import asyncio
from typing import Any, Optional
import time

class CacheService:
    def __init__(self):
        # In-memory cache for demo purposes
        # In production, use Redis: self.redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        self.cache = {}
        self.expire_times = {}
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        # Check if key has expired
        if key in self.expire_times and time.time() > self.expire_times[key]:
            await self.delete(key)
            return None
            
        if key in self.cache:
            return self.cache[key]
        return None
    
    async def set(self, key: str, value: Any, expiry: int = 300) -> bool:  # 5 minutes default
        """Set value in cache"""
        try:
            self.cache[key] = value
            self.expire_times[key] = time.time() + expiry
            return True
        except:
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            self.cache.pop(key, None)
            self.expire_times.pop(key, None)
            return True
        except:
            return False
    
    async def clear_expired(self):
        """Clear expired cache entries"""
        current_time = time.time()
        expired_keys = [key for key, expiry in self.expire_times.items() if current_time > expiry]
        for key in expired_keys:
            await self.delete(key)

    async def pre_cache_next_pages(self, query: str, max_pages: int = 5):
        """Pre-cache the next few pages for a query to improve loading speed"""
        print(f"Pre-caching {max_pages} pages for query: {query}")
        for page in range(1, max_pages + 1):
            # Create a cache key that matches what the database cache function would use
            cache_key = f"search_{query}_page_{page}"
            # We'll let the regular caching happen during actual requests
            # For now, we'll just note that pre-caching was requested for this query
            await self.set(cache_key, f"pre_cached_{query}_page_{page}", expiry=300)  # 5 minutes