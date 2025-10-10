from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Request, Response
import shutil
import os
import logging
import time
import asyncio
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from hybrid_service import HybridImageService
from database import init_db
from vision_router import vision_router
from floor_plan_service import generate_floor_plan
from interior_ai_service import interior_ai_service
from indian_ecommerce_service import IndianEcommerceService
from interior_design_ecommerce_service import InteriorDesignEcommerceService
from cache_service import CacheService
from vastu_service import vastu_service, VastuRequest
from ai_design_service import ai_design_service, MaterialRequest, BudgetRequest, ColorPaletteRequest, LayoutRequest
from realtime_service import realtime_service
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Debug: Check if environment variables are loaded
print(f"HUGGING_FACE_API_TOKEN loaded: {'Yes' if os.environ.get('HUGGING_FACE_API_TOKEN') else 'No'}")
if os.environ.get('HUGGING_FACE_API_TOKEN'):
    token = os.environ.get('HUGGING_FACE_API_TOKEN')
    print(f"Token length: {len(token)} characters")
    print(f"Token starts with: {token[:10]}...")

# Initialize the hybrid service
hybrid_service = HybridImageService()
indian_ecommerce_service = IndianEcommerceService()
interior_design_ecommerce_service = InteriorDesignEcommerceService()
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
    per_page: int = Query(60, ge=1, le=100, description="Number of items per page"),
    use_aggregated: bool = Query(True, description="Whether to use aggregated results from multiple providers"),
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

        # Add default design terms if no specific query or minimal query
        if not filter_terms or (len(filter_terms) == 1 and filter_terms[0].lower() in ["", " ", "design", "architecture", "interior"]):
            filter_terms.extend([
                "architecture", "interior design", "modern interior", "minimalist design",
                "scandinavian interior", "industrial design", "luxury home", "contemporary architecture",
                "residential design", "commercial architecture", "kitchen design", "bathroom design",
                "living room", "bedroom design", "office interior", "restaurant design"
            ])
        elif not any(term.lower() in ["design", "architecture", "interior", "home", "room", "kitchen", "bathroom", "living", "bedroom", "office"] for term in filter_terms):
            # If the query doesn't contain design-related terms, add some
            filter_terms.extend(["interior design", "architecture"])

        combined = " ".join(filter_terms)
        print(f"Feed endpoint called with query: '{query}', style: {style}, room_type: {room_type}, layout_type: {layout_type}, combined: '{combined}'")
        
        if use_aggregated:
            # Use the new aggregated search for unlimited designs
            result = await hybrid_service.search_photos_aggregated(combined, page, per_page, max_pages=2)
        else:
            # Use the regular search if aggregated is disabled
            result = await hybrid_service.search_photos(combined, page, per_page)
        
        # Validate that the result is a list to prevent "Invalid response format" errors
        if not isinstance(result, list):
            logger.error(f"Search returned non-list result: {type(result)} - {result}")
            result = []  # Fallback to empty list if result is not a list
            
        print(f"Feed endpoint returning {len(result)} results")
        
        # Start background task to cache next few pages
        asyncio.create_task(hybrid_service.cache_next_pages(combined, page, per_page))
        
        # Return a response that includes pagination info for infinite scrolling
        # Always indicate there's more to prevent "No more designs to load" - this ensures infinite scroll continues
        has_more = True
        
        return {
            "results": result,
            "page": page,
            "per_page": per_page,
            "has_more": has_more,
            "query": combined
        }
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
    per_page: int = Query(100, ge=1, le=100, description="Number of items per page"),
    use_aggregated: bool = Query(True, description="Whether to use aggregated results from multiple providers"),
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

        # Add default design terms if no specific query or minimal query
        if not filter_terms or (len(filter_terms) == 1 and filter_terms[0].lower() in ["", " ", "design", "architecture", "interior"]):
            filter_terms.extend([
                "architecture", "interior design", "modern interior", "minimalist design",
                "scandinavian interior", "industrial design", "luxury home", "contemporary architecture",
                "residential design", "commercial architecture", "kitchen design", "bathroom design",
                "living room", "bedroom design", "office interior", "restaurant design"
            ])
        elif not any(term.lower() in ["design", "architecture", "interior", "home", "room", "kitchen", "bathroom", "living", "bedroom", "office"] for term in filter_terms):
            # If the query doesn't contain design-related terms, add some
            filter_terms.extend(["interior design", "architecture"])

        combined = " ".join(filter_terms)
        
        if use_aggregated:
            # Use the new aggregated search for unlimited designs
            result = await hybrid_service.search_photos_aggregated(combined, page, per_page, max_pages=2)
        else:
            # Use the regular search if aggregated is disabled
            result = await hybrid_service.search_photos(combined, page, per_page)
        
        # Validate that the result is a list to prevent "Invalid response format" errors
        if not isinstance(result, list):
            logger.error(f"Search returned non-list result: {type(result)} - {result}")
            result = []  # Fallback to empty list if result is not a list
        
        print(f"Feed endpoint returning {len(result)} results")
        
        # Start background task to cache next few pages
        asyncio.create_task(hybrid_service.cache_next_pages(combined, page, per_page))
        
        # Return a response that includes pagination info for infinite scrolling
        # Always indicate there's more to prevent "No more designs to load" - this ensures infinite scroll continues
        has_more = True
        
        return {
            "results": result,
            "page": page,
            "per_page": per_page,
            "has_more": has_more,
            "query": combined
        }
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/generate-interior")
async def generate_interior_design(request: Request):
    """Generate interior design using multi-provider AI service with rate limit handling"""
    try:
        data = await request.json()
        prompt = data.get("prompt")
        style = data.get("style", "auto")
        room_type = data.get("room_type", "auto")
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        if not prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        # Optional parameters
        width = data.get("width", 1024)
        height = data.get("height", 1024)
        steps = data.get("steps", 50)
        guidance_scale = data.get("guidance_scale", 7.5)
        
        # Log the request for debugging
        logger.info(f"🎨 Interior generation request:")
        logger.info(f"   Prompt: {prompt}")
        logger.info(f"   Style: {style}")
        logger.info(f"   Room Type: {room_type}")
        
        # Try the new multi-provider service first
        try:
            from multi_ai_service import multi_ai_service
            
            image_bytes, used_placeholder = multi_ai_service.generate_interior_image(
                prompt=prompt,
                style=style,
                room_type=room_type,
                width=width,
                height=height,
                steps=steps,
                guidance_scale=guidance_scale
            )
            
            if image_bytes and not used_placeholder:
                logger.info("✅ Successfully generated image with multi-provider service")
                return Response(content=image_bytes, media_type="image/png")
            elif used_placeholder:
                logger.warning("⚠️ Multi-provider service returned placeholder image - treating as failure")
            else:
                logger.warning("⚠️ Multi-provider service failed, trying fallback...")
                
        except Exception as multi_error:
            logger.error(f"Multi-provider service error: {str(multi_error)}")
        
        # Fallback to original service
        logger.info("🔄 Falling back to original interior AI service...")
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
            raise HTTPException(
                status_code=503, 
                detail="AI image generation services are currently overloaded. Please try again in a few minutes. This often happens due to high demand on free AI services."
            )
        
        return Response(content=image_bytes, media_type="image/png")
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Interior generation error: {str(e)}")
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


# India Shopping API endpoints - DISABLED
# @app.get("/india-shopping/products")
# async def get_indian_products(
#     query: str = Query("", description="Search query for products"),
#     category: str = Query(None, description="Product category filter"),
#     style: str = Query(None, description="Design style filter"),
#     price_min: int = Query(None, description="Minimum price filter (INR)"),
#     price_max: int = Query(None, description="Maximum price filter (INR)"),
#     retailer: str = Query(None, description="Specific retailer filter"),
#     page: int = Query(1, ge=1, description="Page number"),
#     per_page: int = Query(100, ge=1, le=100, description="Number of items per page"),
# ):
#     """Get products from Indian retailers"""
#     try:
#         # Create cache key
#         cache_key = f"indian_products_{query}_{category}_{style}_{price_min}_{price_max}_{page}_{per_page}"
#
#         # Try to get from cache first
#         cached_result = await cache_service.get(cache_key)
#         if cached_result:
#             print(f"Cache hit for key: {cache_key}")
#             return cached_result
#
#         # Fetch from service
#         products = await indian_ecommerce_service.search_products(
#             query=query,
#             category=category,
#             price_min=price_min,
#             price_max=price_max
#         )
#
#         # Apply pagination
#         start_idx = (page - 1) * per_page
#         end_idx = start_idx + per_page
#         paginated_products = products[start_idx:end_idx]
#
#         result = {
#             "products": paginated_products,
#             "total": len(products),
#             "page": page,
#             "per_page": per_page,
#             "total_pages": (len(products) + per_page - 1) // per_page
#         }
#
#         # Cache the result for 5 minutes
#         await cache_service.set(cache_key, result, expiry=300)
#
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch Indian products: {str(e)}")


# @app.get("/india-shopping/retailers")
# async def get_indian_retailers():
#     """Get list of supported Indian retailers"""
#     # Get retailers from the service
#     retailers = [r["name"] for r in indian_ecommerce_service.retailers]
#     return {"retailers": retailers}


# @app.get("/india-shopping/featured")
# async def get_featured_products():
#     """Get featured products from Indian retailers"""
#     try:
#         products = await indian_ecommerce_service.get_featured_products()
#         return {"products": products}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch featured products: {str(e)}")


# # Interior Design Shopping API endpoints
# @app.get("/interior-design-shopping/products")
# async def get_interior_design_products(
#     query: str = Query("", description="Search query for products"),
#     category: str = Query(None, description="Product category filter"),
#     style: str = Query(None, description="Design style filter"),
#     price_min: int = Query(None, description="Minimum price filter (INR)"),
#     price_max: int = Query(None, description="Maximum price filter (INR)"),
#     retailer: str = Query(None, description="Specific retailer filter"),
#     page: int = Query(1, ge=1, description="Page number"),
#     per_page: int = Query(10, ge=1, le=100, description="Number of items per page"),
# ):
#     """Get interior design products from various retailers"""
#     try:
#         # Create cache key
#         cache_key = f"interior_design_products_{query}_{category}_{style}_{price_min}_{price_max}_{page}_{per_page}"
#
#         # Try to get from cache first
#         cached_result = await cache_service.get(cache_key)
#         if cached_result:
#             print(f"Cache hit for key: {cache_key}")
#             return cached_result
#
#         async with interior_design_ecommerce_service as service:
#             # Fetch from service
#             products = await service.search_products(
#                 query=query,
#                 category=category,
#                 price_min=price_min,
#                 price_max=price_max,
#                 style=style,
#                 retailer=retailer,
#                 page=page,
#                 per_page=per_page
#             )
#
#             # Format products for response
#             formatted_products = []
#             for product in products:
#                 formatted_products.append({
#                     "id": product.id,
#                     "name": product.name,
#                     "brand": product.brand,
#                     "price": product.price,
#                     "original_price": product.original_price,
#                     "rating": product.rating,
#                     "reviews": product.reviews,
#                     "image": product.image,
#                     "category": product.category,
#                     "style": product.style,
#                     "colors": product.colors,
#                     "dimensions": product.dimensions,
#                     "retailer": product.retailer,
#                     "in_stock": product.in_stock,
#                     "discount": product.discount,
#                     "is_wishlisted": product.is_wishlisted,
#                     "tags": product.tags,
#                     "currency": product.currency,
#                     "delivery_time": product.delivery_time,
#                     "warranty": product.warranty,
#                     "specifications": product.specifications,
#                     "features": product.features,
#                     "material": product.material,
#                     "designer": product.designer,
#                     "design_style": product.design_style,
#                     "sustainability_rating": product.sustainability_rating,
#                     "certified_eco_friendly": product.certified_eco_friendly,
#                     "stock_quantity": product.stock_quantity,
#                     "availability_status": product.availability_status,
#                     "shipping_cost": product.shipping_cost,
#                     "estimated_delivery": product.estimated_delivery,
#                     "customer_rating_breakdown": product.customer_rating_breakdown,
#                     "verified_reviews": product.verified_reviews,
#                     "price_history": product.price_history,
#                     "related_products": product.related_products,
#                     "trending_score": product.trending_score,
#                     "personalization_score": product.personalization_score,
#                     "last_updated": product.last_updated.isoformat() if product.last_updated else None
#                 })
#
#         result = {
#             "products": formatted_products,
#             "total": len(formatted_products),
#             "page": page,
#             "per_page": per_page,
#             "total_pages": (len(formatted_products) + per_page - 1) // per_page
#         }
#
#         # Cache the result for 5 minutes
#         await cache_service.set(cache_key, result, expiry=300)
#
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch interior design products: {str(e)}")


# @app.get("/interior-design-shopping/product/{product_id}")
# async def get_interior_design_product_details(product_id: str):
#     """Get detailed information for a specific interior design product"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             product = await service.get_product_details(product_id, "")  # Retailer will be determined from product_id
#
#             return {
#                 "id": product.id,
#                 "name": product.name,
#                 "brand": product.brand,
#                 "price": product.price,
#                 "original_price": product.original_price,
#                 "rating": product.rating,
#                 "reviews": product.reviews,
#                 "image": product.image,
#                 "category": product.category,
#                 "style": product.style,
#                 "colors": product.colors,
#                 "dimensions": product.dimensions,
#                 "retailer": product.retailer,
#                 "in_stock": product.in_stock,
#                 "discount": product.discount,
#                 "is_wishlisted": product.is_wishlisted,
#                 "tags": product.tags,
#                 "currency": product.currency,
#                 "delivery_time": product.delivery_time,
#                 "warranty": product.warranty,
#                 "return_policy": product.return_policy,
#                 "description": product.description,
#                 "specifications": product.specifications,
#                 "features": product.features,
#                 "material": product.material,
#                 "designer": product.designer,
#                 "design_style": product.design_style,
#                 "sustainability_rating": product.sustainability_rating,
#                 "certified_eco_friendly": product.certified_eco_friendly,
#                 "stock_quantity": product.stock_quantity,
#                 "availability_status": product.availability_status,
#                 "shipping_cost": product.shipping_cost,
#                 "estimated_delivery": product.estimated_delivery,
#                 "customer_rating_breakdown": product.customer_rating_breakdown,
#                 "verified_reviews": product.verified_reviews,
#                 "price_history": product.price_history,
#                 "related_products": product.related_products,
#                 "trending_score": product.trending_score,
#                 "personalization_score": product.personalization_score,
#                 "last_updated": product.last_updated.isoformat() if product.last_updated else None
#             }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch product details: {str(e)}")


# @app.get("/interior-design-shopping/trending")
# async def get_trending_interior_design_products(limit: int = Query(20, description="Number of trending products to return")):
#     """Get trending interior design products"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             products = await service.get_trending_products(limit=limit)
#
#             formatted_products = []
#             for product in products:
#                 formatted_products.append({
#                     "id": product.id,
#                     "name": product.name,
#                     "brand": product.brand,
#                     "price": product.price,
#                     "original_price": product.original_price,
#                     "rating": product.rating,
#                     "reviews": product.reviews,
#                     "image": product.image,
#                     "category": product.category,
#                     "style": product.style,
#                     "colors": product.colors,
#                     "dimensions": product.dimensions,
#                     "retailer": product.retailer,
#                     "in_stock": product.in_stock,
#                     "discount": product.discount,
#                     "is_wishlisted": product.is_wishlisted,
#                     "tags": product.tags,
#                     "currency": product.currency,
#                     "delivery_time": product.delivery_time,
#                     "warranty": product.warranty,
#                     "return_policy": product.return_policy,
#                     "trending_score": product.trending_score,
#                     "last_updated": product.last_updated.isoformat() if product.last_updated else None
#                 })
#
#         return {"products": formatted_products}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch trending products: {str(e)}")


# @app.get("/interior-design-shopping/personalized/{user_id}")
# async def get_personalized_recommendations(user_id: str, limit: int = Query(20, description="Number of recommendations to return")):
#     """Get personalized product recommendations for a user"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             products = await service.get_personalized_recommendations(user_id, limit=limit)
#
#             formatted_products = []
#             for product in products:
#                 formatted_products.append({
#                     "id": product.id,
#                     "name": product.name,
#                     "brand": product.brand,
#                     "price": product.price,
#                     "original_price": product.original_price,
#                     "rating": product.rating,
#                     "reviews": product.reviews,
#                     "image": product.image,
#                     "category": product.category,
#                     "style": product.style,
#                     "colors": product.colors,
#                     "dimensions": product.dimensions,
#                     "retailer": product.retailer,
#                     "in_stock": product.in_stock,
#                     "discount": product.discount,
#                     "is_wishlisted": product.is_wishlisted,
#                     "tags": product.tags,
#                     "currency": product.currency,
#                     "delivery_time": product.delivery_time,
#                     "warranty": product.warranty,
#                     "return_policy": product.return_policy,
#                     "personalization_score": product.personalization_score,
#                     "last_updated": product.last_updated.isoformat() if product.last_updated else None
#                 })
#
#         return {"products": formatted_products}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch personalized recommendations: {str(e)}")


# @app.get("/interior-design-shopping/inventory-updates")
# async def get_realtime_inventory_updates():
#     """Get real-time inventory updates for products"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             updates = await service.get_realtime_inventory_updates()
#         return {"updates": updates}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch inventory updates: {str(e)}")


# @app.get("/interior-design-shopping/price-comparisons/{product_name}")
# async def get_price_comparisons(product_name: str):
#     """Get price comparisons across platforms for a product"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             comparisons = await service.get_price_comparisons(product_name)
#         return {"comparisons": comparisons}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch price comparisons: {str(e)}")


# @app.post("/interior-design-shopping/price-alerts")
# async def create_price_alert(request: Request):
#     """Set up price alerts for a product"""
#     try:
#         data = await request.json()
#         user_id = data.get("user_id")
#         product_id = data.get("product_id")
#         target_price = data.get("target_price")
#
#         if not user_id or not product_id or target_price is None:
#             raise HTTPException(status_code=400, detail="user_id, product_id, and target_price are required")
#
#         async with interior_design_ecommerce_service as service:
#             alert = await service.get_price_alerts(user_id, product_id, target_price)
#         return alert
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to create price alert: {str(e)}")


# @app.get("/interior-design-shopping/ar-preview/{product_id}")
# async def get_ar_preview_data(product_id: str):
#     """Get AR preview data for a product"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             ar_data = await service.get_ar_preview_data(product_id)
#         return ar_data
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch AR preview data: {str(e)}")


# @app.get("/interior-design-shopping/demand-forecast/{product_id}")
# async def get_demand_forecast(product_id: str, days: int = Query(30, description="Number of days to forecast")):
#     """Get demand forecast for a product"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             forecast = await service.get_demand_forecast(product_id, days)
#         return {"forecast": forecast}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch demand forecast: {str(e)}")


# # New real-time features for the smart shopping page
# @app.get("/interior-design-shopping/realtime-updates")
# async def get_realtime_updates():
#     """Get real-time updates for products across all retailers"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             updates = await service.get_realtime_inventory_updates()
#         return {"updates": updates}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch real-time updates: {str(e)}")


# @app.get("/interior-design-shopping/enhanced-comparisons/{product_name}")
# async def get_enhanced_product_comparisons(product_name: str):
#     """Get enhanced product comparisons across platforms"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             comparisons = await service.get_enhanced_product_comparisons(product_name)
#         return {"comparisons": comparisons}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch product comparisons: {str(e)}")

@app.post("/ai/texture-generation")
async def generate_texture(request: Request):
    """Generate a texture image from a text description."""
    try:
        data = await request.json()
        prompt = data.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt not provided")

        image_bytes = interior_ai_service.generate_texture(prompt)

        return Response(content=image_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# @app.get("/interior-design-shopping/realtime-ratings/{product_id}")
# async def get_realtime_rating_updates(product_id: str):
#     """Get real-time rating and review updates for a product"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             updates = await service.get_realtime_rating_updates(product_id)
#         return updates
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch rating updates: {str(e)}")


# @app.post("/interior-design-shopping/track-behavior")
# async def track_user_behavior(request: Request):
#     """Track user behavior for personalization"""
#     try:
#         data = await request.json()
#         user_id = data.get("user_id")
#         action = data.get("action")
#         product_id = data.get("product_id")
#         metadata = data.get("metadata", {})
#
#         if not user_id or not action:
#             raise HTTPException(status_code=400, detail="user_id and action are required")
#
#         async with interior_design_ecommerce_service as service:
#             result = await service.track_user_behavior(user_id, action, product_id, metadata)
#
#         return {"success": result}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to track user behavior: {str(e)}")


# @app.get("/interior-design-shopping/personalized-insights/{user_id}")
# async def get_personalized_insights(user_id: str):
#     """Get personalized insights based on user behavior"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             insights = await service.get_personalized_insights(user_id)
#         return insights
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch personalized insights: {str(e)}")


# @app.get("/interior-design-shopping/retailers")
# async def get_retailers():
#     """Get list of supported retailers"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             retailers = [r["name"] for r in service.retailers]
#         return {"retailers": retailers}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch retailers: {str(e)}")


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
    """Get AI-powered material suggestions (non-streaming version)"""
    try:
        suggestions = await ai_design_service.get_material_suggestions(request)
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get material suggestions: {str(e)}")


@app.post("/ai/materials-stream")
async def stream_material_suggestions(request: MaterialRequest):
    """Stream AI-powered material suggestions in real-time"""
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        ai_design_service.stream_material_suggestions(request),
        media_type="text/event-stream"
    )


@app.post("/ai/budget")
async def get_budget_prediction(request: BudgetRequest):
    """Get AI-powered budget predictions with streaming response"""
    try:
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            ai_design_service.get_budget_prediction(request),
            media_type="text/plain"
        )
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
            {"value": "rustic", "label": "Rustic"},
            {"value": "contemporary", "label": "Contemporary"},
            {"value": "mid_century", "label": "Mid-Century Modern"},
            {"value": "farmhouse", "label": "Farmhouse"},
            {"value": "art_deco", "label": "Art Deco"}
        ]
    }


@app.post("/ai/layout-image")
async def generate_layout_image(request: Request):
    """Generate AI-powered layout image"""
    try:
        from layout_image_service import layout_image_service, LayoutImageRequest

        data = await request.json()
        layout_request = LayoutImageRequest(**data)

        result = await layout_image_service.generate_layout_image(layout_request)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate layout image: {str(e)}")


@app.get("/ai/layout-models-status")
async def get_layout_models_status():
    """Get status of available layout generation models"""
    try:
        from layout_image_service import layout_image_service

        status = await layout_image_service.get_model_status()
        return status

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model status: {str(e)}")


@app.get("/realtime-updates")
async def get_realtime_updates(request: Request, query: str = Query("design", description="Search query for real-time updates")):
    """Stream real-time updates for design feed"""
    return StreamingResponse(
        realtime_service.stream_updates(request, query),
        media_type="text/event-stream"
    )


# @app.get("/interior-design-shopping/performance-optimization")
# async def get_performance_optimization():
#     """Get performance optimizations for real-time features"""
#     try:
#         async with interior_design_ecommerce_service as service:
#             optimization_data = await service.get_performance_optimized_data()
#         return optimization_data
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch performance data: {str(e)}")

# @app.get("/interior-design-shopping/real-time-features")
# async def get_real_time_features():
#     """Get data for the real-time features section."""
#     try:
#         async with interior_design_ecommerce_service as service:
#             price_comparisons = await service.get_enhanced_product_comparisons("Modern Sectional Sofa")
#             trending_products = await service.get_trending_products_realtime(limit=3)
#             inventory_updates = await service.get_realtime_inventory_status()
#         return {
#             "price_comparisons": price_comparisons,
#             "trending_products": trending_products,
#             "inventory_updates": inventory_updates,
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch real-time features: {str(e)}")


# Vastu Shastra endpoints
@app.get("/vastu/room-types")
async def get_vastu_room_types():
    """Get available room types for Vastu analysis"""
    from vastu_service import RoomType
    return {
        "room_types": [
            {"value": room.value, "label": room.value.replace("_", " ").title()}
            for room in RoomType
        ]
    }


@app.get("/vastu/directions")
async def get_vastu_directions():
    """Get available directions for Vastu analysis"""
    from vastu_service import Direction
    return {
        "directions": [
            {"value": direction.value, "label": direction.value.replace("_", " ").title()}
            for direction in Direction
        ]
    }


@app.post("/vastu/analyze-room")
async def analyze_vastu_room(request: Request):
    """Analyze a room's Vastu compliance"""
    try:
        from vastu_service import vastu_service, RoomType, Direction

        data = await request.json()
        room_type = data.get("room_type")
        direction = data.get("direction")

        if not room_type or not direction:
            raise HTTPException(status_code=400, detail="Room type and direction are required")

        # Convert string values to enums
        try:
            room_enum = RoomType(room_type)
            direction_enum = Direction(direction.replace(" ", "-"))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid room type or direction: {e}")

        # Get analysis
        analysis = vastu_service.analyze_room(room_enum.value, direction_enum.value)

        # Convert to dict for JSON response
        return {
            "room_type": analysis.room_type.value,
            "direction": analysis.direction.value,
            "status": analysis.status.value,
            "score": analysis.score,
            "ideal_directions": [d.value for d in analysis.ideal_directions],
            "avoid_directions": [d.value for d in analysis.avoid_directions],
            "recommendations": analysis.recommendations,
            "benefits": analysis.benefits,
            "issues": analysis.issues,
            "element": {
                "name": analysis.element.name,
                "direction": analysis.element.direction.value,
                "properties": analysis.element.properties,
                "color": analysis.element.color,
                "benefits": analysis.element.benefits,
                "tips": analysis.element.tips
            } if analysis.element else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze room: {str(e)}")


@app.post("/vastu/analyze-room-detailed")
async def analyze_vastu_room_detailed(request: Request):
    """Get detailed Vastu analysis with remedies"""
    try:
        from vastu_service import vastu_service, RoomType, Direction

        data = await request.json()
        room_type = data.get("room_type")
        direction = data.get("direction")

        if not room_type or not direction:
            raise HTTPException(status_code=400, detail="Room type and direction are required")

        # Convert string values to enums
        try:
            room_enum = RoomType(room_type)
            direction_enum = Direction(direction.replace(" ", "-"))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid room type or direction: {e}")

        # Get detailed analysis
        detailed_analysis = vastu_service.get_detailed_room_analysis(room_enum.value, direction_enum.value)

        # Convert to dict for JSON response
        return {
            "basic_analysis": {
                "room_type": detailed_analysis.basic_analysis.room_type.value,
                "direction": detailed_analysis.basic_analysis.direction.value,
                "status": detailed_analysis.basic_analysis.status.value,
                "score": detailed_analysis.basic_analysis.score,
                "ideal_directions": [d.value for d in detailed_analysis.basic_analysis.ideal_directions],
                "avoid_directions": [d.value for d in detailed_analysis.basic_analysis.avoid_directions],
                "recommendations": detailed_analysis.basic_analysis.recommendations,
                "benefits": detailed_analysis.basic_analysis.benefits,
                "issues": detailed_analysis.basic_analysis.issues,
                "element": {
                    "name": detailed_analysis.basic_analysis.element.name if detailed_analysis.basic_analysis.element else None,
                    "direction": detailed_analysis.basic_analysis.element.direction.value if detailed_analysis.basic_analysis.element else None,
                    "properties": detailed_analysis.basic_analysis.element.properties if detailed_analysis.basic_analysis.element else None,
                    "color": detailed_analysis.basic_analysis.element.color if detailed_analysis.basic_analysis.element else None,
                    "benefits": detailed_analysis.basic_analysis.element.benefits if detailed_analysis.basic_analysis.element else None,
                    "tips": detailed_analysis.basic_analysis.element.tips if detailed_analysis.basic_analysis.element else None
                } if detailed_analysis.basic_analysis.element else None
            },
            "remedies": {
                "crystals": detailed_analysis.remedies.crystals if detailed_analysis.remedies else [],
                "plants": detailed_analysis.remedies.plants if detailed_analysis.remedies else [],
                "colors": detailed_analysis.remedies.colors if detailed_analysis.remedies else [],
                "mirrors": detailed_analysis.remedies.mirrors if detailed_analysis.remedies else [],
                "symbols": detailed_analysis.remedies.symbols if detailed_analysis.remedies else [],
                "general_tips": detailed_analysis.remedies.general_tips if detailed_analysis.remedies else []
            } if detailed_analysis.remedies else None,
            "energy_flow_score": detailed_analysis.energy_flow_score,
            "prosperity_impact": detailed_analysis.prosperity_impact,
            "health_impact": detailed_analysis.health_impact,
            "relationship_impact": detailed_analysis.relationship_impact,
            "detailed_recommendations": detailed_analysis.detailed_recommendations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get detailed analysis: {str(e)}")


@app.get("/vastu/directional-guide")
async def get_vastu_directional_guide():
    """Get comprehensive directional guide"""
    try:
        from vastu_service import vastu_service

        guide = vastu_service.get_directional_guide()
        return guide

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get directional guide: {str(e)}")


@app.get("/vastu/tips/{category}")
async def get_vastu_tips(category: str = "all"):
    """Get Vastu tips by category"""
    try:
        from vastu_service import vastu_service

        tips = vastu_service.get_vastu_tips(category)
        return tips

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get Vastu tips: {str(e)}")


@app.get("/vastu/score-interpretation/{score}")
async def get_vastu_score_interpretation(score: int):
    """Get detailed interpretation of Vastu score"""
    try:
        from vastu_service import vastu_service

        interpretation = vastu_service.get_vastu_score_interpretation(score)
        return interpretation

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get score interpretation: {str(e)}")


@app.post("/vastu/analyze-house")
async def analyze_vastu_house(request: Request):
    """Analyze complete house Vastu compliance"""
    try:
        from vastu_service import vastu_service, VastuRequest, RoomType, Direction

        data = await request.json()
        rooms_data = data.get("rooms", [])
        house_facing = data.get("house_facing")
        plot_shape = data.get("plot_shape", "rectangular")

        # Convert to proper format
        rooms = []
        for room_data in rooms_data:
            try:
                room_type = RoomType(room_data["type"])
                direction = Direction(room_data["direction"].replace(" ", "-"))
                rooms.append({"type": room_type.value, "direction": direction.value})
            except ValueError:
                continue

        if not rooms:
            raise HTTPException(status_code=400, detail="No valid rooms provided")

        vastu_request = VastuRequest(
            rooms=rooms,
            house_facing=Direction(house_facing.replace(" ", "-")) if house_facing else None,
            plot_shape=plot_shape
        )

        # Get analysis
        house_analysis = vastu_service.analyze_house(vastu_request)

        # Convert to dict for JSON response
        return {
            "overall_score": house_analysis.overall_score,
            "overall_status": house_analysis.overall_status.value,
            "room_analyses": [
                {
                    "room_type": analysis.room_type.value,
                    "direction": analysis.direction.value,
                    "status": analysis.status.value,
                    "score": analysis.score,
                    "recommendations": analysis.recommendations,
                    "benefits": analysis.benefits,
                    "issues": analysis.issues
                }
                for analysis in house_analysis.room_analyses
            ],
            "general_recommendations": house_analysis.general_recommendations,
            "critical_issues": house_analysis.critical_issues,
            "positive_aspects": house_analysis.positive_aspects
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze house: {str(e)}")