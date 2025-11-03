#!/usr/bin/env python3
"""
Test script to verify Prokerala API integration for authentic astrology data
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables first
load_dotenv('Backend/.env')

from astrology_api_service import ProkeralaAstrologyService

async def test_prokerala_integration():
    """Test the Prokerala API integration"""
    
    print("🔮 Testing Prokerala API Integration for Authentic Astrology")
    print("=" * 60)
    
    # Initialize service after env vars are loaded
    prokerala_service = ProkeralaAstrologyService()
    
    # Test credentials
    client_id = os.getenv('PROKERALA_CLIENT_ID')
    secret_key = os.getenv('PROKERALA_SECRET_KEY')
    
    if not client_id or not secret_key:
        print("❌ Prokerala API credentials not found!")
        return False
    
    print(f"✅ Credentials loaded - Client ID: {client_id[:8]}...")
    
    # Test access token
    print("\n🔑 Testing access token...")
    token = await prokerala_service.get_access_token()
    
    if not token:
        print("❌ Failed to get access token")
        return False
    
    print(f"✅ Access token obtained: {token[:20]}...")
    
    # Test birth chart API with sample data
    print("\n📊 Testing birth chart API...")
    
    # Sample birth details (you can change these)
    birth_date = "1990-01-15"
    birth_time = "10:30"
    birth_place = "Mumbai, India"
    
    print(f"Sample data: {birth_date} at {birth_time} in {birth_place}")
    
    try:
        # Get authentic astrology data
        astro_data = await prokerala_service.get_authentic_astrology_data(
            birth_date, birth_time, birth_place
        )
        
        if astro_data:
            print("✅ Successfully retrieved authentic astrological data!")
            print("\n📋 Astrological Insights:")
            print(f"   Sun Sign: {astro_data['sun_sign']}")
            print(f"   Moon Sign: {astro_data['moon_sign']}")
            print(f"   Ascendant: {astro_data['ascendant']}")
            print(f"   Favorable Directions: {', '.join(astro_data['favorable_directions'])}")
            print(f"   Favorable Colors: {', '.join(astro_data['favorable_colors'])}")
            print(f"   Lucky Numbers: {', '.join(map(str, astro_data['lucky_numbers']))}")
            print(f"   Gemstone Recommendations: {', '.join(astro_data['gemstone_recommendations'])}")
            print(f"   Data Source: {astro_data['source']}")
            
            return True
        else:
            print("❌ Failed to get astrological data")
            return False
            
    except Exception as e:
        print(f"❌ Error during API test: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_prokerala_integration())
    
    if success:
        print("\n🎉 Prokerala API integration test PASSED!")
        print("The Vastu application now uses authentic astrological data.")
    else:
        print("\n💥 Prokerala API integration test FAILED!")
        print("Please check your API credentials and network connection.")