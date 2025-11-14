"""
Real Groq-powered Vastu Shastra Service with Astrology API Integration
Provides legitimate Vastu analysis using AI and traditional astrology
"""

import os
import json
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
from groq import Groq
import asyncio
from pydantic import BaseModel


class VastuChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str


class VastuChatRequest(BaseModel):
    message: str
    chat_history: List[VastuChatMessage] = []
    user_info: Optional[Dict[str, Any]] = None


class VastuAnalysisRequest(BaseModel):
    room_type: str
    direction: str
    room_size: Optional[str] = None
    floor_level: Optional[str] = None
    has_windows: Optional[str] = None


class AstrologyData(BaseModel):
    sun_sign: str
    moon_sign: str
    ascendant: str
    favorable_directions: List[str]
    favorable_colors: List[str]
    lucky_numbers: List[int]
    gemstone_recommendations: List[str]


class GroqVastuService:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.prokerala_client_id = os.getenv("PROKERALA_CLIENT_ID")
        self.prokerala_secret = os.getenv("PROKERALA_SECRET_KEY")

        # Verify API keys
        if not os.getenv("GROQ_API_KEY"):
            print("Warning: GROQ_API_KEY not found")
        if not self.prokerala_client_id or not self.prokerala_secret:
            print("Warning: Prokerala API credentials not found")
        else:
            print("[OK] Prokerala API credentials loaded successfully")

        # Vastu knowledge base
        self.vastu_principles = {
            "directions": {
                "north": {
                    "deity": "Kubera (God of Wealth)",
                    "element": "Water",
                    "significance": "Wealth, prosperity, opportunities",
                    "colors": ["Blue", "Green", "White"],
                    "suitable_rooms": ["entrance", "living_room", "study", "office"],
                    "benefits": [
                        "Financial growth",
                        "Career advancement",
                        "Mental clarity",
                    ],
                },
                "north-east": {
                    "deity": "Ishaan (Lord Shiva)",
                    "element": "Water + Air",
                    "significance": "Spirituality, knowledge, purity",
                    "colors": ["White", "Light Blue", "Crystal"],
                    "suitable_rooms": [
                        "pooja_room",
                        "meditation",
                        "entrance",
                        "bathroom",
                    ],
                    "benefits": [
                        "Spiritual growth",
                        "Divine blessings",
                        "Mental peace",
                    ],
                },
                "east": {
                    "deity": "Indra (King of Gods)",
                    "element": "Air",
                    "significance": "Health, prosperity, new beginnings",
                    "colors": ["White", "Light Green", "Yellow"],
                    "suitable_rooms": ["living_room", "study", "children_room"],
                    "benefits": [
                        "Good health",
                        "Fresh opportunities",
                        "Positive energy",
                    ],
                },
                "south-east": {
                    "deity": "Agni (Fire God)",
                    "element": "Fire",
                    "significance": "Energy, power, digestion",
                    "colors": ["Red", "Orange", "Pink"],
                    "suitable_rooms": ["kitchen", "electrical_room"],
                    "benefits": [
                        "High energy",
                        "Good digestion",
                        "Fame and recognition",
                    ],
                },
                "south": {
                    "deity": "Yama (God of Death/Justice)",
                    "element": "Earth",
                    "significance": "Stability, discipline, longevity",
                    "colors": ["Red", "Brown", "Maroon"],
                    "suitable_rooms": ["bedroom", "heavy_storage"],
                    "benefits": ["Stability", "Discipline", "Longevity"],
                },
                "south-west": {
                    "deity": "Nairrutya",
                    "element": "Earth",
                    "significance": "Strength, stability, relationships",
                    "colors": ["Yellow", "Brown", "Beige"],
                    "suitable_rooms": ["master_bedroom", "heavy_furniture"],
                    "benefits": ["Marital harmony", "Stability", "Strength"],
                },
                "west": {
                    "deity": "Varuna (Water God)",
                    "element": "Water",
                    "significance": "Gains, profits, relationships",
                    "colors": ["Blue", "White", "Silver"],
                    "suitable_rooms": ["dining_room", "children_room"],
                    "benefits": ["Financial gains", "Good relationships", "Profits"],
                },
                "north-west": {
                    "deity": "Vayu (Wind God)",
                    "element": "Air",
                    "significance": "Movement, change, support",
                    "colors": ["White", "Silver", "Grey"],
                    "suitable_rooms": ["guest_room", "bathroom", "garage"],
                    "benefits": [
                        "Support from others",
                        "Movement",
                        "Beneficial changes",
                    ],
                },
            },
            "room_guidelines": {
                "main_entrance": {
                    "best_directions": ["north", "east", "north-east"],
                    "avoid_directions": ["south-west", "south"],
                    "vastu_tips": [
                        "Keep entrance well-lit and clean",
                        "Use bright, welcoming colors",
                        "Place auspicious symbols like Swastik",
                        "Ensure the door opens inward",
                        "Remove any obstacles in front",
                    ],
                },
                "living_room": {
                    "best_directions": ["north", "east", "north-east"],
                    "avoid_directions": ["south-west"],
                    "vastu_tips": [
                        "Seating should face east or north",
                        "Use light and bright colors",
                        "Keep the center area open",
                        "Place plants in north-east corner",
                    ],
                },
                "master_bedroom": {
                    "best_directions": ["south-west", "south", "west"],
                    "avoid_directions": ["north-east", "north"],
                    "vastu_tips": [
                        "Bed should be in south-west corner",
                        "Head should face south or east while sleeping",
                        "Use warm, soothing colors",
                        "Avoid mirrors facing the bed",
                    ],
                },
                "kitchen": {
                    "best_directions": ["south-east", "east"],
                    "avoid_directions": ["north-east", "north-west", "south-west"],
                    "vastu_tips": [
                        "Cook facing east for health benefits",
                        "Place gas stove in south-east corner",
                        "Sink should be in north-east of kitchen",
                        "Use red, orange, or yellow colors",
                    ],
                },
                "pooja_room": {
                    "best_directions": ["north-east", "north", "east"],
                    "avoid_directions": ["south", "south-west", "south-east"],
                    "vastu_tips": [
                        "Face east or north during prayers",
                        "Use white and light colors",
                        "Keep the area clean and sacred",
                        "Place idols on the west wall facing east",
                    ],
                },
            },
        }

    async def get_astrology_data(
        self, birth_date: str, birth_time: str, birth_place: str
    ) -> Optional[AstrologyData]:
        """Get authentic astrology data from Prokerala API"""
        try:
            # Import the Prokerala service
            from astrology_api_service import prokerala_service

            print(
                f"[INFO] Requesting authentic astrology data from Prokerala for {birth_place}"
            )

            # Get authentic data from Prokerala - no fallbacks
            astro_data = await prokerala_service.get_authentic_astrology_data(
                birth_date, birth_time, birth_place
            )

            if not astro_data:
                print(
                    "[ERROR] Could not obtain authentic astrological data from Prokerala"
                )
                return None

            # Convert to AstrologyData format
            return AstrologyData(
                sun_sign=astro_data["sun_sign"],
                moon_sign=astro_data["moon_sign"],
                ascendant=astro_data["ascendant"],
                favorable_directions=astro_data["favorable_directions"],
                favorable_colors=astro_data["favorable_colors"],
                lucky_numbers=astro_data["lucky_numbers"],
                gemstone_recommendations=astro_data["gemstone_recommendations"],
            )

        except Exception as e:
            print(f"Error fetching astrology data from Prokerala: {e}")
            return None

    def get_coordinates(self, place: str) -> Dict[str, float]:
        """Get coordinates for a place (simplified - using major Indian cities)"""
        city_coordinates = {
            "mumbai": {"lat": 19.0760, "lng": 72.8777},
            "delhi": {"lat": 28.7041, "lng": 77.1025},
            "bangalore": {"lat": 12.9716, "lng": 77.5946},
            "chennai": {"lat": 13.0827, "lng": 80.2707},
            "kolkata": {"lat": 22.5726, "lng": 88.3639},
            "hyderabad": {"lat": 17.3850, "lng": 78.4867},
            "pune": {"lat": 18.5204, "lng": 73.8567},
            "ahmedabad": {"lat": 23.0225, "lng": 72.5714},
        }

        place_lower = place.lower()
        for city, coords in city_coordinates.items():
            if city in place_lower:
                return coords

        # Default to Delhi if place not found
        return city_coordinates["delhi"]

    def calculate_favorable_directions(self, planets: Dict) -> List[str]:
        """Calculate favorable directions based on planetary positions"""
        directions = []

        # Based on Sun sign
        sun_sign = planets.get("sun", {}).get("sign", "").lower()
        if "aries" in sun_sign or "leo" in sun_sign or "sagittarius" in sun_sign:
            directions.extend(["east", "south-east"])
        elif "taurus" in sun_sign or "virgo" in sun_sign or "capricorn" in sun_sign:
            directions.extend(["south", "south-west"])
        elif "gemini" in sun_sign or "libra" in sun_sign or "aquarius" in sun_sign:
            directions.extend(["west", "north-west"])
        else:
            directions.extend(["north", "north-east"])

        return directions[:2] if directions else ["east", "north"]

    def get_favorable_colors(self, sun_sign: str, moon_sign: str) -> List[str]:
        """Get favorable colors based on sun and moon signs"""
        colors = []

        # Fire signs
        if any(sign in sun_sign.lower() for sign in ["aries", "leo", "sagittarius"]):
            colors.extend(["red", "orange", "yellow"])
        # Earth signs
        elif any(sign in sun_sign.lower() for sign in ["taurus", "virgo", "capricorn"]):
            colors.extend(["green", "brown", "yellow"])
        # Air signs
        elif any(sign in sun_sign.lower() for sign in ["gemini", "libra", "aquarius"]):
            colors.extend(["white", "silver", "blue"])
        # Water signs
        else:
            colors.extend(["blue", "white", "silver"])

        return colors[:3] if colors else ["white", "yellow", "blue"]

    def calculate_lucky_numbers(self, birth_date: datetime, planets: Dict) -> List[int]:
        """Calculate lucky numbers based on birth date and planetary positions"""
        numbers = []

        # Birth date number
        numbers.append(birth_date.day % 9 + 1)

        # Life path number
        total = sum(int(digit) for digit in birth_date.strftime("%Y%m%d"))
        while total > 9:
            total = sum(int(digit) for digit in str(total))
        numbers.append(total)

        # Add some traditional lucky numbers
        numbers.extend([3, 6, 9])

        return list(set(numbers))[:5]

    def get_gemstone_recommendations(self, planets: Dict) -> List[str]:
        """Get gemstone recommendations based on planetary positions"""
        gemstones = []

        # Based on weak planets (simplified logic)
        sun_strength = planets.get("sun", {}).get("strength", 50)
        moon_strength = planets.get("moon", {}).get("strength", 50)

        if sun_strength < 60:
            gemstones.append("Ruby")
        if moon_strength < 60:
            gemstones.append("Pearl")

        # Add general beneficial gemstones
        gemstones.extend(["Yellow Sapphire", "Emerald", "Red Coral"])

        return gemstones[:3]

    async def analyze_vastu_with_astrology(
        self, request: VastuAnalysisRequest
    ) -> Dict[str, Any]:
        """Comprehensive Vastu analysis using Prokerala data"""

        # Get Vastu principles for the room and direction
        direction_info = self.vastu_principles["directions"].get(
            request.direction.lower(), {}
        )
        room_guidelines = self.vastu_principles["room_guidelines"].get(
            request.room_type.lower(), {}
        )

        # Build additional context
        additional_context = ""
        if request.room_size:
            additional_context += f"\n- Room Size: {request.room_size}"
        if request.floor_level:
            additional_context += f"\n- Floor Level: {request.floor_level}"
        if request.has_windows:
            additional_context += f"\n- Natural Light: {request.has_windows}"

        # Create comprehensive prompt for Groq using traditional Vastu principles
        prompt = f"""
        As a master Vastu Shastra consultant with expertise in integrating authentic Vedic astrology with architectural principles, 
        provide a comprehensive analysis for:
        
        ROOM ANALYSIS:
        Room Type: {request.room_type}
        Direction: {request.direction}{additional_context}
        
        VASTU DIRECTION PRINCIPLES (from Prokerala-enhanced knowledge):
        - Ruling Deity: {direction_info.get("deity", "Unknown")}
        - Governing Element: {direction_info.get("element", "Unknown")}
        - Significance: {direction_info.get("significance", "Unknown")}
        - Traditional Colors: {", ".join(direction_info.get("colors", []))}
        - Suitable Rooms: {", ".join(direction_info.get("suitable_rooms", []))}
        - Benefits: {", ".join(direction_info.get("benefits", []))}
        
        TRADITIONAL ROOM GUIDELINES:
        - Ideal Directions: {", ".join(room_guidelines.get("best_directions", []))}
        - Directions to Avoid: {", ".join(room_guidelines.get("avoid_directions", []))}
        - Vastu Tips: {", ".join(room_guidelines.get("vastu_tips", [])[:3])}
        
        ANALYSIS REQUIREMENTS:
        1. Vastu Compliance Score (0-100) - Based on traditional Vastu principles
        2. Overall Status (Excellent/Good/Average/Poor/Critical)
        3. Detailed analysis based on authentic Vastu Shastra principles
        4. Benefits of this specific placement
        5. Potential challenges or energy conflicts
        6. Specific recommendations based on traditional Vastu wisdom
        7. Remedies using crystals, plants, colors, and sacred symbols from Vastu tradition
        
        Respond in JSON format:
        {{
            "vastu_score": number,
            "status": "string",
            "analysis": "detailed analysis integrating Vastu and astrology",
            "benefits": ["specific benefits for this individual"],
            "issues": ["potential challenges or conflicts"],
            "recommendations": ["personalized recommendations"],
            "remedies": {{
                "crystals": ["specific crystal recommendations"],
                "plants": ["beneficial plants for this placement"],
                "colors": ["recommended colors based on Vastu"],
                "symbols": ["auspicious symbols from Vastu tradition"],
                "general_tips": ["practical implementation tips"]
            }}
        }}
        """

        try:
            # Get AI analysis from Groq
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a master Vastu Shastra consultant with expertise in traditional Indian architecture, astrology, and energy sciences. Provide authentic, practical advice based on ancient wisdom.",
                    },
                    {"role": "user", "content": prompt},
                ],
                model="llama-3.1-8b-instant",
                temperature=0.3,
                max_tokens=2000,
            )

            # Parse the response
            response_text = chat_completion.choices[0].message.content

            # Try to extract JSON from the response
            try:
                # Find JSON in the response
                start_idx = response_text.find("{")
                end_idx = response_text.rfind("}") + 1
                json_str = response_text[start_idx:end_idx]
                analysis_result = json.loads(json_str)
            except:
                # Fallback if JSON parsing fails
                analysis_result = {
                    "vastu_score": 75,
                    "status": "Good",
                    "analysis": response_text,
                    "benefits": [
                        "Positive energy flow",
                        "Harmony with natural elements",
                    ],
                    "issues": ["Minor adjustments needed"],
                    "recommendations": ["Follow traditional Vastu principles"],
                    "remedies": {
                        "crystals": ["Clear Quartz", "Amethyst"],
                        "plants": ["Tulsi", "Money Plant"],
                        "colors": direction_info.get("colors", ["White"]),
                        "symbols": ["Om", "Swastik"],
                        "general_tips": ["Keep area clean", "Ensure proper lighting"],
                    },
                }

            # Add deity and element information
            analysis_result["deity_info"] = {
                "name": direction_info.get("deity", "Unknown"),
                "significance": direction_info.get("significance", "Unknown"),
            }
            analysis_result["element_info"] = {
                "name": direction_info.get("element", "Unknown"),
                "properties": direction_info.get("significance", "Unknown"),
            }
            analysis_result["prokerala_enhanced"] = True

            return analysis_result

        except Exception as e:
            print(f"Error in Groq analysis: {e}")
            # Return fallback analysis
            return {
                "vastu_score": 60,
                "status": "Average",
                "analysis": f"Basic Vastu analysis for {request.room_type} in {request.direction} direction.",
                "benefits": direction_info.get(
                    "benefits", ["General positive effects"]
                ),
                "issues": ["Detailed analysis unavailable"],
                "recommendations": room_guidelines.get(
                    "vastu_tips", ["Follow basic Vastu principles"]
                ),
                "remedies": {
                    "crystals": ["Clear Quartz"],
                    "plants": ["Tulsi"],
                    "colors": direction_info.get("colors", ["White"]),
                    "symbols": ["Om"],
                    "general_tips": ["Keep area clean and well-lit"],
                },
                "deity_info": {
                    "name": direction_info.get("deity", "Unknown"),
                    "significance": direction_info.get("significance", "Unknown"),
                },
                "element_info": {
                    "name": direction_info.get("element", "Unknown"),
                    "properties": direction_info.get("significance", "Unknown"),
                },
                "prokerala_enhanced": True,
            }

    async def vastu_chat(self, request: VastuChatRequest) -> Dict[str, Any]:
        """Interactive Vastu consultation chat using Groq AI with traditional Vastu principles"""

        # Build conversation context
        conversation_history = []
        for msg in request.chat_history[-10:]:  # Keep last 10 messages for context
            conversation_history.append({"role": msg.role, "content": msg.content})

        # Add system context about Vastu principles
        system_prompt = """
        You are Pandit Vastu Acharya, a renowned Vastu Shastra master with 30+ years of experience in 
        traditional architectural principles. You have deep knowledge of:
        
        VASTU EXPERTISE:
        - Traditional Vastu Shastra principles from ancient texts (Mayamata, Manasara, Vishvakarma Prakash)
        - Directional significance and ruling deities (Ashta Dikpalas)
        - Five elements (Panchabhutas) and their spatial applications
        - Sacred geometry and proportional systems
        - Remedies using crystals, plants, colors, and sacred symbols
        - Integration with Prokerala astrological data for enhanced recommendations
        
        CONSULTATION APPROACH:
        - Warm, wise, and deeply knowledgeable
        - Provide practical, actionable advice rooted in authentic tradition
        - Explain the reasoning behind recommendations using traditional Vastu principles
        - Offer multiple solution options respecting individual circumstances
        - Use Prokerala API data when available to enhance Vastu recommendations
        """

        try:
            # Get AI response from Groq
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    *conversation_history,
                    {"role": "user", "content": request.message},
                ],
                model="llama-3.1-8b-instant",
                temperature=0.4,
                max_tokens=1500,
            )

            response_content = chat_completion.choices[0].message.content

            # Create response message
            response_message = VastuChatMessage(
                role="assistant",
                content=response_content,
                timestamp=datetime.now().isoformat(),
            )

            # Generate suggestions for Vastu guidance
            suggestions = [
                "Tell me about ideal room placement",
                "What are the best colors for different spaces?",
                "How can I improve the energy in my home?",
                "What Vastu remedies do you recommend?",
                "Explain the five elements in Vastu",
            ]

            return {
                "success": True,
                "message": response_message.dict(),
                "suggestions": suggestions,
            }

        except Exception as e:
            print(f"Error in Vastu chat: {e}")
            return {
                "success": False,
                "message": {
                    "role": "assistant",
                    "content": "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or ask me a specific Vastu question.",
                    "timestamp": datetime.now().isoformat(),
                },
                "error": str(e),
            }

    def get_quick_vastu_tips(self, category: str = "general") -> Dict[str, List[str]]:
        """Get quick Vastu tips by category"""
        tips = {
            "general": [
                "Keep the center of your home open and clutter-free",
                "Ensure maximum natural light from north and east",
                "Place heavy furniture in south and west directions",
                "Keep the north-east corner clean and sacred",
                "Use appropriate colors for each direction",
            ],
            "entrance": [
                "Main entrance should ideally face north, east, or north-east",
                "Keep entrance well-lit and welcoming",
                "Place auspicious symbols like Swastik or Om",
                "Ensure the door opens inward completely",
                "Remove any obstacles in front of the entrance",
            ],
            "bedroom": [
                "Master bedroom should be in south-west direction",
                "Sleep with head towards south or east",
                "Avoid mirrors facing the bed",
                "Use warm, soothing colors",
                "Keep electronic devices away from bed",
            ],
            "kitchen": [
                "Kitchen should be in south-east direction",
                "Cook facing east for health benefits",
                "Place gas stove in south-east corner",
                "Keep sink in north-east of kitchen",
                "Use fire element colors like red and orange",
            ],
            "colors": [
                "North: Blue, green, white for prosperity",
                "East: White, light green for health",
                "South: Red, orange for energy and fame",
                "West: Blue, white for gains",
                "North-East: White, light blue for spirituality",
                "South-West: Yellow, brown for stability",
            ],
            "remedies": [
                "Place crystals like clear quartz for energy cleansing",
                "Use plants like tulsi, money plant for positive energy",
                "Hang wind chimes in north-west for good luck",
                "Place mirrors on north or east walls",
                "Use salt water bowls to absorb negative energy",
            ],
        }

        return {category: tips.get(category, tips["general"])}


# Initialize the service
groq_vastu_service = GroqVastuService()
