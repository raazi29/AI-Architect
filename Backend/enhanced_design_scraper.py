"""
Enhanced Design Scraper Service
Scrapes real design images from Unsplash, Houzz, and other design websites directly
without relying on rate-limited APIs.
"""
import os
import httpx
import asyncio
import random
import time
import json
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import urlencode, urlparse, parse_qs
from bs4 import BeautifulSoup
import re
from fake_useragent import UserAgent

# Import the image categorization service
from image_categorization_service import image_categorization_service

class EnhancedDesignScraper:
    """
    Enhanced scraper that directly scrapes design websites for high-quality images.
    Avoids API rate limits by scraping public web pages.
    """

    def __init__(self):
        # Initialize HTTP client with realistic headers
        self.ua = UserAgent()
        self.session = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers=self._get_random_headers()
        )

        # Rate limiting per domain
        self.rate_limits = {
            "unsplash.com": {"last_request": 0, "min_interval": 2.0},  # 2 seconds between requests
            "houzz.com": {"last_request": 0, "min_interval": 3.0},     # 3 seconds between requests
            "archdigest.com": {"last_request": 0, "min_interval": 3.0}, # 3 seconds
        }

        # Cache for storing requests temporarily
        self.cache = {}
        self.cache_timeout = 600  # 10 minutes cache timeout

        # Supported design websites
        self.supported_sites = {
            "unsplash": {
                "base_url": "https://unsplash.com",
                "search_url": "https://unsplash.com/s/photos/{query}",
                "image_selector": "img[data-test='photo-grid-image']",
                "parser": self._parse_unsplash_page
            },
            "houzz": {
                "base_url": "https://www.houzz.com",
                "search_url": "https://www.houzz.com/photos/query/{query}",
                "image_selector": "img.hz-photo-grid-image",
                "parser": self._parse_houzz_page
            },
            "archdigest": {
                "base_url": "https://www.architecturaldigest.com",
                "search_url": "https://www.architecturaldigest.com/search?q={query}",
                "image_selector": "img.responsive-img",
                "parser": self._parse_archdigest_page
            }
        }

        print("Enhanced Design Scraper initialized with support for:", list(self.supported_sites.keys()))

    def _get_random_headers(self) -> Dict[str, str]:
        """Generate realistic browser headers to avoid blocking"""
        return {
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        }

    def _get_cache_key(self, site: str, query: str, page: int, per_page: int) -> str:
        """Generate a cache key for the request"""
        return f"{site}:{query}:{page}:{per_page}"

    def _is_cache_valid(self, timestamp: float) -> bool:
        """Check if cache entry is still valid"""
        return (time.time() - timestamp) < self.cache_timeout

    async def _rate_limit(self, domain: str):
        """Implement rate limiting per domain"""
        if domain in self.rate_limits:
            limiter = self.rate_limits[domain]
            elapsed = time.time() - limiter["last_request"]
            if elapsed < limiter["min_interval"]:
                wait_time = limiter["min_interval"] - elapsed
                await asyncio.sleep(wait_time)
            limiter["last_request"] = time.time()

    async def search_design_images(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
        sites: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for design images across multiple websites concurrently
        """
        print(f"Searching design images with query: '{query}', page: {page}, per_page: {per_page}")

        # Use all sites if none specified
        if sites is None:
            sites = list(self.supported_sites.keys())

        # Check cache first
        cache_key = f"multi_site:{query}:{page}:{per_page}:{','.join(sorted(sites))}"
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if self._is_cache_valid(timestamp):
                print(f"Returning cached multi-site results for query: {query}")
                return cached_result

        # Search all sites concurrently
        tasks = []
        for site in sites:
            if site in self.supported_sites:
                tasks.append(self._search_single_site(site, query, page, per_page))

        # Execute all searches concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Combine and filter results
        all_images = []
        processed_urls = set()

        for result in results:
            if isinstance(result, list):
                for img in result:
                    img_url = img.get("image", "")
                    if img_url and img_url not in processed_urls:
                        # Validate it's a design image
                        if image_categorization_service.is_valid_design_image(img):
                            all_images.append(img)
                            processed_urls.add(img_url)

        # Sort by relevance (prioritize images with query terms in title/alt)
        query_lower = query.lower()
        all_images.sort(key=lambda x: (
            query_lower in (x.get("title", "").lower() + x.get("alt", "").lower()),
            x.get("likes", 0) or 0
        ), reverse=True)

        # Return requested page
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        final_results = all_images[start_idx:end_idx]

        # Cache the results
        self.cache[cache_key] = (final_results, time.time())

        print(f"Found {len(all_images)} total images, returning {len(final_results)} for page {page}")
        return final_results

    async def _search_single_site(
        self,
        site: str,
        query: str,
        page: int,
        per_page: int
    ) -> List[Dict[str, Any]]:
        """Search a single website for design images"""
        site_config = self.supported_sites.get(site)
        if not site_config:
            return []

        # Check site-specific cache
        cache_key = self._get_cache_key(site, query, page, per_page)
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if self._is_cache_valid(timestamp):
                print(f"Returning cached results for {site}: {query}")
                return cached_result

        try:
            # Apply rate limiting
            domain = urlparse(site_config["base_url"]).netloc
            await self._rate_limit(domain)

            # Build search URL
            search_url = site_config["search_url"].format(query=query.replace(" ", "-"))

            # Add pagination if supported
            if page > 1:
                if "unsplash.com" in domain:
                    search_url += f"?page={page}"
                elif "houzz.com" in domain:
                    search_url += f"?pg={page}"
                elif "archdigest.com" in domain:
                    search_url += f"&page={page}"

            print(f"Scraping {site}: {search_url}")

            # Fetch the page with timeout and retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = await self.session.get(
                        search_url,
                        headers=self._get_random_headers(),
                        timeout=15.0
                    )
                    
                    if response.status_code == 403:
                        print(f"{site} returned 403 Forbidden, site may be blocking requests")
                        if attempt < max_retries - 1:
                            wait_time = 5 * (attempt + 1)  # Exponential backoff
                            print(f"Waiting {wait_time}s before retry...")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            return []
                    elif response.status_code != 200:
                        print(f"Failed to fetch {site}: HTTP {response.status_code}")
                        return []
                    
                    break  # Success, exit retry loop
                    
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"Request failed (attempt {attempt + 1}), retrying: {e}")
                        await asyncio.sleep(2)
                        continue
                    else:
                        raise e

            # Parse the page using site-specific parser
            images = await site_config["parser"](response.text, query, page, per_page)

            # Cache the results
            self.cache[cache_key] = (images, time.time())

            return images

        except Exception as e:
            print(f"Error scraping {site}: {e}")
            return []

    async def _parse_unsplash_page(
        self,
        html: str,
        query: str,
        page: int,
        per_page: int
    ) -> List[Dict[str, Any]]:
        """Parse Unsplash search results page"""
        soup = BeautifulSoup(html, 'html.parser')
        images = []

        # Check if we got a blocked page
        if "403" in html or "blocked" in html.lower() or "cloudflare" in html.lower():
            print("Unsplash returned blocked page, skipping...")
            return []

        # Find image containers - Unsplash has multiple selectors
        img_selectors = [
            "img[data-test='photo-grid-image']",
            "img[data-testid='photo-grid-image']",
            "figure img",
            ".photo-grid img"
        ]

        for selector in img_selectors:
            img_elements = soup.select(selector)
            if img_elements:
                break

        if not img_elements:
            # Try a broader search
            img_elements = soup.find_all('img', {'src': lambda x: x and ('images.unsplash.com' in x or 'unsplash' in x)})

        for img in img_elements[:per_page * 2]:  # Get extra for filtering
            img_url = img.get('src', '')
            if not img_url:
                continue

            # Skip small/thumbnail images
            if 'w=32' in img_url or 'h=32' in img_url or 'thumb' in img_url:
                continue

            # Get full resolution URL
            if 'w=' in img_url and '&' in img_url:
                # Replace width parameter for higher quality
                img_url = re.sub(r'w=\d+', 'w=800', img_url)

            # Get image metadata from data attributes or alt text
            alt_text = img.get('alt', '')
            title = alt_text if alt_text else f"{query.title()} Design"

            # Extract photographer info if available
            photographer = ""
            try:
                # Look for photographer link or credit
                photo_link = img.find_parent('a') if img.find_parent('a') else img.find_parent('figure')
                if photo_link:
                    credit = photo_link.find('span', class_=re.compile(r'credit'))
                    if credit:
                        photographer = credit.get_text(strip=True)
            except:
                pass

            # Create formatted image object
            formatted_img = {
                "id": f"unsplash_{hash(img_url) % 1000000}_{page}",
                "width": 800,
                "height": 600,
                "url": img.get('data-permalink', img_url),
                "photographer": photographer or "",
                "photographer_url": "",
                "photographer_id": 0,
                "avg_color": "#ffffff",
                "src": {
                    "original": img_url.replace('w=800', 'w=1200'),
                    "large2x": img_url.replace('w=800', 'w=1000'),
                    "large": img_url.replace('w=800', 'w=800'),
                    "medium": img_url.replace('w=800', 'w=600'),
                    "small": img_url.replace('w=800', 'w=400'),
                    "portrait": img_url.replace('w=800', 'w=600'),
                    "landscape": img_url.replace('w=800', 'w=800'),
                    "tiny": img_url.replace('w=800', 'w=200')
                },
                "alt": alt_text,
                "image": img_url,
                "title": title,
                "author": photographer or "",
                "likes": 0,
                "saves": 0
            }
            images.append(formatted_img)

        print(f"Parsed {len(images)} images from Unsplash")
        return images

    async def _parse_houzz_page(
        self,
        html: str,
        query: str,
        page: int,
        per_page: int
    ) -> List[Dict[str, Any]]:
        """Parse Houzz search results page"""
        soup = BeautifulSoup(html, 'html.parser')
        images = []

        # Check if we got a blocked page
        if "403" in html or "blocked" in html.lower() or "access denied" in html.lower():
            print("Houzz returned blocked page, skipping...")
            return []

        # Find image containers (Houzz uses multiple selectors)
        img_selectors = [
            "img.hz-photo",
            "img.hz-photo-grid-image",
            ".photo-item img",
            ".gallery-item img"
        ]

        img_elements = []
        for selector in img_selectors:
            elements = soup.select(selector)
            if elements:
                img_elements.extend(elements)

        # Also try broader search
        if not img_elements:
            img_elements = soup.find_all('img', {'src': lambda x: x and ('houzz' in x.lower() or 'hzcdn' in x.lower())})

        print(f"Found {len(img_elements)} potential images on Houzz page")

        for img in img_elements[:per_page * 2]:
            img_url = img.get('src', '')
            if not img_url or 'data:image' in img_url or 'placeholder' in img_url.lower():
                # Try data-src for lazy loading
                img_url = img.get('data-src', img.get('data-lazy-src', ''))
                if not img_url or 'data:image' in img_url or 'placeholder' in img_url.lower():
                    continue

            # Clean up URL
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
            elif not img_url.startswith('http'):
                continue  # Skip relative URLs that aren't images

            # Skip very small images
            if '32x32' in img_url or 'w=32' in img_url:
                continue

            alt_text = img.get('alt', '')
            title = alt_text if alt_text else f"{query.title()} Design by Houzz"

            formatted_img = {
                "id": f"houzz_{hash(img_url) % 1000000}_{page}",
                "width": 800,
                "height": 600,
                "url": img_url,
                "photographer": "Houzz",
                "photographer_url": "",
                "photographer_id": 0,
                "avg_color": "#ffffff",
                "src": {
                    "original": img_url,
                    "large2x": img_url,
                    "large": img_url,
                    "medium": img_url,
                    "small": img_url,
                    "portrait": img_url,
                    "landscape": img_url,
                    "tiny": img_url
                },
                "alt": alt_text,
                "image": img_url,
                "title": title,
                "author": "Houzz",
                "likes": 0,
                "saves": 0
            }
            images.append(formatted_img)

        print(f"Parsed {len(images)} images from Houzz")
        return images

    async def _parse_archdigest_page(
        self,
        html: str,
        query: str,
        page: int,
        per_page: int
    ) -> List[Dict[str, Any]]:
        """Parse Architectural Digest search results page"""
        soup = BeautifulSoup(html, 'html.parser')
        images = []

        # Find article images
        img_elements = soup.find_all('img', class_=re.compile(r'responsive-img'))

        for img in img_elements[:per_page * 2]:
            img_url = img.get('data-src', img.get('src', ''))
            if not img_url or 'data:image' in img_url:
                continue

            if img_url.startswith('//'):
                img_url = 'https:' + img_url

            alt_text = img.get('alt', '')
            title = alt_text if alt_text else f"{query.title()} Design - Architectural Digest"

            formatted_img = {
                "id": f"archdigest_{hash(img_url) % 1000000}_{page}",
                "width": 800,
                "height": 600,
                "url": img_url,
                "photographer": "Architectural Digest",
                "photographer_url": "",
                "photographer_id": 0,
                "avg_color": "#ffffff",
                "src": {
                    "original": img_url,
                    "large2x": img_url,
                    "large": img_url,
                    "medium": img_url,
                    "small": img_url,
                    "portrait": img_url,
                    "landscape": img_url,
                    "tiny": img_url
                },
                "alt": alt_text,
                "image": img_url,
                "title": title,
                "author": "Architectural Digest",
                "likes": 0,
                "saves": 0
            }
            images.append(formatted_img)

        return images

    async def get_trending_designs(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> List[Dict[str, Any]]:
        """Get trending/popular design images"""
        # Use popular design search terms
        trending_queries = [
            "modern interior design",
            "minimalist home",
            "scandinavian style",
            "luxury bedroom",
            "modern kitchen",
            "contemporary living room"
        ]

        # Search with multiple queries concurrently
        tasks = []
        for query in trending_queries:
            tasks.append(self.search_design_images(query, 1, per_page // len(trending_queries)))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Combine and deduplicate
        all_images = []
        seen_urls = set()

        for result in results:
            if isinstance(result, list):
                for img in result:
                    img_url = img.get("image", "")
                    if img_url and img_url not in seen_urls:
                        all_images.append(img)
                        seen_urls.add(img_url)

        # Shuffle for variety and return page
        random.shuffle(all_images)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        return all_images[start_idx:end_idx]

    async def close(self):
        """Close the HTTP session"""
        await self.session.aclose()

# Global instance
enhanced_design_scraper = EnhancedDesignScraper()
