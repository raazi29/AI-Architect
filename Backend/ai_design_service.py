"""
AI Design Service using Groq API
Provides AI-powered design recommendations for materials, budgets, colors, and layouts
"""

import os
import json
from typing import Dict, List, Any, Optional
from groq import Groq
from pydantic import BaseModel
from enum import Enum

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
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-70b-versatile"  # Groq's best model for complex reasoning
        
    async def get_material_suggestions(self, request: MaterialRequest) -> Dict[str, Any]:
        """Get AI-powered material suggestions"""
        
        prompt = f"""
        As an expert interior designer, provide detailed material suggestions for a {request.room_type.value} with {request.style.value} style.

        Room Details:
        - Type: {request.room_type.value}
        - Style: {request.style.value}
        - Size: {request.room_size} square meters
        - Durability needs: {request.durability_needs}
        - Budget range: {request.budget_range}
        - Special requirements: {request.special_requirements or "None"}

        Provide recommendations in the following JSON format:
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
                        "maintenance": "low/medium/high"
                    }}
                ],
                "alternative_options": ["material1", "material2"]
            }},
            "walls": {{
                "paint": {{
                    "recommended_types": ["type1", "type2"],
                    "finishes": ["finish1", "finish2"],
                    "special_features": ["feature1", "feature2"]
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
                "hardware": ["hardware1", "hardware2"]
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
            "summary": "Brief summary of recommendations"
        }}

        Focus on materials available in India, consider climate conditions, and provide practical advice.
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            # Try to parse JSON from the response
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # If JSON parsing fails, return structured response
                return {
                    "error": False,
                    "raw_response": content,
                    "message": "AI provided detailed recommendations"
                }
                
        except Exception as e:
            return {
                "error": True,
                "message": f"Failed to get material suggestions: {str(e)}"
            }

    async def get_budget_prediction(self, request: BudgetRequest) -> Dict[str, Any]:
        """Get AI-powered budget predictions"""
        
        prompt = f"""
        As an expert cost estimator for interior design in India, provide detailed budget predictions for a {request.room_type.value} renovation.

        Project Details:
        - Room type: {request.room_type.value}
        - Style: {request.style.value}
        - Room size: {request.room_size} square meters
        - Materials: {', '.join(request.materials)}
        - Renovation scope: {request.renovation_scope}
        - Location: {request.location}

        Provide cost estimation in the following JSON format (all costs in INR):
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
                    {{"percentage": 40, "amount": 30000, "milestone": "50% work completion"}},
                    {{"percentage": 30, "amount": 22500, "milestone": "Work completion"}}
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
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,  # Lower temperature for more consistent cost estimates
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {
                    "error": False,
                    "raw_response": content,
                    "message": "AI provided detailed budget analysis"
                }
                
        except Exception as e:
            return {
                "error": True,
                "message": f"Failed to get budget prediction: {str(e)}"
            }

    async def generate_color_palette(self, request: ColorPaletteRequest) -> Dict[str, Any]:
        """Generate AI-powered color palettes"""
        
        prompt = f"""
        As an expert color consultant, create a harmonious color palette for a {request.room_type.value} with {request.style.value} style.

        Room Details:
        - Type: {request.room_type.value}
        - Style: {request.style.value}
        - Lighting: {request.lighting_type}
        - Desired mood: {request.mood}
        - Existing colors: {request.existing_colors or "None"}

        Provide color recommendations in the following JSON format:
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
            "mood_achievement": "This palette creates a {request.mood} atmosphere through strategic color psychology"
        }}

        Consider Indian climate, cultural preferences, and Vastu principles where applicable.
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,  # Higher temperature for more creative color combinations
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {
                    "error": False,
                    "raw_response": content,
                    "message": "AI provided detailed color palette recommendations"
                }
                
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
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,  # Balanced temperature for creative yet practical layouts
                max_tokens=2500
            )
            
            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {
                    "error": False,
                    "raw_response": content,
                    "message": "AI provided detailed layout optimization"
                }
                
        except Exception as e:
            return {
                "error": True,
                "message": f"Failed to optimize room layout: {str(e)}"
            }

# Initialize the service
ai_design_service = AIDesignService()
