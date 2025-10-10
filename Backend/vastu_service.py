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

class VastuRemedies(BaseModel):
    """Vastu remedies for non-compliant placements"""
    crystals: List[str]
    plants: List[str]
    colors: List[str]
    mirrors: List[str]
    symbols: List[str]
    general_tips: List[str]

class DetailedRoomAnalysis(BaseModel):
    """Extended room analysis with remedies and detailed recommendations"""
    basic_analysis: RoomAnalysis
    remedies: Optional[VastuRemedies] = None
    energy_flow_score: int  # 0-100
    prosperity_impact: str
    health_impact: str
    relationship_impact: str
    detailed_recommendations: List[Dict[str, str]]

class VastuService:
    def __init__(self):
        self.elements = self._initialize_elements()
        self.room_guidelines = self._initialize_room_guidelines()
        self.directional_significance = self._initialize_directional_significance()
        self.remedies_database = self._initialize_remedies_database()
        
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
    
    def _initialize_remedies_database(self) -> Dict[str, VastuRemedies]:
        """Initialize Vastu remedies for different situations"""
        return {
            "poor_placement": VastuRemedies(
                crystals=[
                    "Place clear quartz crystal in the affected area to neutralize negative energy",
                    "Use amethyst for spiritual protection and peace",
                    "Rose quartz for harmony in relationships",
                    "Citrine for prosperity and abundance"
                ],
                plants=[
                    "Money plant (Pothos) in north direction for wealth",
                    "Bamboo plant in east for growth and prosperity",
                    "Tulsi (Holy Basil) in north-east for positive energy",
                    "Peace lily for air purification and harmony",
                    "Snake plant for protection and good luck"
                ],
                colors=[
                    "Use light colors to brighten dark corners",
                    "Apply Vastu-compliant colors for each direction",
                    "Avoid black and dark colors in north-east",
                    "Use warm colors in south-west for stability"
                ],
                mirrors=[
                    "Place mirrors on north or east walls to enhance positive energy",
                    "Avoid mirrors facing bed or main entrance",
                    "Use mirrors to reflect natural light into dark areas",
                    "Ensure mirrors are clean and unbroken"
                ],
                symbols=[
                    "Place Swastik symbol at entrance for prosperity",
                    "Om symbol in prayer room for spiritual energy",
                    "Ganesha idol near entrance to remove obstacles",
                    "Pyramid yantra for energy correction"
                ],
                general_tips=[
                    "Keep the area clean and clutter-free",
                    "Ensure proper lighting and ventilation",
                    "Use pleasant fragrances like incense or essential oils",
                    "Play soft instrumental music to enhance positive vibrations",
                    "Regularly clean windows and allow natural light"
                ]
            ),
            "entrance_issues": VastuRemedies(
                crystals=["Clear quartz cluster near entrance", "Black tourmaline for protection"],
                plants=["Tulsi plant near entrance", "Money plant on either side"],
                colors=["Bright welcoming colors", "Avoid dark colors at entrance"],
                mirrors=["Mirror on side wall to expand space", "Never directly facing entrance"],
                symbols=["Swastik or Om at entrance", "Ganesha idol for blessings"],
                general_tips=[
                    "Keep entrance well-lit at all times",
                    "Remove any obstacles or clutter",
                    "Use a beautiful nameplate",
                    "Place a doormat with auspicious symbols"
                ]
            ),
            "bedroom_issues": VastuRemedies(
                crystals=["Rose quartz for love and harmony", "Amethyst for peaceful sleep"],
                plants=["Avoid thorny plants", "Small peace lily for air quality"],
                colors=["Soft, warm colors for walls", "Avoid red in bedroom"],
                mirrors=["No mirrors facing bed", "Cover mirrors at night if present"],
                symbols=["Pair of birds or swans for relationship harmony"],
                general_tips=[
                    "Bed should have solid headboard",
                    "Avoid electronic devices near bed",
                    "Use soft, warm lighting",
                    "Keep bedroom door closed at night"
                ]
            ),
            "kitchen_issues": VastuRemedies(
                crystals=["Citrine for abundance", "Clear quartz for energy"],
                plants=["Herbs like basil, mint in kitchen window"],
                colors=["Red, orange, or yellow for fire element", "Avoid blue and black"],
                mirrors=["Mirror behind stove to double prosperity"],
                symbols=["Annapurna image for food abundance"],
                general_tips=[
                    "Keep kitchen clean and organized",
                    "Ensure proper ventilation",
                    "Store food items properly",
                    "Face east while cooking"
                ]
            )
        }
    
    def get_detailed_room_analysis(self, room_type: str, direction: str) -> DetailedRoomAnalysis:
        """Get detailed Vastu analysis with remedies and impacts"""
        # Get basic analysis
        basic_analysis = self.analyze_room(room_type, direction)
        
        # Determine remedies based on status
        remedies = None
        if basic_analysis.status in [VastuStatus.POOR, VastuStatus.AVERAGE]:
            # Get appropriate remedies
            if room_type == "main_entrance":
                remedies = self.remedies_database.get("entrance_issues")
            elif "bedroom" in room_type:
                remedies = self.remedies_database.get("bedroom_issues")
            elif room_type == "kitchen":
                remedies = self.remedies_database.get("kitchen_issues")
            else:
                remedies = self.remedies_database.get("poor_placement")
        
        # Calculate energy flow score
        energy_flow_score = basic_analysis.score
        
        # Determine impacts based on room type and direction
        prosperity_impact = self._calculate_prosperity_impact(room_type, direction, basic_analysis.status)
        health_impact = self._calculate_health_impact(room_type, direction, basic_analysis.status)
        relationship_impact = self._calculate_relationship_impact(room_type, direction, basic_analysis.status)
        
        # Generate detailed recommendations
        detailed_recommendations = self._generate_detailed_recommendations(room_type, direction, basic_analysis.status)
        
        return DetailedRoomAnalysis(
            basic_analysis=basic_analysis,
            remedies=remedies,
            energy_flow_score=energy_flow_score,
            prosperity_impact=prosperity_impact,
            health_impact=health_impact,
            relationship_impact=relationship_impact,
            detailed_recommendations=detailed_recommendations
        )
    
    def _calculate_prosperity_impact(self, room_type: str, direction: str, status: VastuStatus) -> str:
        """Calculate impact on prosperity"""
        if status == VastuStatus.EXCELLENT:
            return "Highly positive - Attracts wealth and abundance"
        elif status == VastuStatus.GOOD:
            return "Positive - Supports financial growth"
        elif status == VastuStatus.AVERAGE:
            return "Neutral - No significant impact on prosperity"
        else:
            return "Negative - May create financial obstacles"
    
    def _calculate_health_impact(self, room_type: str, direction: str, status: VastuStatus) -> str:
        """Calculate impact on health"""
        if status == VastuStatus.EXCELLENT:
            return "Excellent - Promotes physical and mental well-being"
        elif status == VastuStatus.GOOD:
            return "Good - Supports overall health"
        elif status == VastuStatus.AVERAGE:
            return "Moderate - Minor health considerations"
        else:
            return "Concerning - May affect health negatively"
    
    def _calculate_relationship_impact(self, room_type: str, direction: str, status: VastuStatus) -> str:
        """Calculate impact on relationships"""
        if status == VastuStatus.EXCELLENT:
            return "Harmonious - Strengthens family bonds and relationships"
        elif status == VastuStatus.GOOD:
            return "Positive - Supports healthy relationships"
        elif status == VastuStatus.AVERAGE:
            return "Neutral - No major impact on relationships"
        else:
            return "Challenging - May cause relationship stress"
    
    def _generate_detailed_recommendations(self, room_type: str, direction: str, status: VastuStatus) -> List[Dict[str, str]]:
        """Generate detailed, actionable recommendations"""
        recommendations = []
        
        if status in [VastuStatus.POOR, VastuStatus.AVERAGE]:
            recommendations.extend([
                {
                    "category": "Immediate Action",
                    "action": "Declutter and clean the space thoroughly",
                    "benefit": "Removes stagnant energy and improves flow",
                    "difficulty": "Easy"
                },
                {
                    "category": "Lighting",
                    "action": "Increase natural and artificial lighting",
                    "benefit": "Enhances positive energy and reduces negativity",
                    "difficulty": "Easy"
                },
                {
                    "category": "Color Correction",
                    "action": "Apply Vastu-compliant colors for this direction",
                    "benefit": "Aligns space with elemental energies",
                    "difficulty": "Medium"
                },
                {
                    "category": "Energy Enhancement",
                    "action": "Place appropriate crystals and plants",
                    "benefit": "Neutralizes negative energy and attracts positivity",
                    "difficulty": "Easy"
                }
            ])
        
        if status == VastuStatus.POOR:
            recommendations.extend([
                {
                    "category": "Professional Consultation",
                    "action": "Consult a certified Vastu expert",
                    "benefit": "Get personalized remedies for your specific situation",
                    "difficulty": "Easy"
                },
                {
                    "category": "Major Correction",
                    "action": "Consider relocating the room if structurally possible",
                    "benefit": "Achieves optimal Vastu compliance",
                    "difficulty": "Hard"
                }
            ])
        
        return recommendations

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
    
    def get_vastu_score_interpretation(self, score: int) -> Dict[str, Any]:
        """Get detailed interpretation of Vastu score"""
        if score >= 90:
            level = "Excellent"
            description = "Your space has exceptional Vastu compliance. The energy flow is optimal."
            color = "green"
        elif score >= 75:
            level = "Very Good"
            description = "Your space has strong Vastu compliance with minor areas for improvement."
            color = "lightgreen"
        elif score >= 60:
            level = "Good"
            description = "Your space has decent Vastu compliance. Some improvements recommended."
            color = "yellow"
        elif score >= 40:
            level = "Fair"
            description = "Your space needs attention. Several Vastu corrections recommended."
            color = "orange"
        else:
            level = "Poor"
            description = "Your space requires significant Vastu corrections for better energy flow."
            color = "red"
        
        return {
            "score": score,
            "level": level,
            "description": description,
            "color": color,
            "next_steps": self._get_next_steps_for_score(score)
        }
    
    def _get_next_steps_for_score(self, score: int) -> List[str]:
        """Get actionable next steps based on score"""
        if score >= 75:
            return [
                "Maintain current Vastu compliance",
                "Focus on minor optimizations",
                "Regular cleaning and decluttering"
            ]
        elif score >= 50:
            return [
                "Implement recommended remedies",
                "Focus on critical areas first",
                "Consider color corrections",
                "Improve lighting and ventilation"
            ]
        else:
            return [
                "Consult a Vastu expert immediately",
                "Prioritize major corrections",
                "Implement all recommended remedies",
                "Consider structural changes if possible",
                "Use temporary remedies while planning major changes"
            ]

# Initialize the service
vastu_service = VastuService()
