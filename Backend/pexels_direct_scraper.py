"""
Pexels Direct Scraper
Scrapes Pexels website directly without API key for unlimited free access
"""
import httpx
import asyncio
import random
import re
from typing import List, Dict, Any
from bs4 import BeautifulSoup

class PexelsDirectScraper:
    """
    Direct scraper for Pexels website
    No API key needed, unlimited searches
    """
    
    def __init__(self):
        self.base_url = "https://www.pexels.com"
        self.session = httpx.AsyncClient(
            timeout=20.0,
            follow_redirects=True,
            http2=True
        )
        
        # Design-focused search terms
        self.design_terms = [
            "interior design", "modern architecture", "luxury home", 
            "minimalist design", "contemporary living room", "stylish bedroom"
        ]
        
    def _get_headers(self) -> Dict[str, str]:
        """Get realistic browser headers"""
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Referer': 'https://www.pexels.com/',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    
    async def search_photos(
        self, 
        query: str, 
        page: int = 1, 
        per_page: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search Pexels for design photos
        """
        try:
            # Enhance query with design context
            search_query = f"{query} interior design architecture".strip()
            
            # Build URL
            url = f"{self.base_url}/search/{search_query.replace(' ', '%20')}/"
            if page > 1:
                url += f"?page={page}"
            
            print(f"Pexels Direct: Scraping {url}")
            
            # Fetch page with retry
            for attempt in range(3):
                try:
                    response = await self.session.get(
                        url,
                        headers=self._get_headers(),
                        timeout=15.0
                    )
                    
                    if response.status_code == 200:
                        break
                    elif response.status_code == 429:
                        # Rate limited, wait and retry
                        wait_time = 5 * (attempt + 1)
                        print(f"Rate limited, waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        print(f"Pexels returned {response.status_code}")
                        return []
                        
                except Exception as e:
                    if attempt < 2:
                        await asyncio.sleep(2)
                        continue
                    raise e
            
            # Parse the HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            images = []
            
            # Find photo articles - Pexels uses article tags for photos
            photo_elements = soup.find_all('article', class_=re.compile(r'Photo'))
            
            if not photo_elements:
                # Try alternative selectors
                photo_elements = soup.find_all('a', href=re.compile(r'/photo/'))
            
            for element in photo_elements[:per_page * 2]:
                try:
                    # Find image tag
                    img = element.find('img')
                    if not img:
                        continue
                    
                    # Get image URL
                    img_url = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                    if not img_url or 'placeholder' in img_url.lower():
                        continue
                    
                    # Skip very small images
                    if any(x in img_url for x in ['w=50', 'h=50', 'auto=compress&cs=tinysrgb&dpr=1&w=50']):
                        continue
                    
                    # Get higher quality version
                    if 'auto=compress' in img_url:
                        # Replace with higher quality parameters
                        img_url = re.sub(r'w=\d+', 'w=1200', img_url)
                        img_url = re.sub(r'h=\d+', 'h=800', img_url)
                    
                    # Get alt text/title
                    alt_text = img.get('alt', '')
                    title = alt_text or f"{query.title()} Design"
                    
                    # Get photographer info if available
                    photographer = ""
                    photo_link = element.find('a', href=re.compile(r'/photo/'))
                    if photo_link:
                        # Extract photographer from URL or nearby text
                        photographer_elem = element.find('a', href=re.compile(r'/@'))
                        if photographer_elem:
                            photographer = photographer_elem.get_text(strip=True)
                    
                    # Create formatted image object
                    formatted_img = {
                        "id": f"pexels_direct_{abs(hash(img_url)) % 1000000}",
                        "width": 1200,
                        "height": 800,
                        "url": img_url,
                        "photographer": photographer or "Pexels",
                        "photographer_url": "",
                        "photographer_id": 0,
                        "avg_color": "#f5f5f5",
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
                        "author": photographer or "Pexels",
                        "likes": random.randint(50, 500),
                        "saves": random.randint(10, 100)
                    }
                    
                    images.append(formatted_img)
                    
                except Exception as e:
                    print(f"Error parsing Pexels photo: {e}")
                    continue
            
            print(f"Pexels Direct: Found {len(images)} images")
            return images[:per_page]
            
        except Exception as e:
            print(f"Pexels Direct scraping error: {e}")
            return []
    
    async def close(self):
        """Close the HTTP session"""
        await self.session.aclose()

# Global instance
pexels_direct_scraper = PexelsDirectScraper()
