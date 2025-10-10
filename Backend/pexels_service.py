import os
import httpx
import random
from fastapi import HTTPException, Query
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional

load_dotenv()

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
PEXELS_API_URL = "https://api.pexels.com/v1/search"

class PexelsService:
    def __init__(self):
        # Make Pexels optional and controlled by an enabled flag
        self.api_key = PEXELS_API_KEY
        self.base_url = PEXELS_API_URL
        self.enabled = bool(self.api_key and self.api_key != "your_pexels_api_key_here")
        print(f"Pexels service enabled: {self.enabled}")
        print(f"Pexels API key: {self.api_key}")
        self.headers = {"Authorization": self.api_key} if self.enabled else {}
        # Create a shared client for better performance
        self.client = httpx.AsyncClient(timeout=15.0)
    
    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Search for photos on Pexels with improved error handling"""
        if not self.enabled:
            return {"photos": []}

        # Enhance query for interior design and architecture focus
        enhanced_query = f"{query} interior design architecture" if query else "interior design architecture"
        params = {"query": enhanced_query, "page": page, "per_page": per_page}
        
        try:
            response = await self.client.get(
                self.base_url,
                headers=self.headers,
                params=params
            )
            
            # Handle different status codes appropriately
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Pexels API key.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Pexels API is temporarily unavailable. Please try again later.")
            response.raise_for_status()
            
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Pexels API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Pexels API: {str(e)}")
    
    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get trending photos from Pexels with improved queries for design focus"""
        if not self.enabled:
            return {"photos": []}

        # Use more specific queries for interior design and architecture
        queries = ["interior design", "architecture", "modern home", "luxury interior", "minimalist design", "scandinavian design", "industrial design", "bohemian design"]
        # Add some randomness to the query selection
        query = queries[(page + random.randint(0, len(queries)-1)) % len(queries)]
        params = {"query": query, "page": page, "per_page": per_page}
        
        try:
            response = await self.client.get(
                self.base_url,
                headers=self.headers,
                params=params
            )
            
            # Handle different status codes appropriately
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Pexels API key.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Pexels API is temporarily unavailable. Please try again later.")
            response.raise_for_status()
            
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Pexels API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Pexels API: {str(e)}")
    
    def format_photo_data(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        """Format photo data to match frontend expectations and remove photographer info"""
        return {
            "id": photo.get("id", 0),
            "width": photo.get("width", 0),
            "height": photo.get("height", 0),
            "url": photo.get("url", ""),
            # Remove photographer information as requested
            "photographer": "",
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": photo.get("avg_color", "#ffffff"),
            "src": photo.get("src", {}),
            "alt": photo.get("alt", "Photo"),
            # Add fields that the frontend expects
            "image": photo.get("src", {}).get("large2x", photo.get("src", {}).get("large", "")),
            "title": photo.get("alt", "Photo"),
            "author": "",  # Empty as requested
            "likes": 0,    # Placeholder
            "saves": 0     # Placeholder
        }
    
    def format_photos_response(self, pexels_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format the complete Pexels response for the frontend"""
        formatted_data = []
        for photo in pexels_data.get("photos", []):
            formatted_data.append(self.format_photo_data(photo))
        return formatted_data
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()