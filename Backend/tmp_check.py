# Let me try to recreate the exact part that needs fixing
import asyncio
import random
from typing import List, Dict, Any, Tuple

# Example of the method that needs to be fixed
def example_method():
    # Handle different service interfaces
    if provider_name == "unlimited":
        raw_data = await provider.get_trending_designs(page, per_page)
    else:
        raw_data = await provider.get_trending_photos(page, per_page)

        # Handle different response formats
        if isinstance(raw_data, dict) and "results" in raw_data:
            formatted_data = provider.format_photos_response(raw_data)
        elif isinstance(raw_data, list):
            formatted_data = raw_data
        else:
            formatted_data = provider.format_photos_response({"results": raw_data})