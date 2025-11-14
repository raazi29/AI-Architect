from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from geoapify_service import (
    search_places,
    normalize_places,
    geocode_place,
    normalize_geocodes,
    GeoapifyError,
)

router = APIRouter()

@router.get("/api/shops")
async def get_shops(
    category: str = Query(
        "commercial.furniture_and_interior", 
        description="Geoapify category string (e.g., commercial.furniture_and_interior, commercial.houseware_and_hardware). Supports comma-separated multiple categories."
    ),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius: int = Query(2000, ge=50, le=20000, description="Radius in meters (50-20000)"),
    limit: int = Query(20, ge=1, le=100, description="Max items to return"),
    city_hint: Optional[str] = Query(None, description="Optional city hint to improve search links when city is missing in data"),
):
    """
    Returns nearby shops for a given category using Geoapify Places.
    
    Supported real estate categories (top-level only):
    - commercial.furniture_and_interior: Furniture & interior décor stores
    - commercial.houseware_and_hardware: Hardware, construction materials (includes paint, tiles, etc.)
    - commercial.garden: Gardening & outdoor decoration
    - commercial.lighting: Lighting & electrical showrooms
    - commercial.department_store: General home improvement & department stores
    - commercial.shopping_mall: Major shopping areas & malls
    - commercial.food_and_drink: Restaurants & cafés
    - commercial.supermarket: Grocery & convenience stores
    - commercial.marketplace: Local marketplaces
    - commercial: All commercial establishments
    
    Multi-category example: "commercial.furniture_and_interior,commercial.houseware_and_hardware,commercial.garden"
    
    Note: Subcategories like .paint or .tiles are NOT supported by Geoapify API.
    
    Response: { results: [...], count: number }
    """
    try:
        raw = search_places(lon=lon, lat=lat, radius=radius, categories=category, limit=limit)
        results = normalize_places(raw, city_hint=city_hint)
        return {"results": results, "count": len(results)}
    except GeoapifyError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/api/geocode")
async def geocode(
    text: str = Query(..., description="Place text to geocode (e.g., city or area name)"),
    limit: int = Query(1, ge=1, le=10, description="Max geocoding results")
):
    """
    Geocode a text query to coordinates using Geoapify.
    Response: { results: [{ lat, lon, formatted, city, state, country }], count }
    """
    try:
        raw = geocode_place(text=text, limit=limit)
        results = normalize_geocodes(raw)
        return {"results": results, "count": len(results)}
    except GeoapifyError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
