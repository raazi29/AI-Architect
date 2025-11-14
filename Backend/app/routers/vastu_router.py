
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from vastu_service import VastuService
from groq_vastu_service import GroqVastuService

vastu_router = APIRouter()

# Initialize services
vastu_service = VastuService()
groq_vastu_service = GroqVastuService()

@vastu_router.get("/vastu-suggestions", response_model=dict)
async def get_vastu_suggestions(
    query: str = Query(..., description="Query for Vastu suggestions"),
):
    try:
        # This is a placeholder for the actual implementation
        # You would call the vastu_service here
        suggestions = await vastu_service.get_suggestions(query)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@vastu_router.get("/groq-vastu-check", response_model=dict)
async def groq_vastu_check(
    text: str = Query(..., description="Text to check for Vastu compliance using Groq"),
):
    try:
        # This is a placeholder for the actual implementation
        # You would call the groq_vastu_service here
        result = await groq_vastu_service.check_vastu(text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
