import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv
from typing import Dict, List, Any

load_dotenv()

FLICKR_API_KEY = os.getenv("FLICKR_API_KEY")
FLICKR_API_URL = "https://www.flickr.com/services/rest/"

# Creative Commons and public domain friendly licenses
# 4: CC BY, 5: CC BY-SA, 6: CC BY-ND, 9: CC0, 10: Public Domain Mark
CC_LICENSES = "4,5,6,9,10"

class FlickrService:
    def __init__(self):
        self.api_key = FLICKR_API_KEY
        self.enabled = bool(self.api_key and self.api_key != "your_flickr_api_key_here")
        self.client = httpx.AsyncClient(timeout=15.0)

    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        if not self.enabled:
            return {"photos": {"photo": []}}
        params = {
            "method": "flickr.photos.search",
            "api_key": self.api_key,
            "text": query or "interior design architecture",
            "page": page,
            "per_page": per_page,
            "media": "photos",
            "content_type": 1,
            "safe_search": 1,
            "license": CC_LICENSES,
            # Ask for direct URLs in various sizes
            "extras": "url_o,url_l,url_c,url_z,url_m,owner_name",
            "format": "json",
            "nojsoncallback": 1,
        }
        try:
            resp = await self.client.get(FLICKR_API_URL, params=params)
            if resp.status_code == 429:
                raise HTTPException(status_code=429, detail="Flickr rate limit exceeded. Try again later.")
            elif resp.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Flickr API key.")
            resp.raise_for_status()
            return resp.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Flickr API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Flickr API: {str(e)}")

    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        # No trending endpoint; use rotating topics
        topics = [
            "interior design", "architecture", "modern home", "minimalist interior",
            "industrial design", "bohemian interior", "scandinavian interior"
        ]
        topic = topics[(page - 1) % len(topics)]
        return await self.search_photos(topic, page, per_page)

    def best_url(self, p: Dict[str, Any]) -> str:
        for k in ["url_l", "url_c", "url_z", "url_m", "url_o"]:
            if p.get(k):
                return p[k]
        return ""

    def format_photo(self, p: Dict[str, Any]) -> Dict[str, Any]:
        url = self.best_url(p)
        width = int(p.get("width_l") or p.get("width_c") or p.get("width_z") or p.get("width_m") or 800)
        height = int(p.get("height_l") or p.get("height_c") or p.get("height_z") or p.get("height_m") or 1200)
        alt = p.get("title") or "Design Image"
        return {
            "id": p.get("id", 0),
            "width": width,
            "height": height,
            "url": f"https://www.flickr.com/photos/{p.get('owner')}/{p.get('id')}",
            "photographer": "",
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": "#ffffff",
            "src": {
                "original": url,
                "large2x": url,
                "large": url,
                "medium": url,
                "small": url,
                "portrait": url,
                "landscape": url,
                "tiny": url,
            },
            "alt": alt,
            "image": url,
            "title": alt,
            "author": "",
            "likes": 0,
            "saves": 0,
        }

    def format_photos_response(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        photos = (data or {}).get("photos", {})
        items = photos.get("photo", [])
        return [self.format_photo(p) for p in items]

    async def close(self):
        await self.client.aclose()
