#!/usr/bin/env python3
"""
Test script to verify image URLs are valid and load properly
"""

import asyncio
import sys
import os
import httpx

# Add the Backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Backend'))

from unlimited_design_service import unlimited_design_service

async def test_image_urls():
    """Test that generated image URLs are valid and accessible"""
    print("🧪 Testing Image URL Validity")
    print("=" * 60)
    
    # Generate some test images
    print("\n📋 Generating test images...")
    results = await unlimited_design_service.search_images("modern kitchen", page=1, per_page=5)
    
    if not results:
        print("❌ No results generated")
        return
    
    print(f"✅ Generated {len(results)} images")
    
    # Test each image URL
    async with httpx.AsyncClient(timeout=10.0) as client:
        for i, result in enumerate(results, 1):
            print(f"\n📸 Testing image {i}/{len(results)}")
            print(f"   ID: {result['id']}")
            print(f"   Title: {result['title'][:50]}...")
            
            image_url = result.get('image', '')
            if not image_url:
                print(f"   ❌ No image URL found")
                continue
            
            print(f"   URL: {image_url[:80]}...")
            
            try:
                # Try to fetch the image
                response = await client.get(image_url)
                
                if response.status_code == 200:
                    print(f"   ✅ Image loads successfully (Status: {response.status_code})")
                    print(f"   📊 Content-Type: {response.headers.get('content-type', 'unknown')}")
                    print(f"   📦 Size: {len(response.content)} bytes")
                else:
                    print(f"   ⚠️  Image returned status: {response.status_code}")
            
            except Exception as e:
                print(f"   ❌ Failed to load image: {str(e)}")
    
    # Check for duplicate IDs
    print(f"\n🔍 Checking for duplicate IDs...")
    ids = [result['id'] for result in results]
    unique_ids = set(ids)
    
    if len(ids) == len(unique_ids):
        print(f"   ✅ All {len(ids)} IDs are unique")
    else:
        duplicates = len(ids) - len(unique_ids)
        print(f"   ❌ Found {duplicates} duplicate IDs")
        
        # Show duplicates
        from collections import Counter
        id_counts = Counter(ids)
        for id_val, count in id_counts.items():
            if count > 1:
                print(f"      Duplicate: {id_val} (appears {count} times)")
    
    # Close the service
    await unlimited_design_service.close()
    
    print(f"\n🎉 Testing completed!")

if __name__ == "__main__":
    asyncio.run(test_image_urls())