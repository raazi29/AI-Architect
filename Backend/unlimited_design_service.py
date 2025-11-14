
import random
from typing import List, Dict, Any
from architecture_design_service import architecture_design_service

class UnlimitedDesignService:
    def __init__(self):
        self.base_image_url = "https://picsum.photos/seed/{seed}/{width}/{height}"
        self.design_keywords = [
            "modern interior", "minimalist architecture", "scandinavian living room",
            "industrial kitchen", "luxury bedroom", "bohemian study",
            "contemporary bathroom", "rustic dining room", "futuristic office",
            "traditional hallway", "eco-friendly patio", "smart home design"
        ]

    async def search_images(self, query: str, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Generates a list of mock design images using Lorem Picsum.
        This service is designed to always return results, acting as a reliable fallback.
        """
        images = []
        seed_base = hash(query) + page  # Use query and page to vary results
        
        for i in range(per_page):
            seed = seed_base + i
            
            # Use architecture_design_service to generate varied titles and alt texts
            title = architecture_design_service.generate_design_title(seed)
            alt_text = architecture_design_service.generate_alt_text(seed)
            
            # Randomize dimensions slightly for variety
            width = random.randint(800, 1200)
            height = random.randint(600, 900)
            
            # Select a random keyword to ensure variety in generated image content
            keyword = random.choice(self.design_keywords)
            
            # Construct image URL with seed for consistent but varied images
            image_url = f"https://picsum.photos/seed/{seed}/{width}/{height}"
            
            images.append({
                "id": f"unlimited_{seed}_{i}",
                "width": width,
                "height": height,
                "url": image_url,
                "photographer": "Lorem Picsum",
                "photographer_url": "https://picsum.photos/",
                "photographer_id": 0,
                "avg_color": "#888888",  # Generic average color
                "src": {
                    "original": image_url,
                    "large2x": image_url,
                    "large": image_url,
                    "medium": image_url,
                    "small": image_url,
                    "portrait": image_url,
                    "landscape": image_url,
                    "tiny": image_url
                },
                "alt": alt_text,
                "image": image_url,
                "title": title,
                "author": "Lorem Picsum",
                "likes": random.randint(10, 500),
                "saves": random.randint(5, 100)
            })
        return images

    async def get_trending_designs(self, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """
        Generates mock trending design images.
        """
        # For trending, use a fixed query to ensure consistent "trending" results
        return await self.search_images("trending design", page, per_page)

# Global instance
unlimited_design_service = UnlimitedDesignService()
