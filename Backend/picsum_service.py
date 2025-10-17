import httpx
from fastapi import HTTPException
from typing import Dict, List, Any
from architecture_design_service import architecture_design_service

PICSUM_LIST_URL = "https://picsum.photos/v2/list"

class PicsumService:
    def __init__(self):
        # Always enabled (no API key required)
        self.enabled = True
        self.client = httpx.AsyncClient(timeout=15.0)

    async def search_photos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> List[Dict[str, Any]]:
        # Picsum doesn't support search; but we can at least filter for architecture/interior design terms
        # by using specific collections or tags when available
        print(f"Picsum search called with query: '{query}', page: {page}, per_page: {per_page}")
        try:
            # For Picsum, we'll still paginate but add some basic filtering
            resp = await self.client.get(PICSUM_LIST_URL, params={"page": page, "limit": per_page})
            if resp.status_code == 429:
                raise HTTPException(status_code=429, detail="Picsum rate limit exceeded. Try again later.")
            resp.raise_for_status()
            data = resp.json()
            
            # Format the data directly and return as list
            formatted_data = []
            for photo in data:
                formatted_data.append(self.format_photo_data(photo))
            
            # If we have a query, try to filter results (basic filtering since Picsum doesn't support search)
            if query:
                # Convert query to lowercase for case-insensitive matching
                query_lower = query.lower()
                # Define keywords related to architecture and interior design
                architecture_keywords = [
                    "architecture", "building", "house", "home", "interior", "design",
                    "room", "kitchen", "bathroom", "living", "bedroom", "office",
                    "modern", "minimalist", "scandinavian", "industrial", "contemporary",
                    "residential", "commercial", "luxury", "contemporary", "minimalist",
                    "scandinavian", "industrial", "kitchen", "bathroom", "living room",
                    "bedroom", "office", "restaurant", "hotel", "cafe"
                ]
                
                # Filter based on keywords in the query
                filtered_data = []
                for item in formatted_data:
                    # Check if any architecture keyword is in the query
                    if any(keyword in query_lower for keyword in architecture_keywords):
                        # If the query contains architecture/interior terms, include all results
                        # (since we can't actually filter Picsum results)
                        filtered_data.append(item)
                    # If no architecture keywords in query, still return some results
                    # but limit to a smaller subset to reduce random images
                    elif len(filtered_data) < per_page // 2:
                        filtered_data.append(item)
                
                # If query contains architecture terms but we have no filtered results,
                # return a smaller subset of the original data
                if any(keyword in query_lower for keyword in architecture_keywords) and len(filtered_data) == 0:
                    filtered_data = formatted_data[:per_page // 3] if len(formatted_data) > per_page // 3 else formatted_data
                
                return filtered_data
            
            return formatted_data
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request to Picsum timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Picsum: {str(e)}")

    async def get_trending_photos(
        self,
        page: int = 1,
        per_page: int = 20
    ) -> List[Dict[str, Any]]:
        # Use list endpoint as a stand-in for trending
        return await self.search_photos("", page, per_page)

    def format_photo_data(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        # Picsum returns: id, author, width, height, url, download_url
        pid = photo.get("id", "0")
        width = int(photo.get("width", 800))
        height = int(photo.get("height", 1200))
        # Build multiple sizes using picsum.photos
        # e.g., https://picsum.photos/id/237/800/1200
        base = f"https://picsum.photos/id/{pid}"
        # Compute aspect-correct heights for common widths
        def h_for(w):
            try:
                return max(1, int(round((height / width) * w)))
            except Exception:
                return w
        large_w = min(width, 1200)
        large = f"{base}/{large_w}/{h_for(large_w)}"
        regular_w = 800
        regular = f"{base}/{regular_w}/{h_for(regular_w)}"
        small_w = 400
        small = f"{base}/{small_w}/{h_for(small_w)}"
        thumb_w = 200
        thumb = f"{base}/{thumb_w}/{h_for(thumb_w)}"
        
        # Use architecture design service for professional, varied titles
        seed_value = int(pid) if str(pid).isdigit() else hash(pid)
        title = architecture_design_service.generate_design_title(seed_value)
        alt_text = architecture_design_service.generate_alt_text(seed_value)
        
        return {
            "id": int(pid) if str(pid).isdigit() else pid,
            "width": width,
            "height": height,
            "url": photo.get("url", ""),
            "photographer": "",
            "photographer_url": "",
            "photographer_id": 0,
            "avg_color": "#ffffff",
            "src": {
                "original": photo.get("download_url", large),
                "large2x": large,
                "large": regular,
                "medium": small,
                "small": small,
                "portrait": regular,
                "landscape": regular,
                "tiny": thumb
            },
            "alt": alt_text,
            "image": regular,
            "title": title,
            "author": "",
            "likes": 0,
            "saves": 0,
        }

    def format_photos_response(self, picsum_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        formatted_data = []
        # Handle both {"results": [...]} and direct [...] formats
        photos = picsum_data.get("results", picsum_data) if isinstance(picsum_data, dict) else picsum_data
        if isinstance(photos, list):
            for photo in photos:
                formatted_data.append(self.format_photo_data(photo))
        return formatted_data

    async def close(self):
        await self.client.aclose()
