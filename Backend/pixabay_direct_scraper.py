"""
Pixabay Direct Scraper
Scrapes Pixabay website directly without API key
"""
import httpx
import asyncio
import random
import re
import json
from typing import List, Dict, Any
from bs4 import BeautifulSoup

class PixabayDirectScraper:
    """
    Direct scraper for Pixabay website
    No API key needed
    """
    
    def __init__(self):
        self.base_url = "https://pixabay.com"
        self.session = httpx.AsyncClient(
            timeout=20.0,
            follow_redirects=True,
            http2=True
        )
        
    def _get_headers(self) -> Dict[str, str]:
        """Get realistic browser headers"""
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Referer': 'https://pixabay.com/',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
        }
    
    async def search_photos(
        self, 
        query: str, 
        page: int = 1, 
        per_page: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search Pixabay for design photos
        """
        try:
            # Enhance query
            search_query = f"{query} interior design".strip()
            
            # Build URL
            url = f"{self.base_url}/images/search/{search_query.replace(' ', '%20')}/"
            params = {
                'pagi': page,
                'order': 'popular'
            }
            
            print(f"Pixabay Direct: Scraping {url}")
            
            # Fetch page
            response = await self.session.get(
                url,
                params=params,
                headers=self._get_headers(),
                timeout=15.0
            )
            
            if response.status_code != 200:
                print(f"Pixabay returned {response.status_code}")
                return []
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            images = []
            
            # Find image containers
            # Pixabay embeds data in script tags as JSON
            script_tags = soup.find_all('script', type='application/ld+json')
            
            for script in script_tags:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict) and data.get('@type') == 'ImageObject':
                        img_url = data.get('contentUrl') or data.get('url')
                        if img_url:
                            formatted_img = {
                                "id": f"pixabay_direct_{abs(hash(img_url)) % 1000000}",
                                "width": 1200,
                                "height": 800,
                                "url": img_url,
                                "photographer": data.get('author', {}).get('name', 'Pixabay'),
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
                                "alt": data.get('name', query),
                                "image": img_url,
                                "title": data.get('name', f"{query.title()} Design"),
                                "author": data.get('author', {}).get('name', 'Pixabay'),
                                "likes": random.randint(50, 500),
                                "saves": random.randint(10, 100)
                            }
                            images.append(formatted_img)
                except:
                    continue
            
            # Fallback: Try img tags if JSON parsing failed
            if not images:
                img_tags = soup.find_all('img', {'data-lazy': True})
                for img in img_tags[:per_page]:
                    img_url = img.get('data-lazy')
                    if img_url and 'cdn.pixabay.com' in img_url:
                        formatted_img = {
                            "id": f"pixabay_direct_{abs(hash(img_url)) % 1000000}",
                            "width": 1200,
                            "height": 800,
                            "url": img_url,
                            "photographer": "Pixabay",
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
                            "alt": img.get('alt', query),
                            "image": img_url,
                            "title": img.get('alt', f"{query.title()} Design"),
                            "author": "Pixabay",
                            "likes": random.randint(50, 500),
                            "saves": random.randint(10, 100)
                        }
                        images.append(formatted_img)
            
            print(f"Pixabay Direct: Found {len(images)} images")
            return images[:per_page]
            
        except Exception as e:
            print(f"Pixabay Direct scraping error: {e}")
            return []
    
    async def close(self):
        """Close the HTTP session"""
        await self.session.aclose()

# Global instance
pixabay_direct_scraper = PixabayDirectScraper()
