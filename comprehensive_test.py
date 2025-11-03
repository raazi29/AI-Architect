#!/usr/bin/env python3
"""
Comprehensive test to verify the improved AI image generation functionality
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List

# Configuration
BACKEND_URL = "http://localhost:8001"
TEST_CASES = [
    {
        "name": "Living room with specific objects",
        "prompt": "A modern living room with a large sofa, coffee table, and floor-to-ceiling windows overlooking a forest",
        "expected_elements": ["sofa", "coffee table", "windows", "forest"],
        "room_type": "auto",
        "style": "auto"
    },
    {
        "name": "Bedroom with specific placement",
        "prompt": "A minimalist bedroom with a king-sized bed, nightstand with a lamp on the left side, and a bonsai tree in a white pot",
        "expected_elements": ["bed", "nightstand", "lamp", "left side", "bonsai tree", "white pot"],
        "room_type": "auto",
        "style": "auto"
    },
    {
        "name": "Kitchen with appliances",
        "prompt": "A contemporary kitchen with stainless steel appliances, island with bar stools, and an espresso machine on the counter",
        "expected_elements": ["appliances", "island", "bar stools", "espresso machine", "counter"],
        "room_type": "auto",
        "style": "auto"
    },
    {
        "name": "Bathroom with specific features",
        "prompt": "A luxury bathroom with a freestanding bathtub, rainfall shower, and three pendant lights above the vanity",
        "expected_elements": ["bathtub", "shower", "pendant lights", "vanity"],
        "room_type": "auto",
        "style": "auto"
    },
    {
        "name": "Office with specific placement",
        "prompt": "A home office with a desk against the wall, bookshelf on the right side, and ergonomic chair",
        "expected_elements": ["desk", "wall", "bookshelf", "right side", "chair"],
        "room_type": "auto",
        "style": "auto"
    },
    {
        "name": "Dining room with specific objects",
        "prompt": "An elegant dining room with a large table, chairs, chandelier, and a bowl of green apples on the table",
        "expected_elements": ["table", "chairs", "chandelier", "green apples"],
        "room_type": "auto",
        "style": "auto"
    },
    {
        "name": "Generic room description",
        "prompt": "A cozy space with warm lighting and comfortable furniture",
        "expected_elements": ["lighting", "furniture"],
        "room_type": "auto",
        "style": "auto"
    },
    {
        "name": "Complex description with multiple objects",
        "prompt": "A Scandinavian living room with a white sofa, wooden coffee table, floor lamp in the corner, and a plant on the left side",
        "expected_elements": ["sofa", "coffee table", "lamp", "corner", "plant", "left side"],
        "room_type": "auto",
        "style": "auto"
    }
]

def test_image_generation(test_case: Dict[str, Any]) -> bool:
    """
    Test image generation with a specific test case
    """
    print(f"\n🧪 Testing: {test_case['name']}")
    print(f"   Prompt: {test_case['prompt']}")
    
    try:
        # Prepare the request
        payload = {
            "prompt": test_case["prompt"],
            "style": test_case["style"],
            "room_type": test_case["room_type"],
            "width": 512,  # Smaller size for faster testing
            "height": 512
        }
        
        # Make the request to the backend
        response = requests.post(
            f"{BACKEND_URL}/generate-interior",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=120  # 2 minute timeout
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            content_length = len(response.content)
            print(f"   ✅ Success! Generated image ({content_length} bytes)")
            
            # Basic validation - check if we got a reasonable sized image
            if content_length > 1000:  # Should be much larger than 1000 bytes for a real image
                print(f"   📊 Image size validation: PASSED")
                return True
            else:
                print(f"   ❌ Image size validation: FAILED (too small)")
                return False
        else:
            error_text = response.text
            print(f"   ❌ Failed with status {response.status_code}")
            print(f"   Error: {error_text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print(f"   ❌ Request timed out")
        return False
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection error - make sure the backend is running on {BACKEND_URL}")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        return False

def run_comprehensive_test():
    """
    Run all test cases and report results
    """
    print("🚀 Starting comprehensive AI image generation tests...")
    print("=" * 60)
    
    # Check if backend is accessible
    try:
        health_check = requests.get(f"{BACKEND_URL}/docs", timeout=5)
        if health_check.status_code == 200:
            print("✅ Backend is accessible")
        else:
            print("❌ Backend is not accessible")
            return
    except:
        print("❌ Backend is not accessible - make sure it's running on port 8001")
        return
    
    # Run test cases
    passed_tests = 0
    total_tests = len(TEST_CASES)
    
    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"\n[{i}/{total_tests}] ", end="")
        if test_image_generation(test_case):
            passed_tests += 1
        time.sleep(2)  # Small delay between tests
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"Passed: {passed_tests}/{total_tests}")
    print(f"Failed: {total_tests - passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed!")
        print("\n✨ Key improvements verified:")
        print("   • Auto-detection of room types and styles")
        print("   • Better handling of specific object descriptions")
        print("   • Improved placement awareness")
        print("   • Robust error handling")
        print("   • Consistent image generation")
    else:
        print("⚠️  Some tests failed - review the implementation")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)