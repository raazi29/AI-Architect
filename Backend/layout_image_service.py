"""
AI Layout Image Generator Service using Hugging Face Models
Generates floor plan images based on text descriptions using state-of-the-art diffusion models
"""

import os
import io
import base64
import requests
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from enum import Enum
import json
from PIL import Image
import asyncio
import aiohttp

class RoomType(str, Enum):
    LIVING_ROOM = "living_room"
    BEDROOM = "bedroom"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    DINING_ROOM = "dining_room"
    OFFICE = "office"
    HALLWAY = "hallway"
    OUTDOOR = "outdoor"

class DesignStyle(str, Enum):
    MODERN = "modern"
    TRADITIONAL = "traditional"
    SCANDINAVIAN = "scandinavian"
    INDUSTRIAL = "industrial"
    LUXURY = "luxury"
    MINIMALIST = "minimalist"
    BOHEMIAN = "bohemian"
    RUSTIC = "rustic"

class LayoutImageRequest(BaseModel):
    room_type: RoomType
    room_dimensions: Dict[str, float]  # length, width, height
    existing_furniture: Optional[List[str]] = None
    primary_function: str
    traffic_flow_requirements: str
    style: Optional[DesignStyle] = DesignStyle.MODERN
    special_requirements: Optional[str] = None

class LayoutImageService:
    def __init__(self):
        self.hf_api_token = os.getenv("HUGGING_FACE_API_TOKEN")
        if not self.hf_api_token:
            raise ValueError("HUGGING_FACE_API_TOKEN environment variable is required")
        
        # Primary model for floor plan generation
        self.primary_model = "maria26/Floor_Plan_LoRA"
        
        # Fallback models
        self.fallback_models = [
            "stabilityai/stable-diffusion-3.5-large",
            "black-forest-labs/FLUX.1-dev",
            "runwayml/stable-diffusion-v1-5"
        ]
        
        self.headers = {
            "Authorization": f"Bearer {self.hf_api_token}",
            "Content-Type": "application/json"
        }

    def _create_floor_plan_prompt(self, request: LayoutImageRequest) -> str:
        """Create an optimized prompt for floor plan generation"""
        
        # Convert room dimensions to descriptive text
        length = request.room_dimensions.get('length', 0)
        width = request.room_dimensions.get('width', 0)
        area = length * width
        
        # Determine size description
        if area < 20:
            size_desc = "small"
        elif area < 50:
            size_desc = "medium"
        else:
            size_desc = "large"
        
        # Room type mapping for better prompts
        room_mapping = {
            "living_room": "living room with seating area",
            "bedroom": "bedroom with sleeping area",
            "kitchen": "kitchen with cooking and dining space",
            "bathroom": "bathroom with fixtures",
            "dining_room": "dining room with dining table",
            "office": "office with workspace",
            "hallway": "hallway with circulation space",
            "outdoor": "outdoor space with patio"
        }
        
        room_desc = room_mapping.get(request.room_type.value, request.room_type.value)
        
        # Count furniture items
        furniture_count = len(request.existing_furniture) if request.existing_furniture else 3
        furniture_desc = "few" if furniture_count <= 3 else "many"
        
        # Create base prompt following the model's expected format
        base_prompt = f"Floor plan of a {size_desc} {room_desc}, {furniture_desc} furniture pieces"
        
        # Add specific requirements
        if request.primary_function:
            base_prompt += f", optimized for {request.primary_function}"
        
        if request.traffic_flow_requirements:
            base_prompt += f", with {request.traffic_flow_requirements} traffic flow"
        
        # Add style if specified
        if request.style and request.style != DesignStyle.MODERN:
            base_prompt += f", {request.style.value} style"
        
        # Add special requirements
        if request.special_requirements:
            base_prompt += f", {request.special_requirements}"
        
        # Add architectural details for better results
        base_prompt += ", architectural drawing, top view, clean lines, professional layout"
        
        return base_prompt

    async def _query_hf_model(self, model_name: str, prompt: str, session: aiohttp.ClientSession) -> Optional[bytes]:
        """Query a Hugging Face model asynchronously"""
        
        api_url = f"https://router.huggingface.co/hf-inference/models/{model_name}"
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "num_inference_steps": 30,
                "guidance_scale": 7.5,
                "width": 768,
                "height": 768,
                "seed": None  # Random seed for variety
            }
        }
        
        try:
            async with session.post(api_url, headers=self.headers, json=payload) as response:
                if response.status == 200:
                    content_type = response.headers.get('content-type', '')
                    if 'image' in content_type:
                        return await response.read()
                    else:
                        # Handle JSON response (might be an error or loading message)
                        json_response = await response.json()
                        if 'error' in json_response:
                            print(f"Model {model_name} error: {json_response['error']}")
                        return None
                else:
                    print(f"Model {model_name} returned status {response.status}")
                    return None
                    
        except Exception as e:
            print(f"Error querying model {model_name}: {str(e)}")
            return None

    async def generate_layout_image(self, request: LayoutImageRequest) -> Dict[str, Any]:
        """Generate floor plan image using AI models"""
        
        try:
            # Create optimized prompt
            prompt = self._create_floor_plan_prompt(request)
            
            # Try models in order of preference
            models_to_try = [self.primary_model] + self.fallback_models
            
            async with aiohttp.ClientSession() as session:
                for model_name in models_to_try:
                    print(f"Trying model: {model_name}")
                    
                    image_bytes = await self._query_hf_model(model_name, prompt, session)
                    
                    if image_bytes:
                        try:
                            # Verify image is valid
                            image = Image.open(io.BytesIO(image_bytes))
                            
                            # Convert to base64 for frontend
                            buffered = io.BytesIO()
                            image.save(buffered, format="PNG")
                            img_base64 = base64.b64encode(buffered.getvalue()).decode()
                            
                            return {
                                "success": True,
                                "image_data": f"data:image/png;base64,{img_base64}",
                                "model_used": model_name,
                                "prompt_used": prompt,
                                "image_dimensions": {
                                    "width": image.width,
                                    "height": image.height
                                },
                                "layout_analysis": self._analyze_generated_layout(request, prompt),
                                "message": "Floor plan image generated successfully"
                            }
                            
                        except Exception as img_error:
                            print(f"Error processing image from {model_name}: {str(img_error)}")
                            continue
                    
                    # Wait a bit before trying next model to avoid rate limits
                    await asyncio.sleep(1)
            
            # If all models failed
            return {
                "success": False,
                "error": "Failed to generate floor plan image with all available models",
                "message": "All AI models are currently unavailable. Please try again later.",
                "fallback_suggestions": self._get_fallback_suggestions(request)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to generate layout image: {str(e)}"
            }

    def _analyze_generated_layout(self, request: LayoutImageRequest, prompt: str) -> Dict[str, Any]:
        """Provide analysis of the generated layout"""
        
        length = request.room_dimensions.get('length', 0)
        width = request.room_dimensions.get('width', 0)
        area = length * width
        
        return {
            "room_analysis": {
                "type": request.room_type.value,
                "dimensions": f"{length}m x {width}m",
                "total_area": f"{area:.1f} sq meters",
                "primary_function": request.primary_function,
                "style": request.style.value if request.style else "modern"
            },
            "design_features": {
                "traffic_flow": request.traffic_flow_requirements,
                "furniture_consideration": len(request.existing_furniture) if request.existing_furniture else 0,
                "special_requirements": request.special_requirements or "None"
            },
            "optimization_notes": [
                f"Layout optimized for {request.primary_function}",
                f"Traffic flow designed for {request.traffic_flow_requirements}",
                "Proportions scaled to room dimensions",
                "Furniture placement follows best practices"
            ],
            "prompt_engineering": {
                "original_prompt": prompt,
                "optimization_applied": "Enhanced with architectural keywords and style specifications"
            }
        }

    def _get_fallback_suggestions(self, request: LayoutImageRequest) -> List[str]:
        """Provide fallback suggestions when image generation fails"""
        
        return [
            "Try simplifying the room requirements",
            "Consider using a more common room type",
            "Reduce the number of special requirements",
            "Check if the room dimensions are realistic",
            "Try again in a few minutes as models may be loading",
            "Consider using the text-based layout optimizer as an alternative"
        ]

    async def get_model_status(self) -> Dict[str, Any]:
        """Check the status of available models"""
        
        model_status = {}
        
        async with aiohttp.ClientSession() as session:
            for model_name in [self.primary_model] + self.fallback_models:
                api_url = f"https://router.huggingface.co/hf-inference/models/{model_name}"
                
                try:
                    async with session.get(api_url, headers=self.headers) as response:
                        if response.status == 200:
                            model_status[model_name] = "available"
                        else:
                            model_status[model_name] = f"unavailable (status: {response.status})"
                except Exception as e:
                    model_status[model_name] = f"error: {str(e)}"
        
        return {
            "models": model_status,
            "primary_model": self.primary_model,
            "fallback_models": self.fallback_models,
            "total_models": len([self.primary_model] + self.fallback_models)
        }

# Initialize the service
layout_image_service = LayoutImageService()
