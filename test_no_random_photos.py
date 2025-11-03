#!/usr/bin/env python3
"""
Test to verify NO random photos (Picsum) are being returned
Only design-focused placeholders should be returned
"""

import asyncio
import sys
import os

# Add the Backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Backend'))

from unlimited_design_service import unlimited_design_service

async def test_no_random_photos():
    """Test that NO Picsum or random photos are returned"""
    print("🧪 Testing for Random Photos (Should be ZERO)")
    print("=" * 60)
    
    # Generate test images
    print("\n📋 Generating 20 test images...")
    results = await unlimited_design_service.search_images("modern kitchen", page=1, per_page=20)
    
    if not results:
        print("❌ No results generated")
        return
    
    print(f"✅ Generated {len(results)} images")
    
    # Check for Picsum URLs (random photos)
    picsum_count = 0
    placehold_count = 0
    other_count = 0
    
    print(f"\n🔍 Analyzing image sources...")
    
    for i, result in enumerate(results, 1):
        image_url = result.get('image', '')
        
        if 'picsum.photos' in image_url:
            picsum_count += 1
            print(f"   ❌ Image {i}: PICSUM (random photo) - {image_url[:60]}...")
        elif 'placehold.co' in image_url or 'placeholder' in image_url:
            placehold_count += 1
            # Don't print each one, just count
        else:
            other_count += 1
            print(f"   ⚠️  Image {i}: OTHER - {image_url[:60]}...")
    
    # Summary
    print(f"\n📊 Summary:")
    print(f"   Picsum (random photos): {picsum_count}")
    print(f"   Placeholders (design-focused): {placehold_count}")
    print(f"   Other sources: {other_count}")
    
    # Verdict
    print(f"\n🎯 Verdict:")
    if picsum_count == 0:
        print(f"   ✅ PASS: No random photos (Picsum) found!")
        print(f"   ✅ All {placehold_count} images are design-focused placeholders")
    else:
        print(f"   ❌ FAIL: Found {picsum_count} random photos (Picsum)")
        print(f"   ❌ These need to be removed!")
    
    # Check for design-focused content
    print(f"\n🎨 Checking design focus...")
    design_focused = 0
    
    for result in results:
        title = result.get('title', '').lower()
        alt = result.get('alt', '').lower()
        
        design_keywords = ['architecture', 'interior', 'design', 'room', 'building', 
                          'residential', 'commercial', 'modern', 'contemporary']
        
        if any(keyword in title or keyword in alt for keyword in design_keywords):
            design_focused += 1
    
    design_percentage = (design_focused / len(results)) * 100
    print(f"   Design-focused content: {design_focused}/{len(results)} ({design_percentage:.0f}%)")
    
    if design_percentage >= 90:
        print(f"   ✅ PASS: {design_percentage:.0f}% are design-focused")
    else:
        print(f"   ⚠️  WARNING: Only {design_percentage:.0f}% are design-focused")
    
    # Close the service
    await unlimited_design_service.close()
    
    print(f"\n🎉 Testing completed!")
    
    # Final result
    if picsum_count == 0 and design_percentage >= 90:
        print(f"\n✅ ALL TESTS PASSED!")
        print(f"   - No random photos")
        print(f"   - All design-focused")
        return True
    else:
        print(f"\n❌ TESTS FAILED!")
        if picsum_count > 0:
            print(f"   - Found {picsum_count} random photos")
        if design_percentage < 90:
            print(f"   - Only {design_percentage:.0f}% design-focused")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_no_random_photos())
    sys.exit(0 if result else 1)