#!/usr/bin/env python3
"""
Test script for the enhanced design scraper
"""
import asyncio
import sys
import os

# Add the Backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_design_scraper import enhanced_design_scraper

async def test_enhanced_scraper():
    """Test the enhanced design scraper functionality"""
    print("Testing Enhanced Design Scraper...")

    # Test basic search
    print("\n1. Testing basic search for 'modern kitchen'...")
    try:
        results = await enhanced_design_scraper.search_design_images("modern kitchen", page=1, per_page=5)
        print(f"Found {len(results)} results")
        if results:
            print(f"Sample result: {results[0]['title']} - {results[0]['image'][:50]}...")
    except Exception as e:
        print(f"Error in basic search: {e}")

    # Test trending
    print("\n2. Testing trending designs...")
    try:
        trending = await enhanced_design_scraper.get_trending_designs(page=1, per_page=3)
        print(f"Found {len(trending)} trending results")
        if trending:
            print(f"Sample trending: {trending[0]['title']}")
    except Exception as e:
        print(f"Error in trending: {e}")

    # Test multiple sites
    print("\n3. Testing multi-site search...")
    try:
        multi_results = await enhanced_design_scraper.search_design_images(
            "scandinavian living room",
            page=1,
            per_page=3,
            sites=["unsplash", "houzz"]
        )
        print(f"Found {len(multi_results)} multi-site results")
    except Exception as e:
        print(f"Error in multi-site search: {e}")

    print("\nTest completed!")

    # Close the scraper
    await enhanced_design_scraper.close()

if __name__ == "__main__":
    asyncio.run(test_enhanced_scraper())
