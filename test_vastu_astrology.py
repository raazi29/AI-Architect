#!/usr/bin/env python3
"""
Test script for Vastu Astrology Integration
Tests the Prokerala Astrology API integration for authentic Vedic Vastu analysis
"""

import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Add the Backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Backend'))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'Backend', '.env'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_astrology_api():
    """Test the astrology API service"""
    try:
        from astrology_api_service import astrology_api_service
        
        logger.info("🔮 Testing Prokerala Astrology API...")
        
        # Test basic API connection
        async with astrology_api_service as service:
            # Test Vastu analysis
            analysis = await service.analyze_vastu_with_astrology(
                room_type="living_room",
                direction="north-east",
                latitude=28.6139,  # Delhi
                longitude=77.2090
            )
            
            logger.info("✅ Astrology API test successful!")
            logger.info(f"📊 Analysis result: {analysis}")
            
            return True
            
    except Exception as e:
        logger.error(f"❌ Astrology API test failed: {str(e)}")
        return False

async def test_vastu_service():
    """Test the Vastu service with astrology integration"""
    try:
        from vastu_service import VastuService
        
        logger.info("🏠 Testing Vastu Service with Astrology...")
        
        vastu_service = VastuService()
        
        # Test room analysis
        analysis = await vastu_service.analyze_room_with_astrology(
            room_type="living_room",
            direction="north-east",
            latitude=28.6139,
            longitude=77.2090
        )
        
        logger.info("✅ Vastu Service test successful!")
        logger.info(f"📊 Room analysis: {analysis}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Vastu Service test failed: {str(e)}")
        return False

def check_environment():
    """Check if required environment variables are set"""
    logger.info("🔍 Checking environment variables...")
    
    required_vars = ['PROKERALA_SECRET_KEY', 'PROKERALA_CLIENT_ID']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        logger.error("Please set these in your .env file")
        return False
    
    logger.info("✅ All required environment variables are set")
    return True

async def main():
    """Main test function"""
    logger.info("🚀 Starting Vastu Astrology Integration Tests...")
    
    # Check environment
    if not check_environment():
        return
    
    # Test astrology API
    if not await test_astrology_api():
        return
    
    # Test Vastu service
    if not await test_vastu_service():
        return
    
    logger.info("🎉 All tests passed! Vastu Astrology Integration is working correctly.")

if __name__ == "__main__":
    asyncio.run(main())


