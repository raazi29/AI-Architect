"""
Test script for AI-powered Vastu analysis
Run this to verify the Groq API integration is working
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_vastu_ai():
    """Test the AI-powered Vastu analysis"""
    try:
        # Import the service
        from Backend.vastu_service import vastu_service
        
        # Check if Groq client is initialized
        if not vastu_service.groq_client:
            print("❌ ERROR: Groq API key not found!")
            print("\n📝 To fix this:")
            print("1. Create a .env file in the Backend directory")
            print("2. Get a free API key from https://console.groq.com/keys")
            print("3. Add this line to .env file:")
            print("   GROQ_API_KEY=your_api_key_here")
            return False
        
        print("✅ Groq client initialized successfully!")
        print("\n🔮 Testing AI-powered Vastu analysis...")
        print("-" * 60)
        
        # Test 1: Analyze a room
        print("\n📍 Test 1: Analyzing Master Bedroom in South-West direction")
        result = await vastu_service.analyze_room_with_ai("master_bedroom", "south-west")
        
        print(f"✅ Status: {result.get('status', 'N/A')}")
        print(f"📊 Score: {result.get('score', 'N/A')}/100")
        print(f"🤖 AI-Powered: {result.get('ai_powered', False)}")
        
        if result.get('expert_insights'):
            print(f"\n💡 Expert Insights:")
            for insight in result['expert_insights'][:2]:
                print(f"   • {insight}")
        
        if result.get('energy_analysis'):
            print(f"\n⚡ Energy Analysis:")
            energy = result['energy_analysis']
            print(f"   💰 Prosperity: {energy.get('prosperity_impact', 'N/A')[:60]}...")
            print(f"   ❤️ Health: {energy.get('health_impact', 'N/A')[:60]}...")
        
        print("\n" + "-" * 60)
        
        # Test 2: Another room
        print("\n📍 Test 2: Analyzing Kitchen in South-East direction")
        result2 = await vastu_service.analyze_room_with_ai("kitchen", "south-east")
        
        print(f"✅ Status: {result2.get('status', 'N/A')}")
        print(f"📊 Score: {result2.get('score', 'N/A')}/100")
        
        if result2.get('recommendations'):
            print(f"\n📝 Recommendations:")
            for rec in result2['recommendations'][:2]:
                print(f"   • {rec}")
        
        print("\n" + "=" * 60)
        print("✨ All tests passed! AI-powered Vastu analysis is working!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🕉️  AI-Powered Vastu Analysis Test")
    print("=" * 60)
    
    success = asyncio.run(test_vastu_ai())
    
    if success:
        print("\n✅ Setup complete! Your Vastu service is ready to use.")
        print("\n📌 Next steps:")
        print("1. Start the backend: python Backend/main.py")
        print("2. Start the frontend: npm run dev")
        print("3. Navigate to /vastu to test the AI-powered analysis")
    else:
        print("\n⚠️  Please fix the issues above and try again.")






