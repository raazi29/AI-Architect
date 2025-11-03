"""
Test script for image categorization service
"""
import asyncio
from Backend.image_categorization_service import image_categorization_service

def test_categorization():
    print("Testing Image Categorization Service...")
    
    # Test cases for valid design images
    valid_images = [
        {
            "title": "Modern Living Room Design",
            "alt": "Contemporary living room with minimalist furniture",
            "description": "A beautifully designed modern living room featuring Scandinavian style furniture and neutral color palette",
            "tags": ["interior", "design", "furniture"]
        },
        {
            "title": "Kitchen Design with Island",
            "alt": "Modern kitchen with large island and marble countertops",
            "description": "Luxury kitchen design featuring marble countertops, wooden cabinets and pendant lighting",
            "tags": ["kitchen", "interior", "design"]
        },
        {
            "title": "Minimalist Bedroom Decor",
            "alt": "Simple bedroom with clean lines and neutral tones",
            "description": "Minimalist bedroom design with white bedding and wooden floors",
            "tags": ["bedroom", "minimalist", "interior"]
        },
        {
            "title": "Office Interior Design",
            "alt": "Modern home office with ergonomic desk and lighting",
            "description": "Professional home office design with plenty of natural light",
            "tags": ["office", "workspace", "interior"]
        },
        {
            "title": "Bathroom with Marble Finish",
            "alt": "Luxury bathroom with marble walls and modern fixtures",
            "description": "Contemporary bathroom design featuring marble finishes and smart lighting",
            "tags": ["bathroom", "luxury", "interior"]
        }
    ]
    
    # Test cases for invalid images (should be filtered out)
    invalid_images = [
        {
            "title": "Family Portrait at Beach",
            "alt": "Happy family at the beach with umbrella",
            "description": "Family vacation photo at sunny beach",
            "tags": ["family", "vacation", "beach"]
        },
        {
            "title": "Delicious Pizza on Table",
            "alt": "Italian pizza with mushrooms and cheese",
            "description": "Restaurant meal photography of gourmet pizza",
            "tags": ["food", "pizza", "restaurant"]
        },
        {
            "title": "Car Racing on Track",
            "alt": "Red sports car racing on track",
            "description": "Professional car racing during competition",
            "tags": ["car", "racing", "sports"]
        },
        {
            "title": "Mountain Landscape at Sunset",
            "alt": "Beautiful mountains with sunset background",
            "description": "Nature photography of mountains and sunset",
            "tags": ["nature", "mountains", "landscape"]
        }
    ]
    
    print("\n--- Testing VALID design images ---")
    for i, img in enumerate(valid_images):
        is_valid = image_categorization_service.is_valid_design_image(img)
        category = image_categorization_service.categorize_image(img)
        print(f"Test {i+1}: {img['title'][:30]}... -> Valid: {is_valid}, Category: {category}")
    
    print("\n--- Testing INVALID images (should be filtered out) ---")
    for i, img in enumerate(invalid_images):
        is_valid = image_categorization_service.is_valid_design_image(img)
        category = image_categorization_service.categorize_image(img)
        print(f"Test {i+1}: {img['title'][:30]}... -> Valid: {is_valid}, Category: {category}")
    
    print("\n--- Testing additional edge cases ---")
    
    # Test with empty data
    empty_img = {"title": "", "alt": "", "description": "", "tags": []}
    is_valid = image_categorization_service.is_valid_design_image(empty_img)
    print(f"Empty data test -> Valid: {is_valid}")
    
    # Test with non-design term
    non_design_img = {"title": "Car Racing Event", "alt": "Sports car on track", "description": "Racing", "tags": ["car", "racing"]}
    is_valid = image_categorization_service.is_valid_design_image(non_design_img)
    print(f"Non-design term test -> Valid: {is_valid}")
    
    # Test with design term in URL
    url_img = {"title": "Random Image", "alt": "Image from unknown source", "description": "", "tags": [], "image": "https://example.com/kitchen-design-modern-2023.jpg"}
    is_valid = image_categorization_service.is_valid_design_image(url_img)
    print(f"URL with design term test -> Valid: {is_valid}")
    
    print("\nTest completed!")

if __name__ == "__main__":
    test_categorization()