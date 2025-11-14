
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import httpx

from interior_ai_service import InteriorAIService
from architecture_design_service import ArchitectureDesignService
from groq_vastu_service import GroqVastuService

ai_router = APIRouter()

# Initialize services
interior_ai_service = InteriorAIService()
architecture_design_service = ArchitectureDesignService()
groq_vastu_service = GroqVastuService()

@ai_router.get("/generate-interior-design", response_model=dict)
async def generate_interior_design(
    prompt: str = Query(..., description="Prompt for generating interior design"),
    room_type: str = Query(..., description="Type of the room"),
):
    try:
        # This is a placeholder for the actual implementation
        # You would call the interior_ai_service here
        image_url = await interior_ai_service.generate_image(prompt, room_type)
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ai_router.get("/generate-architecture-design", response_model=dict)
async def generate_architecture_design(
    prompt: str = Query(..., description="Prompt for generating architecture design"),
    style: str = Query(..., description="Architectural style"),
):
    try:
        # This is a placeholder for the actual implementation
        # You would call the architecture_design_service here
        image_url = await architecture_design_service.generate_image(prompt, style)
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
