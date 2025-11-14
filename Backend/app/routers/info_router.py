
from fastapi import APIRouter, Query, HTTPException
import httpx
from typing import Optional

from geoapify_service import GeoapifyService

info_router = APIRouter()

geoapify_service = GeoapifyService()

@info_router.get("/places", response_model=dict)
async def get_places(
    categories: str = Query(..., description="Categories of places to search for"),
    lat: float = Query(..., description="Latitude for the search"),
    lon: float = Query(..., description="Longitude for the search"),
    radius: int = Query(1000, description="Search radius in meters"),
    limit: int = Query(20, description="Maximum number of results"),
):
    try:
        async with httpx.AsyncClient() as client:
            places = await geoapify_service.get_places_by_category(
                client=client,
                categories=[categories],
                lat=lat,
                lon=lon,
                radius=radius,
                limit=limit,
            )
            return places
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
