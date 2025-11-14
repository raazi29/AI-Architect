import asyncio
import json
from typing import Dict, List, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from web_scraping_service import web_scraping_service
from analytics_service import analytics_service


class RealtimeService:
    """
    Service to provide real-time updates for design feed
    """
    
    def __init__(self):
        self.active_connections = set()
        self.update_interval = 30  # seconds
        self.default_tags = ["design", "interior", "architecture", "modern", "minimalist"]
        
    async def stream_updates(self, request: Request, query: str = "design"):
        """
        Stream real-time updates to connected clients
        """
        # Add this connection to active connections
        self.active_connections.add(request)
        
        try:
            # Send initial data
            initial_images = await web_scraping_service.search_all_sources(
                query or "design", page=1, per_page=10
            )
            
            yield f"data: {json.dumps({'type': 'initial', 'images': initial_images})}\n\n"
            
            # Continuously send updates
            while True:
                if await request.is_disconnected():
                    break
                
                # Get new images periodically
                new_images = await web_scraping_service.search_all_sources(
                    query or "design", page=1, per_page=5
                )
                
                if new_images:
                    yield f"data: {json.dumps({'type': 'new_images', 'images': new_images})}\n\n"
                
                # Wait before next update
                await asyncio.sleep(self.update_interval)
                
        except asyncio.CancelledError:
            pass
        finally:
            # Remove this connection when done
            self.active_connections.discard(request)

    async def stream_analytics_updates(self, request: Request):
        """
        Stream real-time analytics updates to connected clients
        """
        return await analytics_service.stream_analytics_updates(request)


# Global instance
realtime_service = RealtimeService()