"""
Image categorization service for design feed
Filters and validates images to ensure they match the specified design categories
"""
import re
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse

class ImageCategorizationService:
    def __init__(self):
        # Define all the categories that should be included in the design feed
        self.valid_categories = {
            # 1. Spaces / Rooms
            "living_rooms": [
                "living room", "living room design", "sitting room", "lounge room", "family room",
                "common room", "reception room", "parlor", "parlour", "lounge"
            ],
            "bedrooms": [
                "bedroom", "bedroom design", "bed chamber", "sleeping room", "master bedroom",
                "guest bedroom", "kids bedroom", "teen bedroom", "bed room", "bedroom decor",
                "bedroom furniture", "bedroom ideas"
            ],
            "kitchens": [
                "kitchen", "kitchen design", "cooking space", "culinary space", "gourmet kitchen",
                "country kitchen", "modern kitchen", "island kitchen", "kitchenette", "kitchen decor",
                "kitchen island", "kitchen cabinet", "kitchen counter", "kitchen appliances"
            ],
            "bathrooms": [
                "bathroom", "bathroom design", "bath room", "ensuite", "ensuite bathroom", "master bath",
                "guest bath", "powder room", "half bath", "full bath", "bathroom decor", "bathroom vanity",
                "bathroom sink", "bathroom tile", "bathroom shower", "bathroom toilet"
            ],
            "dining_rooms": [
                "dining room", "dining room design", "dining space", "formal dining", "informal dining",
                "dining area", "breakfast nook", "kitchen dining", "formal dining room", "dining table",
                "dining chair", "dining room decor", "dining room furniture"
            ],
            "home_offices": [
                "home office", "home office design", "study room", "office space", "work from home",
                "work from home office", "study", "library", "den", "home workspace", "office desk",
                "office chair", "office decor", "office furniture", "study space", "workspace design"
            ],
            "outdoor_spaces": [
                "patio", "terrace", "balcony", "garden", "outdoor space", "outdoor design",
                "deck", "veranda", "sunroom", "outdoor living", "garden design", "patio design",
                "terrace design", "balcony design", "outdoor furniture", "outdoor decor",
                "garden furniture", "outdoor dining", "outdoor kitchen", "porch"
            ],
            "commercial_interiors": [
                "cafe", "restaurant", "office", "retail shop", "commercial interior", "commercial design",
                "retail design", "hospitality interior", "hotel interior", "workspace design",
                "corporate office", "shop decor", "store design", "business interior", "coffeeshop",
                "boutique", "spa", "salon", "clinic", "clinic design", "bank interior", "storefront"
            ],
            
            # 2. Architectural Styles
            "modern_contemporary": [
                "modern", "contemporary", "modern design", "contemporary design", "modern architecture",
                "contemporary architecture", "modern interior", "contemporary interior", "modern style",
                "contemporary style", "modern furniture", "contemporary furniture", "modern decor"
            ],
            "minimalist": [
                "minimalist", "minimal", "minimalist design", "minimal design", "minimal interior",
                "simple design", "clean design", "minimal architecture", "minimalist style",
                "clean lines", "minimal furniture", "simple furniture", "uncluttered"
            ],
            "scandinavian": [
                "scandinavian", "nordic", "scandinavian design", "nordic design", "scandinavian style",
                "nordic style", "scandinavian interior", "nordic interior", "nordic decor",
                "scandinavian furniture", "hygge", "cosy design"
            ],
            "industrial": [
                "industrial", "industrial design", "industrial style", "industrial interior",
                "warehouse style", "factory style", "industrial architecture", "brutalism",
                "industrial furniture", "metals and concrete", "raw materials", "exposed brick"
            ],
            "mid_century_modern": [
                "mid-century modern", "mid century modern", "mid-century", "mcm", "mid century",
                "mid-century modern design", "mcm design", "mid-century style", "mcm furniture",
                "retro design", "vintage modern", "50s style", "60s design"
            ],
            "luxury_classic": [
                "luxury", "classic", "neoclassical", "traditional", "luxury interior", "luxury design",
                "classical design", "traditional design", "luxury style", "classic style",
                "elegant design", "upscale design", "opulent design", "luxury furniture",
                "classic furniture", "antique", "vintage", "ornate", "elegant", "chic"
            ],
            "bohemian_eclectic": [
                "bohemian", "boho", "eclectic", "bohemian design", "boho design", "eclectic design",
                "boho chic", "bohemian style", "eclectic style", "bohemian interior", "gypsy style",
                "free spirit", "colorful decor", "eclectic furniture", "mix patterns"
            ],
            "futuristic_smart": [
                "futuristic", "smart home", "futuristic design", "smart home design", "futuristic style",
                "technology integration", "smart house", "high tech", "tech forward", "futuristic interior",
                "automated home", "smart furniture", "high tech design", "future design"
            ],
            
            # 3. Materials & Finishes
            "wood_focused": [
                "wood", "wooden", "wood design", "wood finish", "wood texture", "wood material",
                "wood accent", "timber", "hardwood", "wood flooring", "wood furniture", "wood panel",
                "wood decor", "wood feature", "wood element", "wood grain", "wood tone"
            ],
            "stone_marble": [
                "stone", "marble", "granite", "quartz", "stone design", "marble design", "stone finish",
                "marble finish", "natural stone", "stone texture", "marble texture", "stone wall",
                "marble floor", "stone feature", "marble bathroom", "stone furniture"
            ],
            "metal_industrial": [
                "metal", "industrial finish", "metal design", "metal texture", "steel", "aluminum",
                "iron", "brass", "copper", "metal accent", "industrial material", "metal furniture",
                "metal decor", "metallic", "chrome", "metal structure", "metal framework"
            ],
            "glass_heavy": [
                "glass", "glass design", "glass material", "glass finish", "glass texture",
                "glass accent", "transparent", "glass wall", "glass partition", "glass doors",
                "glass furniture", "glass decor", "glass table", "glass cabinet", "glass windows"
            ],
            "sustainable_eco": [
                "sustainable", "eco", "eco-friendly", "sustainable design", "eco design",
                "environmental", "green design", "sustainable material", "renewable", "eco material",
                "recycled material", "green building", "environmental design", "sustainable furniture"
            ],
            
            # 4. Color Palettes
            "neutral_earth": [
                "neutral", "earth tone", "neutral palette", "earth palette", "neutral color",
                "earth color", "neutral tone", "earth tone", "warm neutral", "cool neutral",
                "beige", "taupe", "cream", "white", "off white", "tan", "stone", "sage"
            ],
            "monochrome": [
                "monochrome", "black and white", "monochrome palette", "black white", "grayscale",
                "grayscale design", "monochrome design", "monochrome style", "bw", "black-white",
                "monochrome decor", "black white design", "monotone", "grayscale decor"
            ],
            "bold_vibrant": [
                "bold", "vibrant", "bold color", "vibrant color", "bold palette", "vibrant palette",
                "bright", "bright color", "colorful", "bold design", "vibrant design", "red",
                "blue", "yellow", "orange", "green", "purple", "color blocking", "bright decor"
            ],
            "pastel_soft": [
                "pastel", "soft", "pastel color", "soft color", "pastel palette", "soft palette",
                "pastel tone", "soft tone", "muted", "muted color", "soft design", "pink",
                "lavender", "mint", "baby blue", "soft yellow", "soft green", "powder blue"
            ],
            "dark_mood": [
                "dark", "moody", "dark theme", "moody design", "dark design", "dark palette",
                "moody palette", "dramatic", "dramatic lighting", "sophisticated", "dark aesthetic",
                "black", "charcoal", "navy", "deep blue", "dark green", "burgundy", "sophisticated"
            ],
            
            # 5. Special Elements
            "furniture_layouts": [
                "furniture layout", "layout design", "room layout", "furniture placement",
                "layout planning", "space planning", "furniture arrangement", "layout style",
                "furniture grouping", "seating arrangement", "space layout", "functional layout"
            ],
            "lighting_designs": [
                "lighting", "lighting design", "pendant", "pendant light", "recessed lighting",
                "natural light", "lighting fixture", "chandelier", "sconce", "ambient lighting",
                "task lighting", "accent lighting", "ceiling light", "table lamp", "floor lamp",
                "wall light", "light fixture", "light bulb", "luminous"
            ],
            "wall_treatments": [
                "wall panel", "wall texture", "wall mural", "wall treatment", "wall design",
                "feature wall", "accent wall", "wall paneling", "wall cladding", "wall paper",
                "wall art", "wall decor", "wall color", "wall finish", "wall covering"
            ],
            "ceilings": [
                "ceiling", "ceiling design", "false ceiling", "ceiling concept", "ceiling treatment",
                "cove lighting", "ceiling finish", "ceiling detail", "suspended ceiling", "coffered",
                "tray ceiling", "cathedral ceiling", "vaulted ceiling", "beam ceiling", "ceiling decor"
            ],
            "flooring_patterns": [
                "flooring", "floor pattern", "floor design", "flooring pattern", "wood flooring",
                "marble flooring", "tile flooring", "mixed flooring", "flooring layout", "parquet",
                "laminate", "vinyl", "stone flooring", "patterned floor", "floor pattern"
            ],
            "decor_details": [
                "plants", "greenery", "art", "accessories", "decor", "decoration", "home decor",
                "interior decor", "decor elements", "statement piece", "focal point", "ornament",
                "vase", "sculpture", "candle", "books", "textiles", "curtains", "pillows", "rugs"
            ],
            
            # 6. Project Type
            "residential": [
                "residential", "home", "apartment", "house", "villa", "cottage", "mansion",
                "residential design", "home design", "residential interior", "single family",
                "multi family", "condo", "townhouse", "residential project"
            ],
            "commercial": [
                "commercial", "office", "retail", "restaurant", "commercial design", "commercial space",
                "business space", "workplace design", "retail space", "corporate", "business",
                "corporate office", "workplace", "commercial project"
            ],
            "hospitality": [
                "hotel", "resort", "lounge", "hospitality", "hospitality design", "hotel design",
                "resort design", "luxury hotel", "boutique hotel", "restaurant", "cafe",
                "bar", "pub", "hospitality project", "hotel room", "resort room"
            ],
            "public_spaces": [
                "public space", "library", "gallery", "museum", "coworking", "library design",
                "gallery design", "public space design", "community space", "civic space",
                "airport", "hospital", "school", "university", "public building", "community center"
            ]
        }
        
        # Compile a comprehensive list of all valid keywords for matching
        self.all_valid_keywords = set()
        for category_keywords in self.valid_categories.values():
            self.all_valid_keywords.update([kw.lower() for kw in category_keywords])
        
        # Precompile regex patterns for faster matching
        self.valid_keywords_pattern = r'|'.join(re.escape(kw) for kw in self.all_valid_keywords)
        self.keyword_pattern = re.compile(r'\b(' + self.valid_keywords_pattern + r')\b', re.IGNORECASE)
        
        # Precompile non-design terms pattern for faster matching
        # STRICT filtering - reject anything that's not architecture/interior design
        self.non_design_terms = [
            # People
            "people", "person", "face", "portrait", "selfie", "human", "individual", 
            "man", "woman", "child", "kid", "baby", "family", "crowd", "group",
            "headshot", "smile", "smiling", "model", "fashion model",
            # Vehicles
            "car", "vehicle", "automotive", "truck", "bike", "motorcycle", "airplane",
            "boat", "ship", "train", "bus", "taxi", "scooter",
            # Food
            "food", "meal", "dinner", "lunch", "breakfast", "cuisine", "dish",
            "recipe", "cooking", "baking", "chef", "plate", "menu",
            # Animals
            "animal", "dog", "cat", "pet", "wildlife", "bird", "fish", "mammal",
            "horse", "cow", "chicken", "lion", "tiger", "elephant",
            # Sports & Activities
            "sports", "football", "basketball", "soccer", "tennis", "athlete", "game",
            "fitness", "gym", "yoga", "exercise", "workout", "running",
            # Events
            "event", "concert", "party", "wedding", "ceremony", "celebration",
            "festival", "conference", "meeting", "gathering",
            # Nature (non-architectural)
            "mountain", "beach", "landscape", "outdoor scenery", "sky", "cloud",
            "tree", "forest", "jungle", "desert", "ocean", "sea", "river",
            "sunset", "sunrise", "weather", "rain", "snow",
            # Products (non-furniture)
            "electronics", "gadget", "mobile", "phone", "computer", "laptop",
            "tablet", "camera", "watch", "jewelry", "accessory",
            # Fashion
            "fashion", "clothing", "clothes", "fashionable", "outfit", "dress", "shirt",
            "shoes", "bag", "handbag", "model",
            # Abstract/Random
            "abstract", "pattern", "texture", "wallpaper", "background",
            "graffiti", "street art", "mural",
            # Body parts
            "hand", "hands", "feet", "leg", "arm", "finger"
        ]
        self.non_design_pattern = r'|'.join(re.escape(term) for term in self.non_design_terms)
        self.non_design_regex = re.compile(self.non_design_pattern, re.IGNORECASE)
        
        # Set of generic titles to identify placeholders
        self.generic_titles = {
            "design image", "architecture design image", "architecture design", 
            "design", "interior design", "random design", "random image", "photo"
        }
    
    def is_valid_design_image(self, image_data: Dict[str, Any]) -> bool:
        """
        Determine if an image is valid for the design feed based on our categories
        Optimized for performance with early-exit strategies
        """
        # Check if the image URL contains any relevant keywords first (fastest check)
        image_url = image_data.get('image', '') or image_data.get('url', '') or image_data.get('src', {}).get('large', '')
        url_keywords = self._extract_keywords_from_url(image_url)
        if url_keywords:
            return True  # If URL has design keywords, it's valid
        
        # Extract text elements
        title = image_data.get('title', '')
        alt_text = image_data.get('alt', '')
        description = image_data.get('description', '') if 'description' in image_data else ''
        tags = image_data.get('tags', [])
        
        # Quick check: if title is generic and no tags/description, likely placeholder
        title_lower = title.lower()
        if title_lower in self.generic_titles and not tags and not description:
            return False  # Likely a generic placeholder
        
        # Combine all text for analysis (avoid creating unnecessary strings)
        all_text_parts = [title, alt_text, description] + tags
        combined_text = ' '.join(all_text_parts).lower()
        
        # Quick check for non-design terms (most efficient first)
        if self.non_design_regex.search(combined_text):
            return False
        
        # Additional check for URLs containing non-design content
        if any(term in image_url for term in ['people', 'person', 'face', 'human', 'portrait', 'selfie', 'family', 'beach', 'nature', 'mountain', 'landscape']):
            return False
        
        # Check for valid design keywords
        if self.keyword_pattern.search(combined_text):
            return True
        
        # Check if this is a Picsum-generated image that may be generic
        # Picsum images without meaningful alt descriptions are likely generic placeholders
        if 'picsum.photos' in image_url:
            title = str(image_data.get('title', ''))
            alt_text = str(image_data.get('alt', ''))
            # If the title/alt only contains generic content like "Photo #123", it's likely a placeholder
            if 'Photo #' in title or 'Photo #' in alt_text:
                # Only accept if there are other meaningful design-related terms
                combined_text = f"{title} {alt_text} {description} {' '.join(tags)}".lower()
                if not any(keyword in combined_text for keyword in self.all_valid_keywords):
                    return False
        
        return False

    def _extract_keywords_from_url(self, url: str) -> List[str]:
        """
        Extract potential keywords from the image URL that might indicate design categories
        """
        parsed = urlparse(url)
        path = parsed.path.lower()
        domain = parsed.netloc.lower()
        
        # Check for keywords in the path and domain
        matches = []
        for keyword in self.all_valid_keywords:
            if keyword in path or keyword in domain:
                matches.append(keyword)
        
        return matches if matches else []

    def categorize_image(self, image_data: Dict[str, Any]) -> Optional[str]:
        """
        Categorize an image into one of the design feed categories
        """
        # Only categorize if the image is valid (to avoid categorizing non-design images)
        if not self.is_valid_design_image(image_data):
            return None
        
        # Extract text elements that might indicate category
        title = image_data.get('title', '').lower()
        alt_text = image_data.get('alt', '').lower()
        description = image_data.get('description', '').lower() if 'description' in image_data else ''
        tags = image_data.get('tags', [])
        
        # Combine text for analysis
        combined_text = f"{title} {alt_text} {description} {' '.join(tags)}".lower()
        
        # Check each category for matches
        for category, keywords in self.valid_categories.items():
            for keyword in keywords:
                if keyword.lower() in combined_text:
                    return category
        
        # If no category match found from text, try URL
        image_url = image_data.get('image', '') or image_data.get('url', '') or image_data.get('src', {}).get('large', '')
        url_keywords = self._extract_keywords_from_url(image_url)
        
        if url_keywords:
            # Try to map URL keywords back to categories
            for category, keywords in self.valid_categories.items():
                for keyword in keywords:
                    if keyword.lower() in url_keywords:
                        return category
        
        return None  # No matching category found
    
# Global instance
image_categorization_service = ImageCategorizationService()