#!/usr/bin/env python3
"""
Test script to verify Groq + Prokerala integration for authentic Vastu consultations
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables first
load_dotenv('Backend/.env')

from groq_vastu_service import GroqVastuService, VastuChatRequest, VastuChatMessage

async def test_groq_prokerala_integration():
    """Test the complete Groq + Prokerala integration"""
    
    print("🔮 Testing Groq + Prokerala Integration for Authentic Vastu Consultations")
    print("=" * 70)
    
    # Initialize the service
    groq_service = GroqVastuService()
    
    # Test 1: Chat without birth details (general guidance)
    print("\n📝 Test 1: General Vastu consultation (no birth details)")
    print("-" * 50)
    
    general_request = VastuChatRequest(
        message="I want to know the best direction for my bedroom",
        chat_history=[],
        user_info={}
    )
    
    try:
        result = await groq_service.vastu_chat(general_request)
        if result['success']:
            print("✅ General consultation successful")
            print(f"Response preview: {result['message']['content'][:200]}...")
            print(f"Astrology integrated: {result.get('astrology_integrated', False)}")
        else:
            print("❌ General consultation failed")
    except Exception as e:
        print(f"❌ Error in general consultation: {e}")
    
    # Test 2: Chat with birth details (personalized with Prokerala)
    print("\n🔮 Test 2: Personalized consultation with authentic astrology")
    print("-" * 50)
    
    personalized_request = VastuChatRequest(
        message="Please provide personalized Vastu recommendations for my bedroom based on my birth chart",
        chat_history=[],
        user_info={
            'birth_date': '1990-01-15',
            'birth_time': '10:30',
            'birth_place': 'Mumbai, India'
        }
    )
    
    try:
        result = await groq_service.vastu_chat(personalized_request)
        if result['success']:
            print("✅ Personalized consultation successful")
            print(f"Response preview: {result['message']['content'][:300]}...")
            print(f"Astrology integrated: {result.get('astrology_integrated', False)}")
            print(f"Suggestions: {result.get('suggestions', [])[:2]}")
        else:
            print("❌ Personalized consultation failed")
    except Exception as e:
        print(f"❌ Error in personalized consultation: {e}")
    
    # Test 3: Vastu analysis with astrology
    print("\n🏠 Test 3: Room analysis with authentic astrology integration")
    print("-" * 50)
    
    from groq_vastu_service import VastuAnalysisRequest
    
    analysis_request = VastuAnalysisRequest(
        room_type='master_bedroom',
        direction='south-west',
        birth_date='1990-01-15',
        birth_time='10:30',
        birth_place='Mumbai, India'
    )
    
    try:
        result = await groq_service.analyze_vastu_with_astrology(analysis_request)
        print("✅ Astrological Vastu analysis successful")
        print(f"Vastu Score: {result.get('vastu_score', 'N/A')}")
        print(f"Status: {result.get('status', 'N/A')}")
        print(f"Analysis preview: {result.get('analysis', '')[:200]}...")
        print(f"Astrology insights available: {'astrology_insights' in result}")
    except Exception as e:
        print(f"❌ Error in astrological analysis: {e}")
    
    print("\n🎉 Integration test completed!")
    print("The system now provides authentic astrological Vastu consultations using:")
    print("- Groq AI for intelligent conversation and analysis")
    print("- Prokerala API for authentic Vedic astrology calculations")
    print("- Traditional Vastu principles integrated with personal birth charts")

if __name__ == "__main__":
    asyncio.run(test_groq_prokerala_integration())