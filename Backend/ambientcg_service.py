import httpx
import random
from typing import Dict, List, Any
from fastapi import HTTPException

class AmbientCGService:
    def __init__(self):
        # AmbientCG API for PBR textures and materials - completely free
        self.base_url = "https://ambientcg.com/api/v2/full_json"
        self.enabled = True  # Always enabled since it's free
        # Create a shared client for better performance
        self.client = httpx.AsyncClient(timeout=15.0)
    
    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Search for material textures on AmbientCG"""
        # Material categories relevant to architecture/interior design
        material_types = ["Wood", "Stone", "Marble", "Concrete", "Metal", "Fabric", "Tiles", "Brick", "Ground"]
        
        # If no specific query, use material types
        if not query or query in ["", "trending", "interior design", "architecture"]:
            # Rotate through material types based on page
            material_query = material_types[page % len(material_types)]
        else:
            # Map query terms to material categories
            query_lower = query.lower()
            if any(word in query_lower for word in ["wood", "wooden", "timber"]):
                material_query = "Wood"
            elif any(word in query_lower for word in ["stone", "rock", "granite"]):
                material_query = "Stone"
            elif any(word in query_lower for word in ["marble", "luxury"]):
                material_query = "Marble"
            elif any(word in query_lower for word in ["concrete", "industrial", "modern"]):
                material_query = "Concrete"
            elif any(word in query_lower for word in ["metal", "steel", "iron"]):
                material_query = "Metal"
            elif any(word in query_lower for word in ["fabric", "textile", "soft"]):
                material_query = "Fabric"
            elif any(word in query_lower for word in ["tile", "ceramic", "bathroom", "kitchen"]):
                material_query = "Tiles"
            elif any(word in query_lower for word in ["brick", "wall"]):
                material_query = "Brick"
            else:
                material_query = random.choice(material_types)
        
        params = {
            "type": "Material",
            "category": material_query,
            "limit": per_page,
            "offset": (page - 1) * per_page
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
                raise HTTPException(status_code=502, detail="AmbientCG API is temporarily unavailable. Please try again later.")
            elif response.status_code == 404:
                return {"foundAssets": []}  # No results found
            
            response.raise_for_status()
            
            data = response.json()
            return data
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to AmbientCG API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to AmbientCG API: {str(e)}")
    
    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get trending material textures from AmbientCG"""
        # Popular material categories for interior design
        trending_materials = [
            "Wood", "Marble", "Stone", "Concrete", "Metal", 
            "Fabric", "Tiles", "Brick", "Ground", "Plaster"
        ]
        
        # Rotate through trending materials
        material_category = trending_materials[page % len(trending_materials)]
        
        params = {
            "type": "Material",
            "category": material_category,
            "sort": "Popular",  # Get popular materials
            "limit": per_page,
            "offset": (page - 1) * per_page
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
                raise HTTPException(status_code=502, detail="AmbientCG API is temporarily unavailable. Please try again later.")
            elif response.status_code == 404:
                return {"foundAssets": []}  # No results found
            
            response.raise_for_status()
            
            data = response.json()
            return data
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to AmbientCG API timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to AmbientCG API: {str(e)}")
    
    def format_photo_data(self, asset: Dict[str, Any]) -> Dict[str, Any]:
        """Format material asset data to match frontend expectations"""
        # Get preview images from the asset
        downloads = asset.get("downloadFolders", {})
        preview_url = ""
        
        # Try to get preview image
        for size in ["1K", "2K", "4K"]:
            if size in downloads:
                files = downloads[size].get("downloadFiletypeCategories", {}).get("zip", {}).get("downloads", [])
                if files:
                    # Look for preview image in the download info
                    preview_url = f"https://ambientcg.com/get?file={asset.get('assetId', '')}_1K_Color.jpg"
                    break
        
        if not preview_url:
            # Fallback preview URL pattern
            preview_url = f"https://ambientcg.com/get?file={asset.get('assetId', '')}_Preview.jpg"
        
        return {
            "id": hash(asset.get("assetId", "")),
            "width": 512,
            "height": 512,
            "url": f"https://ambientcg.com/view?id={asset.get('assetId', '')}",
            # Remove photographer information as requested
            "photographer": "",
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": "#8B7355",  # Neutral brown color for materials
            "src": {
                "original": preview_url,
                "large2x": preview_url,
                "large": preview_url,
                "medium": preview_url,
                "small": preview_url,
                "portrait": preview_url,
                "landscape": preview_url,
                "tiny": preview_url
            },
            "alt": f"{asset.get('displayName', 'Material')} - {asset.get('category', 'Texture')}",
            # Add fields that the frontend expects
            "image": preview_url,
            "title": f"{asset.get('displayName', 'Material')} - {asset.get('category', 'Texture')}",
            "author": "AmbientCG",  # Credit the source
            "likes": 0,    # Placeholder
            "saves": 0     # Placeholder
        }
    
    def format_photos_response(self, ambientcg_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format the complete AmbientCG response for the frontend"""
        formatted_data = []
        assets = ambientcg_data.get("foundAssets", [])
        
        for asset in assets:
            # Only include CC0 licensed materials
            if asset.get("license", "").lower() == "cc0":
                formatted_data.append(self.format_photo_data(asset))
        
        return formatted_data
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
