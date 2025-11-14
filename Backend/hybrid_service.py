import asyncio
import random
from typing import List, Dict, Any, Tuple
from pexels_service import PexelsService
from unsplash_service import UnsplashService
from pixabay_service import PixabayService
from picsum_service import PicsumService
from openverse_service_fixed import OpenverseService
from wikimedia_service import WikimediaService
from rawpixel_service import RawpixelService
from ambientcg_service import AmbientCGService
from web_scraping_service import web_scraping_service

# Import the image categorization service
from image_categorization_service import image_categorization_service

# Import the new enhanced design scraper
from enhanced_design_scraper import enhanced_design_scraper

# Import the unlimited design service
from unlimited_design_service import unlimited_design_service

# Import direct scrapers (no API keys needed)
from pexels_direct_scraper import pexels_direct_scraper
from pixabay_direct_scraper import pixabay_direct_scraper

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
        self.web_scraping = web_scraping_service  # Old web scraping service (kept as fallback)
        self.enhanced_scraper = enhanced_design_scraper  # Enhanced design scraper
        self.unlimited_service = unlimited_design_service  # Unlimited design service (ALWAYS WORKS)
        self.pexels_direct = pexels_direct_scraper  # Pexels direct scraper (no API key)
        self.pixabay_direct = pixabay_direct_scraper  # Pixabay direct scraper (no API key)
        
        # Start with direct scrapers (no API limits), then unlimited service as guaranteed fallback
        self.providers = []
        
        # PRIORITY 1: Direct scrapers (PRIMARY - real photos, no API keys, high quality)
        self.providers.append(("pexels_direct", self.pexels_direct))
        self.providers.append(("pixabay_direct", self.pixabay_direct))
        
        # PRIORITY 2: Enhanced design scraper (SECONDARY - design-specific websites)
        self.providers.append(("enhanced_scraper", self.enhanced_scraper))
        
        # PRIORITY 3: Old web scraping service (THIRD - aggregated)
        self.providers.append(("web_scraping", self.web_scraping))
        
        # PRIORITY 4: Unlimited service (GUARANTEED FALLBACK - ALWAYS WORKS)
        self.providers.append(("unlimited", self.unlimited_service))
        
        # PRIORITY 3: Free services that support search (THIRD)
        self.providers.append(("rawpixel", self.rawpixel))
        self.providers.append(("openverse", self.openverse))
        self.providers.append(("wikimedia", self.wikimedia))
        self.providers.append(("ambientcg", self.ambientcg))
        
        # PRIORITY 4: API services (FOURTH - only if enabled, subject to rate limits)
        if getattr(self.pexels, "enabled", False):
            self.providers.append(("pexels", self.pexels))
        if getattr(self.unsplash, "enabled", False):
            self.providers.append(("unsplash", self.unsplash))
        if getattr(self.pixabay, "enabled", False):
            self.providers.append(("pixabay", self.pixabay))
        
        # PRIORITY 5: Picsum (LAST RESORT - fast but uses placeholder images with architecture titles)
        self.providers.append(("picsum", self.picsum))
        
        # Print debug information about initialized providers
        print("Initialized providers:")
        for name, provider in self.providers:
            enabled_attr = getattr(provider, "enabled", "N/A") if hasattr(provider, "enabled") else "N/A"
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
            
            # Handle different service interfaces
            if provider_name == "unlimited":
                raw_data = await provider.search_images(query, page, per_page)
            elif provider_name == "enhanced_scraper":
                raw_data = await provider.search_design_images(query, page, per_page)
            elif provider_name == "web_scraping":
                raw_data = await provider.search_all_sources(query, page, per_page)
            elif provider_name in ["pexels_direct", "pixabay_direct"]:
                # Direct scrapers use standard search_photos interface
                raw_data = await provider.search_photos(query, page, per_page)
            else:
                raw_data = await provider.search_photos(query, page, per_page)
            
            print(f"Raw data from {provider_name}: {type(raw_data)}")
            
            # Handle different response formats
            if isinstance(raw_data, list):
                # Service returned [...] format directly (Picsum, web_scraping, etc.)
                formatted_data = raw_data
            elif provider_name == "web_scraping":
                # Web scraping service already returns properly formatted data
                formatted_data = raw_data if isinstance(raw_data, list) else []
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
            
            # Ensure formatted_data is a list before returning
            if not isinstance(formatted_data, list):
                print(f"Provider {provider_name} returned non-list data: {type(formatted_data)}")
                formatted_data = []  # Fallback to empty list if not a list
            
            # Filter results to only include valid design images and enhance metadata with early exit
            filtered_data = []
            target_count = per_page * 2  # Get extra to compensate for filtering
            for result in formatted_data:
                if image_categorization_service.is_valid_design_image(result):
                    # Enhance the metadata of the image
                    enhanced_result = image_categorization_service.enhance_image_metadata(result)
                    filtered_data.append(enhanced_result)
                    # Early exit if we have enough results
                    if len(filtered_data) >= target_count:
                        break
            
            # Cache the results
            await cache_images(provider_name, query, page, filtered_data)
            
            return filtered_data[:per_page]  # Return only requested amount
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

    async def search_photos_aggregated(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
        max_pages: int = 5  # Increase max_pages to ensure we have enough results
    ) -> List[Dict[str, Any]]:
        """Search for photos from multiple providers and aggregate results to support unlimited scrolling"""
        print(f"Aggregating photos with query: '{query}', page: {page}, per_page: {per_page}, max_pages: {max_pages}")
        
        all_results = []
        processed_urls = set()  # To avoid duplicates
        
        # FAST PATH: Use Picsum immediately to provide instant results while other providers load
        # This ensures the feed never shows "No designs found"
        picsum_provider = None
        for provider_name, provider in self.providers:
            if provider_name == "picsum":
                picsum_provider = (provider_name, provider)
                break
        
        if picsum_provider and page == 1:
            # On first page, immediately get Picsum results for instant display
            try:
                provider_name, provider = picsum_provider
                print(f"Fast path: Getting instant results from {provider_name}")
                raw_data = await provider.search_photos(query, 1, per_page)
                formatted_data = raw_data if isinstance(raw_data, list) else provider.format_photos_response({"results": raw_data})
                
                if formatted_data and isinstance(formatted_data, list):
                    for item in formatted_data[:per_page]:  # Limit to requested amount
                        if item and isinstance(item, dict):
                            item_id = item.get("id") or item.get("image") or item.get("url") or ""
                            if item_id and item_id not in processed_urls:
                                all_results.append(item)
                                processed_urls.add(item_id)
                    print(f"Fast path: Got {len(all_results)} instant results from Picsum")
            except Exception as e:
                print(f"Fast path Picsum failed: {e}")
        
        # Always prioritize enhanced scraper as it's faster and avoids rate limits
        enhanced_scraper_provider = None
        web_scraping_provider = None
        other_providers = []
        
        for provider_name, provider in self.providers:
            if provider_name == "enhanced_scraper":
                enhanced_scraper_provider = (provider_name, provider)
            elif provider_name == "web_scraping":
                web_scraping_provider = (provider_name, provider)
            elif provider_name == "picsum":
                picsum_provider = (provider_name, provider)
            else:
                other_providers.append((provider_name, provider))
        
        # Try other architecture-specific providers first before Picsum
        # Picsum is kept as last resort for fast loading
        
        # Then try other rate-limited providers only if we still need more results
        for provider_name, provider in other_providers:
            if len(all_results) >= per_page * page:
                break  # Stop if we have enough results
                
            try:
                for page_num in range(1, min(max_pages, 2) if len(all_results) > 0 else max_pages + 1):  # Limit API calls when we already have some results
                    if len(all_results) >= per_page * page:
                        break  # Stop if we have enough results
                        
                    print(f"Fetching from {provider_name}, page {page_num}")
                    # Handle different service interfaces
                    if provider_name == "unlimited":
                        raw_data = await provider.search_images(query, page_num, per_page)
                    elif provider_name == "enhanced_scraper":
                        raw_data = await provider.search_design_images(query, page_num, per_page)
                    elif provider_name == "web_scraping":
                        raw_data = await provider.search_all_sources(query, page_num, per_page)
                    else:
                        raw_data = await provider.search_photos(query, page_num, per_page)
                    
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
                    
                    # Ensure formatted_data is a list before processing
                    if not isinstance(formatted_data, list):
                        print(f"Provider {provider_name} returned non-list data: {type(formatted_data)} for page {page_num}")
                        formatted_data = []  # Fallback to empty list if not a list
                    
                    if formatted_data:
                        # Filter out duplicates based on item ID and ensure valid design images
                        for item in formatted_data:
                            image_url = item.get("image", "")
                            # Use the unique ID as primary key, fallback to URL
                            item_id = item.get("id", image_url)  # Use ID if available, else URL
                            if item_id and item_id not in processed_urls:
                                # Only add if it's a valid design image
                                if image_categorization_service.is_valid_design_image(item):
                                    # Enhance the metadata of the image
                                    enhanced_item = image_categorization_service.enhance_image_metadata(item)
                                    all_results.append(enhanced_item)
                                    processed_urls.add(item_id)  # Store the item_id to prevent duplicates
                                
                    # Early exit if we have enough results
                    if len(all_results) >= per_page * page:
                        break
                        
            except Exception as e:
                print(f"Error fetching from {provider_name}: {e}")
                continue  # Continue with other providers
        
        # Picsum disabled - only return architecture-specific results from other providers
        print(f"Total architecture-specific results collected: {len(all_results)}")
        
        # Return the slice for the requested page
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_results = all_results[start_idx:end_idx] if all_results else []
        
        # If we don't have any results for this page, use unlimited design service as guaranteed fallback
        if not paginated_results:
            try:
                print(f"No aggregated results, using unlimited design service as guaranteed fallback")
                fallback_results = await self.unlimited_service.search_images(query, page, per_page)
                if fallback_results:
                    # Cache the fallback results
                    await cache_images("unlimited_fallback", f"{query}_fallback", page, fallback_results)
                    return fallback_results
            except Exception as e:
                print(f"Unlimited design service fallback failed: {e}")
                # Last resort: return empty array to avoid breaking the frontend
                return []
        
        # Cache the results with a special key for aggregated results
        await cache_images("aggregated", f"{query}_aggregated", page, paginated_results)
        
        print(f"Returning {len(paginated_results)} results for page {page}")
        return paginated_results
    
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
            
            # Filter results to only include valid design images
            filtered_data = []
            for result in formatted_data:
                if image_categorization_service.is_valid_design_image(result):
                    filtered_data.append(result)
            
            # Cache the results
            await cache_images(provider_name, "", page, filtered_data)
            
            return filtered_data
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
        # Prioritize unlimited service, then shuffle others, keep Picsum at the end
        unlimited_providers = [p for p in self.providers if p[0] == "unlimited" and p[0] != failed_provider]
        non_picsum_providers = [p for p in self.providers if p[0] != "picsum" and p[0] != "unlimited" and p[0] != failed_provider]
        picsum_providers = [p for p in self.providers if p[0] == "picsum"]
        
        # Build fallback order: unlimited first, then randomized others, then picsum
        shuffled_providers = unlimited_providers.copy()  # Start with unlimited (most reliable)
        other_providers = non_picsum_providers.copy()
        random.shuffle(other_providers)  # Randomize other providers
        shuffled_providers.extend(other_providers)
        shuffled_providers.extend(picsum_providers)  # Add Picsum at the end as last resort
        
        for provider_name, provider in shuffled_providers:
            if provider_name == failed_provider:
                continue  # Skip the provider that just failed
            
            try:
                # Handle different service interfaces
                if provider_name == "unlimited":
                    raw_data = await provider.search_images(query, page, per_page)
                elif provider_name == "enhanced_scraper":
                    raw_data = await provider.search_design_images(query, page, per_page)
                elif provider_name == "web_scraping":
                    raw_data = await provider.search_all_sources(query, page, per_page)
                else:
                    raw_data = await provider.search_photos(query, page, per_page)
                    
                    # Handle different response formats
                    if isinstance(raw_data, dict) and "results" in raw_data:
                        formatted_data = provider.format_photos_response(raw_data)
                    elif isinstance(raw_data, list):
                        formatted_data = raw_data
                    else:
                        formatted_data = provider.format_photos_response({"results": raw_data})
                
                # Filter results to only include valid design images and enhance metadata with early exit
                filtered_data = []
                target_count = per_page * 2  # Get extra to compensate for filtering
                for result in formatted_data:
                    if image_categorization_service.is_valid_design_image(result):
                        # Enhance the metadata of the image
                        enhanced_result = image_categorization_service.enhance_image_metadata(result)
                        filtered_data.append(enhanced_result)
                        # Early exit if we have enough results
                        if len(filtered_data) >= target_count:
                            break
                
                # Cache the results
                await cache_images(provider_name, query, page, filtered_data)
                
                return filtered_data[:per_page]  # Return only requested amount
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
        # Shuffle providers to randomize fallback order, but keep Picsum at the end
        non_picsum_providers = [p for p in self.providers if p[0] != "picsum" and p[0] != failed_provider]
        picsum_providers = [p for p in self.providers if p[0] == "picsum"]
        
        shuffled_providers = non_picsum_providers.copy()
        random.shuffle(shuffled_providers)  # Randomize non-Picsum providers
        shuffled_providers.extend(picsum_providers)  # Add Picsum at the end as last resort
        
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
                
                # Filter results to only include valid design images and enhance metadata
                filtered_data = []
                for result in formatted_data:
                    if image_categorization_service.is_valid_design_image(result):
                        # Enhance the metadata of the image
                        enhanced_result = image_categorization_service.enhance_image_metadata(result)
                        filtered_data.append(enhanced_result)
                
                # Cache the results
                await cache_images(provider_name, "", page, filtered_data)
                
                return filtered_data
            except Exception:
                continue  # Try the next provider
        
        # If all providers fail, raise an error
        raise HTTPException(status_code=502, detail="All image providers are temporarily unavailable. Please try again later.")
    
    async def cache_next_pages(self, query: str, current_page: int, per_page: int, num_pages_to_cache: int = 3):
        """Cache the next few pages in the background to improve loading performance"""
        print(f"Caching {num_pages_to_cache} additional pages for query: {query}, starting from page {current_page + 1}")
        
        import asyncio
        from database import cache_images_batch
        
        # Prepare cache entries for the next few pages
        cache_batches = []
        
        for page_offset in range(1, num_pages_to_cache + 1):
            page_num = current_page + page_offset
            try:
                # Prioritize fast providers (web scraping, Picsum) first to avoid rate limits
                fast_providers = []
                rate_limited_providers = []
                
                for provider_name, provider in self.providers:
                    if provider_name == "web_scraping":
                        fast_providers.insert(0, (provider_name, provider))  # Priority
                    elif provider_name == "picsum":
                        fast_providers.append((provider_name, provider))  # Fast, no rate limits
                    else:
                        rate_limited_providers.append((provider_name, provider))
                
                # Try fast providers first
                for provider_name, provider in fast_providers:
                    try:
                        if provider_name == "web_scraping":
                            # For web scraping, just get data since it aggregates from multiple sources
                            try:
                                raw_data = await provider.search_all_sources(query, page_num, per_page)
                                # Web scraping service already returns properly formatted data
                                if isinstance(raw_data, list):
                                    formatted_data = raw_data
                                else:
                                    formatted_data = []
                            except Exception as e:
                                print(f"Error in web scraping service cache prefetch: {e}")
                                formatted_data = []
                        elif provider_name == "picsum":
                            # Get Picsum results for the specific page
                            raw_data = await provider.search_photos(query, page_num, per_page)
                            if isinstance(raw_data, list):
                                formatted_data = raw_data
                            else:
                                formatted_data = provider.format_photos_response({"results": raw_data})
                        else:
                            raw_data = await provider.search_photos(query, page_num, per_page)
                            
                            # Handle different response formats
                            if isinstance(raw_data, list):
                                formatted_data = raw_data
                            elif isinstance(raw_data, dict) and "results" in raw_data:
                                formatted_data = provider.format_photos_response(raw_data)
                            elif isinstance(raw_data, dict) and "foundAssets" in raw_data:
                                formatted_data = provider.format_photos_response(raw_data)
                            else:
                                formatted_data = provider.format_photos_response({"results": raw_data})
                        
                        if formatted_data:
                            # Filter results to only include valid design images
                            filtered_data = []
                            for result in formatted_data:
                                if image_categorization_service.is_valid_design_image(result):
                                    filtered_data.append(result)
                            
                            cache_entry = {
                                "provider": provider_name,
                                "query": f"{query}_prefetch",
                                "page": page_num,
                                "data": filtered_data
                            }
                            cache_batches.append(cache_entry)
                            break  # Move to next page after first successful provider
                            
                    except Exception as e:
                        print(f"Error prefetching page {page_num} from {provider_name}: {e}")
                        continue  # Try next provider
                
                # Only try rate-limited providers if fast providers didn't work
                if not cache_batches or len([cb for cb in cache_batches if cb["page"] == page_num]) == 0:
                    for provider_name, provider in rate_limited_providers:
                        try:
                            raw_data = await provider.search_photos(query, page_num, per_page)
                            
                            # Handle different response formats
                            if isinstance(raw_data, list):
                                formatted_data = raw_data
                            elif isinstance(raw_data, dict) and "results" in raw_data:
                                formatted_data = provider.format_photos_response(raw_data)
                            elif isinstance(raw_data, dict) and "foundAssets" in raw_data:
                                formatted_data = provider.format_photos_response(raw_data)
                            else:
                                formatted_data = provider.format_photos_response({"results": raw_data})
                            
                            if formatted_data:
                                # Filter results to only include valid design images
                                filtered_data = []
                                for result in formatted_data:
                                    if image_categorization_service.is_valid_design_image(result):
                                        filtered_data.append(result)
                                
                                cache_entry = {
                                    "provider": provider_name,
                                    "query": f"{query}_prefetch",
                                    "page": page_num,
                                    "data": filtered_data
                                }
                                cache_batches.append(cache_entry)
                                break  # Move to next page after first successful provider
                                
                        except Exception as e:
                            print(f"Error prefetching page {page_num} from {provider_name}: {e}")
                            continue  # Try next provider
                        
            except Exception as e:
                print(f"Error in prefetching loop: {e}")
                continue
        
        # Cache all collected batches
        if cache_batches:
            await cache_images_batch(cache_batches)
            print(f"Cached {len(cache_batches)} pages for query: {query}")

    async def get_extended_cached_results(self, query: str, start_page: int, end_page: int, per_page: int) -> List[Dict[str, Any]]:
        """Get cached results across multiple pages to support unlimited scrolling"""
        from database import get_cached_images_multi_provider_extended
        import json
        
        # Get cached results for the page range
        cached_results = await get_cached_images_multi_provider_extended(query, (start_page, end_page))
        
        # Combine all results in order
        all_results = []
        processed_urls = set()  # To avoid duplicates
        
        for page_num in range(start_page, end_page + 1):
            if page_num in cached_results and cached_results[page_num]:
                for item in cached_results[page_num]:
                    image_url = item.get("image", "")
                    # Use the unique ID as primary key, fallback to URL
                    item_id = item.get("id", image_url)  # Use ID if available, else URL
                    if item_id and item_id not in processed_urls:
                        # Only add if it's a valid design image
                        if image_categorization_service.is_valid_design_image(item):
                            all_results.append(item)
                            processed_urls.add(item_id)  # Store the item_id to prevent duplicates
        
        # Return results for the requested range
        start_idx = (start_page - 1) * per_page
        end_idx = start_idx + (end_page - start_page + 1) * per_page
        return all_results[start_idx:end_idx]

    async def close(self):
        """Close all provider clients"""
        await self.pexels.close()
        await self.unsplash.close()
        await self.pixabay.close()
        await self.picsum.close()
        await self.openverse.close()
        await self.rawpixel.close()
        await self.ambientcg.close()