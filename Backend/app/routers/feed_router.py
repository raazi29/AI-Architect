
import asyncio
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
import httpx

from hybrid_service import HybridImageService
from image_categorization_service import ImageCategorizationService
from cache_service import CacheService

feed_router = APIRouter()

# Initialize services
image_categorization_service = ImageCategorizationService()
cache_service = CacheService()
hybrid_service = HybridImageService(image_categorization_service, cache_service)

async def get_feed_impl(
    query: str,
    page: int = 1,
    per_page: int = 20,
    provider: str = "all",
    orientation: Optional[str] = None,
    color: Optional[str] = None,
):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")

    try:
        results, _ = await hybrid_service.search_photos_aggregated(
            query=query,
            page=page,
            per_page=per_page,
            provider=provider,
            orientation=orientation,
            color=color,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@feed_router.get("/feed", response_model=List[dict])
async def get_feed(
    query: str = Query(..., description="Search query for images"),
    page: int = Query(1, description="Page number"),
    per_page: int = Query(20, description="Number of results per page"),
    provider: str = Query("all", description="Image provider to use"),
    orientation: Optional[str] = Query(None, description="Image orientation"),
    color: Optional[str] = Query(None, description="Image color"),
):
    return await get_feed_impl(query, page, per_page, provider, orientation, color)

@feed_router.get("/mobile-feed", response_model=List[dict])
async def get_mobile_feed(
    query: str = Query(..., description="Search query for images"),
    page: int = Query(1, description="Page number"),
    per_page: int = Query(20, description="Number of results per page"),
):
    try:
        results = await hybrid_service.search_photos_mobile_optimized(
            query=query, page=page, per_page=per_page
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
