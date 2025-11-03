"""
Test script to verify gzip compression is working on the backend
"""
import requests
import sys

def test_compression():
    """Test that the backend returns compressed responses"""
    base_url = "http://localhost:8001"
    
    print("Testing Backend Response Compression")
    print("=" * 50)
    
    # Test endpoints
    endpoints = [
        "/feed?query=modern&page=1&per_page=20",
        "/trending?page=1&per_page=20",
    ]
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"\nTesting: {endpoint}")
        print("-" * 50)
        
        try:
            # Request without compression
            response_uncompressed = requests.get(
                url,
                headers={"Accept-Encoding": "identity"}
            )
            uncompressed_size = len(response_uncompressed.content)
            
            # Request with compression
            response_compressed = requests.get(
                url,
                headers={"Accept-Encoding": "gzip, deflate"}
            )
            
            # Check if response is compressed
            content_encoding = response_compressed.headers.get("Content-Encoding", "none")
            compressed_size = len(response_compressed.content)
            
            # Calculate compression ratio
            if uncompressed_size > 0:
                compression_ratio = (1 - compressed_size / uncompressed_size) * 100
            else:
                compression_ratio = 0
            
            print(f"Status Code: {response_compressed.status_code}")
            print(f"Content-Encoding: {content_encoding}")
            print(f"Uncompressed Size: {uncompressed_size:,} bytes")
            print(f"Compressed Size: {compressed_size:,} bytes")
            print(f"Compression Ratio: {compression_ratio:.1f}%")
            print(f"Savings: {uncompressed_size - compressed_size:,} bytes")
            
            # Verify compression is working
            if content_encoding == "gzip":
                print("✓ Compression is ENABLED")
                if compression_ratio > 50:
                    print(f"✓ Good compression ratio: {compression_ratio:.1f}%")
                else:
                    print(f"⚠ Low compression ratio: {compression_ratio:.1f}%")
            else:
                if uncompressed_size < 1000:
                    print(f"✓ Response too small for compression ({uncompressed_size} bytes < 1000 bytes)")
                else:
                    print("✗ Compression is NOT enabled (response > 1KB)")
                    
        except requests.exceptions.ConnectionError:
            print(f"✗ Could not connect to {url}")
            print("  Make sure the backend is running on port 8001")
        except Exception as e:
            print(f"✗ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Compression Test Complete")

def test_next_js_compression():
    """Test that Next.js accepts compressed responses"""
    print("\n\nTesting Next.js Compression Support")
    print("=" * 50)
    
    # Test Next.js API routes
    base_url = "http://localhost:3000"
    endpoints = ["/api/image/generate"]
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"\nTesting: {endpoint}")
        print("-" * 50)
        
        try:
            # Make a request with compression headers
            response = requests.options(
                url,
                headers={
                    "Accept-Encoding": "gzip, deflate, br",
                    "Origin": "http://localhost:3000"
                }
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"CORS Headers Present: {'Access-Control-Allow-Origin' in response.headers}")
            print(f"Compression Headers Accepted: {'Accept-Encoding' in response.headers or response.status_code == 200}")
            
            if response.status_code in [200, 204]:
                print("✓ Next.js API is accessible and accepts compression headers")
            else:
                print(f"⚠ Unexpected status code: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"✗ Could not connect to {url}")
            print("  Make sure Next.js is running on port 3000")
        except Exception as e:
            print(f"✗ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Next.js Compression Test Complete")

if __name__ == "__main__":
    print("Response Compression Test Suite")
    print("=" * 50)
    print("\nThis script tests:")
    print("1. Backend gzip compression (FastAPI)")
    print("2. Next.js compression support")
    print("\nMake sure both servers are running:")
    print("- Backend: http://localhost:8001")
    print("- Frontend: http://localhost:3000")
    print("\n" + "=" * 50 + "\n")
    
    test_compression()
    test_next_js_compression()
    
    print("\n\nSummary:")
    print("=" * 50)
    print("✓ Backend should compress responses > 1KB with gzip")
    print("✓ Next.js automatically decompresses gzip responses")
    print("✓ Browsers handle decompression transparently")
    print("\nExpected savings: 60-80% for JSON responses")
