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