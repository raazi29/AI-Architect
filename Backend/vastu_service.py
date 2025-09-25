"""
Vastu Shastra Service - Comprehensive Vastu analysis and recommendations
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from enum import Enum
import json
import math

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

class VastuElement(BaseModel):
    name: str
    direction: Direction
    properties: str
    color: str
    benefits: List[str]
    tips: List[str]

class RoomAnalysis(BaseModel):
    room_type: RoomType
    direction: Direction
    status: VastuStatus
    score: int  # 0-100
    ideal_directions: List[Direction]
    avoid_directions: List[Direction]
    recommendations: List[str]
    benefits: List[str]
    issues: List[str]
    element: Optional[VastuElement] = None

class HouseAnalysis(BaseModel):
    overall_score: int
    overall_status: VastuStatus
    room_analyses: List[RoomAnalysis]
    general_recommendations: List[str]
    critical_issues: List[str]
    positive_aspects: List[str]

class VastuRequest(BaseModel):
    rooms: List[Dict[str, str]]  # [{"type": "living_room", "direction": "north"}]
    house_facing: Optional[Direction] = None
    plot_shape: Optional[str] = "rectangular"

class VastuService:
    def __init__(self):
        self.elements = self._initialize_elements()
        self.room_guidelines = self._initialize_room_guidelines()
        self.directional_significance = self._initialize_directional_significance()
        
    def _initialize_elements(self) -> Dict[str, VastuElement]:
        """Initialize the five elements (Panchabhutas) of Vastu"""
        return {
            "earth": VastuElement(
                name="Earth (Prithvi)",
                direction=Direction.SOUTH_WEST,
                properties="Stability, strength, support, grounding",
                color="yellow",
                benefits=[
                    "Provides stability and security",
                    "Enhances material prosperity",
                    "Strengthens family bonds",
                    "Improves physical health"
                ],
                tips=[
                    "Place heavy furniture in SW direction",
                    "Use earth tones and yellow colors",
                    "Keep this area clutter-free",
                    "Ideal for master bedroom"
                ]
            ),
            "water": VastuElement(
                name="Water (Jal)",
                direction=Direction.NORTH_EAST,
                properties="Flow, purification, life force, prosperity",
                color="blue",
                benefits=[
                    "Brings wealth and prosperity",
                    "Enhances mental clarity",
                    "Promotes spiritual growth",
                    "Improves health and vitality"
                ],
                tips=[
                    "Place water features in NE",
                    "Keep this area clean and bright",
                    "Use blue and white colors",
                    "Ideal for entrance and prayer room"
                ]
            ),
            "fire": VastuElement(
                name="Fire (Agni)",
                direction=Direction.SOUTH_EAST,
                properties="Energy, transformation, power, digestion",
                color="red",
                benefits=[
                    "Boosts energy and vitality",
                    "Improves digestion and health",
                    "Enhances leadership qualities",
                    "Brings fame and recognition"
                ],
                tips=[
                    "Place kitchen in SE direction",
                    "Use red and orange colors",
                    "Keep electrical appliances here",
                    "Ensure proper ventilation"
                ]
            ),
            "air": VastuElement(
                name="Air (Vayu)",
                direction=Direction.NORTH_WEST,
                properties="Movement, circulation, freshness, communication",
                color="green",
                benefits=[
                    "Improves communication",
                    "Enhances social relationships",
                    "Brings fresh opportunities",
                    "Promotes mental agility"
                ],
                tips=[
                    "Ensure good ventilation in NW",
                    "Use green and white colors",
                    "Keep windows and openings here",
                    "Ideal for guest rooms"
                ]
            ),
            "space": VastuElement(
                name="Space (Akash)",
                direction=Direction.CENTER,
                properties="Openness, freedom, expansion, consciousness",
                color="purple",
                benefits=[
                    "Enhances spiritual awareness",
                    "Promotes mental peace",
                    "Brings clarity of thought",
                    "Supports overall well-being"
                ],
                tips=[
                    "Keep center area open and clean",
                    "Avoid heavy furniture in center",
                    "Use light colors",
                    "Maintain good lighting"
                ]
            )
        }
    
    def _initialize_room_guidelines(self) -> Dict[RoomType, Dict]:
        """Initialize room placement guidelines"""
        return {
            RoomType.MAIN_ENTRANCE: {
                "ideal_directions": [Direction.NORTH, Direction.EAST, Direction.NORTH_EAST],
                "avoid_directions": [Direction.SOUTH_WEST, Direction.SOUTH],
                "benefits": [
                    "Attracts positive energy",
                    "Brings prosperity and opportunities",
                    "Enhances family reputation",
                    "Promotes good health"
                ],
                "tips": [
                    "Keep entrance well-lit and clean",
                    "Use bright colors",
                    "Place auspicious symbols",
                    "Ensure easy access"
                ]
            },
            RoomType.LIVING_ROOM: {
                "ideal_directions": [Direction.NORTH, Direction.EAST, Direction.NORTH_EAST],
                "avoid_directions": [Direction.SOUTH_WEST],
                "benefits": [
                    "Promotes family harmony",
                    "Enhances social relationships",
                    "Brings positive energy",
                    "Improves communication"
                ],
                "tips": [
                    "Face east or north while sitting",
                    "Use light and bright colors",
                    "Keep the area spacious",
                    "Place plants in NE corner"
                ]
            },
            RoomType.MASTER_BEDROOM: {
                "ideal_directions": [Direction.SOUTH_WEST, Direction.SOUTH, Direction.WEST],
                "avoid_directions": [Direction.NORTH_EAST, Direction.NORTH],
                "benefits": [
                    "Provides stability and security",
                    "Enhances marital harmony",
                    "Improves sleep quality",
                    "Brings material prosperity"
                ],
                "tips": [
                    "Place bed in SW corner",
                    "Head should face south or east",
                    "Use warm colors",
                    "Avoid mirrors facing bed"
                ]
            },
            RoomType.KITCHEN: {
                "ideal_directions": [Direction.SOUTH_EAST, Direction.EAST],
                "avoid_directions": [Direction.NORTH_EAST, Direction.NORTH_WEST, Direction.SOUTH_WEST],
                "benefits": [
                    "Improves health and digestion",
                    "Brings prosperity",
                    "Enhances family well-being",
                    "Promotes good appetite"
                ],
                "tips": [
                    "Cook facing east",
                    "Place sink in NE corner of kitchen",
                    "Use red and orange colors",
                    "Keep gas stove in SE"
                ]
            },
            RoomType.BATHROOM: {
                "ideal_directions": [Direction.NORTH_WEST, Direction.SOUTH_EAST, Direction.WEST],
                "avoid_directions": [Direction.NORTH_EAST, Direction.SOUTH_WEST, Direction.CENTER],
                "benefits": [
                    "Maintains hygiene and cleanliness",
                    "Prevents negative energy accumulation",
                    "Supports good health",
                    "Ensures proper waste disposal"
                ],
                "tips": [
                    "Keep bathroom door closed",
                    "Ensure proper ventilation",
                    "Use light colors",
                    "Place exhaust fan in east or north"
                ]
            },
            RoomType.STUDY_ROOM: {
                "ideal_directions": [Direction.NORTH_EAST, Direction.NORTH, Direction.EAST],
                "avoid_directions": [Direction.SOUTH_WEST, Direction.SOUTH],
                "benefits": [
                    "Enhances concentration and focus",
                    "Improves academic performance",
                    "Boosts creativity and intelligence",
                    "Brings success in studies"
                ],
                "tips": [
                    "Face east or north while studying",
                    "Use bright lighting",
                    "Keep books in SW corner",
                    "Place study table away from bed"
                ]
            },
            RoomType.POOJA_ROOM: {
                "ideal_directions": [Direction.NORTH_EAST, Direction.NORTH, Direction.EAST],
                "avoid_directions": [Direction.SOUTH, Direction.SOUTH_WEST, Direction.SOUTH_EAST],
                "benefits": [
                    "Enhances spiritual growth",
                    "Brings peace and tranquility",
                    "Attracts divine blessings",
                    "Purifies the environment"
                ],
                "tips": [
                    "Face east or north during prayers",
                    "Use white and light colors",
                    "Keep the area clean and sacred",
                    "Place idols facing west"
                ]
            }
        }
    
    def _initialize_directional_significance(self) -> Dict[Direction, Dict]:
        """Initialize directional significance and ruling deities"""
        return {
            Direction.NORTH: {
                "deity": "Kubera (God of Wealth)",
                "element": "Water",
                "significance": "Wealth, prosperity, opportunities",
                "color": "Blue, Green",
                "benefits": ["Financial growth", "Career advancement", "Business success"]
            },
            Direction.NORTH_EAST: {
                "deity": "Ishaan (Lord Shiva)",
                "element": "Water + Air",
                "significance": "Spirituality, knowledge, purity",
                "color": "White, Light Blue",
                "benefits": ["Spiritual growth", "Mental clarity", "Divine blessings"]
            },
            Direction.EAST: {
                "deity": "Indra (King of Gods)",
                "element": "Air",
                "significance": "Health, prosperity, new beginnings",
                "color": "White, Light colors",
                "benefits": ["Good health", "Fresh start", "Positive energy"]
            },
            Direction.SOUTH_EAST: {
                "deity": "Agni (Fire God)",
                "element": "Fire",
                "significance": "Energy, power, digestion",
                "color": "Red, Orange",
                "benefits": ["High energy", "Good digestion", "Fame"]
            },
            Direction.SOUTH: {
                "deity": "Yama (God of Death)",
                "element": "Earth",
                "significance": "Stability, discipline, longevity",
                "color": "Red, Brown",
                "benefits": ["Stability", "Discipline", "Long life"]
            },
            Direction.SOUTH_WEST: {
                "deity": "Nairrutya (Demon)",
                "element": "Earth",
                "significance": "Strength, stability, relationships",
                "color": "Yellow, Brown",
                "benefits": ["Marital harmony", "Stability", "Strength"]
            },
            Direction.WEST: {
                "deity": "Varuna (Water God)",
                "element": "Water",
                "significance": "Gains, profits, relationships",
                "color": "Blue, White",
                "benefits": ["Financial gains", "Good relationships", "Profits"]
            },
            Direction.NORTH_WEST: {
                "deity": "Vayu (Wind God)",
                "element": "Air",
                "significance": "Movement, change, support",
                "color": "White, Silver",
                "benefits": ["Support from others", "Movement", "Change"]
            }
        }
    
    def analyze_room(self, room_type: str, direction: str) -> RoomAnalysis:
        """Analyze a single room's Vastu compliance"""
        try:
            room_enum = RoomType(room_type.lower())
            direction_enum = Direction(direction.lower().replace(" ", "-"))
        except ValueError as e:
            raise ValueError(f"Invalid room type or direction: {e}")
        
        guidelines = self.room_guidelines.get(room_enum, {})
        ideal_directions = guidelines.get("ideal_directions", [])
        avoid_directions = guidelines.get("avoid_directions", [])
        
        # Calculate status and score
        if direction_enum in ideal_directions:
            status = VastuStatus.EXCELLENT
            score = 90 + (len(ideal_directions) - ideal_directions.index(direction_enum)) * 2
        elif direction_enum in avoid_directions:
            status = VastuStatus.POOR
            score = 20 - avoid_directions.index(direction_enum) * 5
        else:
            status = VastuStatus.AVERAGE
            score = 60
        
        # Get associated element
        element = None
        for elem_key, elem_data in self.elements.items():
            if elem_data.direction == direction_enum:
                element = elem_data
                break
        
        # Generate recommendations
        recommendations = guidelines.get("tips", [])
        if status == VastuStatus.POOR:
            recommendations.extend([
                f"Consider relocating {room_type} to {', '.join([d.value for d in ideal_directions])}",
                "Use Vastu remedies like mirrors, crystals, or plants",
                "Consult a Vastu expert for specific solutions"
            ])
        
        return RoomAnalysis(
            room_type=room_enum,
            direction=direction_enum,
            status=status,
            score=max(0, min(100, score)),
            ideal_directions=ideal_directions,
            avoid_directions=avoid_directions,
            recommendations=recommendations,
            benefits=guidelines.get("benefits", []),
            issues=[] if status != VastuStatus.POOR else [f"{room_type} in {direction} may cause negative effects"],
            element=element
        )
    
    def analyze_house(self, vastu_request: VastuRequest) -> HouseAnalysis:
        """Analyze complete house Vastu compliance"""
        room_analyses = []
        total_score = 0
        critical_issues = []
        positive_aspects = []
        
        for room_data in vastu_request.rooms:
            try:
                analysis = self.analyze_room(room_data["type"], room_data["direction"])
                room_analyses.append(analysis)
                total_score += analysis.score
                
                if analysis.status == VastuStatus.POOR:
                    critical_issues.extend(analysis.issues)
                elif analysis.status == VastuStatus.EXCELLENT:
                    positive_aspects.extend([f"{analysis.room_type.value} placement is excellent"])
                    
            except ValueError as e:
                continue  # Skip invalid rooms
        
        # Calculate overall score and status
        if room_analyses:
            overall_score = total_score // len(room_analyses)
        else:
            overall_score = 0
            
        if overall_score >= 80:
            overall_status = VastuStatus.EXCELLENT
        elif overall_score >= 60:
            overall_status = VastuStatus.GOOD
        elif overall_score >= 40:
            overall_status = VastuStatus.AVERAGE
        else:
            overall_status = VastuStatus.POOR
        
        # Generate general recommendations
        general_recommendations = [
            "Keep the center of the house open and clutter-free",
            "Ensure proper lighting in all areas",
            "Use appropriate colors for each direction",
            "Maintain cleanliness throughout the house",
            "Place plants in the northeast corner"
        ]
        
        return HouseAnalysis(
            overall_score=overall_score,
            overall_status=overall_status,
            room_analyses=room_analyses,
            general_recommendations=general_recommendations,
            critical_issues=critical_issues,
            positive_aspects=positive_aspects
        )
    
    def get_vastu_tips(self, category: str = "all") -> Dict[str, List[str]]:
        """Get Vastu tips by category"""
        tips = {
            "colors": [
                "Use light colors in north and east walls",
                "Avoid dark colors in north-east direction",
                "Yellow and orange in south-west bring stability",
                "Blue and green in north enhance prosperity",
                "White color promotes peace and purity",
                "Red color in south-east boosts energy"
            ],
            "lighting": [
                "Maximize natural light from north and east",
                "Avoid heavy curtains on north/east windows",
                "Use bright lights in dark corners",
                "Place lamps in south-east corner",
                "Keep entrance well-lit",
                "Use warm lighting in bedrooms"
            ],
            "furniture": [
                "Place heavy furniture in south and west",
                "Keep north-east corner light and airy",
                "Avoid furniture in center of room",
                "Bed should not face north direction",
                "Study table should face east or north",
                "Dining table in west or south-west"
            ],
            "plants": [
                "Place money plant in north direction",
                "Tulsi plant in north-east brings positivity",
                "Avoid thorny plants inside house",
                "Bamboo plant in east for growth",
                "Aloe vera in north for health",
                "Rose plant in south-west for love"
            ],
            "water": [
                "Water features in north-east direction",
                "Avoid water in south-west corner",
                "Keep water storage in north or north-east",
                "Swimming pool in north or north-east",
                "Fountain in north-east for prosperity",
                "Avoid water leakage anywhere"
            ]
        }
        
        if category == "all":
            return tips
        else:
            return {category: tips.get(category, [])}
    
    def get_directional_guide(self) -> Dict[str, Any]:
        """Get comprehensive directional guide"""
        return {
            "directions": self.directional_significance,
            "elements": {key: {
                "name": elem.name,
                "direction": elem.direction.value,
                "properties": elem.properties,
                "color": elem.color,
                "benefits": elem.benefits,
                "tips": elem.tips
            } for key, elem in self.elements.items()},
            "compass_guide": {
                "center": "Keep open and clutter-free (Brahmasthan)",
                "importance": "Each direction has specific significance and ruling deity",
                "usage": "Use this guide to place rooms and objects correctly"
            }
        }

# Initialize the service
vastu_service = VastuService()
