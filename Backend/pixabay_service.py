import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv
from typing import Dict, List, Any

load_dotenv()

PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")
PIXABAY_API_URL = "https://pixabay.com/api/"

class PixabayService:
    def __init__(self):
        self.api_key = PIXABAY_API_KEY
        self.base_url = PIXABAY_API_URL
        self.client = httpx.AsyncClient(timeout=15.0)
        self.enabled = bool(self.api_key and self.api_key != "your_pixabay_api_key_here")
    
    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Search for photos on Pixabay"""
        # Check if service is enabled
        if not self.enabled:
            return {"hits": []}
            
        # Enhance query for interior design and architecture focus
        enhanced_query = f"{query} interior design architecture" if query else "interior design architecture"
        params = {
            "key": self.api_key,
            "q": enhanced_query,
            "page": page,
            "per_page": per_page,
            "image_type": "photo",
            "category": "buildings,rooms",
            "min_width": 800,
            "min_height": 600
        }
        
        try:
            response = await self.client.get(
                self.base_url,
                params=params
            )
            
            # Handle different status codes appropriately
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Pixabay API key.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Pixabay API is temporarily unavailable. Please try again later.")
            response.raise_for_status()
            
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Pixabay API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Pixabay API: {str(e)}")
    
    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get trending photos from Pixabay with improved queries for design focus"""
        # Check if service is enabled
        if not self.enabled:
            return {"hits": []}
            
        # Use more specific queries for interior design and architecture
        queries = ["interior+design", "architecture", "modern+home", "luxury+interior"]
        query = queries[(page - 1) % len(queries)]  # Rotate queries based on page
        params = {
            "key": self.api_key,
            "q": query,
            "page": page,
            "per_page": per_page,
            "image_type": "photo",
            "category": "buildings,rooms",
            "min_width": 800,
            "min_height": 600,
            "order": "popular"
        }
        
        try:
            response = await self.client.get(
                self.base_url,
                params=params
            )
            
            # Handle different status codes appropriately
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Pixabay API key.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Pixabay API is temporarily unavailable. Please try again later.")
            response.raise_for_status()
            
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Pixabay API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Pixabay API: {str(e)}")
    
    def format_photo_data(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        """Format photo data to match frontend expectations and remove photographer info"""
        # Pixabay uses different field names
        preview_url = photo.get("previewURL", "")
        webformat_url = photo.get("webformatURL", "")
        large_image_url = photo.get("largeImageURL", "")
        
        return {
            "id": photo.get("id", 0),
            "width": photo.get("imageWidth", 0),
            "height": photo.get("imageHeight", 0),
            "url": photo.get("pageURL", ""),
            "photographer": "",  # Remove photographer information as requested
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": "#ffffff",  # Pixabay doesn't provide this
            "src": {
                "original": large_image_url,
                "large2x": large_image_url,
                "large": webformat_url,
                "medium": preview_url,
                "small": preview_url,
                "portrait": preview_url,
                "landscape": webformat_url,
                "tiny": preview_url
            },
            "alt": photo.get("tags", "Photo"),
            # Add fields that the frontend expects
            "image": webformat_url or preview_url,
            "title": photo.get("tags", "Photo"),
            "author": "",  # Empty as requested
            "likes": photo.get("likes", 0),
            "saves": photo.get("favorites", 0)
        }
    
    def format_photos_response(self, pixabay_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format the complete Pixabay response for the frontend"""
        formatted_data = []
        for photo in pixabay_data.get("hits", []):
            formatted_data.append(self.format_photo_data(photo))
        return formatted_data
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()