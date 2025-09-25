from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Request, Response
import shutil
import os
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from hybrid_service import HybridImageService
from database import init_db
from vision_router import vision_router
from floor_plan_service import generate_floor_plan
from interior_ai_service import interior_ai_service
from indian_ecommerce_service import IndianEcommerceService
from cache_service import CacheService
from vastu_service import vastu_service, VastuRequest
from ai_design_service import ai_design_service, MaterialRequest, BudgetRequest, ColorPaletteRequest, LayoutRequest
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
indian_ecommerce_service = IndianEcommerceService()
cache_service = CacheService()

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


@app.post("/generate-interior")
async def generate_interior_design(request: Request):
    """Generate interior design using Stability AI model"""
    try:
        data = await request.json()
        prompt = data.get("prompt")
        style = data.get("style", "modern")
        room_type = data.get("room_type", "living_room")
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        # Optional parameters
        width = data.get("width", 1024)
        height = data.get("height", 1024)
        steps = data.get("steps", 50)
        guidance_scale = data.get("guidance_scale", 7.5)
        
        image_bytes = interior_ai_service.generate_interior_design(
            prompt=prompt,
            style=style,
            room_type=room_type,
            width=width,
            height=height,
            steps=steps,
            guidance_scale=guidance_scale
        )
        
        if not image_bytes:
            raise HTTPException(status_code=500, detail="Failed to generate interior design")
        
        return Response(content=image_bytes, media_type="image/png")
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/generate-architecture")
async def generate_architecture_design(request: Request):
    """Generate architectural design using Stability AI model"""
    try:
        data = await request.json()
        prompt = data.get("prompt")
        building_type = data.get("building_type", "residential")
        architectural_style = data.get("architectural_style", "contemporary")
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        # Optional parameters
        width = data.get("width", 1024)
        height = data.get("height", 1024)
        steps = data.get("steps", 50)
        guidance_scale = data.get("guidance_scale", 7.5)
        
        image_bytes = interior_ai_service.generate_architecture_design(
            prompt=prompt,
            building_type=building_type,
            architectural_style=architectural_style,
            width=width,
            height=height,
            steps=steps,
            guidance_scale=guidance_scale
        )
        
        if not image_bytes:
            raise HTTPException(status_code=500, detail="Failed to generate architecture design")
        
        return Response(content=image_bytes, media_type="image/png")
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/interior-styles")
async def get_interior_styles():
    """Get available interior design styles"""
    return {"styles": interior_ai_service.get_available_styles()}


@app.get("/room-types")
async def get_room_types():
    """Get available room types"""
    return {"room_types": interior_ai_service.get_available_room_types()}


# India Shopping API endpoints
@app.get("/india-shopping/products")
async def get_indian_products(
    query: str = Query("", description="Search query for products"),
    category: str = Query(None, description="Product category filter"),
    style: str = Query(None, description="Design style filter"),
    price_min: int = Query(None, description="Minimum price filter (INR)"),
    price_max: int = Query(None, description="Maximum price filter (INR)"),
    retailer: str = Query(None, description="Specific retailer filter"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(30, ge=1, le=100, description="Number of items per page"),
):
    """Get products from Indian retailers"""
    try:
        # Create cache key
        cache_key = f"indian_products_{query}_{category}_{style}_{price_min}_{price_max}_{page}_{per_page}"
        
        # Try to get from cache first
        cached_result = await cache_service.get(cache_key)
        if cached_result:
            print(f"Cache hit for key: {cache_key}")
            return cached_result
        
        # Fetch from service
        products = await indian_ecommerce_service.search_products(
            query=query,
            category=category,
            price_min=price_min,
            price_max=price_max
        )
        
        # Apply pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_products = products[start_idx:end_idx]
        
        result = {
            "products": paginated_products,
            "total": len(products),
            "page": page,
            "per_page": per_page,
            "total_pages": (len(products) + per_page - 1) // per_page
        }
        
        # Cache the result for 5 minutes
        await cache_service.set(cache_key, result, expiry=300)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Indian products: {str(e)}")


@app.get("/india-shopping/retailers")
async def get_indian_retailers():
    """Get list of supported Indian retailers"""
    # Get retailers from the service
    retailers = [r["name"] for r in indian_ecommerce_service.retailers]
    return {"retailers": retailers}


@app.get("/india-shopping/featured")
async def get_featured_products():
    """Get featured products from Indian retailers"""
    try:
        products = await indian_ecommerce_service.get_featured_products()
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch featured products: {str(e)}")


# Vastu Shastra API endpoints
@app.post("/vastu/analyze-room")
async def analyze_room(request: Request):
    """Analyze a single room's Vastu compliance"""
    try:
        data = await request.json()
        room_type = data.get("room_type")
        direction = data.get("direction")
        
        if not room_type or not direction:
            raise HTTPException(status_code=400, detail="Room type and direction are required")
        
        analysis = vastu_service.analyze_room(room_type, direction)
        return analysis.dict()
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/vastu/analyze-house")
async def analyze_house(vastu_request: VastuRequest):
    """Analyze complete house Vastu compliance"""
    try:
        analysis = vastu_service.analyze_house(vastu_request)
        return analysis.dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/vastu/tips")
async def get_vastu_tips(category: str = Query("all", description="Category of tips (colors, lighting, furniture, plants, water, all)")):
    """Get Vastu tips by category"""
    try:
        tips = vastu_service.get_vastu_tips(category)
        return {"tips": tips}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/vastu/directional-guide")
async def get_directional_guide():
    """Get comprehensive directional guide with elements and significance"""
    try:
        guide = vastu_service.get_directional_guide()
        return guide
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/vastu/room-types")
async def get_vastu_room_types():
    """Get available room types for Vastu analysis"""
    return {
        "room_types": [
            {"value": "main_entrance", "label": "Main Entrance"},
            {"value": "living_room", "label": "Living Room"},
            {"value": "master_bedroom", "label": "Master Bedroom"},
            {"value": "kitchen", "label": "Kitchen"},
            {"value": "bathroom", "label": "Bathroom"},
            {"value": "study_room", "label": "Study Room"},
            {"value": "dining_room", "label": "Dining Room"},
            {"value": "guest_room", "label": "Guest Room"},
            {"value": "pooja_room", "label": "Pooja Room"},
            {"value": "staircase", "label": "Staircase"}
        ]
    }


@app.get("/vastu/directions")
async def get_vastu_directions():
    """Get available directions for Vastu analysis"""
    return {
        "directions": [
            {"value": "north", "label": "North"},
            {"value": "north-east", "label": "North-East"},
            {"value": "east", "label": "East"},
            {"value": "south-east", "label": "South-East"},
            {"value": "south", "label": "South"},
            {"value": "south-west", "label": "South-West"},
            {"value": "west", "label": "West"},
            {"value": "north-west", "label": "North-West"},
            {"value": "center", "label": "Center"}
        ]
    }


# AI Design Service endpoints
@app.post("/ai/materials")
async def get_material_suggestions(request: MaterialRequest):
    """Get AI-powered material suggestions"""
    try:
        suggestions = await ai_design_service.get_material_suggestions(request)
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get material suggestions: {str(e)}")


@app.post("/ai/budget")
async def get_budget_prediction(request: BudgetRequest):
    """Get AI-powered budget predictions"""
    try:
        prediction = await ai_design_service.get_budget_prediction(request)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get budget prediction: {str(e)}")


@app.post("/ai/colors")
async def generate_color_palette(request: ColorPaletteRequest):
    """Generate AI-powered color palettes"""
    try:
        palette = await ai_design_service.generate_color_palette(request)
        return palette
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate color palette: {str(e)}")


@app.post("/ai/layout")
async def optimize_room_layout(request: LayoutRequest):
    """Get AI-powered room layout optimization"""
    try:
        layout = await ai_design_service.optimize_room_layout(request)
        return layout
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to optimize room layout: {str(e)}")


@app.get("/ai/room-types")
async def get_ai_room_types():
    """Get available room types for AI services"""
    return {
        "room_types": [
            {"value": "living_room", "label": "Living Room"},
            {"value": "bedroom", "label": "Bedroom"},
            {"value": "kitchen", "label": "Kitchen"},
            {"value": "bathroom", "label": "Bathroom"},
            {"value": "dining_room", "label": "Dining Room"},
            {"value": "office", "label": "Office"},
            {"value": "hallway", "label": "Hallway"},
            {"value": "outdoor", "label": "Outdoor"}
        ]
    }


@app.get("/ai/design-styles")
async def get_ai_design_styles():
    """Get available design styles for AI services"""
    return {
        "styles": [
            {"value": "modern", "label": "Modern"},
            {"value": "traditional", "label": "Traditional"},
            {"value": "scandinavian", "label": "Scandinavian"},
            {"value": "industrial", "label": "Industrial"},
            {"value": "luxury", "label": "Luxury"},
            {"value": "minimalist", "label": "Minimalist"},
            {"value": "bohemian", "label": "Bohemian"},
            {"value": "rustic", "label": "Rustic"}
        ]
    }
