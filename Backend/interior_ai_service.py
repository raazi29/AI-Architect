import requests
import os
import logging
import time
from typing import Optional, Dict, Any
import base64
import io
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InteriorAIService:
    """
    Service for generating interior design and architecture images using Stability AI's stable-diffusion-3.5-large model
    """
    
    def __init__(self):
        self.api_token = os.environ.get("HUGGING_FACE_API_TOKEN")
        self.base_url = "https://api-inference.huggingface.co/models"
        
        # Primary model for interior design generation
        self.primary_model = "stabilityai/stable-diffusion-3.5-large"
        
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
    
    def _enhance_prompt(self, prompt: str, style: str = "modern", room_type: str = "living_room") -> str:
        """
        Enhance the user prompt with architectural and interior design context
        """
        # Base architectural context
        base_context = "professional architectural interior design photograph, high quality, detailed, realistic lighting"
        
        # Add style context
        style_context = self.context_prompts.get(style.lower(), self.context_prompts["modern"])
        
        # Add room context
        room_context = self.room_contexts.get(room_type.lower(), self.room_contexts["living_room"])
        
        # Combine all contexts
        enhanced_prompt = f"{base_context}, {style_context}, {room_context}, {prompt}"
        
        # Add quality and technical specifications
        enhanced_prompt += ", 8k resolution, professional photography, architectural digest style, perfect composition"
        
        return enhanced_prompt
    
    def _make_request(self, model: str, prompt: str, **kwargs) -> Optional[bytes]:
        """
        Make API request to Hugging Face model
        """
        url = f"{self.base_url}/{model}"
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "num_inference_steps": kwargs.get("steps", 50),
                "guidance_scale": kwargs.get("guidance_scale", 7.5),
                "width": kwargs.get("width", 1024),
                "height": kwargs.get("height", 1024),
                "negative_prompt": kwargs.get("negative_prompt", "blurry, low quality, distorted, ugly, bad anatomy, bad proportions")
            }
        }
        
        try:
            logger.info(f"Making request to model: {model}")
            response = requests.post(
                url, 
                headers=self._get_headers(), 
                json=payload, 
                timeout=120
            )
            
            logger.info(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                return response.content
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
        style: str = "modern", 
        room_type: str = "living_room",
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
        
        # Try primary model first
        models_to_try = [self.primary_model] + self.fallback_models
        
        for model in models_to_try:
            result = self._make_request(model, enhanced_prompt, **kwargs)
            if result:
                logger.info(f"✅ Successfully generated image with model: {model}")
                return result
            
            # Wait a bit before trying next model
            time.sleep(2)
        
        logger.error("All models failed to generate image")
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
        models_to_try = [self.primary_model] + self.fallback_models
        
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

# Initialize service instance
interior_ai_service = InteriorAIService()
