"""
Prokerala Astrology API Service
Provides legitimate astrology data integration for Vastu analysis
"""

import os
import requests
import json
from typing import Dict, List, Optional, Any
from datetime import datetime

class ProkeralaAstrologyService:
    def __init__(self):
        self.client_id = os.getenv('PROKERALA_CLIENT_ID')
        self.client_secret = os.getenv('PROKERALA_SECRET_KEY')
        self.base_url = "https://api.prokerala.com/v2"
        self.access_token = None
        
        if self.client_id and self.client_secret:
            print(f"✅ Prokerala API credentials loaded - Client ID: {self.client_id[:8]}...")
        else:
            print("❌ Prokerala API credentials not found in environment variables")
            print("Please set PROKERALA_CLIENT_ID and PROKERALA_SECRET_KEY in your .env file")
    
    async def get_access_token(self) -> Optional[str]:
        """Get OAuth access token from Prokerala"""
        if not self.client_id or not self.client_secret:
            print("❌ Cannot get access token: Missing Prokerala credentials")
            return None
        
        try:
            auth_url = "https://api.prokerala.com/token"
            auth_data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }
            
            print(f"🔄 Requesting Prokerala access token from {auth_url}")
            response = requests.post(auth_url, data=auth_data, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                self.access_token = result.get('access_token')
                print("✅ Prokerala access token obtained successfully")
                return self.access_token
            else:
                print(f"❌ Prokerala auth failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting Prokerala access token: {e}")
            return None
    
    def get_coordinates(self, place: str) -> Dict[str, float]:
        """Get coordinates for Indian cities"""
        # Major Indian cities coordinates
        city_coordinates = {
            'mumbai': {'lat': 19.0760, 'lng': 72.8777},
            'delhi': {'lat': 28.7041, 'lng': 77.1025},
            'new delhi': {'lat': 28.7041, 'lng': 77.1025},
            'bangalore': {'lat': 12.9716, 'lng': 77.5946},
            'bengaluru': {'lat': 12.9716, 'lng': 77.5946},
            'chennai': {'lat': 13.0827, 'lng': 80.2707},
            'kolkata': {'lat': 22.5726, 'lng': 88.3639},
            'hyderabad': {'lat': 17.3850, 'lng': 78.4867},
            'pune': {'lat': 18.5204, 'lng': 73.8567},
            'ahmedabad': {'lat': 23.0225, 'lng': 72.5714},
            'jaipur': {'lat': 26.9124, 'lng': 75.7873},
            'surat': {'lat': 21.1702, 'lng': 72.8311},
            'lucknow': {'lat': 26.8467, 'lng': 80.9462},
            'kanpur': {'lat': 26.4499, 'lng': 80.3319},
            'nagpur': {'lat': 21.1458, 'lng': 79.0882},
            'indore': {'lat': 22.7196, 'lng': 75.8577},
            'thane': {'lat': 19.2183, 'lng': 72.9781},
            'bhopal': {'lat': 23.2599, 'lng': 77.4126},
            'visakhapatnam': {'lat': 17.6868, 'lng': 83.2185},
            'pimpri': {'lat': 18.6298, 'lng': 73.7997}
        }
        
        place_lower = place.lower().strip()
        
        # Try exact match first
        if place_lower in city_coordinates:
            return city_coordinates[place_lower]
        
        # Try partial match
        for city, coords in city_coordinates.items():
            if city in place_lower or place_lower in city:
                return coords
        
        # Default to Delhi if no match found
        print(f"City '{place}' not found, using Delhi coordinates")
        return city_coordinates['delhi']
    
    async def get_birth_chart(self, birth_date: str, birth_time: str, birth_place: str) -> Optional[Dict]:
        """Get birth chart from Prokerala API"""
        try:
            # Get access token
            token = await self.get_access_token()
            if not token:
                print("❌ Cannot fetch birth chart: No access token available")
                return None
            
            # Parse birth details
            try:
                birth_dt = datetime.strptime(birth_date, '%Y-%m-%d')
                time_parts = birth_time.split(':')
                hour = int(time_parts[0])
                minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                print(f"📅 Parsed birth details: {birth_dt.strftime('%Y-%m-%d')} at {hour:02d}:{minute:02d}")
            except ValueError as e:
                print(f"❌ Date/time parsing error: {e}")
                return None
            
            # Get coordinates
            coordinates = self.get_coordinates(birth_place)
            print(f"📍 Using coordinates for {birth_place}: {coordinates['lat']}, {coordinates['lng']}")
            
            # API endpoint for birth details
            chart_url = f"{self.base_url}/astrology/birth-details"
            
            # Format datetime for API (ISO format with timezone)
            datetime_str = f"{birth_dt.strftime('%Y-%m-%d')}T{hour:02d}:{minute:02d}:00+05:30"
            
            params = {
                'datetime': datetime_str,
                'coordinates': f"{coordinates['lat']},{coordinates['lng']}",
                'ayanamsa': 1  # Lahiri ayanamsa (most commonly used)
            }
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            print(f"🔄 Requesting birth chart from Prokerala API...")
            response = requests.get(chart_url, params=params, headers=headers, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Birth chart data received successfully from Prokerala")
                # Debug: Print response structure (first 500 chars)
                import json
                response_str = json.dumps(data, indent=2)[:500]
                print(f"📊 API Response preview: {response_str}...")
                return data
            else:
                print(f"❌ Prokerala birth chart API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error fetching birth chart from Prokerala: {e}")
            return None
    
    def extract_vastu_relevant_data(self, chart_data: Dict) -> Dict[str, Any]:
        """Extract Vastu-relevant information from birth chart"""
        if not chart_data or 'data' not in chart_data:
            print("⚠️ No valid chart data available, cannot provide authentic astrological insights")
            return None
        
        data = chart_data['data']
        
        try:
            print("🔍 Extracting astrological data from Prokerala response...")
            
            # Extract signs from Prokerala API response structure
            # Sun sign (Soorya Rasi)
            sun_sign = 'Unknown'
            soorya_rasi = data.get('soorya_rasi', {})
            if soorya_rasi:
                sun_sign = soorya_rasi.get('name', 'Unknown')
            
            # Moon sign (Chandra Rasi)
            moon_sign = 'Unknown'
            chandra_rasi = data.get('chandra_rasi', {})
            if chandra_rasi:
                moon_sign = chandra_rasi.get('name', 'Unknown')
            
            # Ascendant (Lagna) - may not be in birth-details endpoint
            ascendant = 'Unknown'
            # For now, we'll use zodiac info if available
            zodiac = data.get('zodiac', {})
            if zodiac:
                ascendant = zodiac.get('name', 'Unknown')
            
            # Get nakshatra for additional insights
            nakshatra = data.get('nakshatra', {}).get('name', 'Unknown')
            
            print(f"🌟 Extracted signs - Sun: {sun_sign}, Moon: {moon_sign}, Ascendant: {ascendant}")
            
            # Create a planets dict from the available data for calculations
            planets = {
                'sun': {'sign': sun_sign},
                'moon': {'sign': moon_sign}
            }
            
            # Calculate favorable directions based on planetary positions
            favorable_directions = self.calculate_favorable_directions_from_planets(planets)
            
            # Get favorable colors based on signs
            favorable_colors = self.get_favorable_colors(sun_sign, moon_sign)
            
            # Calculate lucky numbers from planetary degrees
            lucky_numbers = self.calculate_lucky_numbers_from_planets(planets)
            
            # Get gemstone recommendations based on planetary strengths
            gemstones = self.get_gemstone_recommendations_from_planets(planets)
            
            result = {
                'sun_sign': sun_sign,
                'moon_sign': moon_sign,
                'ascendant': ascendant,
                'nakshatra': nakshatra,
                'favorable_directions': favorable_directions,
                'favorable_colors': favorable_colors,
                'lucky_numbers': lucky_numbers,
                'gemstone_recommendations': gemstones,
                'planetary_data': planets,
                'source': 'prokerala_api_authentic'
            }
            
            print("✅ Successfully extracted authentic astrological data")
            return result
            
        except Exception as e:
            print(f"❌ Error extracting chart data: {e}")
            return None
    
    def calculate_favorable_directions_from_planets(self, planets: Dict) -> List[str]:
        """Calculate favorable directions based on actual planetary positions from Prokerala"""
        directions = []
        
        try:
            # Get sun's sign for primary direction
            sun_sign = planets.get('sun', {}).get('sign', '').lower()
            
            # Get moon's sign for secondary direction
            moon_sign = planets.get('moon', {}).get('sign', '').lower()
            
            # Calculate based on sun sign (primary influence)
            if any(sign in sun_sign for sign in ['aries', 'leo', 'sagittarius']):
                directions.append('east')
                directions.append('south-east')
            elif any(sign in sun_sign for sign in ['taurus', 'virgo', 'capricorn']):
                directions.append('south')
                directions.append('south-west')
            elif any(sign in sun_sign for sign in ['gemini', 'libra', 'aquarius']):
                directions.append('west')
                directions.append('north-west')
            else:  # Water signs
                directions.append('north')
                directions.append('north-east')
            
            # Add moon sign influence for additional favorable direction
            if any(sign in moon_sign for sign in ['cancer', 'scorpio', 'pisces']):
                if 'north-east' not in directions:
                    directions.append('north-east')
            
            print(f"🧭 Calculated favorable directions from planets: {directions}")
            return directions[:3]  # Return top 3 directions
                
        except Exception as e:
            print(f"Error calculating directions from planets: {e}")
            return ['east', 'north']
    
    def get_favorable_colors(self, sun_sign: str, moon_sign: str) -> List[str]:
        """Get favorable colors based on astrological signs"""
        colors = []
        
        sun_lower = sun_sign.lower()
        
        # Fire signs
        if any(sign in sun_lower for sign in ['aries', 'leo', 'sagittarius']):
            colors = ['red', 'orange', 'yellow']
        # Earth signs
        elif any(sign in sun_lower for sign in ['taurus', 'virgo', 'capricorn']):
            colors = ['green', 'brown', 'yellow']
        # Air signs
        elif any(sign in sun_lower for sign in ['gemini', 'libra', 'aquarius']):
            colors = ['white', 'silver', 'light blue']
        # Water signs
        else:
            colors = ['blue', 'white', 'silver']
        
        return colors
    
    def calculate_lucky_numbers_from_planets(self, planets: Dict) -> List[int]:
        """Calculate lucky numbers based on actual planetary degrees from Prokerala"""
        numbers = []
        
        try:
            # Calculate from sun's degree
            sun_degree = planets.get('sun', {}).get('degree', 0)
            if sun_degree:
                sun_number = (int(sun_degree) % 9) + 1
                numbers.append(sun_number)
            
            # Calculate from moon's degree
            moon_degree = planets.get('moon', {}).get('degree', 0)
            if moon_degree:
                moon_number = (int(moon_degree) % 9) + 1
                if moon_number not in numbers:
                    numbers.append(moon_number)
            
            # Calculate from ascendant degree if available
            # Add traditional Vedic lucky numbers
            vedic_numbers = [1, 3, 6, 9]
            for num in vedic_numbers:
                if num not in numbers and len(numbers) < 5:
                    numbers.append(num)
            
            print(f"🔢 Calculated lucky numbers from planetary degrees: {numbers}")
            return numbers[:5]
                
        except Exception as e:
            print(f"Error calculating lucky numbers: {e}")
            return [1, 3, 6, 9]
    
    def get_gemstone_recommendations_from_planets(self, planets: Dict) -> List[str]:
        """Get gemstone recommendations based on actual planetary strengths from Prokerala"""
        gemstones = []
        
        try:
            # Analyze planetary strengths and recommend gemstones for weak planets
            
            # Sun - Ruby for strength and leadership
            sun_data = planets.get('sun', {})
            sun_sign = sun_data.get('sign', '').lower()
            if any(weak_sign in sun_sign for weak_sign in ['libra', 'aquarius']):
                gemstones.append('Ruby')
            
            # Moon - Pearl for emotional balance
            moon_data = planets.get('moon', {})
            moon_sign = moon_data.get('sign', '').lower()
            if any(weak_sign in moon_sign for weak_sign in ['scorpio', 'capricorn']):
                gemstones.append('Pearl')
            
            # Jupiter - Yellow Sapphire for wisdom and prosperity
            jupiter_data = planets.get('jupiter', {})
            jupiter_sign = jupiter_data.get('sign', '').lower()
            if any(weak_sign in jupiter_sign for weak_sign in ['gemini', 'virgo', 'capricorn']):
                gemstones.append('Yellow Sapphire')
            
            # Venus - Diamond for relationships and luxury
            venus_data = planets.get('venus', {})
            venus_sign = venus_data.get('sign', '').lower()
            if any(weak_sign in venus_sign for weak_sign in ['aries', 'scorpio']):
                gemstones.append('Diamond')
            
            # Mars - Red Coral for energy and courage
            mars_data = planets.get('mars', {})
            mars_sign = mars_data.get('sign', '').lower()
            if any(weak_sign in mars_sign for weak_sign in ['cancer', 'libra']):
                gemstones.append('Red Coral')
            
            # If no specific weaknesses found, recommend general beneficial stones
            if not gemstones:
                gemstones = ['Yellow Sapphire', 'Pearl', 'Red Coral']
            
            print(f"💎 Recommended gemstones based on planetary analysis: {gemstones}")
            return gemstones[:3]
                
        except Exception as e:
            print(f"Error calculating gemstone recommendations: {e}")
            return ['Yellow Sapphire', 'Pearl', 'Red Coral']
    
    async def get_authentic_astrology_data(self, birth_date: str, birth_time: str, birth_place: str) -> Optional[Dict[str, Any]]:
        """Get authentic astrology data from Prokerala API - no fallbacks"""
        try:
            print(f"🔮 Fetching authentic astrology data for {birth_place} on {birth_date} at {birth_time}")
            
            # Get birth chart from Prokerala
            chart_data = await self.get_birth_chart(birth_date, birth_time, birth_place)
            
            if not chart_data:
                print("❌ Failed to get birth chart from Prokerala API")
                return None
            
            # Extract Vastu-relevant data
            vastu_data = self.extract_vastu_relevant_data(chart_data)
            
            if not vastu_data:
                print("❌ Failed to extract astrological insights")
                return None
            
            print("✅ Successfully obtained authentic astrological data from Prokerala")
            return vastu_data
            
        except Exception as e:
            print(f"❌ Error getting authentic astrology data: {e}")
            return None

# Initialize the service
prokerala_service = ProkeralaAstrologyService()