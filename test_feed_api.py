#!/usr/bin/env python3
"""
Test script to verify the design feed API works with unlimited scrolling
"""

import asyncio
import aiohttp
import json
import time

async def test_feed_api():
    """Test the design feed API endpoint"""
    print("🧪 Testing Design Feed API")
    print("=" * 50)
    
    base_url = "http://localhost:8001"
    
    async with aiohttp.ClientSession() as session:
        # Test cases
        test_cases = [
            {"query": "modern interior", "page": 1, "per_page": 10},
            {"query": "minimalist kitchen", "page": 2, "per_page": 15},
            {"query": "", "page": 1, "per_page": 20},  # Empty query
            {"query": "luxury bedroom", "page": 5, "per_page": 25},  # High page number
        ]
        
        for i, params in enumerate(test_cases, 1):
            print(f"\n📋 Test {i}: {params}")
            
            try:
                # Build URL with parameters
                url = f"{base_url}/feed"
                
                start_time = time.time()
                async with session.get(url, params=params) as response:
                    end_time = time.time()
                    
                    print(f"⏱️  Response time: {end_time - start_time:.2f}s")
                    print(f"📊 Status code: {response.status}")
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check response structure
                        if isinstance(data, dict) and "results" in data:
                            results = data["results"]
                            print(f"✅ Got {len(results)} results")
                            print(f"📄 Page: {data.get('page', 'N/A')}")
                            print(f"📊 Per page: {data.get('per_page', 'N/A')}")
                            print(f"🔄 Has more: {data.get('has_more', 'N/A')}")
                            print(f"🎯 Unlimited: {data.get('unlimited', 'N/A')}")
                            
                            if results:
                                # Check first result structure
                                first_result = results[0]
                                required_fields = ['id', 'image', 'title', 'alt']
                                
                                print("🔍 First result structure:")
                                for field in required_fields:
                                    if field in first_result:
                                        value = str(first_result[field])[:50]
                                        print(f"  ✓ {field}: {value}...")
                                    else:
                                        print(f"  ❌ Missing: {field}")
                                
                                # Check for unique IDs
                                ids = [r['id'] for r in results]
                                unique_ids = set(ids)
                                if len(ids) == len(unique_ids):
                                    print(f"  ✓ All {len(ids)} IDs are unique")
                                else:
                                    print(f"  ⚠️  {len(ids) - len(unique_ids)} duplicate IDs")
                        
                        elif isinstance(data, list):
                            print(f"✅ Got {len(data)} results (legacy format)")
                        
                        else:
                            print(f"❌ Unexpected response format: {type(data)}")
                    
                    else:
                        error_text = await response.text()
                        print(f"❌ Error {response.status}: {error_text[:200]}...")
            
            except Exception as e:
                print(f"❌ Request failed: {str(e)}")
        
        # Test pagination consistency
        print(f"\n🔄 Testing pagination consistency...")
        try:
            params1 = {"query": "design", "page": 1, "per_page": 5}
            params2 = {"query": "design", "page": 2, "per_page": 5}
            
            async with session.get(f"{base_url}/feed", params=params1) as resp1:
                data1 = await resp1.json()
            
            async with session.get(f"{base_url}/feed", params=params2) as resp2:
                data2 = await resp2.json()
            
            if isinstance(data1, dict) and isinstance(data2, dict):
                results1 = data1.get("results", [])
                results2 = data2.get("results", [])
                
                ids1 = set(r['id'] for r in results1)
                ids2 = set(r['id'] for r in results2)
                
                overlap = ids1.intersection(ids2)
                if not overlap:
                    print("✅ No overlap between pages - good pagination")
                else:
                    print(f"⚠️  {len(overlap)} overlapping IDs between pages")
            
        except Exception as e:
            print(f"❌ Pagination test failed: {str(e)}")
        
        # Test performance with multiple rapid requests
        print(f"\n⚡ Testing rapid requests (simulating infinite scroll)...")
        try:
            rapid_requests = []
            for page in range(1, 6):  # Pages 1-5
                params = {"query": "modern", "page": page, "per_page": 10}
                rapid_requests.append(session.get(f"{base_url}/feed", params=params))
            
            start_time = time.time()
            responses = await asyncio.gather(*rapid_requests)
            end_time = time.time()
            
            print(f"⏱️  5 rapid requests completed in {end_time - start_time:.2f}s")
            
            success_count = sum(1 for resp in responses if resp.status == 200)
            print(f"✅ {success_count}/5 requests successful")
            
            # Close responses
            for resp in responses:
                resp.close()
        
        except Exception as e:
            print(f"❌ Rapid request test failed: {str(e)}")
    
    print(f"\n🎉 API testing completed!")

if __name__ == "__main__":
    asyncio.run(test_feed_api())