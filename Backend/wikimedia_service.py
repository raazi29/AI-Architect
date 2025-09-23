import httpx
from fastapi import HTTPException
from typing import Dict, List, Any
import urllib.parse

WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php"

class WikimediaService:
    def __init__(self):
        # Always enabled (no API key required)
        self.enabled = True
        self.client = httpx.AsyncClient(timeout=15.0)
        self.base_url = WIKIMEDIA_API_URL

    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Search for photos on Wikimedia Commons"""
        # Enhance query for interior design and architecture focus
        enhanced_query = f"{query} architecture interior design" if query else "architecture interior design"
        
        # Calculate offset for pagination
        offset = (page - 1) * per_page
        
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {enhanced_query}",
            "gsrlimit": per_page,
            "gsroffset": offset,
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "iiurlwidth": 800,
            "iiurlheight": 600
        }
        
        try:
            response = await self.client.get(self.base_url, params=params)
            
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Wikimedia rate limit exceeded. Try again later.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Wikimedia API is temporarily unavailable.")
            
            response.raise_for_status()
            data = response.json()
            
            # Transform to match expected format
            results = []
            pages = data.get("query", {}).get("pages", {})
            
            for page_id, page_data in pages.items():
                if "imageinfo" in page_data and page_data["imageinfo"]:
                    img_info = page_data["imageinfo"][0]
                    if img_info.get("mime", "").startswith("image/"):
                        results.append({
                            "id": page_id,
                            "title": page_data.get("title", "").replace("File:", ""),
                            "url": img_info.get("url", ""),
                            "thumburl": img_info.get("thumburl", img_info.get("url", "")),
                            "width": img_info.get("width", 800),
                            "height": img_info.get("height", 600),
                            "size": img_info.get("size", 0)
                        })
            
            return {"results": results}
            
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Wikimedia timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Wikimedia: {str(e)}")

    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get trending photos with design-focused queries"""
        queries = [
            "modern interior design architecture",
            "contemporary architecture", 
            "minimalist home architecture",
            "luxury interior architecture",
            "scandinavian design architecture",
            "industrial loft architecture",
            "bohemian interior architecture",
            "art deco design architecture"
        ]
        query = queries[(page - 1) % len(queries)]
        return await self.search_photos(query, page, per_page)

    def format_photo_data(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        """Format photo data to match frontend expectations"""
        return {
            "id": photo.get("id", ""),
            "width": photo.get("width", 800),
            "height": photo.get("height", 600),
            "url": photo.get("url", ""),
            "photographer": "",
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": "#ffffff",
            "src": {
                "original": photo.get("url", ""),
                "large2x": photo.get("url", ""),
                "large": photo.get("thumburl", photo.get("url", "")),
                "medium": photo.get("thumburl", photo.get("url", "")),
                "small": photo.get("thumburl", photo.get("url", "")),
                "portrait": photo.get("thumburl", photo.get("url", "")),
                "landscape": photo.get("thumburl", photo.get("url", "")),
                "tiny": photo.get("thumburl", photo.get("url", ""))
            },
            "alt": photo.get("title", "Design Image"),
            "image": photo.get("thumburl", photo.get("url", "")),
            "title": photo.get("title", "Design Image"),
            "author": "",
            "likes": 0,
            "saves": 0
        }

    def format_photos_response(self, wikimedia_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format the complete Wikimedia response for the frontend"""
        formatted_data = []
        for photo in wikimedia_data.get("results", []):
            formatted_data.append(self.format_photo_data(photo))
        return formatted_data

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
