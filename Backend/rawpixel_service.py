import httpx
import random
from typing import Dict, List, Any
from fastapi import HTTPException
from urllib.parse import quote

class RawpixelService:
    def __init__(self):
        # Rawpixel free CC0 images API - no API key required!
        self.base_url = "https://www.rawpixel.com/api/v1/search"
        self.enabled = True  # Always enabled since it's free
        # Create a shared client for better performance
        self.client = httpx.AsyncClient(timeout=15.0)
    
    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Search for free CC0 photos on Rawpixel"""
        # Enhanced query for interior design and architecture focus
        enhanced_query = f"{query} architecture interior design" if query else "architecture interior design"
        
        params = {
            "freecc0": "1",  # Only free CC0 images
            "html": "0",     # Return JSON, not HTML
            "page": page,
            "per_page": per_page,
            "query": enhanced_query
        }
        
        try:
            response = await self.client.get(
                self.base_url,
                params=params
            )
            
            # Handle different status codes appropriately
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Rawpixel API is temporarily unavailable. Please try again later.")
            elif response.status_code == 404:
                return {"results": []}  # No results found
            
            response.raise_for_status()
            
            data = response.json()
            # Filter only free images
            if "results" in data:
                filtered_results = [
                    item for item in data["results"] 
                    if item.get("free_image", False) or item.get("freecc0", False)
                ]
                return {"results": filtered_results}
            
            return data
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Rawpixel API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Rawpixel API: {str(e)}")
    
    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get trending free CC0 photos from Rawpixel with design focus"""
        # Use more specific queries for interior design and architecture
        queries = [
            "modern interior design", 
            "contemporary architecture", 
            "minimalist home", 
            "luxury interior", 
            "scandinavian design", 
            "industrial architecture", 
            "bohemian interior",
            "art deco design",
            "mid century modern",
            "sustainable architecture"
        ]
        
        # Add some randomness to the query selection
        query = queries[(page + random.randint(0, len(queries)-1)) % len(queries)]
        
        params = {
            "freecc0": "1",  # Only free CC0 images
            "html": "0",     # Return JSON, not HTML
            "page": page,
            "per_page": per_page,
            "query": query,
            "sort": "curated"  # Get curated/trending results
        }
        
        try:
            response = await self.client.get(
                self.base_url,
                params=params
            )
            
            # Handle different status codes appropriately
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Rawpixel API is temporarily unavailable. Please try again later.")
            elif response.status_code == 404:
                return {"results": []}  # No results found
            
            response.raise_for_status()
            
            data = response.json()
            # Filter only free images
            if "results" in data:
                filtered_results = [
                    item for item in data["results"] 
                    if item.get("free_image", False) or item.get("freecc0", False)
                ]
                return {"results": filtered_results}
            
            return data
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Rawpixel API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Rawpixel API: {str(e)}")
    
    def format_photo_data(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        """Format photo data to match frontend expectations"""
        return {
            "id": photo.get("id", photo.get("nid", 0)),
            "width": int(photo.get("original_width", 400)),
            "height": int(photo.get("original_height", 300)),
            "url": photo.get("url", ""),
            # Remove photographer information as requested
            "photographer": "",
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": "#ffffff",
            "src": {
                "original": photo.get("image_opengraph", photo.get("image_2500", photo.get("image", ""))),
                "large2x": photo.get("image_2000", photo.get("image_1600", "")),
                "large": photo.get("image_1400", photo.get("image_1200", "")),
                "medium": photo.get("image_800", photo.get("image_600", "")),
                "small": photo.get("image_400", photo.get("image_200", "")),
                "portrait": photo.get("image_600", ""),
                "landscape": photo.get("image_800", ""),
                "tiny": photo.get("image_200", "")
            },
            "alt": photo.get("image_alt", photo.get("image_title", "Architecture Design Image")),
            # Add fields that the frontend expects
            "image": photo.get("image_1200", photo.get("image_800", photo.get("image", ""))),
            "title": photo.get("image_title", "Architecture Design"),
            "author": "",  # Empty as requested for free images
            "likes": 0,    # Placeholder
            "saves": 0     # Placeholder
        }
    
    def format_photos_response(self, rawpixel_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format the complete Rawpixel response for the frontend"""
        formatted_data = []
        results = rawpixel_data.get("results", [])
        
        for photo in results:
            # Only include free CC0 images
            if photo.get("free_image", False) or photo.get("freecc0", False):
                formatted_data.append(self.format_photo_data(photo))
        
        return formatted_data
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
