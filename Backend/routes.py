from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Request, Response
import shutil
import os
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from hybrid_service import HybridImageService
from database import init_db
from vision_router import vision_router
from floor_plan_service import generate_floor_plan
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Debug: Check if environment variables are loaded
print(f"HUGGING_FACE_API_TOKEN loaded: {'Yes' if os.environ.get('HUGGING_FACE_API_TOKEN') else 'No'}")
if os.environ.get('HUGGING_FACE_API_TOKEN'):
    token = os.environ.get('HUGGING_FACE_API_TOKEN')
    print(f"Token length: {len(token)} characters")
    print(f"Token starts with: {token[:10]}...")

# Initialize the hybrid service
hybrid_service = HybridImageService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        # Continue without failing - database is not critical for basic functionality
    yield
    # Shutdown
    try:
        await hybrid_service.close()
        print("Services closed successfully")
    except Exception as e:
        print(f"Error closing services: {e}")

app = FastAPI(lifespan=lifespan)

# Include the vision router
app.include_router(vision_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/floor-plan")
async def create_floor_plan(request: Request):
    try:
        data = await request.json()
        prompt = data.get("prompt")
        model = data.get("model", "default")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt not provided")

        image_bytes = generate_floor_plan(prompt, model)

        return Response(content=image_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/feed")
async def get_feed(
    query: str = Query("", description="Search query for images"),
    style: str | None = Query(None, description="Optional style to bias results (e.g., Modern, Minimalist)"),
    room_type: str | None = Query(None, description="Room type filter"),
    layout_type: str | None = Query(None, description="Layout type filter"),
    lighting: str | None = Query(None, description="Lighting filter"),
    palette_mode: str | None = Query(None, description="Palette mode filter"),
    colors: str | None = Query(None, description="Colors filter (comma-separated)"),
    materials: str | None = Query(None, description="Materials filter (comma-separated)"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(30, ge=1, le=100, description="Number of items per page"),
):
    try:
        # Build combined query with all filters
        filter_terms = []
        if style and style.lower() != "all":
            filter_terms.append(style)
        if query:
            filter_terms.append(query)
        if room_type:
            filter_terms.append(room_type)
        if layout_type:
            filter_terms.append(layout_type)
        if lighting:
            filter_terms.append(lighting)
        if palette_mode:
            filter_terms.append(palette_mode)
        if colors:
            filter_terms.extend(colors.split(","))
        if materials:
            filter_terms.extend(materials.split(","))

        # Add default terms if no specific query
        if not filter_terms:
            filter_terms.extend([
                "architecture", "interior design", "modern interior", "minimalist design",
                "scandinavian interior", "industrial design", "luxury home", "contemporary architecture",
                "residential design", "commercial architecture", "kitchen design", "bathroom design",
                "living room", "bedroom design", "office interior", "restaurant design"
            ])

        combined = " ".join(filter_terms)
        print(f"Feed endpoint called with query: '{query}', style: {style}, room_type: {room_type}, layout_type: {layout_type}, combined: '{combined}'")
        result = await hybrid_service.search_photos(combined, page, per_page)
        print(f"Feed endpoint returning {len(result)} results")
        return result
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/upload")
async def upload_design(
    file: UploadFile = File(..., description="Image file to upload"),
    title: str = Query(..., description="Title of the design"),
    tags: str = Query(..., description="Comma-separated tags for the design"),
    author: str = Query(..., description="Author of the design"),
):
    upload_dir = "./uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_location = os.path.join(upload_dir, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    return {"message": "File uploaded successfully", "filename": file.filename, "title": title, "tags": tags, "author": author}


@app.get("/design-feed")
async def get_design_feed(
    query: str = Query("", description="Search query for images"),
    style: str | None = Query(None, description="Optional style to bias results (e.g., Modern, Minimalist)"),
    room_type: str | None = Query(None, description="Room type filter"),
    layout_type: str | None = Query(None, description="Layout type filter"),
    lighting: str | None = Query(None, description="Lighting filter"),
    palette_mode: str | None = Query(None, description="Palette mode filter"),
    colors: str | None = Query(None, description="Colors filter (comma-separated)"),
    materials: str | None = Query(None, description="Materials filter (comma-separated)"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(30, ge=1, le=100, description="Number of items per page"),
):
    try:
        # Build combined query with all filters
        filter_terms = []
        if style and style.lower() != "all":
            filter_terms.append(style)
        if query:
            filter_terms.append(query)
        if room_type:
            filter_terms.append(room_type)
        if layout_type:
            filter_terms.append(layout_type)
        if lighting:
            filter_terms.append(lighting)
        if palette_mode:
            filter_terms.append(palette_mode)
        if colors:
            filter_terms.extend(colors.split(","))
        if materials:
            filter_terms.extend(materials.split(","))

        # Add default terms if no specific query
        if not filter_terms:
            filter_terms.extend([
                "architecture", "interior design", "modern interior", "minimalist design",
                "scandinavian interior", "industrial design", "luxury home", "contemporary architecture",
                "residential design", "commercial architecture", "kitchen design", "bathroom design",
                "living room", "bedroom design", "office interior", "restaurant design"
            ])

        combined = " ".join(filter_terms)
        return await hybrid_service.search_photos(combined, page, per_page)
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
