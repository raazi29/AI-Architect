import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv
from typing import Dict, List, Any

load_dotenv()

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
UNSPLASH_SECRET_KEY = os.getenv("UNSPLASH_SECRET_KEY")
UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"
UNSPLASH_COLLECTIONS_URL = "https://api.unsplash.com/collections"

class UnsplashService:
    def __init__(self):
        self.access_key = UNSPLASH_ACCESS_KEY
        self.secret_key = UNSPLASH_SECRET_KEY
        self.base_url = UNSPLASH_API_URL
        # Check for placeholder/demo API keys that should be treated as disabled
        placeholder_access_keys = [
            "your_unsplash_access_key_here",
            "7GgIy-50AGkL5vzuEWjOd__qZT9gtEEH2yanI71mnlI",  # Demo key
            None,
            ""
        ]
        placeholder_secret_keys = [
            "your_unsplash_secret_key_here",
            "XbvYUrh1yLQZWzOqnDgE7pPwEBCm9E_Q-22YGAo4L3I",  # Demo key
            None,
            ""
        ]
        self.enabled = bool(self.access_key and self.secret_key and
                          self.access_key not in placeholder_access_keys and
                          self.secret_key not in placeholder_secret_keys)
        self.headers = {"Authorization": f"Client-ID {self.access_key}"} if self.enabled else {}
        self.client = httpx.AsyncClient(timeout=15.0)
        print(f"Unsplash service enabled: {self.enabled}")
        if not self.enabled:
            print(f"Unsplash disabled - using placeholder/demo API keys")
    
    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Search for photos on Unsplash"""
        # Check if service is enabled
        if not self.enabled:
            return {"results": []}
            
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
                raise HTTPException(status_code=401, detail="Invalid Unsplash API key.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Unsplash API is temporarily unavailable. Please try again later.")
            response.raise_for_status()
            
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Unsplash API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Unsplash API: {str(e)}")
    
    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get trending photos from Unsplash with improved queries for design focus"""
        # Check if service is enabled
        if not self.enabled:
            return {"results": []}
        
        # Try to get from curated collections first, then fallback to search
        try:
            # Popular architecture/interior design collection IDs
            collection_ids = [
                "3348849",  # Architecture
                "1103808",  # Interior Design
                "219941",   # Architecture Photography
                "1954515",  # Modern Architecture
                "1394215"   # Interior Photography
            ]
            
            collection_id = collection_ids[(page - 1) % len(collection_ids)]
            collection_url = f"{UNSPLASH_COLLECTIONS_URL}/{collection_id}/photos"
            
            response = await self.client.get(
                collection_url,
                headers=self.headers,
                params={"page": page, "per_page": per_page}
            )
            
            if response.status_code == 200:
                # Format collection response to match search format
                photos = response.json()
                return {"results": photos}
            
        except Exception:
            # Fallback to search if collections fail
            pass
            
        # Fallback to enhanced search queries
        queries = [
            "interior design modern", "architecture photography", "luxury home interior", 
            "scandinavian design", "minimalist architecture", "contemporary interior",
            "industrial design", "mid century modern", "sustainable architecture"
        ]
        query = queries[(page - 1) % len(queries)]
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
                raise HTTPException(status_code=401, detail="Invalid Unsplash API key.")
            elif response.status_code >= 500:
                raise HTTPException(status_code=502, detail="Unsplash API is temporarily unavailable. Please try again later.")
            response.raise_for_status()
            
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Unsplash API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Unsplash API: {str(e)}")
    
    def format_photo_data(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        """Format photo data to match frontend expectations and remove photographer info"""
        return {
            "id": photo.get("id", ""),
            "width": photo.get("width", 0),
            "height": photo.get("height", 0),
            "url": photo.get("links", {}).get("html", ""),
            "photographer": "",  # Remove photographer information as requested
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": photo.get("color", "#ffffff"),
            "src": {
                "original": photo.get("urls", {}).get("raw", ""),
                "large2x": photo.get("urls", {}).get("full", ""),
                "large": photo.get("urls", {}).get("regular", ""),
                "medium": photo.get("urls", {}).get("small", ""),
                "small": photo.get("urls", {}).get("thumb", ""),
                "portrait": photo.get("urls", {}).get("small", ""),
                "landscape": photo.get("urls", {}).get("regular", ""),
                "tiny": photo.get("urls", {}).get("thumb", "")
            },
            "alt": photo.get("alt_description", "Photo"),
            # Add fields that the frontend expects
            "image": photo.get("urls", {}).get("regular", photo.get("urls", {}).get("small", "")),
            "title": photo.get("alt_description", "Photo"),
            "author": "",  # Empty as requested
            "likes": photo.get("likes", 0),
            "saves": 0     # Placeholder
        }
    
    def format_photos_response(self, unsplash_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format the complete Unsplash response for the frontend"""
        formatted_data = []
        for photo in unsplash_data.get("results", []):
            formatted_data.append(self.format_photo_data(photo))
        return formatted_data
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()