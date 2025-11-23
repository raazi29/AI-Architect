"""
Input validation and sanitization for API requests
Prevents injection attacks and ensures data integrity
"""

from pydantic import BaseModel, Field, validator, constr
from typing import Optional, List
import re

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed image formats
ALLOWED_IMAGE_FORMATS = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


class InteriorGenerationRequest(BaseModel):
    """Validated request for interior design generation"""
    
    prompt: constr(min_length=1, max_length=500) = Field(
        ..., description="Design prompt (1-500 characters)"
    )
    style: constr(regex=r"^[a-z_]+$") = Field(
        ..., description="Design style (lowercase with underscores)"
    )
    room_type: constr(regex=r"^[a-z_]+$") = Field(
        ..., description="Room type (lowercase with underscores)"
    )
    width: Optional[int] = Field(1024, ge=512, le=2048, description="Image width")
    height: Optional[int] = Field(1024, ge=512, le=2048, description="Image height")
    steps: Optional[int] = Field(50, ge=20, le=100, description="Generation steps")
    guidance_scale: Optional[float] = Field(
        9.0, ge=1.0, le=20.0, description="Guidance scale"
    )

    @validator("prompt")
    def sanitize_prompt(cls, v):
        """Remove potentially harmful characters from prompt"""
        # Remove control characters and excessive whitespace
        v = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", v)
        v = re.sub(r"\s+", " ", v)
        return v.strip()


class ArchitectureGenerationRequest(BaseModel):
    """Validated request for architecture design generation"""
    
    prompt: constr(min_length=1, max_length=500) = Field(
        ..., description="Architecture prompt"
    )
    style: constr(regex=r"^[a-z_]+$") = Field(..., description="Architecture style")
    building_type: constr(regex=r"^[a-z_]+$") = Field(
        ..., description="Building type"
    )
    width: Optional[int] = Field(1024, ge=512, le=2048)
    height: Optional[int] = Field(1024, ge=512, le=2048)

    @validator("prompt")
    def sanitize_prompt(cls, v):
        v = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", v)
        v = re.sub(r"\s+", " ", v)
        return v.strip()


class FloorPlanRequest(BaseModel):
    """Validated request for floor plan generation"""
    
    prompt: constr(min_length=1, max_length=500) = Field(
        ..., description="Floor plan description"
    )
    rooms: Optional[int] = Field(3, ge=1, le=20, description="Number of rooms")
    floors: Optional[int] = Field(1, ge=1, le=5, description="Number of floors")
    style: Optional[constr(regex=r"^[a-z_]+$")] = Field(
        "modern", description="Architectural style"
    )

    @validator("prompt")
    def sanitize_prompt(cls, v):
        v = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", v)
        v = re.sub(r"\s+", " ", v)
        return v.strip()


class SearchRequest(BaseModel):
    """Validated request for search queries"""
    
    query: constr(min_length=0, max_length=200) = Field(
        "", description="Search query"
    )
    page: int = Field(1, ge=1, le=100, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")
    style: Optional[constr(regex=r"^[a-z_]+$")] = None

    @validator("query")
    def sanitize_query(cls, v):
        if not v:
            return v
        # Remove special characters that could be used for injection
        v = re.sub(r"[<>\"'%;()&+]", "", v)
        v = re.sub(r"\s+", " ", v)
        return v.strip()


def validate_file_upload(file_size: int, content_type: str) -> tuple[bool, str]:
    """
    Validate uploaded file
    
    Args:
        file_size: Size of the file in bytes
        content_type: MIME type of the file
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB"
    
    if content_type not in ALLOWED_IMAGE_FORMATS:
        return False, f"Invalid file format. Allowed formats: {', '.join(ALLOWED_IMAGE_FORMATS)}"
    
    return True, ""


def sanitize_sql_input(value: str) -> str:
    """
    Sanitize input for SQL queries
    Note: Always use parameterized queries instead when possible
    
    Args:
        value: Input string to sanitize
        
    Returns:
        Sanitized string
    """
    # Remove SQL injection patterns
    dangerous_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
        r"(--|;|\/\*|\*\/)",
        r"(\bOR\b.*=.*)",
        r"(\bAND\b.*=.*)",
    ]
    
    sanitized = value
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)
    
    return sanitized.strip()
