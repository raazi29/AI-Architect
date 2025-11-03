import asyncio
import json
from typing import AsyncGenerator
import aiohttp
from Backend.ai_design_service import MaterialRequest, RoomType, DesignStyle

async def test_streaming():
    """Test the streaming functionality of the AI materials endpoint"""
    
    # Test data
    test_request = {
        "room_type": "living_room",
        "style": "modern",
        "room_size": 25.0,
        "durability_needs": "medium",
        "budget_range": "medium",
        "special_requirements": "pet-friendly"
    }
    
    try:
        # Using aiohttp to handle the streaming response
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:8001/ai/materials-stream",
                json=test_request,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                print(f"Response status: {response.status}")
                print("Streaming response:")
                
                buffer = ""
                async for line in response.content:
                    line_str = line.decode('utf-8')
                    buffer += line_str
                    
                    # Process complete lines
                    while '\n' in buffer:
                        complete_line, buffer = buffer.split('\n', 1)
                        
                        if complete_line.startswith("data: "):
                            try:
                                data = json.loads(complete_line[6:])  # Remove "data: " prefix
                                print(f"Received: {data}")
                                
                                if data.get('status') == 'complete':
                                    print("Stream completed successfully!")
                                    return True
                                elif data.get('error'):
                                    print(f"Error in stream: {data}")
                                    return False
                            except json.JSONDecodeError:
                                print(f"Could not parse JSON: {complete_line}")
                
                # Process any remaining buffer
                if buffer.strip():
                    if buffer.startswith("data: "):
                        try:
                            data = json.loads(buffer[6:])
                            print(f"Received: {data}")
                        except json.JSONDecodeError:
                            print(f"Could not parse JSON: {buffer}")
    
    except Exception as e:
        print(f"Error during streaming test: {e}")
        return False

if __name__ == "__main__":
    print("Testing AI materials streaming functionality...")
    success = asyncio.run(test_streaming())
    if success:
        print("Streaming test completed successfully!")
    else:
        print("Streaming test failed!")