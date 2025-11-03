#!/usr/bin/env python3
"""
Test script for the unlimited design service
"""

import asyncio
import sys
import os

# Add the Backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Backend'))

from unlimited_design_service import unlimited_design_service

async def test_unlimited_designs():
    """Test the unlimited design service"""
    print("🧪 Testing Unlimited Design Service")
    print("=" * 50)
    
    # Test different queries and pages
    test_cases = [
        ("modern interior", 1, 10),
        ("minimalist kitchen", 2, 15),
        ("luxury bedroom", 3, 20),
        ("scandinavian living room", 1, 25),
        ("", 1, 10),  # Empty query test
    ]
    
    for query, page, per_page in test_cases:
        print(f"\n📋 Testing: query='{query}', page={page}, per_page={per_page}")
        
        try:
            results = await unlimited_design_service.search_images(query, page, per_page)
            
            print(f"✅ Success: Got {len(results)} results")
            
            if results:
                # Check first result structure
                first_result = results[0]
                required_fields = ['id', 'image', 'title', 'alt', 'src']
                
                print("🔍 Checking result structure:")
                for field in required_fields:
                    if field in first_result:
                        print(f"  ✓ {field}: {str(first_result[field])[:50]}...")
                    else:
                        print(f"  ❌ Missing field: {field}")
                
                # Check for unique IDs
                ids = [result['id'] for result in results]
                unique_ids = set(ids)
                if len(ids) == len(unique_ids):
                    print(f"  ✓ All {len(ids)} IDs are unique")
                else:
                    print(f"  ⚠️  Found {len(ids) - len(unique_ids)} duplicate IDs")
                
                # Check image URLs
                image_urls = [result['image'] for result in results if result.get('image')]
                if image_urls:
                    print(f"  ✓ All results have image URLs")
                    print(f"  📸 Sample image URL: {image_urls[0]}")
                else:
                    print(f"  ❌ No image URLs found")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    # Test pagination consistency
    print(f"\n🔄 Testing pagination consistency...")
    try:
        page1_results = await unlimited_design_service.search_images("modern design", 1, 5)
        page2_results = await unlimited_design_service.search_images("modern design", 2, 5)
        
        page1_ids = set(result['id'] for result in page1_results)
        page2_ids = set(result['id'] for result in page2_results)
        
        overlap = page1_ids.intersection(page2_ids)
        if not overlap:
            print("✅ No overlap between page 1 and page 2 - good pagination")
        else:
            print(f"⚠️  Found {len(overlap)} overlapping IDs between pages")
        
    except Exception as e:
        print(f"❌ Pagination test error: {str(e)}")
    
    # Close the service
    await unlimited_design_service.close()
    
    print(f"\n🎉 Testing completed!")

if __name__ == "__main__":
    asyncio.run(test_unlimited_designs())