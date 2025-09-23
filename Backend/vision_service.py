import base64
import io
from typing import Dict, Any, Optional
from groq import Groq
from PIL import Image
import os
from dotenv import load_dotenv
import json
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisionService:
    def __init__(self):
        """Initialize the VisionService with Groq client"""
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=self.groq_api_key)
        
        # Define the prompt template for interior design analysis
        self.analysis_prompt = """
        Analyze this interior design image and provide detailed information about:
        1. Room type (living room, bedroom, kitchen, bathroom, office, etc.)
        2. Design style (modern, minimalist, industrial, bohemian, scandinavian, etc.)
        3. Furniture and objects present in the room
        4. Color palette and dominant colors
        5. Design improvement suggestions
        
        Please format your response as a JSON object with the following structure:
        {
            "room_type": "identified room type",
            "design_style": "identified design style",
            "furniture_objects": ["list", "of", "furniture", "and", "objects"],
            "color_palette": ["primary colors in the room"],
            "improvement_suggestions": ["specific", "design", "improvement", "suggestions"]
        }
        
        Provide concise but informative responses for each field. Ensure your response is valid JSON.
        """

    def encode_image(self, image_path: str) -> str:
        """Encode image to base64 string"""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary (remove alpha channel)
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize image if it's too large to reduce API usage
                max_size = (1024, 1024)
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Save to bytes
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=85)
                img_byte_arr = img_byte_arr.getvalue()
                
                return base64.b64encode(img_byte_arr).decode('utf-8')
        except Exception as e:
            logger.error(f"Error encoding image: {str(e)}")
            raise

    def analyze_image_with_llama_vision(self, image_path: str) -> Dict[str, Any]:
        """Analyze image using LLaMA 3.1 Vision model via Groq API"""
        try:
            # Encode the image
            base64_image = self.encode_image(image_path)
            
            # Create the message for the model
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": self.analysis_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ]
            
            # Call the Groq API with LLaMA 3.1 Vision
            response = self.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=messages,
                temperature=0.7,
                max_completion_tokens=1024,
                response_format={"type": "json_object"}
            )
            
            # Extract the response content
            content = response.choices[0].message.content
            
            # Parse as JSON directly (no need for complex parsing with the new model)
            try:
                parsed_response = json.loads(content)
                return parsed_response
            except json.JSONDecodeError:
                # If JSON parsing fails, return as text response
                return {
                    "room_type": "unknown",
                    "design_style": "unknown",
                    "furniture_objects": [],
                    "color_palette": [],
                    "improvement_suggestions": [content]
                }
                
        except Exception as e:
            logger.error(f"Error analyzing image with LLaMA Vision: {str(e)}")
            raise

    def analyze_image_with_fallback(self, image_path: str) -> Dict[str, Any]:
        """Analyze image with fallback to alternative methods if needed"""
        try:
            # Try primary method first (LLaMA 3.1 Vision)
            return self.analyze_image_with_llama_vision(image_path)
        except Exception as e:
            logger.warning(f"Primary vision analysis failed: {str(e)}")
            
            # Fallback response if all methods fail
            return {
                "room_type": "unknown",
                "design_style": "unknown",
                "furniture_objects": [],
                "color_palette": [],
                "improvement_suggestions": ["Unable to analyze the image at the moment. Please try again later."]
            }

# Create a singleton instance
vision_service = VisionService()