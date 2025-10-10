"""
AI Design Service using Groq API and Gemini as fallback
Provides AI-powered design recommendations for materials, budgets, colors, and layouts
"""

from groq import Groq
import google.generativeai as genai
from pydantic import BaseModel
from enum import Enum
from typing import Optional, List, Dict, AsyncGenerator, Any
import os
import json
import asyncio
import random
from indian_ecommerce_service import IndianEcommerceService

class RoomType(str, Enum):
    LIVING_ROOM = "living_room"
    BEDROOM = "bedroom"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    DINING_ROOM = "dining_room"
    OFFICE = "office"
    HALLWAY = "hallway"
    OUTDOOR = "outdoor"

class DesignStyle(str, Enum):
    MODERN = "modern"
    TRADITIONAL = "traditional"
    SCANDINAVIAN = "scandinavian"
    INDUSTRIAL = "industrial"
    LUXURY = "luxury"
    MINIMALIST = "minimalist"
    BOHEMIAN = "bohemian"
    RUSTIC = "rustic"

class MaterialRequest(BaseModel):
    room_type: RoomType
    style: DesignStyle
    room_size: float  # in square meters
    durability_needs: str  # high, medium, low
    budget_range: str  # low, medium, high
    special_requirements: Optional[str] = None

class BudgetRequest(BaseModel):
    room_type: RoomType
    style: DesignStyle
    room_size: float
    materials: List[str]
    renovation_scope: str  # full, partial, refresh
    location: str = "India"

class ColorPaletteRequest(BaseModel):
    room_type: RoomType
    style: DesignStyle
    lighting_type: str  # natural, artificial, mixed
    mood: str  # energetic, calm, cozy, professional
    existing_colors: Optional[List[str]] = None

class LayoutRequest(BaseModel):
    room_type: RoomType
    room_dimensions: Dict[str, float]  # length, width, height
    existing_furniture: Optional[List[str]] = None
    primary_function: str
    traffic_flow_requirements: str

class AIDesignService:
    def __init__(self):
        # Initialize both providers
        self.groq_client = None
        self.gemini_client = None

        # Try to initialize Groq first
        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key:
            try:
                self.groq_client = Groq(api_key=groq_api_key)
                self.primary_provider = "groq"
                print("[SUCCESS] Groq client initialized successfully")
            except Exception as e:
                print(f"[ERROR] Failed to initialize Groq client: {e}")
                self.primary_provider = None
        else:
            print("[WARNING] GROQ_API_KEY not found")
            self.primary_provider = None

        # Initialize Gemini as fallback
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                genai.configure(api_key=gemini_api_key)
                self.gemini_client = genai.GenerativeModel('gemini-1.5-flash')
                self.fallback_provider = "gemini"
                print("[SUCCESS] Gemini client initialized successfully")
            except Exception as e:
                print(f"[ERROR] Failed to initialize Gemini client: {e}")
                self.fallback_provider = None
        else:
            print("[WARNING] GEMINI_API_KEY not found")
            self.fallback_provider = None

        # Set model names
        self.groq_model = "llama-3.3-70b-versatile"
        self.gemini_model = "gemini-1.5-pro"

        # Initialize ecommerce service
        self.ecommerce_service = IndianEcommerceService()

        # Determine which provider to use
        if self.primary_provider == "groq" and self.groq_client:
            self.client = self.groq_client
            self.model = self.groq_model
            self.provider = "groq"
        elif self.fallback_provider == "gemini" and self.gemini_client:
            self.client = self.gemini_client
            self.model = self.gemini_model
            self.provider = "gemini"
        else:
            raise ValueError("[ERROR] No AI providers available. Please check your API keys.")

    async def _call_ai_provider(self, messages, temperature=0.7, max_tokens=2000, stream=False):
        """Call the appropriate AI provider with fallback logic"""
        # Try Groq first if available
        if self.primary_provider == "groq" and self.groq_client:
            try:
                if stream and hasattr(self.groq_client, 'chat'):
                    # Groq streaming - return the streaming generator
                    result = self.groq_client.chat.completions.create(
                        model=self.groq_model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True
                    )
                    return result
                else:
                    # Groq non-streaming - use sync method in async context
                    import asyncio
                    loop = asyncio.get_event_loop()
                    response = await loop.run_in_executor(
                        None,
                        lambda: self.groq_client.chat.completions.create(
                            model=self.groq_model,
                            messages=messages,
                            temperature=temperature,
                            max_tokens=max_tokens
                        )
                    )
                    return response.choices[0].message.content
            except Exception as e:
                print(f"[ERROR] Groq API failed: {e}")
                # Fall back to Gemini
                if self.fallback_provider == "gemini" and self.gemini_client:
                    print("[INFO] Falling back to Gemini...")
                    try:
                        if stream:
                            # Gemini doesn't support streaming, so we'll simulate it by returning the full response
                            response = await self.gemini_client.generate_content(
                                self._format_messages_for_gemini(messages),
                                generation_config=genai.types.GenerationConfig(
                                    temperature=temperature,
                                    max_output_tokens=max_tokens,
                                )
                            )
                            # For streaming simulation, we'll return the full content
                            return response.text
                        else:
                            response = await self.gemini_client.generate_content(
                                self._format_messages_for_gemini(messages),
                                generation_config=genai.types.GenerationConfig(
                                    temperature=temperature,
                                    max_output_tokens=max_tokens,
                                )
                            )
                            return response.text
                    except Exception as gemini_error:
                        print(f"[ERROR] Gemini API also failed: {gemini_error}")
                        raise Exception(f"Both AI providers failed. Groq: {e}, Gemini: {gemini_error}")
                else:
                    raise Exception(f"Groq API failed and no fallback available: {e}")
        # If only Gemini is available
        elif self.fallback_provider == "gemini" and self.gemini_client:
            try:
                if stream:
                    # Gemini streaming simulation - return the full response
                    response = await self.gemini_client.generate_content(
                        self._format_messages_for_gemini(messages),
                        generation_config=genai.types.GenerationConfig(
                            temperature=temperature,
                            max_output_tokens=max_tokens,
                        )
                    )
                    return response.text
                else:
                    response = await self.gemini_client.generate_content(
                        self._format_messages_for_gemini(messages),
                        generation_config=genai.types.GenerationConfig(
                            temperature=temperature,
                            max_output_tokens=max_tokens,
                        )
                    )
                    return response.text
            except Exception as e:
                raise Exception(f"Gemini API failed: {e}")
        else:
            raise Exception("No AI providers configured")

    def _format_messages_for_gemini(self, messages):
        """Convert Groq-style messages to Gemini format"""
        if isinstance(messages, list) and len(messages) > 0:
            return messages[0]["content"]
        return str(messages)
        
    async def get_material_suggestions(self, request: MaterialRequest) -> Dict[str, Any]:
        """Get AI-powered material suggestions (non-streaming version)"""
        # Fetch real-time product data from Indian e-commerce sites
        async with self.ecommerce_service as service:
            product_query = f"{request.style.value} {request.room_type.value} flooring"
            flooring_products = await service.search_products(query=product_query, category="flooring")
            
            product_query = f"{request.style.value} {request.room_type.value} paint"
            paint_products = await service.search_products(query=product_query, category="paint")
            
            product_query = f"{request.style.value} {request.room_type.value} lighting"
            lighting_products = await service.search_products(query=product_query, category="lighting")

        # Prepare product data for the prompt
        flooring_product_info = "\n".join([f"- {p['name']} (₹{p['price']}) from {p.get('retailer', 'Unknown')}" for p in flooring_products[:5]])
        paint_product_info = "\n".join([f"- {p['name']} (₹{p['price']}) from {p.get('retailer', 'Unknown')}" for p in paint_products[:5]])
        lighting_product_info = "\n".join([f"- {p['name']} (₹{p['price']}) from {p.get('retailer', 'Unknown')}" for p in lighting_products[:5]])

        prompt = f"""
        As an expert interior designer, provide detailed material suggestions for a {request.room_type.value} with {request.style.value} style.

        Room Details:
        - Type: {request.room_type.value}
        - Style: {request.style.value}
        - Size: {request.room_size} square meters
        - Durability needs: {request.durability_needs}
        - Budget range: {request.budget_range}
        - Special requirements: {request.special_requirements or "None"}

        **Crucially, use the following real-time product data from Indian online stores to make your recommendations more concrete and actionable.**

        **Available Flooring Products:**
        {flooring_product_info}

        **Available Paint Products:**
        {paint_product_info}

        **Available Lighting Products:**
        {lighting_product_info}

        IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.
        Provide recommendations in the following exact JSON format:
        {{
            "flooring": {{
                "primary_options": [
                    {{
                        "material": "material name",
                        "description": "detailed description",
                        "pros": ["advantage 1", "advantage 2"],
                        "cons": ["disadvantage 1", "disadvantage 2"],
                        "cost_range": "₹X - ₹Y per sq ft",
                        "durability_score": 8,
                        "maintenance": "low/medium/high",
                        "example_product": "Example Product Name (₹Price) from Retailer"
                    }}
                ],
                "alternative_options": ["material1", "material2"]
            }},
            "walls": {{
                "paint": {{
                    "recommended_types": ["type1", "type2"],
                    "finishes": ["finish1", "finish2"],
                    "special_features": ["feature1", "feature2"],
                    "example_product": "Example Product Name (₹Price) from Retailer"
                }},
                "wallpaper": {{
                    "patterns": ["pattern1", "pattern2"],
                    "materials": ["material1", "material2"]
                }},
                "tiles": {{
                    "recommended_for": ["area1", "area2"],
                    "types": ["type1", "type2"]
                }}
            }},
            "ceiling": {{
                "materials": ["material1", "material2"],
                "treatments": ["treatment1", "treatment2"]
            }},
            "fixtures": {{
                "lighting": ["fixture1", "fixture2"],
                "hardware": ["hardware1", "hardware2"],
                "example_product": "Example Product Name (₹Price) from Retailer"
            }},
            "sustainability": {{
                "eco_friendly_options": ["option1", "option2"],
                "certifications": ["cert1", "cert2"]
            }},
            "indian_context": {{
                "climate_considerations": ["consideration1", "consideration2"],
                "local_materials": ["material1", "material2"],
                "cultural_elements": ["element1", "element2"]
            }},
            "summary": "Brief summary of recommendations based on real-time product data."
        }}

        Focus on materials available in India, consider climate conditions, and provide practical advice.
        """

        try:
            response_content = await self._call_ai_provider(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000,
                stream=False
            )

            # Try to extract JSON from the response
            try:
                # First try direct parsing
                result = json.loads(response_content)
                return result
            except json.JSONDecodeError:
                # Try to find JSON within the response
                import re
                json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if json_match:
                    try:
                        return json.loads(json_match.group())
                    except json.JSONDecodeError:
                        # If all JSON parsing fails, create a structured fallback
                        return {
                            "error": False,
                            "summary": "AI provided detailed material suggestions. Please see the detailed response below.",
                            "raw_response": response_content,
                            "message": "Response received but could not be parsed as structured data"
                        }
                else:
                    return {
                        "error": False,
                        "summary": "AI provided detailed material suggestions. Please see the detailed response below.",
                        "raw_response": response_content,
                        "message": "Response received but could not be parsed as structured data"
                    }

        except Exception as e:
            return {
                "error": True,
                "message": f"Failed to get material suggestions: {str(e)}"
            }

    async def stream_material_suggestions(self, request: MaterialRequest) -> AsyncGenerator[str, None]:
        """Stream AI-powered material suggestions in real-time"""
        try:
            # Send initial data event to indicate processing has started
            yield f"data: {json.dumps({'status': 'processing', 'message': 'Fetching real-time product data...', 'step': 1, 'total_steps': 3})}\n\n"
            
            # Fetch real-time product data from Indian e-commerce sites
            async with self.ecommerce_service as service:
                product_query = f"{request.style.value} {request.room_type.value} flooring"
                flooring_products = await service.search_products(query=product_query, category="flooring")
                
                yield f"data: {json.dumps({'status': 'processing', 'message': 'Fetching paint options...', 'step': 2, 'total_steps': 3})}\n\n"
                
                product_query = f"{request.style.value} {request.room_type.value} paint"
                paint_products = await service.search_products(query=product_query, category="paint")
                
                yield f"data: {json.dumps({'status': 'processing', 'message': 'Fetching lighting options...', 'step': 3, 'total_steps': 3})}\n\n"
                
                product_query = f"{request.style.value} {request.room_type.value} lighting"
                lighting_products = await service.search_products(query=product_query, category="lighting")

            # Prepare product data for the prompt
            flooring_product_info = "\n".join([f"- {p['name']} (₹{p['price']}) from {p.get('retailer', 'Unknown')}" for p in flooring_products[:5]])
            paint_product_info = "\n".join([f"- {p['name']} (₹{p['price']}) from {p.get('retailer', 'Unknown')}" for p in paint_products[:5]])
            lighting_product_info = "\n".join([f"- {p['name']} (₹{p['price']}) from {p.get('retailer', 'Unknown')}" for p in lighting_products[:5]])

            prompt = f"""
            As an expert interior designer, provide detailed material suggestions for a {request.room_type.value} with {request.style.value} style.

            Room Details:
            - Type: {request.room_type.value}
            - Style: {request.style.value}
            - Size: {request.room_size} square meters
            - Durability needs: {request.durability_needs}
            - Budget range: {request.budget_range}
            - Special requirements: {request.special_requirements or "None"}

            **Crucially, use the following real-time product data from Indian online stores to make your recommendations more concrete and actionable.**

            **Available Flooring Products:**
            {flooring_product_info}

            **Available Paint Products:**
            {paint_product_info}

            **Available Lighting Products:**
            {lighting_product_info}

            IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.
            Provide recommendations in the following exact JSON format:
            {{
                "flooring": {{
                    "primary_options": [
                        {{
                            "material": "material name",
                            "description": "detailed description",
                            "pros": ["advantage 1", "advantage 2"],
                            "cons": ["disadvantage 1", "disadvantage 2"],
                            "cost_range": "₹X - ₹Y per sq ft",
                            "durability_score": 8,
                            "maintenance": "low/medium/high",
                            "example_product": "Example Product Name (₹Price) from Retailer"
                        }}
                    ],
                    "alternative_options": ["material1", "material2"]
                }},
                "walls": {{
                    "paint": {{
                        "recommended_types": ["type1", "type2"],
                        "finishes": ["finish1", "finish2"],
                        "special_features": ["feature1", "feature2"],
                        "example_product": "Example Product Name (₹Price) from Retailer"
                    }},
                    "wallpaper": {{
                        "patterns": ["pattern1", "pattern2"],
                        "materials": ["material1", "material2"]
                    }},
                    "tiles": {{
                        "recommended_for": ["area1", "area2"],
                        "types": ["type1", "type2"]
                    }}
                }},
                "ceiling": {{
                    "materials": ["material1", "material2"],
                    "treatments": ["treatment1", "treatment2"]
                }},
                "fixtures": {{
                    "lighting": ["fixture1", "fixture2"],
                    "hardware": ["hardware1", "hardware2"],
                    "example_product": "Example Product Name (₹Price) from Retailer"
                }},
                "sustainability": {{
                    "eco_friendly_options": ["option1", "option2"],
                    "certifications": ["cert1", "cert2"]
                }},
                "indian_context": {{
                    "climate_considerations": ["consideration1", "consideration2"],
                    "local_materials": ["material1", "material2"],
                    "cultural_elements": ["element1", "element2"]
                }},
                "summary": "Brief summary of recommendations based on real-time product data."
            }}

            Focus on materials available in India, consider climate conditions, and provide practical advice.
            """

            # Send data to indicate AI processing has started
            yield f"data: {json.dumps({'status': 'ai_processing', 'message': 'Generating personalized material suggestions...', 'step': 0, 'total_steps': 0})}\n\n"
            
            # Handle streaming based on provider
            if self.provider == "groq":
                stream = self.groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=2000,
                    stream=True
                )
                
                # Accumulate the response content
                full_response = ""
                for chunk in stream:
                    content = chunk.choices[0].delta.content or ""
                    if content:
                        full_response += content
                        # Send partial response as it accumulates (for long-running AI responses)
                        yield f"data: {json.dumps({'partial_response': content, 'status': 'generating'})}\n\n"
            else:
                # For Gemini, which doesn't support true streaming, get the full response
                response_content = await self._call_ai_provider(
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=2000,
                    stream=False
                )
                full_response = response_content
                yield f"data: {json.dumps({'partial_response': full_response, 'status': 'generating'})}\n\n"
            
            # Continue with the rest of the function logic
            
            # Try to parse the complete response as JSON
            try:
                # First try direct parsing
                result = json.loads(full_response)
                yield f"data: {json.dumps({'complete_response': result, 'status': 'complete'})}\n\n"
            except json.JSONDecodeError:
                # Try to find JSON within the response
                import re
                json_match = re.search(r'\{.*\}', full_response, re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                        yield f"data: {json.dumps({'complete_response': result, 'status': 'complete'})}\n\n"
                    except json.JSONDecodeError:
                        # If all JSON parsing fails, send the raw response
                        yield f"data: {json.dumps({'raw_response': full_response, 'status': 'complete', 'error': 'Could not parse as JSON'})}\n\n"
                else:
                    # Send the raw response if no JSON found
                    yield f"data: {json.dumps({'raw_response': full_response, 'status': 'complete', 'error': 'No JSON found in response'})}\n\n"

        except Exception as e:
            error_message = {
                "error": True,
                "message": f"Failed to get material suggestions: {str(e)}",
                "status": "error"
            }
            yield f"data: {json.dumps(error_message)}\n\n"

    async def get_budget_prediction(self, request: BudgetRequest) -> AsyncGenerator[str, None]:
        """Get AI-powered budget predictions in a stream"""
        
        # Fetch real-time product data from Indian e-commerce sites, with fallback to mock data
        product_prices = {}
        try:
            async with self.ecommerce_service as service:
                for material in request.materials:
                    product_query = f"{request.style.value} {request.room_type.value} {material}"
                    products = await service.search_products(query=product_query, category=material)
                    if products:
                        # Get average price for the material
                        prices = [p['price'] for p in products if p['price'] > 0]
                        if prices:
                            product_prices[material] = sum(prices) / len(prices)
        except Exception as e:
            print(f"Warning: Could not fetch real product data: {e}. Using mock data instead.")
            # Use mock data if real fetching fails
            for material in request.materials:
                product_prices[material] = random.uniform(500, 20000)  # Generate mock prices

        # Prepare product data for the prompt
        product_price_info = "\n".join([f"- {material}: ₹{price:.2f}" for material, price in product_prices.items()])

        prompt = f"""
        As an expert cost estimator for interior design in India, provide detailed budget predictions for a {request.room_type.value} renovation.

        Project Details:
        - Room type: {request.room_type.value}
        - Style: {request.style.value}
        - Room size: {request.room_size} square meters
        - Materials: {', '.join(request.materials)}
        - Renovation scope: {request.renovation_scope}
        - Location: {request.location}

        **Crucially, use the following real-time average prices from Indian online stores to make your budget calculations more accurate.**

        **Average Material Prices:**
        {product_price_info}

        IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.
        Provide cost estimation in the following exact JSON format (all costs in INR):
        {{
            "total_budget": {{
                "minimum": 50000,
                "average": 75000,
                "maximum": 100000,
                "currency": "INR"
            }},
            "category_breakdown": {{
                "materials": {{
                    "amount": 40000,
                    "percentage": 53,
                    "details": {{
                        "flooring": 15000,
                        "paint": 8000,
                        "fixtures": 12000,
                        "hardware": 5000
                    }}
                }},
                "labor": {{
                    "amount": 20000,
                    "percentage": 27,
                    "details": {{
                        "skilled_labor": 15000,
                        "unskilled_labor": 5000
                    }}
                }},
                "design_consultation": {{
                    "amount": 7500,
                    "percentage": 10
                }},
                "contingency": {{
                    "amount": 7500,
                    "percentage": 10
                }}
            }},
            "timeline": {{
                "planning_phase": "1-2 weeks",
                "execution_phase": "3-4 weeks",
                "total_duration": "4-6 weeks"
            }},
            "cost_factors": {{
                "room_size_impact": "Medium - standard pricing applies",
                "style_complexity": "High - {request.style.value} requires premium materials",
                "location_factor": "Standard rates for {request.location}",
                "market_conditions": "Current market rates applied"
            }},
            "savings_tips": [
                "Consider local alternatives for imported materials",
                "Plan renovation during off-season for better labor rates",
                "Buy materials in bulk for better pricing"
            ],
            "payment_schedule": {{
                "advance": {{
                    "percentage": 30,
                    "amount": 22500,
                    "timing": "Before work starts"
                }},
                "progress_payments": [
                    {{ "percentage": 40, "amount": 30000, "milestone": "50% work completion" }},
                    {{ "percentage": 30, "amount": 22500, "milestone": "Work completion" }}
                ]
            }},
            "indian_market_insights": {{
                "seasonal_variations": "Prices may vary by 10-15% during festival seasons",
                "regional_differences": "Costs may vary by location within India",
                "gst_implications": "18% GST applicable on most services"
            }}
        }}

        Base your estimates on current Indian market rates and include GST where applicable.
        """

        try:
            # Send initial processing status
            yield f"data: {json.dumps({'status': 'processing', 'message': 'Analyzing project requirements...', 'step': 1, 'total_steps': 3})}\n\n"

            # Send AI processing status
            yield f"data: {json.dumps({'status': 'ai_processing', 'message': 'Generating personalized budget recommendations with Groq AI...', 'step': 2, 'total_steps': 3})}\n\n"

            # Call AI provider (using the appropriate provider based on configuration)
            response_content = await self._call_ai_provider(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000,
                stream=False  # Use non-streaming for consistency with budget output
            )

            # Send parsing status
            yield f"data: {json.dumps({'status': 'parsing', 'message': 'Processing AI response...', 'step': 3, 'total_steps': 3})}\n\n"

            # Try to parse the complete response as JSON
            try:
                # First try direct parsing
                result = json.loads(response_content)
                # Send completion with full result
                yield f"data: {json.dumps({'complete_response': result, 'status': 'complete', 'message': 'Budget prediction completed'})}\n\n"
            except json.JSONDecodeError:
                # Try to find JSON within the response
                import re
                json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                        yield f"data: {json.dumps({'complete_response': result, 'status': 'complete', 'message': 'Budget prediction completed'})}\n\n"
                    except json.JSONDecodeError:
                        # If all JSON parsing fails, send the raw response
                        yield f"data: {json.dumps({'raw_response': response_content, 'status': 'complete', 'error': 'Could not parse as JSON', 'message': 'Budget prediction completed'})}\n\n"
                else:
                    # Send the raw response if no JSON found
                    yield f"data: {json.dumps({'raw_response': response_content, 'status': 'complete', 'error': 'No JSON found in response', 'message': 'Budget prediction completed'})}\n\n"

        except Exception as e:
            error_message = {
                "error": True,
                "message": f"Failed to get budget prediction: {str(e)}",
                "status": "error"
            }
            yield f"data: {json.dumps(error_message)}\n\n"

    def calculate_color_contrast(self, color1_hex: str, color2_hex: str) -> float:
        """Calculate WCAG contrast ratio between two colors"""
        def hex_to_rgb(hex_color):
            hex_color = hex_color.lstrip('#')
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        
        def relative_luminance(rgb):
            r, g, b = [x / 255.0 for x in rgb]
            r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
            g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
            b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4
            return 0.2126 * r + 0.7152 * g + 0.0722 * b
        
        rgb1 = hex_to_rgb(color1_hex)
        rgb2 = hex_to_rgb(color2_hex)
        l1 = relative_luminance(rgb1)
        l2 = relative_luminance(rgb2)
        
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)
    
    def get_color_temperature(self, hex_color: str) -> str:
        """Determine if a color is warm, cool, or neutral"""
        hex_color = hex_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        
        if r > b + 20:
            return "warm"
        elif b > r + 20:
            return "cool"
        else:
            return "neutral"

    async def generate_color_palette(self, request: ColorPaletteRequest) -> Dict[str, Any]:
        """Generate AI-powered color palettes with real color theory and accessibility"""
        
        # Get color temperature preference based on mood
        temp_preference = {
            "energetic": "warm and vibrant",
            "calm": "cool and soothing",
            "cozy": "warm and inviting",
            "professional": "neutral and balanced"
        }.get(request.mood, "balanced")
        
        prompt = f"""
        As an expert color consultant with deep knowledge of color theory, psychology, and accessibility, create a harmonious color palette for a {request.room_type.value} with {request.style.value} style.

        Room Details:
        - Type: {request.room_type.value}
        - Style: {request.style.value}
        - Lighting: {request.lighting_type}
        - Desired mood: {request.mood} ({temp_preference} colors preferred)
        - Existing colors: {request.existing_colors or "None - complete freedom"}

        CRITICAL REQUIREMENTS:
        1. Follow the 60-30-10 rule (dominant, secondary, accent)
        2. Ensure colors work well under {request.lighting_type} lighting
        3. Consider color psychology for {request.mood} mood
        4. Provide accessibility-compliant color combinations
        5. Include Indian cultural context and Vastu principles

        IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.
        Provide color recommendations in the following exact JSON format:
        {{
            "primary_palette": {{
                "dominant_color": {{
                    "name": "Warm White",
                    "hex": "#F8F6F0",
                    "rgb": "248, 246, 240",
                    "usage": "60% - Main walls, ceiling",
                    "psychology": "Creates sense of space and calm"
                }},
                "secondary_color": {{
                    "name": "Sage Green",
                    "hex": "#87A96B",
                    "rgb": "135, 169, 107",
                    "usage": "30% - Accent wall, furniture",
                    "psychology": "Brings nature indoors, promotes relaxation"
                }},
                "accent_color": {{
                    "name": "Terracotta",
                    "hex": "#C65D07",
                    "rgb": "198, 93, 7",
                    "usage": "10% - Accessories, artwork",
                    "psychology": "Adds warmth and energy"
                }}
            }},
            "alternative_palettes": [
                {{
                    "theme": "Monochromatic",
                    "colors": [
                        {{"name": "Light Gray", "hex": "#E5E5E5"}},
                        {{"name": "Medium Gray", "hex": "#B0B0B0"}},
                        {{"name": "Charcoal", "hex": "#404040"}}
                    ]
                }},
                {{
                    "theme": "Complementary",
                    "colors": [
                        {{"name": "Navy Blue", "hex": "#1B365D"}},
                        {{"name": "Coral", "hex": "#FF6B6B"}},
                        {{"name": "Cream", "hex": "#FFF8DC"}}
                    ]
                }}
            ],
            "room_specific_recommendations": {{
                "walls": {{
                    "main_walls": "#F8F6F0",
                    "accent_wall": "#87A96B",
                    "trim": "#FFFFFF"
                }},
                "ceiling": "#FFFFFF",
                "flooring_complement": ["#8B4513", "#D2B48C", "#F5DEB3"],
                "furniture_colors": ["#FFFFFF", "#87A96B", "#8B4513"],
                "textile_colors": ["#C65D07", "#87A96B", "#F8F6F0"]
            }},
            "lighting_considerations": {{
                "natural_light": "Colors will appear brighter and more vibrant",
                "artificial_light": "Warm LED lights recommended to enhance color warmth",
                "time_of_day_variations": "Colors may shift slightly throughout the day"
            }},
            "cultural_context": {{
                "vastu_compliance": "Colors align with Vastu principles for {request.room_type.value}",
                "indian_preferences": "Incorporates colors popular in Indian homes",
                "festival_compatibility": "Colors work well with traditional decorations"
            }},
            "maintenance_tips": [
                "Use washable paint finishes in high-traffic areas",
                "Consider darker colors for areas prone to staining",
                "Light colors help small spaces appear larger"
            ],
            "mood_achievement": "This palette creates a {request.mood} atmosphere through strategic color psychology",
            "accessibility": {{
                "contrast_ratios": {{
                    "dominant_to_text": 4.5,
                    "secondary_to_text": 4.5,
                    "wcag_aa_compliant": true,
                    "wcag_aaa_compliant": false
                }},
                "color_blind_friendly": true,
                "recommendations": [
                    "Use sufficient contrast for text readability",
                    "Avoid relying solely on color to convey information",
                    "Test colors with color blindness simulators"
                ]
            }},
            "seasonal_variations": {{
                "summer": ["Lighter shades recommended for hot months"],
                "winter": ["Warmer tones create cozy atmosphere"],
                "monsoon": ["Bright colors combat gloomy weather"]
            }},
            "paint_brands_india": {{
                "asian_paints": ["Specific shade names from Asian Paints catalog"],
                "berger_paints": ["Specific shade names from Berger catalog"],
                "nerolac": ["Specific shade names from Nerolac catalog"]
            }},
            "cost_estimate": {{
                "paint_cost_per_sqft": "₹15-25 for premium brands",
                "total_estimate_range": "₹8,000-15,000 for average room",
                "labor_cost": "₹10-15 per sqft"
            }}
        }}

        Consider Indian climate, cultural preferences, Vastu principles, and real paint availability.
        Ensure colors are practical, available in Indian market, and culturally appropriate.
        """

        try:
            response_content = await self._call_ai_provider(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,  # Higher temperature for more creative color combinations
                max_tokens=2500,
                stream=False
            )

            content = response_content

            # Try to extract JSON from the response
            try:
                # First try direct parsing
                result = json.loads(content)
            except json.JSONDecodeError:
                # Try to find JSON within the response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        # If all JSON parsing fails, create a structured fallback
                        return {
                            "error": False,
                            "summary": "AI provided detailed color palette recommendations. Please see the detailed response below.",
                            "raw_response": content,
                            "message": "Response received but could not be parsed as structured data"
                        }
                else:
                    return {
                        "error": False,
                        "summary": "AI provided detailed color palette recommendations. Please see the detailed response below.",
                        "raw_response": content,
                        "message": "Response received but could not be parsed as structured data"
                    }
            
            # Add calculated accessibility metrics if we have the colors
            if "primary_palette" in result:
                try:
                    dominant_hex = result["primary_palette"]["dominant_color"]["hex"]
                    secondary_hex = result["primary_palette"]["secondary_color"]["hex"]
                    accent_hex = result["primary_palette"]["accent_color"]["hex"]
                    
                    # Calculate contrast ratios
                    contrast_dom_sec = self.calculate_color_contrast(dominant_hex, secondary_hex)
                    contrast_dom_acc = self.calculate_color_contrast(dominant_hex, accent_hex)
                    
                    # Add temperature analysis
                    result["color_analysis"] = {
                        "dominant_temperature": self.get_color_temperature(dominant_hex),
                        "secondary_temperature": self.get_color_temperature(secondary_hex),
                        "accent_temperature": self.get_color_temperature(accent_hex),
                        "contrast_ratios": {
                            "dominant_to_secondary": round(contrast_dom_sec, 2),
                            "dominant_to_accent": round(contrast_dom_acc, 2)
                        }
                    }
                except Exception as e:
                    # If calculation fails, just continue without it
                    pass
            
            return result
                
        except Exception as e:
            return {
                "error": True,
                "message": f"Failed to generate color palette: {str(e)}"
            }

    async def optimize_room_layout(self, request: LayoutRequest) -> Dict[str, Any]:
        """Get AI-powered room layout optimization"""
        
        prompt = f"""
        As an expert space planner, optimize the layout for a {request.room_type.value} to maximize functionality and flow.

        Room Details:
        - Type: {request.room_type.value}
        - Dimensions: {request.room_dimensions}
        - Existing furniture: {request.existing_furniture or "None"}
        - Primary function: {request.primary_function}
        - Traffic flow needs: {request.traffic_flow_requirements}

        Provide layout optimization in the following JSON format:
        {{
            "optimal_layout": {{
                "furniture_placement": [
                    {{
                        "item": "Sofa",
                        "position": {{
                            "x": 2.0,
                            "y": 1.0,
                            "rotation": 0
                        }},
                        "dimensions": {{
                            "length": 2.2,
                            "width": 0.9,
                            "height": 0.8
                        }},
                        "reasoning": "Positioned to face the main focal point while allowing traffic flow"
                    }}
                ],
                "traffic_paths": [
                    {{
                        "from": "entrance",
                        "to": "seating area",
                        "width": 1.2,
                        "description": "Main circulation path"
                    }}
                ],
                "focal_points": [
                    {{
                        "type": "Entertainment center",
                        "position": {{
                            "x": 0.0,
                            "y": 3.0
                        }},
                        "description": "Main visual anchor for the room"
                    }}
                ]
            }},
            "space_utilization": {{
                "total_area": {request.room_dimensions.get('length', 0) * request.room_dimensions.get('width', 0)},
                "usable_area": 85,
                "circulation_area": 15,
                "efficiency_score": 8.5
            }},
            "functional_zones": [
                {{
                    "name": "Primary seating",
                    "area": 6.0,
                    "furniture": ["Sofa", "Coffee table"],
                    "purpose": "Main relaxation and entertainment area"
                }},
                {{
                    "name": "Secondary seating",
                    "area": 3.0,
                    "furniture": ["Accent chair"],
                    "purpose": "Additional seating for guests"
                }}
            ],
            "design_principles": {{
                "balance": "Asymmetrical balance achieved through furniture placement",
                "proportion": "Furniture scaled appropriately for room size",
                "rhythm": "Created through repetition of colors and shapes",
                "emphasis": "Entertainment center serves as focal point"
            }},
            "lighting_plan": {{
                "ambient_lighting": [
                    {{
                        "type": "Ceiling fixture",
                        "position": "Center of room",
                        "purpose": "General illumination"
                    }}
                ],
                "task_lighting": [
                    {{
                        "type": "Table lamp",
                        "position": "Side table",
                        "purpose": "Reading light"
                    }}
                ],
                "accent_lighting": [
                    {{
                        "type": "Wall sconces",
                        "position": "Accent wall",
                        "purpose": "Highlight artwork"
                    }}
                ]
            }},
            "storage_solutions": [
                {{
                    "type": "Built-in shelving",
                    "location": "Along wall",
                    "capacity": "Books and decorative items",
                    "accessibility": "Easy reach"
                }}
            ],
            "flexibility_features": [
                "Modular furniture allows reconfiguration",
                "Multi-purpose pieces maximize functionality",
                "Clear pathways enable easy rearrangement"
            ],
            "indian_context": {{
                "vastu_compliance": "Layout follows Vastu principles for {request.room_type.value}",
                "cultural_considerations": "Space for traditional activities and gatherings",
                "climate_adaptations": "Furniture placement considers ventilation needs"
            }},
            "improvement_suggestions": [
                "Consider adding plants for better air quality",
                "Use mirrors to enhance natural light",
                "Add area rugs to define spaces"
            ]
        }}

        Consider Indian living patterns, Vastu principles, and climate considerations.
        """

        try:
            response_content = await self._call_ai_provider(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,  # Balanced temperature for creative yet practical layouts
                max_tokens=2500,
                stream=False
            )

            content = response_content

            # Try to extract JSON from the response
            try:
                # First try direct parsing
                return json.loads(content)
            except json.JSONDecodeError:
                # Try to find JSON within the response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    try:
                        return json.loads(json_match.group())
                    except json.JSONDecodeError:
                        pass

                # If all JSON parsing fails, create a structured fallback
                return {
                    "error": False,
                    "summary": "AI provided detailed layout optimization. Please see the detailed response below.",
                    "raw_response": content,
                    "message": "Response received but could not be parsed as structured data"
                }
                
        except Exception as e:
            return {
                "error": True,
                "message": f"Failed to optimize room layout: {str(e)}"
            }

# Initialize the service
ai_design_service = AIDesignService()
