import os
import httpx
import asyncio
import random
import time
from typing import Dict, List, Any, Optional
from fastapi import HTTPException
from urllib.parse import urlencode
from bs4 import BeautifulSoup
import re

# Import the image categorization service
from image_categorization_service import image_categorization_service
# Removed unused import: from fast_cache_service import fast_cache_service


class WebScrapingService:
    """
    A service to scrape Pinterest and Unsplash for design images.
    Uses public APIs and public-facing pages only to comply with ToS.
    """
    
    def __init__(self):
        self.session = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Use existing API keys if available (these are already defined in your .env)
        self.unsplash_access_key = os.getenv("UNSPLASH_ACCESS_KEY")
        self.unsplash_secret_key = os.getenv("UNSPLASH_SECRET_KEY")
        self.pexels_api_key = os.getenv("PEXELS_API_KEY")
        
        # Initialize rate limiting
        self.rate_limiters = {
            "unsplash": {"last_request": 0, "min_interval": 1.0},  # 1 second between requests
            "pexels": {"last_request": 0, "min_interval": 1.0},     # 1 second between requests
        }
        
        # Initialize cache for storing requests temporarily
        self.cache = {}
        self.cache_timeout = 300  # 5 minutes cache timeout
        
        # Validate available services
        self.unsplash_enabled = bool(self.unsplash_access_key and 
                                   self.unsplash_access_key != "7GgIy-50AGkL5vzuEWjOd__qZT9gtEEH2yanI71mnlI" and
                                   self.unsplash_secret_key and
                                   self.unsplash_secret_key != "XbvYUrh1yLQZWzOqnDgE7pPwEBCm9E_Q-22YGAo4L3I")
        
        self.pexels_enabled = bool(self.pexels_api_key and 
                                 self.pexels_api_key != "rXEdhkisXHdUMcohUxq5Qy2YXRXzzN5fVgEBOXMoBAVPaPbOrFdHrD38")
        
        print(f"Web scraping service initialized: Unsplash={self.unsplash_enabled}, Pexels={self.pexels_enabled}")
    
    def _get_cache_key(self, provider: str, query: str, page: int, per_page: int) -> str:
        """
        Generate a cache key based on the query parameters
        """
        return f"{provider}:{query}:{page}:{per_page}"
    
    def _is_cache_valid(self, timestamp: float) -> bool:
        """
        Check if cache entry is still valid
        """
        return (time.time() - timestamp) < self.cache_timeout

    async def _rate_limit(self, service_name: str):
        """
        Implement rate limiting to avoid hitting API limits
        """
        if service_name in self.rate_limiters:
            limiter = self.rate_limiters[service_name]
            elapsed = time.time() - limiter["last_request"]
            if elapsed < limiter["min_interval"]:
                wait_time = limiter["min_interval"] - elapsed
                await asyncio.sleep(wait_time)
            limiter["last_request"] = time.time()

    async def scrape_unsplash_by_tags(self, tags: List[str], page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Scrape Unsplash using public collections and search endpoints through API
        """
        if not self.unsplash_enabled:
            print("Unsplash API not properly configured, returning empty results")
            return []
        
        query = " ".join(tags) if tags else "design"
        cache_key = self._get_cache_key("unsplash", query, page, per_page)
        
        # Check if results are cached
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if self._is_cache_valid(timestamp):
                print(f"Returning cached results for Unsplash query: {query}, page: {page}")
                return cached_result
        
        # Apply rate limiting
        await self._rate_limit("unsplash")
        
        try:
            # Use Unsplash API for better reliability
            base_url = "https://api.unsplash.com/search/photos"
            params = {
                "query": query,
                "page": page,
                "per_page": per_page,
                "orientation": "all"
            }
            
            headers = {"Authorization": f"Client-ID {self.unsplash_access_key}"}
            response = await self.session.get(base_url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                results = []
                for item in data.get("results", []):
                    formatted_item = self._format_unsplash_item(item)
                    results.append(formatted_item)
                
                # Cache the results
                self.cache[cache_key] = (results, time.time())
                return results
            else:
                print(f"Unsplash API error: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Error scraping Unsplash: {e}")
            return []

    async def scrape_pinterest_by_tags(self, tags: List[str], page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Get Pinterest-like content through public Unsplash/Pexels collections
        since direct Pinterest scraping is against ToS
        """
        if not tags:
            tags = ["design", "interior", "architecture"]
            
        # For compliance with Pinterest ToS, we'll use alternative sources
        # that provide similar content to what would be found on Pinterest
        return await self._get_alternative_design_images(tags, page, per_page)

    async def _get_alternative_design_images(self, tags: List[str], page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Get design images from various sources as alternative to Pinterest
        """
        all_results = []
        
        # Get from Unsplash if available
        if self.unsplash_enabled:
            unsplash_results = await self.scrape_unsplash_by_tags(tags, page, per_page)
            all_results.extend(unsplash_results)
        
        # Get from Pexels if available
        if self.pexels_enabled:
            pexels_results = await self._scrape_pexels_by_tags(tags, page, per_page)
            all_results.extend(pexels_results)
        
        # Filter results to only include valid design images
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
        
        # Shuffle results to avoid source bias
        random.shuffle(filtered_results)
        
        # Limit to requested per_page
        return filtered_results[:per_page]

    async def _scrape_pexels_by_tags(self, tags: List[str], page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Scrape Pexels using API
        """
        if not self.pexels_enabled:
            print("Pexels API not properly configured, returning empty results")
            return []
        
        query = " ".join(tags) if tags else "design"
        cache_key = self._get_cache_key("pexels", query, page, per_page)
        
        # Check if results are cached
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if self._is_cache_valid(timestamp):
                print(f"Returning cached results for Pexels query: {query}, page: {page}")
                return cached_result
        
        # Apply rate limiting
        await self._rate_limit("pexels")
        
        try:
            base_url = "https://api.pexels.com/v1/search"
            query = " ".join(tags) if tags else "design"
            params = {
                "query": query,
                "page": page,
                "per_page": per_page
            }
            
            headers = {"Authorization": self.pexels_api_key}
            response = await self.session.get(base_url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                results = []
                for item in data.get("photos", []):
                    formatted_item = self._format_pexels_item(item)
                    results.append(formatted_item)
                
                # Cache the results
                self.cache[cache_key] = (results, time.time())
                return results
            else:
                print(f"Pexels API error: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Error scraping Pexels: {e}")
            return []

    def _format_unsplash_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Format Unsplash item to match frontend expectations"""
        # Only use "Design Image" if there's no actual alt_description
        alt_description = item.get("alt_description", "")
        title = alt_description if alt_description.strip() else "Design Image"
        alt_text = alt_description if alt_description.strip() else "Design Image"
        
        return {
            "id": item.get("id", ""),
            "width": item.get("width", 0),
            "height": item.get("height", 0),
            "url": item.get("links", {}).get("html", ""),
            "photographer": "",  # Removed as per requirements
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": item.get("color", "#ffffff"),
            "src": {
                "original": item.get("urls", {}).get("raw", ""),
                "large2x": item.get("urls", {}).get("full", ""),
                "large": item.get("urls", {}).get("regular", ""),
                "medium": item.get("urls", {}).get("small", ""),
                "small": item.get("urls", {}).get("thumb", ""),
                "portrait": item.get("urls", {}).get("small", ""),
                "landscape": item.get("urls", {}).get("regular", ""),
                "tiny": item.get("urls", {}).get("thumb", "")
            },
            "alt": alt_text,
            "image": item.get("urls", {}).get("regular", item.get("urls", {}).get("small", "")),
            "title": title,
            "author": "",
            "likes": item.get("likes", 0),
            "saves": 0
        }

    def _format_pexels_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Format Pexels item to match frontend expectations"""
        # Only use "Design Image" if there's no actual alt
        alt_text = item.get("alt", "")
        title = alt_text if alt_text.strip() else "Design Image"
        alt = alt_text if alt_text.strip() else "Design Image"
        
        return {
            "id": item.get("id", 0),
            "width": item.get("width", 0),
            "height": item.get("height", 0),
            "url": item.get("url", ""),
            "photographer": "",  # Removed as per requirements
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": item.get("avg_color", "#ffffff"),
            "src": item.get("src", {}),
            "alt": alt,
            "image": item.get("src", {}).get("large2x", item.get("src", {}).get("large", "")),
            "title": title,
            "author": "",
            "likes": 0,  # Placeholder
            "saves": 0   # Placeholder
        }

    async def scrape_by_category(self, category: str, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Scrape images by category (interior design, architecture, etc.)
        """
        category_tags = {
            "interior": ["interior design", "home decor", "room design"],
            "architecture": ["architecture", "building design", "modern architecture"],
            "minimalist": ["minimalist", "minimal design", "simple interior"],
            "scandinavian": ["scandinavian", "nordic design", "scandinavian interior"],
            "modern": ["modern design", "contemporary", "modern interior"],
            "kitchen": ["kitchen design", "modern kitchen", "kitchen interior"],
            "bedroom": ["bedroom design", "bedroom decor", "bedroom interior"],
            "living": ["living room", "living room design", "modern living room"],
            "bathroom": ["bathroom design", "modern bathroom", "bathroom decor"],
            "outdoor": ["outdoor design", "patio design", "garden design"]
        }
        
        tags = category_tags.get(category.lower(), [category])
        return await self._get_alternative_design_images(tags, page, per_page)



    async def search_all_sources(self, query: str, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Search all available sources for images matching the query
        Prioritizes faster scraping methods and minimizes rate-limited API calls
        """
        # For infinite scroll, prioritize Picsum which has no rate limits
        return await self.search_picsum_only(query, page, per_page)
        
    async def search_picsum_only(self, query: str, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Search only using Picsum (no rate limits) for infinite scroll
        """
        cache_key = self._get_cache_key("picsum_only", query, page, per_page)
        
        # Check if results are cached
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if self._is_cache_valid(timestamp):
                print(f"Returning cached results for Picsum-only query: {query}, page: {page}")
                return cached_result
        
        all_results = []
        processed_urls = set()
        
        try:
            import httpx
            # Fetch from Picsum which is very reliable and fast - this avoids rate limits
            # Use a larger limit to ensure we have enough results for infinite scroll
            picsum_limit = per_page * 2  # Get double the requested amount to ensure we always have enough
            picsum_url = f"https://picsum.photos/v2/list?page={page % 10 + 1}&limit={picsum_limit}"  # Cycle through pages to avoid repetition
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{random.randint(1000, 9999)}",  # Include random number to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        try:
            import httpx
            # Use Picsum with a more sophisticated approach to generate unique content across pages
            # Generate a seed based on query and page to ensure variety
            seed = hash(query + str(page)) % 10000
            picsum_limit = per_page * 3  # Get 3x the requested amount to ensure we always have enough
            picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={picsum_limit}&seed={seed}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        try:
            import httpx
            # Fetch from Picsum which is very reliable and fast - this avoids rate limits
            # Use a larger limit to ensure we have enough results for infinite scroll
            picsum_limit = per_page * 2  # Get double the requested amount to ensure we always have enough
            # Use a seed based on query and page to ensure variety across pages
            seed = hash(query + str(page)) % 10000
            picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={picsum_limit}&seed={seed}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        try:
            import httpx
            # Use Picsum with a seed based on query and page to ensure variety
            seed = hash(query + str(page)) % 10000
            picsum_limit = per_page * 2  # Get extra to compensate for filtering
            picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={picsum_limit}&seed={seed}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        try:
            import httpx
            # Fetch from Picsum which is very reliable and fast - this avoids rate limits
            # Use a larger limit to ensure we have enough results for infinite scroll
            picsum_limit = per_page * 3  # Get triple the requested amount to ensure we always have enough
            # Generate a seed based on query and page to ensure variety across pages
            seed = hash(query + str(page)) % 10000
            picsum_url = f"https://picsum.photos/v2/list?page={page % 10 + 1}&limit={picsum_limit}&seed={seed}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        try:
            import httpx
            # Use Picsum with a consistent approach to generate unique content across pages
            # Generate a seed based on query and page to ensure variety
            seed = hash(query + str(page)) % 10000
            picsum_limit = per_page * 3  # Get extra to compensate for filtering
            picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={picsum_limit}&seed={seed}"  # Cycle through pages with seed for variety
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        try:
            import httpx
            # Use Picsum with a more sophisticated approach to generate unique content across pages
            # Generate a seed based on query and page to ensure variety
            seed = hash(query + str(page)) % 10000
            picsum_limit = per_page * 3  # Get extra to compensate for filtering
            picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={picsum_limit}&seed={seed}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Filter results to ensure they match design categories with early exit
                    filtered_results = []
                    for result in all_results:
                        if image_categorization_service.is_valid_design_image(result):
                            filtered_results.append(result)
                            # Early exit if we have enough results
                            if len(filtered_results) >= per_page:
                                break
                    
                    # Cache the results
                    final_results = filtered_results[:per_page] if filtered_results else []
                    self.cache[cache_key] = (final_results, time.time())
                    
                    print(f"Got {len(final_results)} results from Picsum-only for page {page}")
                    return final_results
                else:
                    print(f"Picsum API error: {response.status_code} - {response.text}")
                    return []
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
            return []
        
        try:
            import httpx
            # Use a sophisticated approach to generate unique images across pages
            # Generate a seed based on query and page to ensure variety
            seed = hash(query + str(page)) % 10000
            
            # Get more than needed to ensure we have enough results after filtering
            picsum_limit = per_page * 3  # Get triple the requested amount to compensate for filtering
            picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={picsum_limit}&seed={seed}"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    
                    # Process each item
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        
                        # Use the unique ID as primary key for deduplication
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            # Only add if it's a valid design image
                            if image_categorization_service.is_valid_design_image(formatted_item):
                                all_results.append(formatted_item)
                                processed_urls.add(image_key)
                        
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
            
        # Filter results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        try:
            import httpx
            # Fetch from Picsum which is very reliable and fast - this avoids rate limits
            # Use a larger limit to ensure we have enough results for infinite scroll
            picsum_limit = per_page * 3  # Get triple the requested amount to ensure we always have enough
            # Use a seed based on query and page to ensure variety across pages
            seed = hash(query + str(page)) % 10000
            picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={picsum_limit}&seed={seed}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        try:
            import httpx
            # Use a more sophisticated approach to generate unique images across pages
            # Generate a seed based on query and page to ensure variety
            seed = hash(query + str(page)) % 10000
            picsum_limit = per_page * 3  # Get extra to compensate for filtering
            picsum_url = f"https://picsum.photos/v2/list?page={page % 10 + 1}&limit={picsum_limit}&seed={seed}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
        
        # First, try to get results from non-rate-limited sources (like Picsum which is fast and free)
        try:
            import httpx
            # Fetch from Picsum which is very reliable and fast - this avoids rate limits
            # Use a consistent page calculation to ensure we can support infinite scroll
            # Instead of cycling through pages, use a more sophisticated approach to generate unique content
            picsum_page = (page - 1) % 10 + 1  # This ensures we cycle through 10 different pages
            picsum_url = f"https://picsum.photos/v2/list?page={picsum_page}&limit={per_page}"  # Use consistent page calculation
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}",  # Include page number in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Only try rate-limited APIs if we need more results
        if len(all_results) < per_page and (self.unsplash_enabled or self.pexels_enabled):
            # Split query into tags
            tags = query.split() if query else ["design"]
            
            # Try to get results from Unsplash when needed (but sparingly to avoid rate limits)
            if self.unsplash_enabled and len(all_results) < per_page:
                try:
                    # Use different page numbers for different requests to get more variety
                    # Use lower page numbers to reduce chance of rate limits
                    effective_page = max(1, (page - 1) % 3 + 1)  # Cycle through fewer pages to reduce rate limits
                    unsplash_results = await self.scrape_unsplash_by_tags(tags, effective_page, max(10, per_page // 2))  # Fetch fewer to avoid rate limits
                    for item in unsplash_results:
                        # Use image ID as primary deduplication key
                        image_key = item.get("id", "") or item.get("image", "")
                        if image_key and image_key not in processed_urls:
                            all_results.append(item)
                            processed_urls.add(image_key)
                except Exception as e:
                    print(f"Error fetching from Unsplash: {e}")
            
            # Try to get results from Pexels when needed (but sparingly to avoid rate limits)
            if self.pexels_enabled and len(all_results) < per_page:
                try:
                    # Use different page numbers for different requests to get more variety
                    # Use lower page numbers to reduce chance of rate limits
                    effective_page = max(1, (page - 1) % 3 + 1)  # Cycle through fewer pages to reduce rate limits
                    pexels_results = await self._scrape_pexels_by_tags(tags, effective_page, max(10, per_page // 2))  # Fetch fewer to avoid rate limits
                    for item in pexels_results:
                        # Use image ID as primary deduplication key
                        image_key = item.get("id", "") or item.get("image", "")
                        if image_key and image_key not in processed_urls:
                            all_results.append(item)
                            processed_urls.add(image_key)
                except Exception as e:
                    print(f"Error fetching from Pexels: {e}")
        
        # If still no results after trying all sources, try with alternative design terms
        if not all_results and len(self.cache) < 100:  # Only try alternatives if we're not over-caching
            print("No images from primary sources, trying alternative design terms")
            alternative_queries = [
                ["interior", "design"], ["architecture"], ["modern", "home"], 
                ["minimalist"], ["scandinavian"], ["luxury", "interior"],
                ["contemporary", "design"], ["industrial", "design"]
            ]
            
            # Try with alternative queries until we find some results - prioritizing Picsum again
            for alt_query in alternative_queries:
                if len(all_results) >= per_page // 2:  # Stop if we have enough
                    break
                
                # Try alternative with Picsum first (no rate limits)
                try:
                    import httpx
                    # Vary the seed based on the query to get different images for different terms
                    seed = hash(" ".join(alt_query)) % 10000
                    picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={per_page // 2}&seed={seed}"
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(picsum_url)
                        if response.status_code == 200:
                            picsum_data = response.json()
                            for item in picsum_data:
                                formatted_item = {
                                    "id": f"picsum_{item.get('id', 'unknown')}",
                                    "width": item.get("width", 800),
                                    "height": item.get("height", 600),
                                    "url": f"https://picsum.photos/id/{item.get('id')}/info",
                                    "photographer": "",
                                    "photographer_url": "",
                                    "photographer_id": 0,
                                    "avg_color": item.get("avg_color", "#ffffff"),
                                    "src": {
                                        "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                        "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                        "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                        "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                        "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                        "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                        "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                        "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                                    },
                                    "alt": f"{' '.join(alt_query).title()} #{item.get('id')}",  # Removed "Design" suffix
                                    "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                    "title": f"{' '.join(alt_query).title()} #{item.get('id')}",  # Removed "Design" suffix
                                    "author": "",
                                    "likes": 0,
                                    "saves": 0
                                }
                                # Only add if the image matches our design criteria
                                if image_categorization_service.is_valid_design_image(formatted_item):
                                    image_key = formatted_item["id"]
                                    if image_key and image_key not in processed_urls:
                                        all_results.append(formatted_item)
                                        processed_urls.add(image_key)
                except Exception as e:
                    print(f"Error fetching from Picsum with alternative query: {e}")
        
        # Filter all results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results

    async def search_picsum_only(self, query: str, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Search only using Picsum (no rate limits) for infinite scroll
        """
        cache_key = self._get_cache_key("picsum_only", query, page, per_page)
        
        # Check if results are cached
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if self._is_cache_valid(timestamp):
                print(f"Returning cached results for Picsum-only query: {query}, page: {page}")
                return cached_result
        
        all_results = []
        processed_urls = set()
        
        try:
            import httpx
            # Fetch from Picsum which is very reliable and fast - this avoids rate limits
            # Use a larger limit to ensure we have enough results for infinite scroll
            picsum_limit = per_page * 3  # Get triple the requested amount to ensure we always have enough
            # Use a seed based on query and page to ensure variety across pages
            seed = hash(query + str(page)) % 10000
            picsum_url = f"https://picsum.photos/v2/list?page={page % 5 + 1}&limit={picsum_limit}&seed={seed}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(picsum_url)
                if response.status_code == 200:
                    picsum_data = response.json()
                    for item in picsum_data:
                        # Format Picsum data to match our expected format
                        formatted_item = {
                            "id": f"picsum_{item.get('id', 'unknown')}_{page}_{seed}",  # Include page number and seed in ID to prevent duplicates across pages
                            "width": item.get("width", 800),
                            "height": item.get("height", 600),
                            "url": f"https://picsum.photos/id/{item.get('id')}/info",
                            "photographer": "",
                            "photographer_url": "",
                            "photographer_id": 0,
                            "avg_color": item.get("avg_color", "#ffffff"),
                            "src": {
                                "original": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large2x": f"https://picsum.photos/seed/{item.get('id')}/1200/900",
                                "large": f"https://picsum.photos/seed/{item.get('id')}/1000/750",
                                "medium": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "small": f"https://picsum.photos/seed/{item.get('id')}/400/300",
                                "portrait": f"https://picsum.photos/seed/{item.get('id')}/600/800", 
                                "landscape": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                                "tiny": f"https://picsum.photos/seed/{item.get('id')}/200/150"
                            },
                            "alt": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "image": f"https://picsum.photos/seed/{item.get('id')}/800/600",
                            "title": f"{' '.join(query.split()[:3]).title()} Design #{item.get('id')} Page {page} Seed {seed}",  # Create more contextually relevant captions
                            "author": "",
                            "likes": 0,
                            "saves": 0
                        }
                        image_key = formatted_item["id"]
                        if image_key and image_key not in processed_urls:
                            all_results.append(formatted_item)
                            processed_urls.add(image_key)
                    # Always prioritize Picsum since it has no rate limits
                    print(f"Got {len(all_results)} results from Picsum for page {page}")
        except Exception as e:
            print(f"Error fetching from Picsum: {e}")
        
        # Filter results to ensure they match design categories with early exit
        filtered_results = []
        for result in all_results:
            if image_categorization_service.is_valid_design_image(result):
                filtered_results.append(result)
                # Early exit if we have enough results
                if len(filtered_results) >= per_page:
                    break
        
        # Cache the results
        final_results = filtered_results[:per_page] if filtered_results else []
        self.cache[cache_key] = (final_results, time.time())
        
        return final_results
    
    async def close(self):
        """Close the HTTP client"""
        await self.session.aclose()


# Global instance
web_scraping_service = WebScrapingService()