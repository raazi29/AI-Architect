"""
Rate limiting middleware for FastAPI
Protects endpoints from abuse and DDoS attacks
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from typing import Callable

# Initialize rate limiter
# Uses client IP address as the key for rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],  # Default: 100 requests per minute
    storage_uri="memory://",  # Use in-memory storage (upgrade to Redis for production)
)

# Custom rate limit exceeded handler
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors
    Returns a user-friendly error message
    """
    return {
        "error": "Rate limit exceeded",
        "message": "Too many requests. Please try again later.",
        "retry_after": exc.detail,
    }
