#!/usr/bin/env python3
"""
Comprehensive test script for AR Interior Design Platform
Tests all major features and endpoints
"""

import requests
import json
import time
import sys
from typing import Dict, Any

class ApplicationTester:
    def __init__(self, backend_url: str = "http://localhost:8001"):
        self.backend_url = backend_url
        self.results = []
    
    def log_test(self, test_name: str, success: bool, message: str = ""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        self.results.append({
            "test": test_name,
            "success": success,
            "message": message
        })
    
    def test_backend_health(self):
        """Test backend health endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend Health Check", True, f"Status: {data.get('status')}")
                return True
            else:
                self.log_test("Backend Health Check", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Health Check", False, str(e))
            return False
    
    def test_ai_image_generation(self):
        """Test AI image generation"""
        try:
            payload = {
                "prompt": "modern living room with white walls and wooden furniture",
                "style": "modern",
                "room_type": "living_room",
                "width": 512,
                "height": 512
            }
            response = requests.post(
                f"{self.backend_url}/generate-interior",
                json=payload,
                timeout=60
            )
            if response.status_code == 200:
                self.log_test("AI Image Generation", True, "Image generated successfully")
                return True
            else:
                self.log_test("AI Image Generation", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("AI Image Generation", False, str(e))
            return False
    
    def test_floor_plan_generation(self):
        """Test floor plan generation"""
        try:
            payload = {
                "prompt": "2 bedroom apartment with kitchen and living room",
                "model_name": "default"
            }
            response = requests.post(
                f"{self.backend_url}/floor-plan",
                json=payload,
                timeout=60
            )
            if response.status_code == 200:
                self.log_test("Floor Plan Generation", True, "Floor plan generated successfully")
                return True
            else:
                self.log_test("Floor Plan Generation", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Floor Plan Generation", False, str(e))
            return False
    
    def test_design_feed(self):
        """Test design feed endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/feed", timeout=30)
            if response.status_code == 200:
                data = response.json()
                count = len(data.get('results', []))
                self.log_test("Design Feed", True, f"Retrieved {count} images")
                return True
            else:
                self.log_test("Design Feed", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Design Feed", False, str(e))
            return False
    
    def test_materials_search(self):
        """Test materials search"""
        try:
            payload = {
                "query": "wooden furniture",
                "room_type": "living_room",
                "style": "modern",
                "budget_range": "medium"
            }
            response = requests.post(
                f"{self.backend_url}/materials/search",
                json=payload,
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get('products', []))
                self.log_test("Materials Search", True, f"Found {count} products")
                return True
            else:
                self.log_test("Materials Search", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Materials Search", False, str(e))
            return False
    
    def test_shopping_products(self):
        """Test shopping products"""
        try:
            payload = {
                "page": 1,
                "per_page": 10,
                "category": "furniture",
                "price_range": [1000, 50000],
                "sort_by": "relevance"
            }
            response = requests.post(
                f"{self.backend_url}/shopping/products",
                json=payload,
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get('products', []))
                self.log_test("Shopping Products", True, f"Retrieved {count} products")
                return True
            else:
                self.log_test("Shopping Products", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Shopping Products", False, str(e))
            return False
    
    def test_ai_chat(self):
        """Test AI chat functionality"""
        try:
            payload = {
                "messages": [
                    {"role": "user", "content": "What are the best colors for a modern living room?"}
                ]
            }
            response = requests.post(
                f"{self.backend_url}/chat",
                json=payload,
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                if 'response' in data:
                    self.log_test("AI Chat", True, "Chat response received")
                    return True
                else:
                    self.log_test("AI Chat", False, "No response in data")
                    return False
            else:
                self.log_test("AI Chat", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("AI Chat", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("AR Interior Design Platform - Backend Tests")
        print("=" * 60)
        print()
        
        # Wait for backend to be ready
        print("Waiting for backend to be ready...")
        for i in range(30):
            try:
                response = requests.get(f"{self.backend_url}/health", timeout=5)
                if response.status_code == 200:
                    break
            except:
                pass
            time.sleep(1)
        else:
            print("❌ Backend is not responding. Please start the backend first.")
            return False
        
        print("Backend is ready! Starting tests...\n")
        
        # Run tests
        tests = [
            self.test_backend_health,
            self.test_design_feed,
            self.test_materials_search,
            self.test_shopping_products,
            self.test_ai_chat,
            self.test_ai_image_generation,
            self.test_floor_plan_generation,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        
        print()
        print("=" * 60)
        print(f"Test Results: {passed}/{total} tests passed")
        print("=" * 60)
        
        if passed == total:
            print("🎉 All tests passed! The application is ready for deployment.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the backend logs and fix the issues.")
            return False

def main():
    backend_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8001"
    tester = ApplicationTester(backend_url)
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()







