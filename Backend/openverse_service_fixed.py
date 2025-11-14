import httpx
from fastapi import HTTPException
from typing import Dict, List, Any

# Fixed: Updated to new Openverse API URL
OPENVERSE_API_URL = "https://api.openverse.org/v1/images/"

class OpenverseService:
    def __init__(self):
        # Always enabled (no API key required)
        self.enabled = True
        self.client = httpx.AsyncClient(
            timeout=15.0,
            follow_redirects=True  # Follow redirects automatically
        )

    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        # Openverse supports q, page, page_size; we can bias for design licenses
        params = {
            "q": query or "interior design architecture",
            "page": page,
            "page_size": per_page,
            # Filter to photos and safe content; exclude noncommercial restrictions if desired
            "license_type": "all",  # could be "commercial" if you need
            "extension": "jpg",
        }
        try:
            resp = await self.client.get(OPENVERSE_API_URL, params=params)
            if resp.status_code == 429:
                raise HTTPException(status_code=429, detail="Openverse rate limit exceeded. Try again later.")
            resp.raise_for_status()
            return resp.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Openverse timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Openverse: {str(e)}")

    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        # Openverse has no trending; use rotating queries for design topics
        topics = [
            "interior design", "architecture", "modern home", "luxury interior",
            "minimalist design", "scandinavian interior", "industrial loft", "bohemian home"
        ]
        topic = topics[(page - 1) % len(topics)]
        return await self.search_photos(topic, page, per_page)

    def format_photo(self, item: Dict[str, Any]) -> Dict[str, Any]:
        # Map Openverse fields to our schema
        # item contains: id, title, url, thumbnail, foreign_landing_url, foreign_identifier,
        #                provider, source, license, license_url, category, filesize, filetype,
        #                width, height, url (direct), etc.
        image_url = item.get("url") or item.get("thumbnail") or ""
        width = int(item.get("width") or 800)
        height = int(item.get("height") or 1200)
        alt = item.get("title") or "Design Image"
        
        # Use title as well for better descriptions
        title = item.get("title", alt)
        
        return {
            "id": item.get("id") or item.get("foreign_identifier") or 0,
            "width": width,
            "height": height,
            "url": item.get("foreign_landing_url") or item.get("url") or "",
            "photographer": item.get("creator") or "",
            "photographer_url": item.get("creator_url") or "",
            "photographer_id": 0,
            "avg_color": item.get("tags", [{}])[0].get("accuracy", "#ffffff") if item.get("tags") else "#ffffff",
            "src": {
                "original": image_url,
                "large2x": image_url,
                "large": image_url,
                "medium": image_url,
                "small": image_url,
                "portrait": image_url,
                "landscape": image_url,
                "tiny": image_url,
            },
            "alt": alt,
            "image": image_url,
            "title": title,  # Add proper title from Openverse data
            "author": item.get("creator") or "",
            "likes": item.get("likes", 0),
            "saves": 0,
        }

    def format_photos_response(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = data.get("results") or []
        return [self.format_photo(item) for item in results]

    async def close(self):
        await self.client.aclose()