#!/usr/bin/env python3
"""
Simple test script to check if FastAPI server can start
"""
import asyncio
import sys
import os

# Add Backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Backend'))

try:
    from routes import app
    print("✅ Successfully imported FastAPI app")

    # Test a simple route
    from fastapi.testclient import TestClient
    client = TestClient(app)

    # Test health endpoint
    response = client.get("/health")
    print(f"✅ Health endpoint: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {response.json()}")

    # Test feed endpoint
    response = client.get("/feed?page=1&per_page=1&query=test")
    print(f"✅ Feed endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Results: {len(data.get('results', []))}")

    print("✅ All tests passed!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
