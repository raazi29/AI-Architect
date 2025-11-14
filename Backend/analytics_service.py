import asyncio
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from fastapi import Request
from database import (
    record_analytics_event,
    get_analytics_summary,
    get_project_analytics,
    get_activity_data,
    update_project_analytics,
)


class AnalyticsService:
    """
    Service to handle analytics data collection and real-time updates
    """

    def __init__(self):
        self.active_connections = set()
        self.update_interval = 10  # seconds - more frequent than design feed
        self.metric_types = {
            "view": "User views content",
            "like": "User likes content",
            "project_created": "New project created",
            "collaborator_added": "Collaborator added to project",
            "session_start": "User session started",
            "session_end": "User session ended",
        }

    async def record_event(
        self,
        metric_type: str,
        metric_value: int = 1,
        user_id: str = None,
        project_id: str = None,
    ) -> bool:
        """
        Record an analytics event
        """
        if metric_type not in self.metric_types:
            return False

        success = await record_analytics_event(
            metric_type, metric_value, user_id, project_id
        )

        # If recording was successful, notify all connected clients
        if success:
            await self._notify_clients(
                "analytics_update",
                {
                    "metric_type": metric_type,
                    "metric_value": metric_value,
                    "user_id": user_id,
                    "project_id": project_id,
                    "timestamp": datetime.now().isoformat(),
                },
            )

        return success

    async def get_dashboard_data(self, time_range: str = "30d") -> Dict[str, Any]:
        """
        Get comprehensive analytics data for dashboard
        """
        try:
            # Get analytics summary
            summary = await get_analytics_summary()

            # Get project analytics
            projects = await get_project_analytics(10)

            # Get activity data
            activity_data = await get_activity_data(30)

            # Calculate derived metrics
            total_projects = summary.get("project_created", {}).get("total", 0)
            total_views = summary.get("view", {}).get("total", 0)
            total_likes = summary.get("like", {}).get("total", 0)
            total_collaborators = summary.get("collaborator_added", {}).get("total", 0)

            # Calculate monthly growth
            projects_growth = summary.get("project_created", {}).get("growth", 0)
            views_growth = summary.get("view", {}).get("growth", 0)
            likes_growth = summary.get("like", {}).get("growth", 0)
            collaborators_growth = summary.get("collaborator_added", {}).get(
                "growth", 0
            )

            # Mock project categories (would be populated from actual project data)
            projects_by_category = [
                {"name": "Living Room", "value": 35, "color": "#3b82f6"},
                {"name": "Bedroom", "value": 28, "color": "#10b981"},
                {"name": "Kitchen", "value": 20, "color": "#f59e0b"},
                {"name": "Bathroom", "value": 12, "color": "#ef4444"},
                {"name": "Office", "value": 5, "color": "#8b5cf6"},
            ]

            # Mock top designs (would be populated from actual project data)
            top_designs = []
            for i, project in enumerate(projects[:3]):
                top_designs.append(
                    {
                        "id": project["project_id"],
                        "title": f"Design Project {i + 1}",
                        "views": project["views"],
                        "likes": project["likes"],
                        "thumbnail": f"/placeholder-design-{i + 1}.jpg",
                    }
                )

            # Mock user engagement metrics
            user_engagement = [
                {
                    "metric": "Avg. Session Duration",
                    "current": 8.5,
                    "previous": 7.2,
                    "change": 18.1,
                },
                {
                    "metric": "Pages per Session",
                    "current": 4.2,
                    "previous": 3.8,
                    "change": 10.5,
                },
                {
                    "metric": "Bounce Rate",
                    "current": 32.1,
                    "previous": 38.7,
                    "change": -17.1,
                },
                {
                    "metric": "Return Visitors",
                    "current": 68.3,
                    "previous": 61.2,
                    "change": 11.6,
                },
            ]

            return {
                "totalProjects": total_projects,
                "totalViews": total_views,
                "totalLikes": total_likes,
                "totalCollaborators": total_collaborators,
                "monthlyGrowth": {
                    "projects": projects_growth,
                    "views": views_growth,
                    "likes": likes_growth,
                    "collaborators": collaborators_growth,
                },
                "projectsByCategory": projects_by_category,
                "activityData": activity_data,
                "topDesigns": top_designs,
                "userEngagement": user_engagement,
            }

        except Exception as e:
            print(f"Error getting dashboard data: {e}")
            return {}

    async def stream_analytics_updates(self, request: Request):
        """
        Stream real-time analytics updates to connected clients
        """
        self.active_connections.add(request)

        try:
            # Send initial dashboard data
            initial_data = await self.get_dashboard_data()
            yield f"data: {json.dumps({'type': 'initial', 'data': initial_data})}\n\n"

            # Continuously send updates
            while True:
                if await request.is_disconnected():
                    break

                # Get updated dashboard data
                updated_data = await self.get_dashboard_data()

                # Send update
                yield f"data: {json.dumps({'type': 'analytics_update', 'data': updated_data})}\n\n"

                # Wait before next update
                await asyncio.sleep(self.update_interval)

        except asyncio.CancelledError:
            pass
        finally:
            self.active_connections.discard(request)

    async def _notify_clients(self, event_type: str, data: Dict[str, Any]):
        """
        Notify all connected clients of an event
        """
        # This would be implemented with proper SSE formatting
        # For now, we'll just log it
        print(f"Notifying clients of {event_type}: {data}")

    async def update_project_metrics(
        self,
        project_id: str,
        category: str,
        views: int = None,
        likes: int = None,
        collaborators: int = None,
    ) -> bool:
        """
        Update project-specific analytics metrics
        """
        return await update_project_analytics(
            project_id, category, views, likes, collaborators
        )


# Global instance
analytics_service = AnalyticsService()
