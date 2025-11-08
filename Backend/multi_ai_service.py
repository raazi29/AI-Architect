import requests
import os
import logging
import time
import json
import re
from typing import Optional, Dict, Any, List, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultiAIService:
    """
    Multi-provider AI service for interior design image generation
    Uses multiple AI providers to avoid rate limits and ensure reliability
    """
    
    def __init__(self):
        # API tokens for different providers
        self.hf_token = os.environ.get("HUGGING_FACE_API_TOKEN")
        self.openai_token = os.environ.get("OPENAI_API_KEY")
        self.replicate_token = os.environ.get("REPLICATE_API_TOKEN")
        
        # Provider configurations
        self.providers = {
            "huggingface": {
                "enabled": bool(self.hf_token),
                "base_url": "https://router.huggingface.co/hf-inference/models",
                "models": [
                    "black-forest-labs/FLUX.1-dev",  # Primary: High-quality, accurate image generation
                    "stabilityai/stable-diffusion-3.5-large",  # Best model first
                    "stabilityai/stable-diffusion-xl-base-1.0",  # Base model second
                    "runwayml/stable-diffusion-v1-5"  # Fallback model last
                ]
            },
            "replicate": {
                "enabled": bool(self.replicate_token),
                "base_url": "https://api.replicate.com/v1/predictions",
                "models": [
                    "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478"
                ]
            }
        }
        
        # Room and style contexts (same as before)
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
        
        self.style_contexts = {
            "modern": "modern contemporary interior design, clean architectural lines, minimalist furniture, neutral color palette, natural lighting, professional photography, high-end materials, geometric forms, open space concept",
            "traditional": "traditional classic interior design, ornate architectural details, classic furniture pieces, warm color tones, elegant fixtures, sophisticated ambiance, rich textures, timeless elegance",
            "scandinavian": "scandinavian interior design, light wood elements, white walls, cozy atmosphere, hygge style, natural materials, functional furniture, soft lighting, minimalist aesthetic",
            "industrial": "industrial interior design, exposed brick walls, metal fixtures, concrete floors, urban loft style, raw materials, high ceilings, large windows, architectural elements",
            "luxury": "luxury high-end interior design, premium materials, sophisticated lighting design, elegant furniture, opulent details, marble surfaces, gold accents, designer pieces",
            "minimalist": "minimalist interior design, clean simple lines, neutral palette, uncluttered space, zen atmosphere, functional furniture, natural light, architectural simplicity",
            "bohemian": "bohemian eclectic interior design, vibrant colors, mixed patterns, artistic elements, creative atmosphere, vintage pieces, global influences, layered textures",
            "rustic": "rustic country interior design, natural wood elements, stone features, cozy farmhouse style, warm atmosphere, vintage furniture, natural textures, country charm"
        }

        # Regional styling cues for cultural fidelity
        self.regional_contexts = {
            "kerala": "Kerala traditional interior design, teak wood furniture, cane weaves, brass hanging lamps, jaali panels, tropical plants"
        }
    
    def _create_enhanced_prompt(self, user_prompt: str, style: str = "auto", room_type: str = "auto") -> str:
        """
        Create enhanced prompt with professional architectural accuracy
        Prioritizes user input while adding architectural quality enhancements
        """
        # Start with user's exact prompt - this is the foundation
        enhanced_prompt = user_prompt.strip()
        
        # Professional architectural prompt templates by style
        style_templates = {
            "modern": "modern contemporary interior design, clean architectural lines, minimalist furniture, neutral color palette, natural lighting, professional photography, high-end materials, geometric forms, open space concept",
            "traditional": "traditional classic interior design, ornate architectural details, classic furniture pieces, warm color tones, elegant fixtures, sophisticated ambiance, rich textures, timeless elegance",
            "scandinavian": "scandinavian interior design, light wood elements, white walls, cozy atmosphere, hygge style, natural materials, functional furniture, soft lighting, minimalist aesthetic",
            "industrial": "industrial interior design, exposed brick walls, metal fixtures, concrete floors, urban loft style, raw materials, high ceilings, large windows, architectural elements",
            "luxury": "luxury high-end interior design, premium materials, sophisticated lighting design, elegant furniture, opulent details, marble surfaces, gold accents, designer pieces",
            "minimalist": "minimalist interior design, clean simple lines, neutral palette, uncluttered space, zen atmosphere, functional furniture, natural light, architectural simplicity",
            "bohemian": "bohemian eclectic interior design, vibrant colors, mixed patterns, artistic elements, creative atmosphere, vintage pieces, global influences, layered textures",
            "rustic": "rustic country interior design, natural wood elements, stone features, cozy farmhouse style, warm atmosphere, vintage furniture, natural textures, country charm"
        }
        
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
                    "living_room": ["living", "lounge", "sitting", "family room", "couch", "sofa", "tv", "entertainment", "seating area", "family space"],
                    "bedroom": ["bedroom", "bed", "sleeping", "master", "guest room", "bedside", "wardrobe", "dressing", "sleep chamber"],
                    "kitchen": ["kitchen", "cooking", "cooker", "stove", "oven", "cabinets", "island", "counter", "dining", "cooking area", "culinary space"],
                    "bathroom": ["bathroom", "bath", "shower", "toilet", "sink", "vanity", "tub", "washroom", "bathing", "wash area"],
                    "office": ["office", "study", "desk", "work", "computer", "workspace", "home office", "study room", "work area"],
                    "dining_room": ["dining", "dinner", "table", "meals", "formal", "dining area", "kitchen", "eating", "dining space"],
                    "hallway": ["hall", "entry", "foyer", "entrance", "corridor", "passage", "hallway", "mudroom", "entryway"],
                    "outdoor": ["outdoor", "garden", "patio", "terrace", "balcony", "exterior", "yard", "deck", "porch", "landscape"]
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
                "modern": ["modern", "contemporary", "clean", "minimal", "sleek", "simple", "functional", "minimalist", "scandinavian", "current", "present-day"],
                "traditional": ["traditional", "classic", "vintage", "classic", "antique", "ornate", "formal", "period", "victorian", "colonial", "heritage", "classic style"],
                "scandinavian": ["scandinavian", "nordic", "hygge", "light", "wood", "minimal", "cozy", "natural", "simple", "danish", "swedish", "norwegian"],
                "industrial": ["industrial", "loft", "exposed", "brick", "metal", "concrete", "urban", "warehouse", "steel", "factory", "raw"],
                "luxury": ["luxury", "luxurious", "premium", "elegant", "sophisticated", "high-end", "opulent", "upscale", "exclusive", "lavish", "extravagant"],
                "minimalist": ["minimalist", "minimal", "simple", "clean", "uncluttered", "zen", "basic", "essential", "pure", "sparse", "unadorned"],
                "bohemian": ["bohemian", "boho", "eclectic", "colorful", "vibrant", "artistic", "free-spirited", "hippie", "gypsy", "creative", "expressive"],
                "rustic": ["rustic", "farmhouse", "country", "cottage", "wood", "stone", "natural", "cozy", "rural", "vintage", "earthy", "homestead"]
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
        
        # Add regional context when detected
        lower_prompt = user_prompt.lower()
        for keyword, context in self.regional_contexts.items():
            if keyword in lower_prompt:
                enhanced_prompt = f"{enhanced_prompt}, {context}"
                break
        
        # Enhanced object and placement detection
        # This helps the AI focus on the specific items and their locations the user wants
        
        # Specific objects that need to be emphasized
        specific_objects = []
        placement_indicators = ["left", "right", "center", "middle", "corner", "side", "behind", "in front", "near", "on", "under", "above", "beside", "next to", "adjacent to"]
        
        # Look for specific objects mentioned with descriptors
        object_patterns = [
            r"(\w+)\s+on\s+the\s+(\w+)\s+(?:side|corner)",  # "bonsai tree on the left side"
            r"(\w+)\s+on\s+the\s+(?:left|right|center)",    # "espresso machine on the left"
            r"a\s+(\w+)\s+in\s+a\s+(\w+)\s+pot",           # "bonsai tree in a white pot"
            r"(\w+)\s+in\s+a\s+(\w+)\s+pot",               # "bonsai tree in white pot"
            r"(\w+)\s+of\s+green\s+(\w+)",                 # "bowl of green apples"
            r"(\w+)\s+in\s+(?:a|the)\s+(\w+)\s+color",     # "pot in white color"
            r"(\w+)\s+(?:on|at)\s+(?:the\s+)?(?:left|right)\s+(?:side|corner)",  # "plant on the left side"
            r"(\w+)\s+(?:placed|positioned)\s+(?:on|at)\s+(?:the\s+)?(?:left|right|center)",  # "lamp placed on the left"
            r"(\w+)\s+(?:sitting|standing|located)\s+(?:on|at)\s+(?:the\s+)?(?:left|right|center)",  # "vase sitting on the left"
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
        if "floor-to-ceiling" in lower_prompt and "window" in lower_prompt:
            specific_items.append("floor-to-ceiling window")
        if "king-sized" in lower_prompt and "bed" in lower_prompt:
            specific_items.append("king-sized bed")
        if "upholstered headboard" in lower_prompt:
            specific_items.append("upholstered headboard")
        if "warm wooden flooring" in lower_prompt:
            specific_items.append("warm wooden flooring")
        if "round rug" in lower_prompt:
            specific_items.append("round rug")
        if "chaise lounge" in lower_prompt:
            specific_items.append("chaise lounge")
        if "accent wall" in lower_prompt:
            specific_items.append("accent wall")
        if "built-in shelving" in lower_prompt:
            specific_items.append("built-in shelving")
        
        # Enhanced placement details
        placement_details = []
        placement_patterns = [
            r"(\w+)\s+(?:on|at)\s+(?:the\s+)?(left|right|center)\s+(?:side|corner)",
            r"(\w+)\s+(?:placed|positioned)\s+(?:on|at)\s+(?:the\s+)?(left|right|center)",
            r"(\w+)\s+(?:sitting|standing|located)\s+(?:on|at)\s+(?:the\s+)?(left|right|center)",
            r"(?:a\s+)?(\w+)\s+(?:in|on)\s+(?:the\s+)?(corner|middle|center)",
            r"(\w+)\s+(?:next\s+to|beside)\s+(?:the\s+)?(\w+)",
            r"(\w+)\s+(?:behind|in\s+front\s+of)\s+(?:the\s+)?(\w+)"
        ]
        
        for pattern in placement_patterns:
            matches = re.findall(pattern, user_prompt, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple) and len(match) >= 2:
                    placement_details.append(f"{match[0]} {match[1]}")
                elif isinstance(match, str):
                    placement_details.append(match)
        
        # Look for specific furniture mentioned in the prompt
        furniture_keywords = [
            "sofa", "couch", "chair", "table", "bed", "desk", "cabinet", "shelf", "bookshelf",
            "lamp", "lighting", "window", "fireplace", "tv", "couch", "ottoman", "dining table",
            "wardrobe", "dresser", "nightstand", "mirror", "rug", "carpet", "curtains", "blinds",
            "chandelier", "armoire", "sideboard", "buffet", "credenza", "hutch", "cabinet",
            "bench", "stool", "barstool", "recliner", "sectional", "love seat", "accent chair",
            "console table", "coffee table", "end table", "side table", "dining chair",
            "bar cart", "plant stand", "media console", "entertainment center"
        ]
        
        mentioned_furniture = []
        for keyword in furniture_keywords:
            if keyword in lower_prompt:
                mentioned_furniture.append(keyword)
        
        # Combine all specific elements
        all_specific_elements = list(set(specific_objects + specific_items + placement_details + mentioned_furniture))
        
        if all_specific_elements:
            elements_str = ", ".join(all_specific_elements)
            enhanced_prompt = f"{enhanced_prompt}, MAKE SURE TO INCLUDE: {elements_str}"
        
        # Enhanced emphasis on placement if mentioned
        if any(indicator in lower_prompt for indicator in placement_indicators):
            enhanced_prompt = f"{enhanced_prompt}, PAY SPECIAL ATTENTION TO PLACEMENT: left, right, center, sides, corners, middle as specifically described by the user"
        
        # Add room dimension context from explicit sizes
        dimension_match = re.search(r"(\d+)\s*[xX]\s*(\d+)", user_prompt)
        if dimension_match:
            width_ft, length_ft = dimension_match.groups()
            enhanced_prompt = (
                f"{enhanced_prompt}, true-to-scale {width_ft} ft by {length_ft} ft room proportions, accurate furniture spacing, realistic dimensions"
            )
        
        # Add high-quality, realistic rendering context with emphasis on details
        realism_context = (
            "interior design photography, realistic lighting, professional interior design, "
            "detailed textures, accurate proportions, high resolution, 8k quality, "
            "natural lighting, professional staging, architecturally accurate, "
            "sharp focus on details, precise object placement, accurate colors, "
            "professional architectural rendering, photorealistic, studio lighting, "
            "architectural precision, material realism, proper scale and perspective"
            "physically-based rendering, global illumination, realistic materials, "
            "proper shadows and reflections, photorealistic quality"
        )
        
        # Add practical context with emphasis on specific objects
        practical_context = (
            "functional design, livable space, ergonomic layout, practical furniture arrangement, "
            "realistic ceiling height, proper scale, believable materials, safe and practical design, "
            "every object clearly visible and correctly placed as described, "
            "realistic furniture proportions, authentic textures, accurate architectural elements, "
            "believable lighting setup, proper furniture placement, realistic room flow"
        )
        
        enhanced_prompt = f"{enhanced_prompt}, {realism_context}, {practical_context}"
        
        # Add a final emphasis to follow the description exactly
        enhanced_prompt = f"{enhanced_prompt}, CRITICAL: INCLUDE ALL SPECIFIC OBJECTS MENTIONED AND FOLLOW PLACEMENT INSTRUCTIONS EXACTLY AS DESCRIBED BY THE USER"
        
        return enhanced_prompt
    
    def _create_negative_prompt(self, room_type: str) -> str:
        """
        Create professional negative prompt to ensure architectural accuracy
        """
        base_negative = (
            "blurry, low quality, distorted, ugly, bad anatomy, bad proportions, grainy, overexposed, underexposed, "
            "washed out colors, cartoon, illustration, CGI, rendered, fake lighting, watermark, logo, text, floating objects, "
            "impractical fixtures, unsafe lighting, exposed wiring, impossible structures, exaggerated proportions, "
            "unrealistic materials, poor lighting, cluttered, messy, unprofessional, amateur, low resolution, "
            "distorted perspective, wrong scale, floating furniture, impossible architecture, bad composition, "
            "oversaturated colors, artificial lighting, poor shadows, unrealistic reflections, bad textures, "
            "inconsistent style, mixed architectural periods, non-functional design, unsafe elements"
        )
        # Add specific room exclusions to prevent wrong room types (skip for auto)
        if room_type.lower() == "auto":
            room_exclusions = ""  # Don't exclude any rooms when auto-detecting
        elif room_type.lower() == "bedroom":
            room_exclusions = "kitchen, bathroom, living room, office"
        elif room_type.lower() == "kitchen":
            room_exclusions = "bedroom, bathroom, living room, office"
        elif room_type.lower() == "bathroom":
            room_exclusions = "bedroom, kitchen, living room, office"
        elif room_type.lower() == "living_room":
            room_exclusions = "bedroom, kitchen, bathroom, office"
        elif room_type.lower() == "office":
            room_exclusions = "bedroom, kitchen, bathroom, living room"
        else:
            # For other room types, exclude the most common ones
            room_exclusions = "bedroom, kitchen, bathroom"
        
        if room_exclusions:
            return f"{base_negative}, {room_exclusions}"
        else:
            return base_negative
    
    def _try_huggingface(self, prompt: str, negative_prompt: str, **kwargs) -> Optional[bytes]:
        """
        Try Hugging Face API
        """
        if not self.providers["huggingface"]["enabled"]:
            return None
            
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        
        for model in self.providers["huggingface"]["models"]:
            try:
                url = f"{self.providers['huggingface']['base_url']}/{model}"
                
                # Enhanced quality parameters for professional results
                parameters = {
                    "num_inference_steps": kwargs.get("steps", 50),  # Higher steps for better quality
                    "guidance_scale": kwargs.get("guidance_scale", 9.0),  # Higher guidance for better prompt adherence
                    "width": kwargs.get("width", 1024),
                    "height": kwargs.get("height", 1024),
                    "negative_prompt": negative_prompt,
                    "scheduler": "DPMSolverMultistepScheduler",  # Better scheduler for quality
                    "num_images_per_prompt": 1
                }
                
                # Adjust parameters for specific models
                if "FLUX.1-dev" in model:
                    # FLUX.1-dev works best with specific parameters for accuracy
                    parameters["num_inference_steps"] = min(kwargs.get("steps", 28), 28)  # FLUX works well with fewer steps
                    parameters["guidance_scale"] = min(kwargs.get("guidance_scale", 3.5), 3.5)  # Lower guidance for FLUX
                    # FLUX prefers specific dimensions
                    if parameters["width"] == 1024 and parameters["height"] == 1024:
                        parameters["width"] = 1024
                        parameters["height"] = 1024  # FLUX works well with square images
                elif "stable-diffusion-3.5-large" in model:
                    # The 3.5-large model might have different parameter requirements
                    # Try with fewer inference steps to avoid timeouts/errors
                    parameters["num_inference_steps"] = min(kwargs.get("steps", 25), 25)  # Even fewer steps for better model
                    # Some models work better with different dimensions
                    if parameters["width"] == 1024 and parameters["height"] == 1024:
                        parameters["width"] = 768
                        parameters["height"] = 768
                    # Add guidance scale adjustment for better model
                    parameters["guidance_scale"] = min(kwargs.get("guidance_scale", 8.0), 8.0)  # Slightly higher guidance
                
                # Retry logic for the better model
                max_retries = 5 if "stable-diffusion-3.5-large" in model else 1
                for attempt in range(max_retries):
                    if attempt > 0:
                        logger.info(f"Retrying {model} (attempt {attempt + 1}/{max_retries})")
                        # Slightly adjust parameters for retry
                        parameters["seed"] = int(time.time() * 1000) % 1000000
                
                    payload = {
                        "inputs": prompt,
                        "parameters": parameters
                    }
                
                    logger.info(f"Trying Hugging Face model: {model}")
                    logger.info(f"Parameters: {parameters}")
                    response = requests.post(url, headers=headers, json=payload, timeout=180)  # Increased timeout for better model
                    
                    if response.status_code == 200:
                        content_length = len(response.content)
                        if content_length > 1000:  # Valid image size
                            logger.info(f"✅ Success with Hugging Face model: {model}")
                            return response.content
                        else:
                            logger.warning(f"Response too small from {model}: {content_length} bytes")
                    elif response.status_code == 400:
                        logger.warning(f"Bad request for {model}: {response.text[:500]}")
                        # Log the full request for debugging
                        logger.debug(f"Full request payload for {model}: {payload}")
                        # Don't retry on bad requests as they're likely due to invalid parameters
                        break
                    elif response.status_code == 429:
                        logger.warning(f"Rate limit hit for {model}")
                        time.sleep(10)  # Wait longer for rate limits
                    elif response.status_code == 503:
                        logger.info(f"Model {model} is loading")
                        time.sleep(15)  # Wait longer for model loading
                    else:
                        logger.warning(f"HF API error {response.status_code} for {model}: {response.text[:500]}")
                        # For other errors, wait before retrying
                        time.sleep(5)
                    
                    if attempt < max_retries - 1:
                        time.sleep(5)  # Wait between retries
                
                # If we get here, this model failed, continue to next model
                continue
                
            except Exception as e:
                logger.error(f"Error with HF model {model}: {str(e)}")
                continue
        
        return None
    
    def _try_replicate(self, prompt: str, negative_prompt: str, **kwargs) -> Optional[bytes]:
        """
        Try Replicate API (if available)
        """
        if not self.providers["replicate"]["enabled"]:
            return None
            
        # Replicate implementation would go here
        # For now, return None as it requires additional setup
        logger.info("Replicate provider not implemented yet")
        return None
    
    def generate_interior_image(
        self,
        prompt: str,
        style: str = "auto",
        room_type: str = "auto",
        **kwargs
    ) -> Tuple[Optional[bytes], bool]:
        """
        Generate interior design image using multiple AI providers
        """
        logger.info(f"🎨 Generating image: {room_type} in {style} style")
        logger.info(f"User prompt: {prompt}")
        
        # Create enhanced prompts
        enhanced_prompt = self._create_enhanced_prompt(prompt, style, room_type)
        negative_prompt = self._create_negative_prompt(room_type)
        
        logger.info(f"Enhanced prompt: {enhanced_prompt[:100]}...")
        logger.info(f"Negative prompt: {negative_prompt[:100]}...")
        
        # Try providers in order of preference
        providers_to_try = [
            ("huggingface", self._try_huggingface),
            ("replicate", self._try_replicate)
        ]
        
        for provider_name, provider_func in providers_to_try:
            if self.providers[provider_name]["enabled"]:
                logger.info(f"🔄 Trying {provider_name} provider...")
                result = provider_func(enhanced_prompt, negative_prompt, **kwargs)
                if result:
                    logger.info(f"✅ Successfully generated image with {provider_name}")
                    return result, False
                else:
                    logger.warning(f"❌ {provider_name} provider failed")
            else:
                logger.info(f"⏭️ {provider_name} provider not configured")
        
        # If all AI services fail, propagate failure (no placeholder image)
        logger.error("❌ Complete failure - no image generated")
        return None, False
    
    def get_provider_status(self) -> Dict[str, Any]:
        """
        Get status of all configured providers
        """
        status = {}
        for provider_name, config in self.providers.items():
            status[provider_name] = {
                "enabled": config["enabled"],
                "models_count": len(config.get("models", [])),
                "available": config["enabled"]
            }
        return status

# Initialize service instance
multi_ai_service = MultiAIService()
