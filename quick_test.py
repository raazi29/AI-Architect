#!/usr/bin/env python3
"""
Quick test script for AR Interior Design Platform
Tests key endpoints without Unicode issues
"""

import requests
import json
import time

def test_endpoint(name, url, method="GET", data=None):
    """Test a single endpoint"""
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        else:
            response = requests.post(url, json=data, timeout=30)
        
        if response.status_code == 200:
            print(f"PASS: {name}")
            return True
        else:
            print(f"FAIL: {name} - HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"FAIL: {name} - {str(e)}")
        return False

def main():
    print("AR Interior Design Platform - Quick Test")
    print("=" * 50)
    
    base_url = "http://localhost:8001"
    
    # Test endpoints
    tests = [
        ("Health Check", f"{base_url}/health", "GET"),
        ("Design Feed", f"{base_url}/feed", "GET"),
        ("Materials Search", f"{base_url}/materials/search", "POST", {
            "query": "wooden furniture",
            "room_type": "living_room",
            "style": "modern"
        }),
        ("Shopping Products", f"{base_url}/shopping/products", "POST", {
            "page": 1,
            "per_page": 5
        }),
        ("AI Chat", f"{base_url}/chat", "POST", {
            "messages": [{"role": "user", "content": "Hello"}]
        })
    ]
    
    passed = 0
    total = len(tests)
    
    for name, url, method, *data in tests:
        payload = data[0] if data else None
        if test_endpoint(name, url, method, payload):
            passed += 1
        time.sleep(1)
    
    print("=" * 50)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("SUCCESS: All tests passed!")
        return True
    else:
        print("WARNING: Some tests failed")
        return False

if __name__ == "__main__":
    main()







