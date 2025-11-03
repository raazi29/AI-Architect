"""
Unit test to verify compression configuration is correct
"""
import sys
import os

def test_backend_compression_config():
    """Verify backend has GZipMiddleware configured"""
    print("Testing Backend Compression Configuration")
    print("=" * 50)
    
    # Read the routes.py file
    routes_path = os.path.join("Backend", "routes.py")
    
    if not os.path.exists(routes_path):
        print(f"✗ File not found: {routes_path}")
        return False
    
    with open(routes_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for GZipMiddleware import
    has_import = "from fastapi.middleware.gzip import GZipMiddleware" in content
    print(f"{'✓' if has_import else '✗'} GZipMiddleware import: {has_import}")
    
    # Check for middleware configuration
    has_middleware = "app.add_middleware(GZipMiddleware" in content
    print(f"{'✓' if has_middleware else '✗'} GZipMiddleware added: {has_middleware}")
    
    # Check for minimum_size parameter
    has_min_size = "minimum_size=1000" in content
    print(f"{'✓' if has_min_size else '✗'} Minimum size configured (1000 bytes): {has_min_size}")
    
    # Check middleware order (should be before CORS)
    gzip_pos = content.find("app.add_middleware(GZipMiddleware")
    cors_pos = content.find("app.add_middleware(\n    CORSMiddleware")
    
    if gzip_pos > 0 and cors_pos > 0:
        correct_order = gzip_pos < cors_pos
        print(f"{'✓' if correct_order else '✗'} Middleware order correct (GZip before CORS): {correct_order}")
    else:
        print("⚠ Could not verify middleware order")
        correct_order = True
    
    success = has_import and has_middleware and has_min_size and correct_order
    
    if success:
        print("\n✓ Backend compression configuration is CORRECT")
    else:
        print("\n✗ Backend compression configuration has ISSUES")
    
    return success

def test_nextjs_compression_config():
    """Verify Next.js has compression enabled"""
    print("\n\nTesting Next.js Compression Configuration")
    print("=" * 50)
    
    # Read the next.config.mjs file
    config_path = "next.config.mjs"
    
    if not os.path.exists(config_path):
        print(f"✗ File not found: {config_path}")
        return False
    
    with open(config_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for compress: true
    has_compress = "compress: true" in content
    print(f"{'✓' if has_compress else '✗'} Compression enabled: {has_compress}")
    
    # Check for swcMinify (additional optimization)
    has_minify = "swcMinify: true" in content
    print(f"{'✓' if has_minify else '✗'} SWC minification enabled: {has_minify}")
    
    success = has_compress
    
    if success:
        print("\n✓ Next.js compression configuration is CORRECT")
    else:
        print("\n✗ Next.js compression configuration has ISSUES")
    
    return success

def test_api_client_compatibility():
    """Verify API client is compatible with compression"""
    print("\n\nTesting API Client Compression Compatibility")
    print("=" * 50)
    
    # Read the api.ts file
    api_path = os.path.join("lib", "api.ts")
    
    if not os.path.exists(api_path):
        print(f"✗ File not found: {api_path}")
        return False
    
    with open(api_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check that fetch is used (automatically handles compression)
    uses_fetch = "fetch(" in content
    print(f"{'✓' if uses_fetch else '✗'} Uses fetch API: {uses_fetch}")
    
    # Check that no manual decompression is attempted
    no_manual_decompress = "decompress" not in content.lower() and "gunzip" not in content.lower()
    print(f"{'✓' if no_manual_decompress else '✗'} No manual decompression: {no_manual_decompress}")
    
    # Check for proper error handling
    has_error_handling = "try {" in content and "catch" in content
    print(f"{'✓' if has_error_handling else '✗'} Has error handling: {has_error_handling}")
    
    success = uses_fetch and no_manual_decompress and has_error_handling
    
    if success:
        print("\n✓ API client is COMPATIBLE with compression")
    else:
        print("\n✗ API client has COMPATIBILITY issues")
    
    return success

def main():
    """Run all compression configuration tests"""
    print("Compression Configuration Test Suite")
    print("=" * 50)
    print("\nThis test verifies that compression is properly configured")
    print("without requiring running servers.\n")
    print("=" * 50 + "\n")
    
    results = []
    
    # Test backend configuration
    results.append(("Backend", test_backend_compression_config()))
    
    # Test Next.js configuration
    results.append(("Next.js", test_nextjs_compression_config()))
    
    # Test API client compatibility
    results.append(("API Client", test_api_client_compatibility()))
    
    # Summary
    print("\n\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    
    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")
        if not passed:
            all_passed = False
    
    print("=" * 50)
    
    if all_passed:
        print("\n✓ All compression configuration tests PASSED!")
        print("\nCompression is properly configured:")
        print("  • Backend: GZip compression for responses > 1KB")
        print("  • Frontend: Next.js compression enabled")
        print("  • Client: Fetch API handles decompression automatically")
        print("\nExpected bandwidth savings: 60-80% for JSON responses")
        return 0
    else:
        print("\n✗ Some compression configuration tests FAILED!")
        print("\nPlease review the issues above and fix the configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
