import asyncio
import json
import os
import sys
from typing import AsyncGenerator

# Add the Backend directory to the path so we can import the modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Backend'))

# Set the GROQ_API_KEY environment variable for the test
os.environ['GROQ_API_KEY'] = 'temp_key_for_testing'

from ai_design_service import AIDesignService, MaterialRequest, RoomType, DesignStyle


async def test_stream_material_suggestions():
    """Test the streaming functionality of the AI design service"""
    
    # Create an instance of the AI design service
    service = AIDesignService()
    
    # Create a test request
    request = MaterialRequest(
        room_type=RoomType.LIVING_ROOM,
        style=DesignStyle.MODERN,
        room_size=25.0,
        durability_needs="medium",
        budget_range="medium",
        special_requirements="pet-friendly"
    )
    
    print("Testing stream_material_suggestions method...")
    
    try:
        # Call the streaming method
        stream = service.stream_material_suggestions(request)
        
        # Collect all streamed data
        results = []
        async for chunk in stream:
            print(f"Received chunk: {chunk}")
            results.append(chunk)
            
            # Parse the chunk to see if it contains complete data
            if chunk.startswith("data: "):
                try:
                    data = json.loads(chunk[6:])  # Remove "data: " prefix
                    print(f"Parsed data: {data}")
                    
                    # If we get a complete response, we can break early
                    if data.get('status') == 'complete' and 'complete_response' in data:
                        print("Received complete response, stopping stream...")
                        break
                    elif data.get('error'):
                        print(f"Error in stream: {data}")
                        break
                except json.JSONDecodeError as e:
                    print(f"Could not parse JSON from chunk: {e}")
                    print(f"Chunk: {chunk}")
        
        print(f"Total chunks received: {len(results)}")
        print("Streaming test completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error during streaming test: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_get_material_suggestions():
    """Test the non-streaming functionality for comparison"""
    
    # Create an instance of the AI design service
    service = AIDesignService()
    
    # Create a test request
    request = MaterialRequest(
        room_type=RoomType.LIVING_ROOM,
        style=DesignStyle.MODERN,
        room_size=25.0,
        durability_needs="medium",
        budget_range="medium",
        special_requirements="pet-friendly"
    )
    
    print("\nTesting get_material_suggestions method (non-streaming)...")
    
    try:
        result = await service.get_material_suggestions(request)
        print(f"Non-streaming result: {type(result)}")
        print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        return True
    except Exception as e:
        print(f"Error during non-streaming test: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Testing AI materials functionality...")
    
    # Test non-streaming first (should work without API calls if properly mocked)
    success1 = asyncio.run(test_get_material_suggestions())
    
    # Test streaming functionality
    success2 = asyncio.run(test_stream_material_suggestions())
    
    if success1 and success2:
        print("\nAll tests completed successfully!")
    else:
        print("\nSome tests failed!")