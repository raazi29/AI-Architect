import random
from typing import List, Dict, Any

class ArchitectureDesignService:
    def __init__(self):
        self.design_styles = [
            "Modern", "Minimalist", "Contemporary", "Industrial", "Scandinavian",
            "Mid-Century Modern", "Rustic", "Bohemian", "Farmhouse", "Coastal",
            "Traditional", "Transitional", "Art Deco", "Mediterranean", "Asian Zen"
        ]
        
        self.room_types = [
            "Living Room", "Bedroom", "Kitchen", "Bathroom", "Home Office",
            "Dining Room", "Outdoor Space", "Entryway", "Home Bar", "Library"
        ]
        
        self.materials = [
            "Wood", "Marble", "Concrete", "Glass", "Metal", "Leather", "Linen",
            "Wool", "Ceramic", "Stone", "Brick", "Copper", "Brass", "Velvet"
        ]
        
        self.colors = [
            "Neutral", "White", "Black", "Grey", "Beige", "Navy", "Emerald",
            "Sage Green", "Dusty Blue", "Terracotta", "Mustard", "Blush Pink"
        ]
        
        self.design_terms = [
            "Open Plan", "Statement Lighting", "Accent Wall", "Floating Shelves",
            "Gallery Wall", "Indoor Plants", "Natural Light", "Geometric Patterns",
            "Textured Walls", "Mixed Materials", "Vintage Accents", "Handcrafted"
        ]
    
    def _get_random_choice(self, items: List[Any], seed: int = None) -> Any:
        if seed is not None:
            random.seed(seed)
        return random.choice(items)
    
    def generate_design_title(self, seed: int = None) -> str:
        """Generate a design title based on the given seed."""
        style = self._get_random_choice(self.design_styles, seed)
        room = self._get_random_choice(self.room_types, seed + 1 if seed is not None else None)
        
        title_templates = [
            f"{style} {room} Design",
            f"{style} {room} Inspiration",
            f"{room} with {style} Touches",
            f"{style} Design: {room} Ideas",
            f"{room} in {style} Style"
        ]
        
        return self._get_random_choice(title_templates, seed)
    
    def generate_alt_text(self, seed: int = None) -> str:
        """Generate alt text for design images."""
        style = self._get_random_choice(self.design_styles, seed)
        room = self._get_random_choice(self.room_types, seed + 1 if seed is not None else None)
        material = self._get_random_choice(self.materials, seed + 2 if seed is not None else None)
        color = self._get_random_choice(self.colors, seed + 3 if seed is not None else None)
        term = self._get_random_choice(self.design_terms, seed + 4 if seed is not None else None)
        
        alt_texts = [
            f"{style} {room} featuring {color} {material} and {term.lower()}",
            f"{room} design in {style} style with {color} accents and {term.lower()}",
            f"{style} interior with {material} details in {color} tones, {term.lower()}",
            f"{room} showcasing {style} design elements with {color} {material} and {term.lower()}",
            f"{style} {room} with {material} finishes in {color} palette, {term.lower()}"
        ]
        
        return self._get_random_choice(alt_texts, seed)

# Create a singleton instance to be imported by other modules
architecture_design_service = ArchitectureDesignService()
