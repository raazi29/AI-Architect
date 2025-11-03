import asyncio
import sys
import os

# Add Backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Backend'))

from unlimited_design_service import unlimited_design_service

async def test_images():
    try:
        results = await unlimited_design_service.search_images('interior design', 1, 3)
        print(f'Generated {len(results)} images')
        for i, img in enumerate(results):
            print(f'Image {i+1}:')
            print(f'  ID: {img["id"]}')
            print(f'  URL: {img["url"]}')
            print(f'  Title: {img["title"]}')
            print(f'  Photographer: {img["photographer"]}')
            print()
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_images())
