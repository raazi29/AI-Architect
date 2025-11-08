import requests
import os
import logging
import time
import re
from typing import Optional, Dict, Any
import base64
import io
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InteriorAIService:
    """
    Service for generating interior design and architecture images using specialized interior design models
    """
    
    def __init__(self):
        self.api_token = os.environ.get("HUGGING_FACE_API_TOKEN")
        self.base_url = "https://router.huggingface.co/hf-inference/models"
        
        # Primary models for interior design generation (FLUX.1-dev prioritized for accuracy)
        self.primary_models = [
            "black-forest-labs/FLUX.1-dev",  # Primary: High-quality, accurate image generation
            "Viktor1717/scandinavian-interior-style1",  # Specialized scandinavian interior model
            "SedatAl/Interior-Flux-Lora"  # Specialized interior design model
        ]
        
        # Secondary model (previous primary)
        self.secondary_model = "stabilityai/stable-diffusion-3.5-large"
        
        # Fallback models for reliability
        self.fallback_models = [
            "stabilityai/stable-diffusion-xl-base-1.0",
            "runwayml/stable-diffusion-v1-5",
            "CompVis/stable-diffusion-v1-4"
        ]
        
        # Architecture and interior design context prompts
        self.context_prompts = {
            "modern": "modern contemporary interior design, clean lines, minimalist aesthetic, neutral colors, natural lighting",
            "traditional": "traditional classic interior design, warm colors, rich textures, elegant furniture, sophisticated ambiance",
            "scandinavian": "scandinavian interior design, light wood, white walls, cozy atmosphere, hygge style, natural materials",
            "industrial": "industrial interior design, exposed brick, metal fixtures, concrete floors, urban loft style",
            "luxury": "luxury high-end interior design, premium materials, sophisticated lighting, elegant furniture, opulent details",
            "minimalist": "minimalist interior design, clean simple lines, neutral palette, uncluttered space, zen atmosphere",
            "bohemian": "bohemian eclectic interior design, vibrant colors, mixed patterns, artistic elements, creative atmosphere",
            "rustic": "rustic country interior design, natural wood, stone elements, cozy farmhouse style, warm atmosphere"
        }
        
        # Regional styling cues for cultural accuracy
        self.regional_contexts = {
            "kerala": "Kerala traditional interior design, teak wood furniture, woven cane elements, brass lamps, earthy textiles, tropical greenery, sloped ceiling ventilation"
        }
        
        # Room-specific enhancement prompts
        self.room_contexts = {
            "living_room": "spacious living room with comfortable seating, coffee table, entertainment area",
            "bedroom": "serene bedroom with comfortable bed, nightstands, wardrobe, relaxing atmosphere",
            "kitchen": "functional modern kitchen with island, cabinets, appliances, dining area",
            "bathroom": "elegant bathroom with vanity, shower, bathtub, modern fixtures",
            "office": "professional home office with desk, chair, storage, good lighting",
            "dining_room": "elegant dining room with table, chairs, chandelier, sophisticated ambiance",
            "hallway": "welcoming entrance hallway with storage, lighting, decorative elements",
            "outdoor": "beautiful outdoor space, patio, garden, landscape architecture"
        }
        
        if not self.api_token:
            logger.warning("HUGGING_FACE_API_TOKEN not found. Interior AI generation will not work.")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers with authorization"""
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    def _enhance_prompt(self, prompt: str, style: str = "auto", room_type: str = "auto") -> str:
        """
        Enhance the user prompt while strictly preserving user's specific requirements
        CRITICAL: User input takes absolute priority - only add minimal technical enhancements
        """
        # Start with the user's exact prompt - this is the most important part
        user_prompt = prompt.strip()
        
        # Auto-detect room type from user prompt if "auto" is specified
        detected_room_type = None
        if room_type == "auto":
            # Check for room type keywords in the prompt
            for room_key, room_desc in self.room_contexts.items():
                # Look for keywords that suggest this room type
                room_keywords = room_desc.split()
                for keyword in room_keywords[:4]: # Check first few words for common identifiers
                    if keyword.lower() in user_prompt.lower():
                        detected_room_type = room_key
                        break
                if detected_room_type:
                    break
            
            # Additional room type detection
            if not detected_room_type:
                room_type_keywords = {
                    "living_room": ["living", "lounge", "sitting", "family room", "couch", "sofa", "tv", "entertainment", "seating area"],
                    "bedroom": ["bedroom", "bed", "sleeping", "master", "guest room", "bedside", "wardrobe", "dressing"],
                    "kitchen": ["kitchen", "cooking", "cooker", "stove", "oven", "cabinets", "island", "counter", "dining", "cooking area"],
                    "bathroom": ["bathroom", "bath", "shower", "toilet", "sink", "vanity", "tub", "washroom", "bathing"],
                    "office": ["office", "study", "desk", "work", "computer", "workspace", "home office", "study room"],
                    "dining_room": ["dining", "dinner", "table", "meals", "formal", "dining area", "kitchen", "eating"],
                    "hallway": ["hall", "entry", "foyer", "entrance", "corridor", "passage", "hallway", "mudroom"],
                    "outdoor": ["outdoor", "garden", "patio", "terrace", "balcony", "exterior", "yard", "deck", "porch"]
                }
                
                for room_key, keywords in room_type_keywords.items():
                    for keyword in keywords:
                        if keyword in user_prompt.lower():
                            detected_room_type = room_key
                            break
                    if detected_room_type:
                        break
        
        # Auto-detect style from user prompt if "auto" is specified
        detected_style = None
        if style == "auto":
            # Check for style keywords in the prompt
            style_keywords = {
                "modern": ["modern", "contemporary", "clean", "minimal", "sleek", "simple", "functional", "minimalist", "scandinavian"],
                "traditional": ["traditional", "classic", "vintage", "classic", "antique", "ornate", "formal", "period", "victorian", "colonial"],
                "scandinavian": ["scandinavian", "nordic", "hygge", "light", "wood", "minimal", "cozy", "natural", "simple"],
                "industrial": ["industrial", "loft", "exposed", "brick", "metal", "concrete", "urban", "warehouse", "steel"],
                "luxury": ["luxury", "luxurious", "premium", "elegant", "sophisticated", "high-end", "opulent", "upscale", "exclusive"],
                "minimalist": ["minimalist", "minimal", "simple", "clean", "uncluttered", "zen", "basic", "essential", "pure"],
                "bohemian": ["bohemian", "boho", "eclectic", "colorful", "vibrant", "artistic", "free-spirited", "hippie", "gypsy"],
                "rustic": ["rustic", "farmhouse", "country", "cottage", "wood", "stone", "natural", "cozy", "rural", "vintage"]
            }
            
            for style_key, keywords in style_keywords.items():
                for keyword in keywords:
                    if keyword in user_prompt.lower():
                        detected_style = style_key
                        break
                if detected_style:
                    break
        
        # Construct the enhanced prompt with better structure
        enhanced_prompt = user_prompt
        
        # Add room type context if needed
        if room_type != "auto" and room_type != "living_room":
            # Only add if not already mentioned in the prompt
            room_mentioned = any(room.replace("_", " ") in user_prompt.lower() for room in self.room_contexts.keys())
            if not room_mentioned:
                enhanced_prompt = f"{room_type.replace('_', ' ')}: {enhanced_prompt}"
        elif room_type == "auto" and detected_room_type:
            # Use auto-detected room type
            enhanced_prompt = f"{detected_room_type.replace('_', ' ')}: {enhanced_prompt}"
        
        # Add style context if needed
        if style != "auto" and style != "modern":
            # Only add if not already mentioned in the prompt
            style_keywords_list = ["modern", "traditional", "scandinavian", "industrial", "luxury", "minimalist", "bohemian", "rustic", "contemporary", "classic", "vintage"]
            style_mentioned = any(keyword in user_prompt.lower() for keyword in style_keywords_list)
            if not style_mentioned:
                enhanced_prompt = f"{enhanced_prompt}, {style} style"
        elif style == "auto" and detected_style:
            # Use auto-detected style
            enhanced_prompt = f"{enhanced_prompt}, {detected_style} style"
        
        # Add regional context when the user references a specific locale
        lower_prompt = user_prompt.lower()
        for keyword, context in self.regional_contexts.items():
            if keyword in lower_prompt:
                enhanced_prompt = f"{enhanced_prompt}, {context}"
                break
        
        # Enhanced object and placement detection
        # This helps the AI focus on the specific items and their locations the user wants
        
        # Specific objects that need to be emphasized
        specific_objects = []
        placement_indicators = ["left", "right", "center", "middle", "corner", "side", "behind", "in front", "near", "on", "under", "above"]
        
        # Look for specific objects mentioned with descriptors
        object_patterns = [
            r"(\w+)\s+on\s+the\s+(\w+)\s+(?:side|corner)",  # "bonsai tree on the left side"
            r"(\w+)\s+on\s+the\s+(?:left|right|center)",    # "espresso machine on the left"
            r"a\s+(\w+)\s+in\s+a\s+(\w+)\s+pot",           # "bonsai tree in a white pot"
            r"(\w+)\s+in\s+a\s+(\w+)\s+pot",               # "bonsai tree in white pot"
            r"(\w+)\s+of\s+green\s+(\w+)",                 # "bowl of green apples"
            r"(\w+)\s+in\s+(?:a|the)\s+(\w+)\s+color",     # "pot in white color"
        ]
        
        import re
        for pattern in object_patterns:
            matches = re.findall(pattern, user_prompt, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    specific_objects.extend(list(match))
                else:
                    specific_objects.append(match)
        
        # Look for objects with specific attributes
        specific_items = []
        if "bonsai" in lower_prompt:
            specific_items.append("bonsai tree")
            if "white" in lower_prompt and "pot" in lower_prompt:
                specific_items.append("white pot for bonsai")
        if "espresso machine" in lower_prompt or ("espresso" in lower_prompt and "machine" in lower_prompt):
            specific_items.append("silver espresso machine")
        if "green apples" in lower_prompt or ("green" in lower_prompt and "apples" in lower_prompt):
            specific_items.append("green apples")
        if "pendant lights" in lower_prompt or ("pendant" in lower_prompt and "lights" in lower_prompt):
            specific_items.append("three hanging pendant lights")
        
        # Placement details
        placement_details = []
        for indicator in placement_indicators:
            if indicator in lower_prompt:
                # Look for objects near placement indicators
                words = user_prompt.split()
                for i, word in enumerate(words):
                    if indicator.lower() == word.lower() and i > 0:
                        placement_details.append(f"{words[i-1]} {word}")
        
        # Combine all specific elements
        all_specific_elements = list(set(specific_objects + specific_items + placement_details))
        
        if all_specific_elements:
            elements_str = ", ".join(all_specific_elements)
            enhanced_prompt = f"{enhanced_prompt}, MAKE SURE TO INCLUDE: {elements_str}"
        
        # Emphasize placement if mentioned
        if any(indicator in lower_prompt for indicator in placement_indicators):
            enhanced_prompt = f"{enhanced_prompt}, PAY ATTENTION TO PLACEMENT: left, right, center, sides as specified"
        
        # Add high-quality, realistic rendering context with emphasis on details
        realism_context = (
            "interior design photography, realistic lighting, professional interior design, "
            "detailed textures, accurate proportions, high resolution, 8k quality, "
            "natural lighting, professional staging, architecturally accurate, "
            "sharp focus on details, precise object placement, accurate colors"
        )
        
        # Add practical context with emphasis on specific objects
        practical_context = (
            "functional design, livable space, ergonomic layout, practical furniture arrangement, "
            "realistic ceiling height, proper scale, believable materials, safe and practical design, "
            "every object clearly visible and correctly placed as described"
        )
        
        enhanced_prompt = f"{enhanced_prompt}, {realism_context}, {practical_context}"
        
        # FLUX.1-dev specific enhancements for better accuracy
        flux_enhancements = (
            "photorealistic interior design, professional architectural photography, "
            "ultra-detailed textures, physically accurate lighting, global illumination, "
            "accurate material properties, proper perspective and scale, "
            "high dynamic range, realistic shadows and reflections, "
            "meticulous attention to user-specified object placement and positioning, "
            "exact room layout as described, precise furniture arrangement, "
            "authentic architectural details, professional interior styling"
        )
        
        enhanced_prompt = f"{enhanced_prompt}, {flux_enhancements}"
        
        # Add a final emphasis to follow the description exactly
        enhanced_prompt = f"{enhanced_prompt}, CRITICAL: INCLUDE ALL SPECIFIC OBJECTS MENTIONED AND FOLLOW PLACEMENT INSTRUCTIONS EXACTLY, NO ABSTRACT OR GENERIC ELEMENTS - BE PRECISE"
        
        return enhanced_prompt
    
    def _get_negative_room_types(self, target_room: str) -> str:
        """Generate negative prompts to avoid wrong room types"""
        if target_room.lower() == "auto":
            return ""  # Don't exclude any rooms when auto-detecting
        elif target_room.lower() == "bedroom":
            return "kitchen, bathroom, living room, office"
        elif target_room.lower() == "kitchen":
            return "bedroom, bathroom, living room, office"
        elif target_room.lower() == "bathroom":
            return "bedroom, kitchen, living room, office"
        elif target_room.lower() == "living_room":
            return "bedroom, kitchen, bathroom, office"
        elif target_room.lower() == "office":
            return "bedroom, kitchen, bathroom, living room"
        else:
            return "bedroom, kitchen, bathroom"
    
    def _make_request(self, model: str, prompt: str, **kwargs) -> Optional[bytes]:
        """
        Make API request to Hugging Face model with better error handling
        """
        url = f"{self.base_url}/{model}"
        
        # Build negative prompt with room-specific exclusions
        base_negative = (
            "blurry, low quality, distorted, ugly, bad anatomy, bad proportions, grainy, overexposed, underexposed, "
            "washed out colors, cartoon, illustration, CGI, rendered, fake lighting, watermark, logo, text, floating objects, "
            "impractical fixtures, unsafe lighting, exposed wiring, impossible structures, exaggerated proportions"
        )
        room_type = kwargs.get("room_type", "living_room")
        negative_room_types = self._get_negative_room_types(room_type)
        if negative_room_types:
            full_negative_prompt = f"{base_negative}, {negative_room_types}"
        else:
            full_negative_prompt = base_negative
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "num_inference_steps": kwargs.get("steps", 50),
                "guidance_scale": kwargs.get("guidance_scale", 7.5),
                "width": kwargs.get("width", 1024),
                "height": kwargs.get("height", 1024),
                "negative_prompt": kwargs.get("negative_prompt", full_negative_prompt)
            }
        }
        
        try:
            logger.info(f"Making request to model: {model}")
            logger.info(f"Prompt: {prompt[:100]}...")
            
            response = requests.post(
                url, 
                headers=self._get_headers(), 
                json=payload, 
                timeout=120
            )
            
            logger.info(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                # Validate that we got actual image data, not cached/random content
                content_length = len(response.content)
                logger.info(f"Received image data: {content_length} bytes")
                
                if content_length < 1000:  # Too small to be a real image
                    logger.warning(f"Response too small ({content_length} bytes), likely not a real image")
                    return None
                    
                return response.content
            elif response.status_code == 429:
                logger.warning(f"Rate limit hit for model {model}")
                return None
            elif response.status_code == 503:
                logger.info(f"Model {model} is loading, will retry...")
                return None
            elif response.status_code == 404:
                logger.warning(f"Model {model} not found")
                return None
            else:
                logger.error(f"API error {response.status_code}: {response.text[:200]}")
                return None
                
        except requests.exceptions.Timeout:
            logger.warning(f"Request to {model} timed out")
            return None
        except Exception as e:
            logger.error(f"Error with model {model}: {str(e)}")
            return None
    
    def generate_interior_design(
        self,
        prompt: str,
        style: str = "auto",
        room_type: str = "auto",
        **kwargs
    ) -> Optional[bytes]:
        """
        Generate interior design image using AI
        
        Args:
            prompt: User's description of the desired interior
            style: Design style (modern, traditional, scandinavian, etc.)
            room_type: Type of room (living_room, bedroom, kitchen, etc.)
            **kwargs: Additional parameters for image generation
        
        Returns:
            Image bytes if successful, None otherwise
        """
        if not self.api_token:
            raise ValueError("HUGGING_FACE_API_TOKEN not configured")
        
        # Enhance the prompt with architectural context
        enhanced_prompt = self._enhance_prompt(prompt, style, room_type)
        logger.info(f"Enhanced prompt: {enhanced_prompt[:100]}...")
        
        # Try primary models first, then secondary, then fallbacks
        models_to_try = self.primary_models + [self.secondary_model] + self.fallback_models
        
        # Add room_type to kwargs for negative prompt generation
        kwargs['room_type'] = room_type
        
        for i, model in enumerate(models_to_try):
            logger.info(f"Trying model {i+1}/{len(models_to_try)}: {model}")
            result = self._make_request(model, enhanced_prompt, **kwargs)
            if result:
                logger.info(f"✅ Successfully generated image with model: {model}")
                logger.info(f"Final prompt used: {enhanced_prompt}")
                return result
            
            # Wait a bit before trying next model (longer wait for rate limits)
            wait_time = 3 if i == 0 else 5  # Wait longer for subsequent models
            logger.info(f"Waiting {wait_time} seconds before trying next model...")
            time.sleep(wait_time)
        
        logger.error("❌ All models failed to generate image")
        logger.error(f"Attempted prompt: {enhanced_prompt}")
        return None
    
    def generate_architecture_design(
        self, 
        prompt: str, 
        building_type: str = "residential",
        architectural_style: str = "contemporary",
        **kwargs
    ) -> Optional[bytes]:
        """
        Generate architectural design image
        
        Args:
            prompt: Description of the building/structure
            building_type: Type of building (residential, commercial, etc.)
            architectural_style: Architectural style (contemporary, classical, etc.)
            **kwargs: Additional parameters
        
        Returns:
            Image bytes if successful, None otherwise
        """
        if not self.api_token:
            raise ValueError("HUGGING_FACE_API_TOKEN not configured")
        
        # Architecture-specific context
        arch_context = f"professional architectural rendering, {architectural_style} {building_type} architecture"
        arch_context += ", exterior view, detailed facade, realistic materials and lighting"
        arch_context += ", architectural photography style, high resolution, detailed design"
        
        enhanced_prompt = f"{arch_context}, {prompt}"
        enhanced_prompt += ", 8k resolution, architectural visualization, professional rendering"
        
        logger.info(f"Architecture prompt: {enhanced_prompt[:100]}...")
        
        # Try models
        models_to_try = self.primary_models + [self.secondary_model] + self.fallback_models
        
        for model in models_to_try:
            result = self._make_request(model, enhanced_prompt, **kwargs)
            if result:
                logger.info(f"✅ Successfully generated architecture with model: {model}")
                return result
            
            time.sleep(2)
        
        logger.error("All models failed to generate architecture image")
        return None
    
    def get_available_styles(self) -> list:
        """Get list of available design styles"""
        return list(self.context_prompts.keys())
    
    def get_available_room_types(self) -> list:
        """Get list of available room types"""
        return list(self.room_contexts.keys())

    def generate_texture(self, prompt: str, **kwargs) -> Optional[bytes]:
        """
        Generate a texture image from a text description.
        """
        if not self.api_token:
            raise ValueError("HUGGING_FACE_API_TOKEN not configured")

        # Enhance the prompt for texture generation
        enhanced_prompt = f"seamless texture, {prompt}, high resolution, 4k, detailed, photorealistic"

        # Use a model good for textures
        model = "stabilityai/stable-diffusion-xl-base-1.0"

        result = self._make_request(model, enhanced_prompt, **kwargs)

        if result:
            logger.info(f"✅ Successfully generated texture with model: {model}")
            return result
        else:
            logger.error("Failed to generate texture")
            return None

# Initialize service instance
interior_ai_service = InteriorAIService()
