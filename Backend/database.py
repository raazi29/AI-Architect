import aiosqlite
import os
import hashlib
from typing import List, Dict, Any
from datetime import datetime, timedelta

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "cache.db")

async def init_db():
    """Initialize the database with the required tables"""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        # Create image cache table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS image_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL,
                query TEXT NOT NULL,
                page INTEGER NOT NULL,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(provider, query, page)
            )
        """)
        
        # Create vision analysis cache table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS vision_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                image_hash TEXT NOT NULL UNIQUE,
                analysis_result TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create chat history table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                message_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create chat sessions table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create analytics metrics table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS analytics_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_type TEXT NOT NULL,
                metric_value INTEGER NOT NULL,
                user_id TEXT,
                project_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create analytics summary table for aggregated data
        await db.execute("""
            CREATE TABLE IF NOT EXISTS analytics_summary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL UNIQUE,
                total_value INTEGER NOT NULL DEFAULT 0,
                monthly_growth REAL DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create project analytics table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS project_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                category TEXT NOT NULL,
                views INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                collaborators INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id)
            )
        """)
        
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_provider_query_page
            ON image_cache(provider, query, page)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at
            ON image_cache(created_at)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_vision_hash
            ON vision_cache(image_hash)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_vision_created_at
            ON vision_cache(created_at)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_chat_session
            ON chat_history(session_id)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_chat_created_at
            ON chat_history(created_at)
        """)
        
        # Analytics indexes
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_metric_type
            ON analytics_metrics(metric_type)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_created_at
            ON analytics_metrics(created_at)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_user_id
            ON analytics_metrics(user_id)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_analytics_project_id
            ON analytics_metrics(project_id)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_project_analytics_category
            ON project_analytics(category)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_project_analytics_updated
            ON project_analytics(updated_at)
        """)
        await db.commit()

async def cache_images(provider: str, query: str, page: int, data: List[Dict[str, Any]]) -> bool:
    """Cache images in the database"""
    try:
        import json
        async with aiosqlite.connect(DATABASE_PATH) as db:
            await db.execute("""
                INSERT OR REPLACE INTO image_cache
                (provider, query, page, data, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (provider, query, page, json.dumps(data), datetime.now()))
            await db.commit()
        return True
    except Exception as e:
        print(f"Error caching images: {e}")
        return False

async def cache_images_batch(caches: List[Dict[str, any]]) -> bool:
    """Cache multiple image sets in the database at once"""
    try:
        import json
        async with aiosqlite.connect(DATABASE_PATH) as db:
            for cache in caches:
                await db.execute("""
                    INSERT OR REPLACE INTO image_cache
                    (provider, query, page, data, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    cache['provider'], 
                    cache['query'], 
                    cache['page'], 
                    json.dumps(cache['data']), 
                    datetime.now()
                ))
            await db.commit()
        return True
    except Exception as e:
        print(f"Error caching images batch: {e}")
        return False

async def get_cached_images(provider: str, query: str, page: int, max_age_hours: int = 24) -> List[Dict[str, Any]] | None:
    """Retrieve cached images from the database"""
    try:
        import json
        async with aiosqlite.connect(DATABASE_PATH) as db:
            # Calculate the expiration time
            expiration_time = datetime.now() - timedelta(hours=max_age_hours)
            
            async with db.execute("""
                SELECT data FROM image_cache
                WHERE provider = ? AND query = ? AND page = ? AND created_at > ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (provider, query, page, expiration_time)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return json.loads(row[0])
        return None
    except Exception as e:
        print(f"Error retrieving cached images: {e}")
        return None

async def get_cached_images_multi_provider(query: str, page: int, max_age_hours: int = 24) -> List[Dict[str, Any]] | None:
    """Retrieve cached images from any provider (for hybrid approach)"""
    try:
        import json
        async with aiosqlite.connect(DATABASE_PATH) as db:
            # Calculate the expiration time
            expiration_time = datetime.now() - timedelta(hours=max_age_hours)
            
            async with db.execute("""
                SELECT data FROM image_cache
                WHERE query = ? AND page = ? AND created_at > ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (query, page, expiration_time)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return json.loads(row[0])
        return None
    except Exception as e:
        print(f"Error retrieving cached images: {e}")
        return None

async def get_cached_images_multi_provider_extended(query: str, page_range: tuple = (1, 5), max_age_hours: int = 24) -> Dict[int, List[Dict[str, Any]]]:
    """Retrieve cached images for a range of pages to support infinite scrolling"""
    try:
        import json
        results = {}
        async with aiosqlite.connect(DATABASE_PATH) as db:
            # Calculate the expiration time
            expiration_time = datetime.now() - timedelta(hours=max_age_hours)
            
            # Get all pages within the requested range
            for page in range(page_range[0], page_range[1] + 1):
                async with db.execute("""
                    SELECT data FROM image_cache
                    WHERE query = ? AND page = ? AND created_at > ?
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (query, page, expiration_time)) as cursor:
                    row = await cursor.fetchone()
                    if row:
                        results[page] = json.loads(row[0])
                    else:
                        results[page] = []
        return results
    except Exception as e:
        print(f"Error retrieving cached images for multiple pages: {e}")
        return {}

async def cleanup_old_cache(max_age_hours: int = 168) -> bool:
    """Remove cache entries older than max_age_hours"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            expiration_time = datetime.now() - timedelta(hours=max_age_hours)
            await db.execute("""
                DELETE FROM image_cache
                WHERE created_at < ?
            """, (expiration_time,))
            await db.commit()
        return True
    except Exception as e:
        print(f"Error cleaning up old cache: {e}")
        return False

# Vision analysis cache functions
async def cache_vision_analysis(image_hash: str, analysis_result: Dict[str, Any]) -> bool:
    """Cache vision analysis result in the database"""
    try:
        import json
        async with aiosqlite.connect(DATABASE_PATH) as db:
            await db.execute("""
                INSERT OR REPLACE INTO vision_cache
                (image_hash, analysis_result, created_at)
                VALUES (?, ?, ?)
            """, (image_hash, json.dumps(analysis_result), datetime.now()))
            await db.commit()
        return True
    except Exception as e:
        print(f"Error caching vision analysis: {e}")
        return False

async def get_cached_vision_analysis(image_hash: str, max_age_hours: int = 1) -> Dict[str, Any] | None:
    """Retrieve cached vision analysis result from the database"""
    try:
        import json
        async with aiosqlite.connect(DATABASE_PATH) as db:
            # Calculate the expiration time
            expiration_time = datetime.now() - timedelta(hours=max_age_hours)
            
            async with db.execute("""
                SELECT analysis_result FROM vision_cache
                WHERE image_hash = ? AND created_at > ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (image_hash, expiration_time)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return json.loads(row[0])
        return None
    except Exception as e:
        print(f"Error retrieving cached vision analysis: {e}")
        return None

def calculate_image_hash(image_path: str) -> str:
    """Calculate SHA256 hash of an image file"""
    hash_sha256 = hashlib.sha256()
    with open(image_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

# Chat history functions
async def save_chat_session(session_id: str, title: str) -> bool:
    """Save or update a chat session"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            await db.execute("""
                INSERT OR REPLACE INTO chat_sessions
                (id, title, updated_at)
                VALUES (?, ?, ?)
            """, (session_id, title, datetime.now()))
            await db.commit()
        return True
    except Exception as e:
        print(f"Error saving chat session: {e}")
        return False

async def save_chat_history(session_id: str, messages: List[Dict[str, Any]]) -> bool:
    """Save chat history for a session"""
    try:
        import json
        async with aiosqlite.connect(DATABASE_PATH) as db:
            # First, delete existing history for this session
            await db.execute("""
                DELETE FROM chat_history WHERE session_id = ?
            """, (session_id,))
            
            # Then insert the new history
            await db.execute("""
                INSERT INTO chat_history
                (session_id, message_data, created_at)
                VALUES (?, ?, ?)
            """, (session_id, json.dumps(messages), datetime.now()))
            
            await db.commit()
        return True
    except Exception as e:
        print(f"Error saving chat history: {e}")
        return False

async def get_chat_history(session_id: str) -> List[Dict[str, Any]] | None:
    """Retrieve chat history for a session"""
    try:
        import json
        async with aiosqlite.connect(DATABASE_PATH) as db:
            async with db.execute("""
                SELECT message_data FROM chat_history
                WHERE session_id = ?
                ORDER BY created_at ASC
            """, (session_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return json.loads(row[0])
        return None
    except Exception as e:
        print(f"Error retrieving chat history: {e}")
        return None

async def get_chat_sessions(limit: int = 30) -> List[Dict[str, Any]]:
    """Retrieve recent chat sessions"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            async with db.execute("""
                SELECT id, title, created_at, updated_at
                FROM chat_sessions
                ORDER BY updated_at DESC
                LIMIT ?
            """, (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "title": row[1],
                        "created_at": row[2],
                        "updated_at": row[3]
                    }
                    for row in rows
                ]
    except Exception as e:
        print(f"Error retrieving chat sessions: {e}")
        return []

# Analytics functions
async def record_analytics_event(metric_type: str, metric_value: int = 1, user_id: str = None, project_id: str = None) -> bool:
    """Record an analytics event"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            await db.execute("""
                INSERT INTO analytics_metrics (metric_type, metric_value, user_id, project_id)
                VALUES (?, ?, ?, ?)
            """, (metric_type, metric_value, user_id, project_id))
            await db.commit()
        return True
    except Exception as e:
        print(f"Error recording analytics event: {e}")
        return False

async def get_analytics_summary() -> Dict[str, Any]:
    """Get aggregated analytics summary"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            # Get total counts for each metric type
            async with db.execute("""
                SELECT 
                    metric_type,
                    SUM(metric_value) as total_value,
                    COUNT(*) as event_count
                FROM analytics_metrics
                GROUP BY metric_type
            """) as cursor:
                metrics = await cursor.fetchall()
            
            # Calculate monthly growth (compare last 30 days vs previous 30 days)
            current_date = datetime.now()
            last_month_start = current_date - timedelta(days=60)
            last_month_end = current_date - timedelta(days=30)
            
            async with db.execute("""
                SELECT 
                    metric_type,
                    SUM(metric_value) as previous_month_value
                FROM analytics_metrics
                WHERE created_at >= ? AND created_at < ?
                GROUP BY metric_type
            """, (last_month_start, last_month_end)) as cursor:
                previous_metrics = {row[0]: row[1] for row in await cursor.fetchall()}
            
            # Calculate current month values
            current_month_start = current_date - timedelta(days=30)
            async with db.execute("""
                SELECT 
                    metric_type,
                    SUM(metric_value) as current_month_value
                FROM analytics_metrics
                WHERE created_at >= ?
                GROUP BY metric_type
            """, (current_month_start,)) as cursor:
                current_metrics = {row[0]: row[1] for row in await cursor.fetchall()}
            
            # Calculate growth percentages
            summary = {}
            for metric_type, total_value, event_count in metrics:
                current = current_metrics.get(metric_type, 0)
                previous = previous_metrics.get(metric_type, 0)
                growth = ((current - previous) / previous * 100) if previous > 0 else 0
                
                summary[metric_type] = {
                    'total': total_value,
                    'events': event_count,
                    'current_month': current,
                    'previous_month': previous,
                    'growth': growth
                }
            
            return summary
    except Exception as e:
        print(f"Error getting analytics summary: {e}")
        return {}

async def get_project_analytics(limit: int = 10) -> List[Dict[str, Any]]:
    """Get project analytics data"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            async with db.execute("""
                SELECT 
                    project_id,
                    category,
                    views,
                    likes,
                    collaborators,
                    created_at,
                    updated_at
                FROM project_analytics
                ORDER BY views DESC
                LIMIT ?
            """, (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [
                    {
                        'project_id': row[0],
                        'category': row[1],
                        'views': row[2],
                        'likes': row[3],
                        'collaborators': row[4],
                        'created_at': row[5],
                        'updated_at': row[6]
                    }
                    for row in rows
                ]
    except Exception as e:
        print(f"Error getting project analytics: {e}")
        return []

async def get_activity_data(days: int = 30) -> List[Dict[str, Any]]:
    """Get activity data for charts"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            # Get daily aggregates for the specified period
            start_date = datetime.now() - timedelta(days=days)
            
            async with db.execute("""
                SELECT 
                    DATE(created_at) as date,
                    metric_type,
                    SUM(metric_value) as daily_total
                FROM analytics_metrics
                WHERE created_at >= ?
                GROUP BY DATE(created_at), metric_type
                ORDER BY date DESC
            """, (start_date,)) as cursor:
                rows = await cursor.fetchall()
            
            # Group by date
            activity_by_date = {}
            for date, metric_type, daily_total in rows:
                if date not in activity_by_date:
                    activity_by_date[date] = {'date': date, 'projects': 0, 'views': 0, 'likes': 0}
                
                if metric_type == 'project_created':
                    activity_by_date[date]['projects'] += daily_total
                elif metric_type == 'view':
                    activity_by_date[date]['views'] += daily_total
                elif metric_type == 'like':
                    activity_by_date[date]['likes'] += daily_total
            
            return list(activity_by_date.values())
    except Exception as e:
        print(f"Error getting activity data: {e}")
        return []

async def update_project_analytics(project_id: str, category: str, views: int = None, likes: int = None, collaborators: int = None) -> bool:
    """Update project analytics data"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            # Get current values
            async with db.execute("""
                SELECT views, likes, collaborators FROM project_analytics
                WHERE project_id = ?
            """, (project_id,)) as cursor:
                row = await cursor.fetchone()
            
            if row:
                # Update existing record
                current_views, current_likes, current_collaborators = row
                new_views = views if views is not None else current_views
                new_likes = likes if likes is not None else current_likes
                new_collaborators = collaborators if collaborators is not None else current_collaborators
                
                await db.execute("""
                    UPDATE project_analytics
                    SET views = ?, likes = ?, collaborators = ?, updated_at = ?
                    WHERE project_id = ?
                """, (new_views, new_likes, new_collaborators, datetime.now(), project_id))
            else:
                # Insert new record
                await db.execute("""
                    INSERT INTO project_analytics (project_id, category, views, likes, collaborators)
                    VALUES (?, ?, ?, ?, ?)
                """, (project_id, category, views or 0, likes or 0, collaborators or 0))
            
            await db.commit()
        return True
    except Exception as e:
        print(f"Error updating project analytics: {e}")
        return False