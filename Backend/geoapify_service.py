import os
import requests
from typing import List, Dict, Any
from urllib.parse import quote_plus

GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY")

class GeoapifyError(Exception):
    pass

def ensure_api_key():
    if not GEOAPIFY_API_KEY:
        raise GeoapifyError("GEOAPIFY_API_KEY is not configured on the server")


def search_places(lon: float, lat: float, radius: int, categories: str, limit: int = 20) -> Dict[str, Any]:
    """
    Calls Geoapify Places API and returns raw JSON.
    """
    ensure_api_key()
    url = "https://api.geoapify.com/v2/places"
    params = {
        "categories": categories,
        "filter": f"circle:{lon},{lat},{radius}",
        "bias": f"proximity:{lon},{lat}",
        "limit": limit,
        "apiKey": GEOAPIFY_API_KEY,
    }
    try:
        # Build full URL for debugging
        request_url = requests.Request('GET', url, params=params).prepare().url
        print(f"[Geoapify] Request URL: {request_url}")
        
        resp = requests.get(url, params=params, timeout=10)
        print(f"[Geoapify] Response status: {resp.status_code}")
        
        if resp.status_code == 403:
            print(f"[Geoapify] 403 response: {resp.text}")
            raise GeoapifyError("Geoapify access forbidden - check API key or quotas")
        if resp.status_code == 429:
            print(f"[Geoapify] 429 response: {resp.text}")
            raise GeoapifyError("Rate limit exceeded for Geoapify free plan")
        if resp.status_code != 200:
            print(f"[Geoapify] Error response: {resp.text}")
            raise GeoapifyError(f"Geoapify returned {resp.status_code}: {resp.text[:200]}")
        
        resp.raise_for_status()
        return resp.json()
    except requests.Timeout as e:
        raise GeoapifyError("Geoapify request timed out") from e
    except requests.RequestException as e:
        raise GeoapifyError(f"Geoapify request failed: {str(e)}") from e


def normalize_places(geojson: Dict[str, Any], city_hint: str | None = None) -> List[Dict[str, Any]]:
    """
    Normalize Geoapify features to a clean list for the frontend.
    """
    results: List[Dict[str, Any]] = []
    for f in geojson.get("features", []):
        p = f.get("properties", {})
        oh = p.get("opening_hours", {})
        lat = p.get("lat")
        lon = p.get("lon")
        name = p.get("name") or ""
        city = p.get("city") or (city_hint or "")
        formatted = p.get("formatted") or ""
        # Build helper links when coordinates available
        map_link = None
        if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
            map_link = f"https://www.google.com/maps?q={lat},{lon}"
        # Prefer name + city for web search; fallback to formatted address
        search_text = (name + " " + city).strip() or formatted
        search_link = f"https://www.google.com/search?q={quote_plus(search_text)}" if search_text else None

        results.append({
            "id": p.get("place_id"),
            "name": name or None,
            "categories": p.get("categories", []),
            "address": formatted or None,
            "lat": lat,
            "lon": lon,
            "distance": p.get("distance"),
            "opening_hours": oh if isinstance(oh, dict) else None,
            "map_link": map_link,
            "search_link": search_link,
        })
    return results


def geocode_place(text: str, limit: int = 1) -> Dict[str, Any]:
    """
    Use Geoapify Geocoding API to convert text to coordinates.
    Returns raw JSON GeoJSON result.
    """
    ensure_api_key()
    url = "https://api.geoapify.com/v1/geocode/search"
    params = {
        "text": text,
        "limit": limit,
        "lang": "en",
        "apiKey": GEOAPIFY_API_KEY,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 403:
            raise GeoapifyError("Geoapify access forbidden - check API key or quotas")
        if resp.status_code == 429:
            raise GeoapifyError("Rate limit exceeded for Geoapify free plan")
        resp.raise_for_status()
        return resp.json()
    except requests.Timeout as e:
        raise GeoapifyError("Geoapify request timed out") from e
    except requests.RequestException as e:
        raise GeoapifyError(f"Geoapify request failed: {str(e)}") from e


def normalize_geocodes(geojson: Dict[str, Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    for f in geojson.get("features", []):
        p = f.get("properties", {})
        results.append({
            "lat": p.get("lat"),
            "lon": p.get("lon"),
            "formatted": p.get("formatted"),
            "city": p.get("city"),
            "state": p.get("state"),
            "country": p.get("country"),
        })
    return results
