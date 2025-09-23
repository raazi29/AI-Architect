import asyncio
import random
from typing import List, Dict, Any, Tuple
from pexels_service import PexelsService
from unsplash_service import UnsplashService
from pixabay_service import PixabayService
from picsum_service import PicsumService
from openverse_service import OpenverseService
from wikimedia_service import WikimediaService
from rawpixel_service import RawpixelService
from ambientcg_service import AmbientCGService

from database import cache_images, get_cached_images, get_cached_images_multi_provider
from fastapi import HTTPException

class HybridImageService:
    def __init__(self):
        self.pexels = PexelsService()
        self.unsplash = UnsplashService()
        self.pixabay = PixabayService()
        self.picsum = PicsumService()
        self.openverse = OpenverseService()
        self.wikimedia = WikimediaService()
        self.rawpixel = RawpixelService()
        self.ambientcg = AmbientCGService()
        
        # Start with free services first to ensure we always get results
        self.providers = []
        
        # Add paid services first if enabled (they support search better)
        if getattr(self.pexels, "enabled", False):
            self.providers.append(("pexels", self.pexels))
        if getattr(self.unsplash, "enabled", False):
            self.providers.append(("unsplash", self.unsplash))
        if getattr(self.pixabay, "enabled", False):
            self.providers.append(("pixabay", self.pixabay))
        
        # Free services that support search (add these next)
        self.providers.append(("rawpixel", self.rawpixel))
        self.providers.append(("openverse", self.openverse))
        self.providers.append(("wikimedia", self.wikimedia))
        self.providers.append(("ambientcg", self.ambientcg))
        
        # Picsum last (doesn't support search well and may return random images)
        # Only use Picsum if specifically requested or as a last resort
        self.providers.append(("picsum", self.picsum))
        
        # Print debug information about initialized providers
        print("Initialized providers:")
        for name, provider in self.providers:
            enabled_attr = getattr(provider, "enabled", "N/A")
            print(f"  {name}: enabled={enabled_attr}")
        
        # Track last provider used for each query to rotate providers
        self.last_provider_index = {}
        
        # Debug: Print available providers
        print(f"Available providers: {[name for name, _ in self.providers]}")
    
    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> List[Dict[str, Any]]:
        """Search for photos using hybrid approach with caching"""
        print(f"Searching for photos with query: '{query}', page: {page}, per_page: {per_page}")
        
        # First check if we have cached results
        cached_results = await get_cached_images_multi_provider(query, page)
        if cached_results is not None:
            print(f"Returning cached results for query '{query}' page {page}")
            return cached_results
        
        # Get the next provider to use (rotate between providers)
        provider_name, provider = self.get_next_provider(query)
        print(f"Selected provider: {provider_name} for query: '{query}'")
        
        try:
            # Try to fetch from the selected provider
            print(f"Fetching from {provider_name} for query '{query}', page {page}, per_page {per_page}")
            raw_data = await provider.search_photos(query, page, per_page)
            print(f"Raw data from {provider_name}: {type(raw_data)}")
            
            # Handle different response formats
            if isinstance(raw_data, list):
                # Service returned [...] format directly (Picsum, etc.)
                formatted_data = raw_data
            elif isinstance(raw_data, dict) and "results" in raw_data:
                # Service returned {results: [...]} format (Unsplash, Pexels, etc.)
                formatted_data = provider.format_photos_response(raw_data)
            elif isinstance(raw_data, dict) and "foundAssets" in raw_data:
                # AmbientCG format
                formatted_data = provider.format_photos_response(raw_data)
            else:
                # Fallback - treat as results format
                formatted_data = provider.format_photos_response({"results": raw_data})
            
            # If the service returned empty results, try another provider
            if not formatted_data or len(formatted_data) == 0:
                print(f"Provider {provider_name} returned empty results, trying fallback...")
                print(f"Formatted data: {formatted_data}")
                print(f"Raw data: {raw_data}")
                return await self.search_photos_fallback(query, page, per_page, provider_name)
            
            # Cache the results
            await cache_images(provider_name, query, page, formatted_data)
            
            return formatted_data
        except HTTPException as e:
            print(f"HTTPException from {provider_name}: {e}")
            if e.status_code in (401, 403, 429):  # Unauthorized/Forbidden/Rate limited
                # Try another provider
                return await self.search_photos_fallback(query, page, per_page, provider_name)
            else:
                raise e
        except Exception as e:
            print(f"Exception from {provider_name}: {e}")
            # Try another provider
            return await self.search_photos_fallback(query, page, per_page, provider_name)
    
    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> List[Dict[str, Any]]:
        """Get trending photos using hybrid approach with caching"""
        # First check if we have cached results
        cached_results = await get_cached_images_multi_provider("", page, max_age_hours=1)  # 1 hour cache for trending
        if cached_results is not None:
            return cached_results
        
        # Get the next provider to use (rotate between providers)
        provider_name, provider = self.get_next_provider("")
        print(f"Using provider for trending: {provider_name}")
        
        try:
            # Try to fetch from the selected provider
            raw_data = await provider.get_trending_photos(page, per_page)
            print(f"Raw data from {provider_name}: {type(raw_data)}, length: {len(raw_data) if isinstance(raw_data, (list, dict)) else 'N/A'}")
            
            # Handle different response formats
            if isinstance(raw_data, list):
                # Service returned [...] format directly (Picsum, etc.)
                formatted_data = raw_data
            elif isinstance(raw_data, dict) and "results" in raw_data:
                # Service returned {results: [...]} format (Unsplash, Pexels, etc.)
                formatted_data = provider.format_photos_response(raw_data)
            elif isinstance(raw_data, dict) and "foundAssets" in raw_data:
                # AmbientCG format
                formatted_data = provider.format_photos_response(raw_data)
            else:
                # Fallback - treat as results format
                formatted_data = provider.format_photos_response({"results": raw_data})
            
            # If the service returned empty results, try another provider
            if not formatted_data or len(formatted_data) == 0:
                print(f"Provider {provider_name} returned empty results for trending, trying fallback...")
                print(f"Formatted data: {formatted_data}")
                print(f"Raw data: {raw_data}")
                return await self.get_trending_photos_fallback(page, per_page, provider_name)
            
            # Cache the results
            await cache_images(provider_name, "", page, formatted_data)
            
            return formatted_data
        except HTTPException as e:
            if e.status_code in (401, 403, 429):  # Unauthorized/Forbidden/Rate limited
                # Try another provider
                return await self.get_trending_photos_fallback(page, per_page, provider_name)
            else:
                raise e
        except Exception as e:
            # Try another provider
            return await self.get_trending_photos_fallback(page, per_page, provider_name)
    
    def get_next_provider(self, query: str) -> Tuple[str, Any]:
        """Get the next provider to use, prioritizing services that support search queries"""
        key = query or "trending"
        last_index = self.last_provider_index.get(key, -1)
        
        # If we have a specific query, prioritize services that support search
        if query and query.strip():
            # Services that properly support search queries (in order of preference)
            search_capable_providers = [
                ("unsplash", self.unsplash),
                ("pexels", self.pexels),
                ("pixabay", self.pixabay),
                ("rawpixel", self.rawpixel),
                ("openverse", self.openverse),
                ("wikimedia", self.wikimedia),
                ("ambientcg", self.ambientcg),
                ("picsum", self.picsum)  # Last resort but with improved filtering
            ]
            
            # Filter to only enabled providers
            enabled_search_providers = [
                (name, provider) for name, provider in search_capable_providers
                if any(name == p_name for p_name, _ in self.providers)
            ]
            
            # If we have enabled search-capable providers, rotate through them
            if enabled_search_providers:
                # Find the index of the last used provider in our search-capable list
                last_search_index = -1
                if last_index >= 0 and last_index < len(self.providers):
                    last_provider_name = self.providers[last_index][0]
                    for i, (name, _) in enumerate(enabled_search_providers):
                        if name == last_provider_name:
                            last_search_index = i
                            break
                
                next_search_index = (last_search_index + 1) % len(enabled_search_providers)
                self.last_provider_index[key] = next_search_index
                provider_name, provider = enabled_search_providers[next_search_index]
                print(f"Provider selection for query '{query}': provider={provider_name}")
                return provider_name, provider
        
        # For trending or when no query, use the original rotation logic
        next_index = (last_index + 1) % len(self.providers)
        self.last_provider_index[key] = next_index
        provider_name, provider = self.providers[next_index]
        print(f"Provider rotation: key={key}, last_index={last_index}, next_index={next_index}, provider={provider_name}")
        return provider_name, provider
    
    async def search_photos_fallback(
        self,
        query: str,
        page: int,
        per_page: int,
        failed_provider: str
    ) -> List[Dict[str, Any]]:
        """Try other providers when one fails"""
        # Shuffle providers to randomize fallback order
        # Put picsum at the end of the fallback list
        filtered_providers = [p for p in self.providers if p[0] != "picsum"]
        picsum_providers = [p for p in self.providers if p[0] == "picsum"]
        filtered_providers.extend(picsum_providers)
        shuffled_providers = filtered_providers.copy()
        random.shuffle(shuffled_providers[:-1])  # Keep picsum at the end
        
        for provider_name, provider in shuffled_providers:
            if provider_name == failed_provider:
                continue  # Skip the provider that just failed
            
            try:
                raw_data = await provider.search_photos(query, page, per_page)
                
                # Handle different response formats
                if isinstance(raw_data, dict) and "results" in raw_data:
                    formatted_data = provider.format_photos_response(raw_data)
                elif isinstance(raw_data, list):
                    formatted_data = raw_data
                else:
                    formatted_data = provider.format_photos_response({"results": raw_data})
                
                # Cache the results
                await cache_images(provider_name, query, page, formatted_data)
                
                return formatted_data
            except Exception:
                continue  # Try the next provider
        
        # If all providers fail, raise an error
        raise HTTPException(status_code=502, detail="All image providers are temporarily unavailable. Please try again later.")
    
    async def get_trending_photos_fallback(
        self,
        page: int,
        per_page: int,
        failed_provider: str
    ) -> List[Dict[str, Any]]:
        """Try other providers when one fails for trending photos"""
        # Shuffle providers to randomize fallback order
        # Put picsum at the end of the fallback list
        filtered_providers = [p for p in self.providers if p[0] != "picsum"]
        picsum_providers = [p for p in self.providers if p[0] == "picsum"]
        filtered_providers.extend(picsum_providers)
        shuffled_providers = filtered_providers.copy()
        random.shuffle(shuffled_providers[:-1])  # Keep picsum at the end
        
        for provider_name, provider in shuffled_providers:
            if provider_name == failed_provider:
                continue  # Skip the provider that just failed
            
            try:
                raw_data = await provider.get_trending_photos(page, per_page)
                
                # Handle different response formats
                if isinstance(raw_data, dict) and "results" in raw_data:
                    formatted_data = provider.format_photos_response(raw_data)
                elif isinstance(raw_data, list):
                    formatted_data = raw_data
                else:
                    formatted_data = provider.format_photos_response({"results": raw_data})
                
                # Cache the results
                await cache_images(provider_name, "", page, formatted_data)
                
                return formatted_data
            except Exception:
                continue  # Try the next provider
        
        # If all providers fail, raise an error
        raise HTTPException(status_code=502, detail="All image providers are temporarily unavailable. Please try again later.")
    
    async def close(self):
        """Close all provider clients"""
        await self.pexels.close()
        await self.unsplash.close()
        await self.pixabay.close()
        await self.picsum.close()
        await self.openverse.close()
        await self.rawpixel.close()
        await self.ambientcg.close()