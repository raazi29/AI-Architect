"""
Architecture Design Service for generating design-focused titles and descriptions
"""
import random
from typing import List

class ArchitectureDesignService:
    def __init__(self):
        # Architecture and interior design focused titles
        self.design_styles = [
            "Modern", "Contemporary", "Minimalist", "Scandinavian", "Industrial", 
            "Mid-Century Modern", "Bohemian", "Traditional", "Rustic", "Luxury",
            "Art Deco", "Bauhaus", "Mediterranean", "Colonial", "Victorian",
            "Zen", "Japandi", "Farmhouse", "Urban Loft", "Coastal"
        ]
        
        self.room_types = [
            "Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room",
            "Office", "Study", "Library", "Entryway", "Hallway", "Balcony",
            "Terrace", "Garden", "Patio", "Basement", "Attic", "Garage",
            "Walk-in Closet", "Laundry Room", "Home Theater", "Gym", "Studio"
        ]
        
        self.architectural_elements = [
            "Open Floor Plan", "High Ceilings", "Large Windows", "Natural Light",
            "Exposed Beams", "Brick Walls", "Concrete Floors", "Hardwood Floors",
            "Built-in Storage", "Kitchen Island", "Fireplace", "Skylight",
            "French Doors", "Bay Windows", "Vaulted Ceilings", "Crown Molding",
            "Wainscoting", "Coffered Ceiling", "Archways", "Columns"
        ]
        
        self.design_features = [
            "Clean Lines", "Neutral Palette", "Bold Colors", "Natural Materials",
            "Mixed Textures", "Statement Lighting", "Artwork Display", "Plants",
            "Vintage Accents", "Modern Furniture", "Custom Cabinetry", "Marble Countertops",
            "Subway Tiles", "Geometric Patterns", "Metallic Finishes", "Wood Accents",
            "Glass Elements", "Stone Features", "Fabric Textures", "Leather Details"
        ]
        
        self.color_schemes = [
            "Monochromatic", "Earth Tones", "Black and White", "Warm Neutrals",
            "Cool Grays", "Navy and Gold", "Sage Green", "Terracotta", "Blush Pink",
            "Deep Blues", "Rich Burgundy", "Soft Pastels", "Bold Jewel Tones"
        ]

    def generate_design_title(self, seed: int = None) -> str:
        """Generate a professional architecture/interior design title"""
        if seed is not None:
            random.seed(seed)
        
        # Different title patterns
        patterns = [
            "{style} {room} Design",
            "{style} {room} with {feature}",
            "{room} featuring {element}",
            "{style} {room} in {color} Palette",
            "{element} in {style} {room}",
            "Contemporary {room} Design",
            "{style} Interior Design",
            "{room} with {feature} and {element}",
            "Elegant {style} {room}",
            "Sophisticated {room} Design"
        ]
        
        pattern = random.choice(patterns)
        
        return pattern.format(
            style=random.choice(self.design_styles),
            room=random.choice(self.room_types),
            feature=random.choice(self.design_features),
            element=random.choice(self.architectural_elements),
            color=random.choice(self.color_schemes)
        )

    def generate_alt_text(self, seed: int = None) -> str:
        """Generate descriptive alt text for accessibility"""
        if seed is not None:
            random.seed(seed)
        
        style = random.choice(self.design_styles).lower()
        room = random.choice(self.room_types).lower()
        feature = random.choice(self.design_features).lower()
        
        return f"A {style} {room} interior featuring {feature} and professional design elements"

    def generate_description(self, seed: int = None) -> str:
        """Generate a detailed description for the design"""
        if seed is not None:
            random.seed(seed)
        
        style = random.choice(self.design_styles)
        room = random.choice(self.room_types)
        elements = random.sample(self.architectural_elements, 2)
        features = random.sample(self.design_features, 2)
        
        return f"This {style.lower()} {room.lower()} showcases {elements[0].lower()} and {elements[1].lower()}, complemented by {features[0].lower()} and {features[1].lower()}. The design emphasizes functionality while maintaining aesthetic appeal."

# Create a singleton instance
architecture_design_service = ArchitectureDesignService()