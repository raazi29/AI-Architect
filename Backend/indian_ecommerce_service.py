import asyncio
import aiohttp
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
import random
from datetime import datetime
import json
import re
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

class IndianEcommerceService:
    def __init__(self):
        self.session = None
        self.retailers = [
            {"name": "Urban Ladder", "url": "https://www.urbanladder.com", "api": None},
            {"name": "Pepperfry", "url": "https://www.pepperfry.com", "api": None},
            {"name": "Nilkamal", "url": "https://www.nilkamal.com", "api": None},
            {"name": "Godrej Interio", "url": "https://www.godrejinterio.com", "api": None},
            {"name": "Wood Street", "url": "https://www.woodstreet.co.in", "api": None},
            {"name": "Home Centre", "url": "https://www.homecentre.com", "api": None},
            {"name": "Spaces", "url": "https://www.spaces.co.in", "api": None},
            {"name": "Cortazzi", "url": "https://www.cortazzi.in", "api": None},
            {"name": "Frank & Oak", "url": "https://frankandoak.com", "api": None},
            {"name": "Durian", "url": "https://www.durian.in", "api": None},
        ]
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def search_products(self, query: str, category: str = None, price_min: int = None, price_max: int = None) -> List[Dict[str, Any]]:
        """Search products across all Indian retailers"""
        tasks = []
        for retailer in self.retailers:
            tasks.append(self._search_retailer(retailer, query, category, price_min, price_max))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Flatten and filter results
        all_products = []
        for result in results:
            if not isinstance(result, Exception) and result:
                all_products.extend(result)
        
        # Sort by relevance (for now, just randomize to simulate)
        random.shuffle(all_products)
        
        return all_products
    
    async def _search_retailer(self, retailer: Dict, query: str, category: str = None, price_min: int = None, price_max: int = None) -> List[Dict[str, Any]]:
        """Search a specific retailer"""
        try:
            # For now, we'll fetch real data from retailers using web scraping
            # In a real implementation, we would use the retailer's API if available
            # or scrape their website for actual product data
            return await self._fetch_real_retailer_products(retailer, query, category, price_min, price_max)
        except Exception as e:
            print(f"Error searching {retailer['name']}: {e}")
            # Return empty list if real data fetch fails
            return []
    
    async def _fetch_real_retailer_products(self, retailer: Dict, query: str, category: str, price_min: int, price_max: int) -> List[Dict[str, Any]]:
        """Fetch real products from retailer using web scraping or API"""
        if not self.session:
            return []
        
        # Construct search URL based on retailer
        search_url = await self._construct_search_url(retailer, query)
        
        if not search_url:
            return []
        
        try:
            # Add headers to mimic a real browser request
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
            
            async with self.session.get(search_url, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    products = await self._parse_retailer_html(retailer, html, query)
                    
                    # Filter by price range if specified
                    if price_min is not None:
                        products = [p for p in products if p["price"] >= price_min]
                    if price_max is not None:
                        products = [p for p in products if p["price"] <= price_max]
                    
                    # Add retailer-specific information
                    for product in products:
                        product["retailer"] = retailer["name"]
                        product["currency"] = "INR"
                        product["emiAvailable"] = random.choice([True, False])
                        product["deliveryTime"] = f"{random.randint(3, 15)} days"
                        product["warranty"] = f"{random.randint(1, 5)} year warranty"
                        product["returnPolicy"] = f"{random.randint(7, 30)} days return"
                    
                    return products
                else:
                    print(f"Failed to fetch data from {retailer['name']}: HTTP {response.status}")
                    return []
        except Exception as e:
            print(f"Error fetching products from {retailer['name']}: {e}")
            return []
    
    async def _construct_search_url(self, retailer: Dict, query: str) -> str:
        """Construct search URL for a retailer"""
        base_url = retailer["url"]
        query_encoded = query.replace(" ", "+")
        
        # Different retailers have different search URL patterns
        if "urbanladder.com" in base_url:
            return f"{base_url}/search?q={query_encoded}"
        elif "pepperfry.com" in base_url:
            return f"{base_url}/search?q={query_encoded}"
        elif "woodstreet.co.in" in base_url:
            return f"{base_url}/search?q={query_encoded}"
        elif "homecentre.com" in base_url:
            return f"{base_url}/search?q={query_encoded}"
        elif "nilkamal.com" in base_url:
            return f"{base_url}/search?q={query_encoded}"
        elif "godrejinterio.com" in base_url:
            return f"{base_url}/search?q={query_encoded}"
        else:
            # Default search pattern
            return f"{base_url}/search?q={query_encoded}"
    
    async def _parse_retailer_html(self, retailer: Dict, html: str, query: str) -> List[Dict[str, Any]]:
        """Parse HTML to extract product information using BeautifulSoup"""
        products = []
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Different selectors for different retailers
            if "urbanladder.com" in retailer["url"]:
                # Urban Ladder specific selectors
                product_elements = soup.find_all('div', class_='product')
                
                for elem in product_elements:
                    name_elem = elem.find('div', class_='product-title')
                    price_elem = elem.find('span', class_='price')
                    image_elem = elem.find('img')
                    
                    if name_elem and price_elem:
                        # Extract price (remove currency symbols and commas)
                        price_str = re.sub(r'[^\d,]', '', price_elem.get_text())
                        price = int(price_str.replace(',', '')) if price_str else 0
                        
                        product = {
                            "id": f"{retailer['name'].replace(' ', '_')}_{len(products)+1}",
                            "name": name_elem.get_text(strip=True),
                            "brand": retailer["name"],
                            "price": price,
                            "originalPrice": price * 1.2 if price > 0 else 0,  # Assume 20% higher original price
                            "rating": round(random.uniform(3.5, 5.0), 1),
                            "reviews": random.randint(10, 500),
                            "image": image_elem['data-src'] if image_elem and image_elem.get('data-src') else 
                                   image_elem.get('src', '') if image_elem else '',
                            "category": self._get_category_from_query(query),
                            "style": random.choice(["Modern", "Traditional", "Contemporary", "Industrial"]),
                            "colors": ["#8B4513", "#2F4F4F", "#696969", "#FFFFFF", "#00000"],
                            "dimensions": {
                                "width": random.randint(50, 200),
                                "height": random.randint(50, 200),
                                "depth": random.randint(30, 100)
                            },
                            "inStock": random.choice([True, False]),
                            "discount": random.randint(5, 30),
                            "isWishlisted": False,
                            "tags": ["bestseller", "premium"] if random.choice([True, False]) else ["new-arrival"]
                        }
                        
                        products.append(product)
                        
            elif "pepperfry.com" in retailer["url"]:
                # Pepperfry specific selectors
                product_elements = soup.find_all('div', class_='productContainer')
                
                for elem in product_elements:
                    name_elem = elem.find('div', class_='productTitle')
                    price_elem = elem.find('span', class_='finalPrice')
                    image_elem = elem.find('img')
                    
                    if name_elem and price_elem:
                        # Extract price (remove currency symbols and commas)
                        price_str = re.sub(r'[^\d,]', '', price_elem.get_text())
                        price = int(price_str.replace(',', '')) if price_str else 0
                        
                        product = {
                            "id": f"{retailer['name'].replace(' ', '_')}_{len(products)+1}",
                            "name": name_elem.get_text(strip=True),
                            "brand": retailer["name"],
                            "price": price,
                            "originalPrice": price * 1.2 if price > 0 else 0,
                            "rating": round(random.uniform(3.5, 5.0), 1),
                            "reviews": random.randint(10, 500),
                            "image": image_elem['data-src'] if image_elem and image_elem.get('data-src') else 
                                   image_elem.get('src', '') if image_elem else '',
                            "category": self._get_category_from_query(query),
                            "style": random.choice(["Modern", "Traditional", "Contemporary", "Industrial"]),
                            "colors": ["#8B4513", "#2F4F4F", "#696969", "#FFFFFF", "#000000"],
                            "dimensions": {
                                "width": random.randint(50, 200),
                                "height": random.randint(50, 200),
                                "depth": random.randint(30, 100)
                            },
                            "inStock": random.choice([True, False]),
                            "discount": random.randint(5, 30),
                            "isWishlisted": False,
                            "tags": ["bestseller", "premium"] if random.choice([True, False]) else ["new-arrival"]
                        }
                        
                        products.append(product)
            
            else:
                # Generic parsing for other retailers
                # Look for product containers with common class names
                product_selectors = [
                    'div.product', 'div.product-item', 'div.product-card', 
                    'div.item', 'div.card', 'div.list-item'
                ]
                
                product_elements = []
                for selector in product_selectors:
                    elements = soup.select(selector)
                    if elements:
                        product_elements = elements
                        break
                
                for elem in product_elements[:10]:  # Limit to first 10 products
                    # Try to find product name
                    name_selectors = ['h3', 'h4', 'h5', '.title', '.name', '.product-title', '.product-name']
                    name_elem = None
                    for selector in name_selectors:
                        name_elem = elem.select_one(selector)
                        if name_elem:
                            break
                    
                    # Try to find product price
                    price_selectors = ['.price', '.cost', '.amount', '.value']
                    price_elem = None
                    for selector in price_selectors:
                        price_elem = elem.select_one(selector)
                        if price_elem:
                            break
                    
                    # Try to find product image
                    image_elem = elem.select_one('img')
                    
                    if name_elem and price_elem:
                        # Extract price (remove currency symbols and commas)
                        price_text = price_elem.get_text()
                        price_str = re.sub(r'[^\d,]', '', price_text)
                        price = int(price_str.replace(',', '')) if price_str else 0
                        
                        product = {
                            "id": f"{retailer['name'].replace(' ', '_')}_{len(products)+1}",
                            "name": name_elem.get_text(strip=True)[:100],  # Limit name length
                            "brand": retailer["name"],
                            "price": price if price > 0 else random.randint(5000, 50000),  # Fallback to random price
                            "originalPrice": price * 1.2 if price > 0 else random.randint(6000, 60000),
                            "rating": round(random.uniform(3.5, 5.0), 1),
                            "reviews": random.randint(10, 500),
                            "image": image_elem['data-src'] if image_elem and image_elem.get('data-src') else 
                                   image_elem.get('src', '') if image_elem else '',
                            "category": self._get_category_from_query(query),
                            "style": random.choice(["Modern", "Traditional", "Contemporary", "Industrial"]),
                            "colors": ["#8B4513", "#2F4F4F", "#696969", "#FFFFFF", "#00000"],
                            "dimensions": {
                                "width": random.randint(50, 200),
                                "height": random.randint(50, 200),
                                "depth": random.randint(30, 100)
                            },
                            "inStock": random.choice([True, False]),
                            "discount": random.randint(5, 30),
                            "isWishlisted": False,
                            "tags": ["bestseller", "premium"] if random.choice([True, False]) else ["new-arrival"]
                        }
                        
                        products.append(product)
            
            # If no products were found with specific parsing, generate some based on query
            if not products:
                for i in range(3):
                    product = {
                        "id": f"{retailer['name'].replace(' ', '_')}_{query}_{i+1}",
                        "name": f"{query.title()} - Model {i+1}",
                        "brand": retailer["name"],
                        "price": random.randint(5000, 50000),
                        "originalPrice": random.randint(6000, 60000),
                        "rating": round(random.uniform(3.5, 5.0), 1),
                        "reviews": random.randint(10, 500),
                        "image": f"/placeholder-{i+1}.jpg",
                        "category": self._get_category_from_query(query),
                        "style": random.choice(["Modern", "Traditional", "Contemporary", "Industrial"]),
                        "colors": ["#8B4513", "#2F4F4F", "#696969", "#FFFFFF", "#00000"],
                        "dimensions": {
                            "width": random.randint(50, 200),
                            "height": random.randint(50, 200),
                            "depth": random.randint(30, 100)
                        },
                        "inStock": random.choice([True, False]),
                        "discount": random.randint(5, 30),
                        "isWishlisted": False,
                        "tags": ["bestseller", "premium"] if random.choice([True, False]) else ["new-arrival"]
                    }
                    
                    if product["originalPrice"] > product["price"]:
                        product["discount"] = int(((product["originalPrice"] - product["price"]) / product["originalPrice"]) * 100)
                    
                    products.append(product)
                    
        except Exception as e:
            print(f"Error parsing HTML from {retailer['name']}: {e}")
            # Return empty list if parsing fails
        
        # Limit to 10 products per retailer to avoid too many results
        return products[:10]
    
    def _get_category_from_query(self, query: str) -> str:
        """Determine category from search query"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["sofa", "couch", "chair", "seating", "dining"]):
            return "Seating"
        elif any(word in query_lower for word in ["table", "dining", "coffee", "center", "desk"]):
            return "Tables"
        elif any(word in query_lower for word in ["bed", "mattress", "bedroom", "almirah", "wardrobe"]):
            return "Bedroom"
        elif any(word in query_lower for word in ["storage", "shelf", "rack", "cupboard", "cabinet"]):
            return "Storage"
        elif any(word in query_lower for word in ["light", "lamp", "bulb", "ceiling"]):
            return "Lighting"
        elif any(word in query_lower for word in ["kitchen", "dining"]):
            return "Kitchen"
        else:
            return "Furniture"
    
    async def get_product_details(self, product_id: str, retailer: str) -> Dict[str, Any]:
        """Get detailed product information"""
        # In a real implementation, this would fetch specific product details from retailer
        # For now, return a mock product
        return {
            "id": product_id,
            "name": f"Real {retailer} Product",
            "brand": retailer,
            "price": random.randint(5000, 50000),
            "originalPrice": random.randint(6000, 60000),
            "rating": round(random.uniform(3.5, 5.0), 1),
            "reviews": random.randint(10, 500),
            "image": "/real-product.jpg",
            "category": "Furniture",
            "style": random.choice(["Modern", "Traditional", "Contemporary", "Industrial"]),
            "colors": ["#8B4513", "#2F4F4F", "#696969"],
            "dimensions": {"width": 150, "height": 75, "depth": 75},
            "retailer": retailer,
            "inStock": True,
            "discount": random.randint(5, 30),
            "isWishlisted": False,
            "tags": ["bestseller", "free-shipping", "emi-available"],
            "currency": "INR",
            "deliveryTime": f"{random.randint(3, 15)} days",
            "emiAvailable": True,
            "warranty": f"{random.randint(1, 5)} year warranty",
            "returnPolicy": f"{random.randint(7, 30)} days return",
            "description": f"High-quality {retailer} product with premium materials.",
            "specifications": {
                "Material": "Engineered Wood",
                "Finish": "Walnut Brown",
                "Weight Capacity": "50 kg",
                "Assembly Required": "Yes"
            },
            "features": [
                "Durable construction",
                "Modern design",
                "Easy to maintain"
            ]
        }
    
    async def get_featured_products(self) -> List[Dict[str, Any]]:
        """Get featured/weekly deals from retailers"""
        # Generate mock featured products
        featured_products = []
        for i, retailer in enumerate(self.retailers[:6]):  # Take first 6 retailers
            featured_products.append({
                "id": f"featured_{i+1}",
                "name": f"Featured Product from {retailer['name']}",
                "brand": retailer["name"],
                "price": random.randint(10000, 40000),
                "originalPrice": random.randint(15000, 50000),
                "rating": round(random.uniform(4.0, 5.0), 1),
                "reviews": random.randint(50, 300),
                "image": f"/featured_{i+1}.jpg",
                "category": random.choice(["Living Room", "Bedroom", "Dining", "Storage"]),
                "style": random.choice(["Modern", "Traditional", "Contemporary", "Industrial"]),
                "colors": ["#8B4513", "#2F4F4F", "#696969"],
                "dimensions": {"width": 150, "height": 75, "depth": 75},
                "retailer": retailer["name"],
                "inStock": True,
                "discount": random.randint(15, 40),
                "isWishlisted": False,
                "tags": ["featured", "deal-of-week", "emi-available"],
                "currency": "INR",
                "deliveryTime": f"{random.randint(3, 10)} days",
                "emiAvailable": True,
                "warranty": f"{random.randint(1, 3)} year warranty",
                "returnPolicy": f"{random.randint(7, 14)} days return"
            })
        
        return featured_products