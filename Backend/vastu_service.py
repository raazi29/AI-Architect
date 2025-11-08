"""
Vastu Shastra Service - Groq-based Vastu analysis
"""

import os
import json
from groq import Groq
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from enum import Enum

# Configure Groq API
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

class Direction(str, Enum):
    NORTH = "north"
    NORTH_EAST = "north-east"
    EAST = "east"
    SOUTH_EAST = "south-east"
    SOUTH = "south"
    SOUTH_WEST = "south-west"
    WEST = "west"
    NORTH_WEST = "north-west"
    CENTER = "center"

class RoomType(str, Enum):
    MAIN_ENTRANCE = "main_entrance"
    LIVING_ROOM = "living_room"
    MASTER_BEDROOM = "master_bedroom"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    STUDY_ROOM = "study_room"
    DINING_ROOM = "dining_room"
    GUEST_ROOM = "guest_room"
    POOJA_ROOM = "pooja_room"
    STAIRCASE = "staircase"

class VastuStatus(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    AVERAGE = "average"
    POOR = "poor"
    CRITICAL = "critical"

class VastuRequest(BaseModel):
    rooms: List[Dict[str, str]]  # [{"type": "living_room", "direction": "north"}]
    house_facing: Optional[Direction] = None
    plot_shape: Optional[str] = "rectangular"

class RoomAnalysis(BaseModel):
    room_type: str
    direction: str
    status: VastuStatus
    score: int  # 0-100
    ideal_directions: List[str]
    avoid_directions: List[str]
    recommendations: List[str]
    benefits: List[str]
    issues: List[str]
    remedies: Optional[List[str]] = None

class VastuService:
    def __init__(self):
        self.model_name = os.getenv('VASTU_GROQ_MODEL', 'llama-3.3-70b-versatile')
        if not groq_client:
            raise ValueError("GROQ_API_KEY not configured for VastuService")
        self.vastu_rules = self._load_vastu_rules()
        
    def generate_text_summary(self, analysis: RoomAnalysis) -> str:
        # Map score to category per user's ranges
        score = analysis.score
        if score <= 40:
            category = "poor"
        elif 40 < score <= 70:
            category = "moderate"
        elif 70 < score <= 80:
            category = "better"
        elif 80 < score < 90:
            category = "good"
        else:
            category = "excellent"

        prompt = f"""
Write a clear, neutral, and helpful narrative summary of the following Vastu analysis in 280 to 320 words (target ~300 words).

Room Type: {analysis.room_type}
Direction: {analysis.direction}
Status: {analysis.status.value}
Score: {analysis.score}/100
Score Category (per provided ranges): {category}
Ideal Directions: {', '.join(analysis.ideal_directions) or 'N/A'}
Avoid Directions: {', '.join(analysis.avoid_directions) or 'N/A'}
Top Recommendations: {', '.join(analysis.recommendations[:5]) or 'N/A'}
Key Benefits: {', '.join(analysis.benefits[:5]) or 'N/A'}
Issues: {', '.join(analysis.issues[:4]) or 'N/A'}

Guidelines:
- Write exactly one cohesive paragraph around 300 words.
- Start with a concise verdict that references the score and the category (poor/moderate/better/good/excellent) using the provided ranges.
- Explain how the direction aligns or conflicts with typical Vastu guidance for the given room type.
- Weave in 2–4 of the most impactful recommendations as flowing prose (no lists), clarifying why they matter.
- Mention the most relevant benefits and potential issues, prioritizing energy flow, stability, health, and harmony.
- Avoid bullet points, headings, enumerations, or markdown.
- Do not include quotes or code blocks.
"""
        messages = [
            {"role": "system", "content": "You produce clear, helpful, neutral summaries."},
            {"role": "user", "content": prompt.strip()}
        ]
        resp = groq_client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=0.4,
            max_tokens=700
        )
        return (resp.choices[0].message.content or "").strip()

    def analyze_room_with_text(self, room_type: str, direction: str) -> Dict[str, Any]:
        analysis = self.analyze_room_with_groq(room_type, direction)
        text_summary = self.generate_text_summary(analysis)
        return {"analysis": analysis, "text_summary": text_summary}

    def _load_vastu_rules(self) -> str:
        """Load Vastu rules from the vastu.txt file"""
        try:
            with open('app/vastu/vastu.txt', 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            # Fallback rules if file not found
            return """
# VASTU COMPLIANCE STANDARD RULES

## Room-Direction Mapping Table

North-East (NE):
- Ideal: prayer_room, water_feature, entrance, meditation
- Avoid: toilet, kitchen, heavy_furniture
- Remedies: Place sea salt, use light colors, keep door closed or area open
- Weight: 20

East (E):
- Ideal: bathroom, study_room, entrance
- Avoid: toilet, heavy_storage
- Remedies: Use blue or green colors, adequate ventilation
- Weight: 15

South-East (SE):
- Ideal: kitchen, electrical_room
- Avoid: prayer_room, bedroom, water_tank
- Remedies: Add copper pyramids, use red/orange decor
- Weight: 15

South (S):
- Ideal: bedroom, heavy_storage, staircase
- Avoid: entrance, water_feature
- Remedies: Place earthen pots, avoid water tanks
- Weight: 10

South-West (SW):
- Ideal: master_bedroom, safe, heavy_furniture
- Avoid: kitchen, toilet, entrance
- Remedies: Place brown shades, keep cash safes closed, use crystals
- Weight: 20

West (W):
- Ideal: children_bedroom, study_room, dining
- Avoid: entrance, prayer_room
- Remedies: Use white/grey decor, display symbolic art
- Weight: 10

North-West (NW):
- Ideal: guest_room, garage, storage
- Avoid: master_bedroom, kitchen
- Remedies: Place wind chimes, use light silver/white colors
- Weight: 10

North (N):
- Ideal: living_room, treasury, cash_counter
- Avoid: toilet, kitchen, staircase
- Remedies: Place mirror decorations, water features
- Weight: 15

Center:
- Ideal: open_space, courtyard, living_room
- Avoid: toilet, kitchen, heavy_furniture, staircase
- Remedies: Use marble, ensure ample light, keep free from obstacles
- Weight: 15

## General Scoring Formula
Score = 100 - [Sum of penalties for each invalid placement based on weights] + [Bonus for ideal placements]
"""

    def analyze_room_with_groq(self, room_type: str, direction: str) -> RoomAnalysis:
        """Analyze room placement using Groq with Vastu rules"""
        prompt = f"""
You are a Vastu Shastra expert. Analyze the following room placement according to the Vastu rules provided.

VASTU RULES:
{self.vastu_rules}

ROOM ANALYSIS REQUEST:
- Room Type: {room_type}
- Direction: {direction}

Provide a comprehensive Vastu analysis in the following JSON format:
{{
  "room_type": "{room_type}",
  "direction": "{direction}",
  "status": "excellent|good|average|poor|critical",
  "score": 0-100,
  "ideal_directions": ["list", "of", "ideal", "directions"],
  "avoid_directions": ["list", "of", "directions", "to", "avoid"],
  "recommendations": ["specific", "actionable", "recommendations"],
  "benefits": ["benefits", "of", "this", "placement"],
  "issues": ["any", "issues", "or", "concerns"],
  "remedies": ["specific", "remedies", "if", "needed"]
}}

Guidelines:
1. Score should be based on the Vastu compliance rules provided
2. Status should reflect the overall compliance level
3. Provide specific, actionable recommendations
4. Include remedies only if the placement is not ideal
5. Be specific about Vastu principles and their benefits
6. Consider the room type and direction combination carefully

IMPORTANT: Respond ONLY with valid JSON. No extra text.
"""
        messages = [
            {"role": "system", "content": "You are a precise Vastu Shastra expert. Output strictly valid JSON only."},
            {"role": "user", "content": prompt.strip()}
        ]
        resp = groq_client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=0.2,
            max_tokens=800
        )
        content = resp.choices[0].message.content
        if not content or not content.strip():
            raise ValueError("Empty response from Groq")
        try:
            result = json.loads(content.strip())
        except json.JSONDecodeError:
            import re
            m = re.search(r'\{.*\}', content, re.DOTALL)
            if not m:
                raise ValueError(f"No JSON found in Groq response: {content[:200]}")
            result = json.loads(m.group())
        return RoomAnalysis(
            room_type=result.get('room_type', room_type),
            direction=result.get('direction', direction),
            status=VastuStatus(result.get('status', 'average')),
            score=max(0, min(100, result.get('score', 50))),
            ideal_directions=result.get('ideal_directions', []),
            avoid_directions=result.get('avoid_directions', []),
            recommendations=result.get('recommendations', []),
            benefits=result.get('benefits', []),
            issues=result.get('issues', []),
            remedies=result.get('remedies', [])
        )

    # No fallback: errors propagate

    def get_room_types(self) -> List[Dict[str, str]]:
        """Get available room types"""
        return [
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

    def get_directions(self) -> List[Dict[str, str]]:
        """Get available directions"""
        return [
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

    def get_vastu_elements(self) -> List[Dict[str, Any]]:
        """Get Vastu elements information"""
        return [
            {
                "name": "Earth (Prithvi)",
                "direction": "South-West",
                "properties": "Stability, strength, support",
                "color": "text-yellow-600",
                "tips": "Place heavy furniture and storage in SW direction"
            },
            {
                "name": "Water (Jal)",
                "direction": "North-East",
                "properties": "Flow, purification, life",
                "color": "text-blue-600",
                "tips": "Water features, bathrooms in NE bring prosperity"
            },
            {
                "name": "Fire (Agni)",
                "direction": "South-East",
                "properties": "Energy, transformation, power",
                "color": "text-red-600",
                "tips": "Kitchen, electrical appliances in SE direction"
            },
            {
                "name": "Air (Vayu)",
                "direction": "North-West",
                "properties": "Movement, circulation, freshness",
                "color": "text-green-600",
                "tips": "Windows, ventilation in NW for good airflow"
            },
            {
                "name": "Space (Akash)",
                "direction": "Center",
                "properties": "Openness, freedom, expansion",
                "color": "text-purple-600",
                "tips": "Keep center area open and clutter-free"
            }
        ]

    def get_room_guidelines(self) -> List[Dict[str, Any]]:
        """Get room placement guidelines"""
        return [
            {
                "room": "Main Entrance",
                "bestDirection": "North, East, North-East",
                "avoid": "South-West corner",
                "tips": "Well-lit, obstacle-free, beautiful door",
                "status": "excellent"
            },
            {
                "room": "Living Room",
                "bestDirection": "North, East, North-East",
                "avoid": "South-West for seating",
                "tips": "Light colors, good ventilation, east-facing seating",
                "status": "good"
            },
            {
                "room": "Master Bedroom",
                "bestDirection": "South-West",
                "avoid": "North-East corner",
                "tips": "Bed in SW corner, head towards south/east",
                "status": "excellent"
            },
            {
                "room": "Kitchen",
                "bestDirection": "South-East",
                "avoid": "North-East, North-West",
                "tips": "Cook facing east, sink in NE corner",
                "status": "good"
            },
            {
                "room": "Bathroom",
                "bestDirection": "North-West, South-East",
                "avoid": "North-East, South-West",
                "tips": "Exhaust fan in east/north wall",
                "status": "warning"
            },
            {
                "room": "Study Room",
                "bestDirection": "North-East, West",
                "avoid": "Under staircase",
                "tips": "Face east/north while studying",
                "status": "excellent"
            }
        ]

    def get_vastu_tips(self, category: str = "all") -> List[Dict[str, Any]]:
        """Get Vastu tips by category"""
        tips = [
            {
                "category": "Colors",
                "tips": [
                    "Use light colors in north and east walls",
                    "Avoid dark colors in north-east",
                    "Yellow and orange in south-west bring stability",
                    "Blue and green in north enhance prosperity"
                ]
            },
            {
                "category": "Lighting",
                "tips": [
                    "Maximum natural light from north and east",
                    "Avoid heavy curtains on north/east windows",
                    "Use bright lights in dark corners",
                    "Place lamps in south-east corner"
                ]
            },
            {
                "category": "Furniture Placement",
                "tips": [
                    "Heavy furniture in south and west",
                    "Keep north-east corner light and airy",
                    "Avoid furniture in center of room",
                    "Bed should not face north direction"
                ]
            }
        ]
        
        if category == "all":
            return tips
        else:
            return [tip for tip in tips if tip["category"].lower() == category.lower()]

    def analyze_room(self, room_type: str, direction: str) -> RoomAnalysis:
        """Analyze room using Groq provider"""
        return self.analyze_room_with_groq(room_type, direction)

    def analyze_house(self, vastu_request: VastuRequest) -> Dict[str, Any]:
        """Analyze complete house Vastu compliance"""
        room_analyses = []
        total_score = 0
        
        for room_data in vastu_request.rooms:
            try:
                analysis = self.analyze_room_with_groq(room_data["type"], room_data["direction"])
                room_analyses.append(analysis)
                total_score += analysis.score
            except Exception as e:
                print(f"Error analyzing room {room_data}: {e}")
                continue
        
        # Calculate overall score
        overall_score = total_score // len(room_analyses) if room_analyses else 0
        
        # Determine overall status
        if overall_score >= 80:
            overall_status = VastuStatus.EXCELLENT
        elif overall_score >= 60:
            overall_status = VastuStatus.GOOD
        elif overall_score >= 40:
            overall_status = VastuStatus.AVERAGE
        else:
            overall_status = VastuStatus.POOR
        
        return {
            "overall_score": overall_score,
            "overall_status": overall_status,
            "room_analyses": room_analyses,
            "general_recommendations": [
                "Keep the center of the house open and clutter-free",
                "Ensure proper lighting in all areas",
                "Use appropriate colors for each direction",
                "Maintain cleanliness throughout the house"
            ],
            "critical_issues": [],
            "positive_aspects": []
        }

    def get_directional_guide(self) -> Dict[str, Any]:
        """Get comprehensive directional guide"""
        return {
            "directions": {
                "north": {
                    "deity": "Kubera (God of Wealth)",
                    "element": "Water",
                    "significance": "Wealth, prosperity, opportunities",
                    "color": "Blue, Green",
                    "benefits": ["Financial growth", "Career advancement", "Business success"]
                },
                "north-east": {
                    "deity": "Ishaan (Lord Shiva)",
                    "element": "Water + Air",
                    "significance": "Spirituality, knowledge, purity",
                    "color": "White, Light Blue",
                    "benefits": ["Spiritual growth", "Mental clarity", "Divine blessings"]
                },
                "east": {
                    "deity": "Indra (King of Gods)",
                    "element": "Air",
                    "significance": "Health, prosperity, new beginnings",
                    "color": "White, Light colors",
                    "benefits": ["Good health", "Fresh start", "Positive energy"]
                },
                "south-east": {
                    "deity": "Agni (Fire God)",
                    "element": "Fire",
                    "significance": "Energy, power, digestion",
                    "color": "Red, Orange",
                    "benefits": ["High energy", "Good digestion", "Fame"]
                },
                "south": {
                    "deity": "Yama (God of Death)",
                    "element": "Earth",
                    "significance": "Stability, discipline, longevity",
                    "color": "Red, Brown",
                    "benefits": ["Stability", "Discipline", "Long life"]
                },
                "south-west": {
                    "deity": "Nairrutya (Demon)",
                    "element": "Earth",
                    "significance": "Strength, stability, relationships",
                    "color": "Yellow, Brown",
                    "benefits": ["Marital harmony", "Stability", "Strength"]
                },
                "west": {
                    "deity": "Varuna (Water God)",
                    "element": "Water",
                    "significance": "Gains, profits, relationships",
                    "color": "Blue, White",
                    "benefits": ["Financial gains", "Good relationships", "Profits"]
                },
                "north-west": {
                    "deity": "Vayu (Wind God)",
                    "element": "Air",
                    "significance": "Movement, change, support",
                    "color": "White, Silver",
                    "benefits": ["Support from others", "Movement", "Change"]
                }
            },
            "elements": self.get_vastu_elements(),
            "compass_guide": {
                "center": "Keep open and clutter-free (Brahmasthan)",
                "importance": "Each direction has specific significance and ruling deity",
                "usage": "Use this guide to place rooms and objects correctly"
            }
        }

    def get_detailed_room_analysis(self, room_type: str, direction: str) -> Dict[str, Any]:
        """Get detailed Vastu analysis with remedies and impacts"""
        basic_analysis = self.analyze_room_with_groq(room_type, direction)
        
        return {
            "basic_analysis": basic_analysis,
            "remedies": {
                "crystals": ["Clear quartz crystal", "Amethyst for protection", "Rose quartz for harmony"],
                "plants": ["Money plant in north", "Tulsi in north-east", "Bamboo in east"],
                "colors": ["Use light colors", "Apply Vastu-compliant colors"],
                "mirrors": ["Place mirrors on north or east walls", "Avoid mirrors facing bed"],
                "symbols": ["Swastik symbol", "Om symbol", "Ganesha idol"],
                "general_tips": ["Keep area clean", "Ensure proper lighting", "Use pleasant fragrances"]
            } if basic_analysis.status in [VastuStatus.POOR, VastuStatus.AVERAGE] else None,
            "energy_flow_score": basic_analysis.score,
            "prosperity_impact": "Positive - Supports financial growth" if basic_analysis.status in [VastuStatus.EXCELLENT, VastuStatus.GOOD] else "Neutral - No significant impact",
            "health_impact": "Excellent - Promotes well-being" if basic_analysis.status in [VastuStatus.EXCELLENT, VastuStatus.GOOD] else "Moderate - Minor considerations",
            "relationship_impact": "Harmonious - Strengthens relationships" if basic_analysis.status in [VastuStatus.EXCELLENT, VastuStatus.GOOD] else "Neutral - No major impact",
            "detailed_recommendations": [
                {
                    "category": "Immediate Action",
                    "action": "Declutter and clean the space",
                    "benefit": "Removes stagnant energy",
                    "difficulty": "Easy"
                },
                {
                    "category": "Lighting",
                    "action": "Increase natural and artificial lighting",
                    "benefit": "Enhances positive energy",
                    "difficulty": "Easy"
                }
            ]
        }

    def get_vastu_score_interpretation(self, score: int) -> Dict[str, Any]:
        """Get detailed interpretation of Vastu score using user-defined ranges"""
        if score >= 90:
            level = "Excellent"
            description = "Exceptional Vastu compliance with highly supportive energy flow; maintain and fine-tune."
            color = "green"
        elif score >= 80:
            level = "Good"
            description = "Strong compliance overall; a few targeted adjustments can optimize results further."
            color = "lightgreen"
        elif score >= 70:
            level = "Better"
            description = "Above-average alignment; implement recommended tweaks to move into the good range."
            color = "yellow"
        elif score >= 40:
            level = "Moderate"
            description = "Mixed alignment; prioritize corrective steps to improve energy balance and function."
            color = "orange"
        else:
            level = "Poor"
            description = "Low compliance; significant corrective measures are advised to improve energy flow."
            color = "red"
        
        return {
            "score": score,
            "level": level,
            "description": description,
            "color": color,
            "next_steps": [
                "Implement recommended remedies",
                "Focus on critical areas first",
                "Consider color corrections",
                "Improve lighting and ventilation"
            ]
        }

# Initialize the service
vastu_service = VastuService()