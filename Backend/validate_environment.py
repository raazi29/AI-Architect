"""
Environment Validation Script
Run this before deployment to verify all required environment variables and services
"""
import os
import sys
from dotenv import load_dotenv
import asyncio
import httpx

# Load environment variables
load_dotenv()

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def check_env_var(var_name, required=True, service_name=""):
    value = os.getenv(var_name)
    service_text = f" ({service_name})" if service_name else ""
    
    if value and len(value) > 0:
        # Hide most of the key for security
        masked_value = value[:10] + "..." if len(value) > 10 else "***"
        print_success(f"{var_name}{service_text}: {masked_value}")
        return True
    else:
        if required:
            print_error(f"{var_name}{service_text}: NOT SET (REQUIRED)")
            return False
        else:
            print_warning(f"{var_name}{service_text}: NOT SET (Optional)")
            return True

async def test_service_endpoint(url, name):
    """Test if a service endpoint is accessible"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code < 500:
                print_success(f"{name}: Accessible (Status {response.status_code})")
                return True
            else:
                print_error(f"{name}: Server error (Status {response.status_code})")
                return False
    except Exception as e:
        print_error(f"{name}: Not accessible - {str(e)}")
        return False

def main():
    print_header("Environment Validation Check")
    
    all_checks_passed = True
    
    # 1. Check Critical Environment Variables
    print_header("Critical Environment Variables")
    
    critical_vars = [
        ("GROQ_API_KEY", "AI Chat & Vision"),
        ("HUGGINGFACE_API_KEY", "Image Generation"),
    ]
    
    for var_name, service in critical_vars:
        if not check_env_var(var_name, required=True, service_name=service):
            all_checks_passed = False
    
    # 2. Check Optional Environment Variables
    print_header("Optional Environment Variables")
    
    optional_vars = [
        ("OPENAI_API_KEY", "Fallback Image Generation"),
        ("PEXELS_API_KEY", "Design Images"),
        ("UNSPLASH_API_KEY", "Design Images"),
        ("PIXABAY_API_KEY", "Design Images"),
        ("GEOAPIFY_API_KEY", "Location Services"),
        ("ASTROLOGY_API_KEY", "Vastu Astrology"),
        ("TAVILY_API_KEY", "Search Services"),
    ]
    
    optional_working = 0
    for var_name, service in optional_vars:
        if check_env_var(var_name, required=False, service_name=service):
            optional_working += 1
    
    print(f"\n{Colors.BLUE}Optional services configured: {optional_working}/{len(optional_vars)}{Colors.END}")
    
    # 3. Check Python Dependencies
    print_header("Python Dependencies")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "httpx",
        "groq",
        "beautifulsoup4",
        "Pillow",
        "aiosqlite",
    ]
    
    deps_ok = True
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print_success(f"{package}: Installed")
        except ImportError:
            print_error(f"{package}: NOT INSTALLED")
            deps_ok = False
            all_checks_passed = False
    
    if not deps_ok:
        print(f"\n{Colors.RED}Install missing packages: pip install -r Backend/requirements.txt{Colors.END}")
    
    # 4. Check File Structure
    print_header("Project File Structure")
    
    critical_files = [
        "Backend/routes.py",
        "Backend/hybrid_service.py",
        "Backend/unlimited_design_service.py",
        "Backend/main.py",
        "Backend/requirements.txt",
        ".env",
        "package.json",
        "next.config.mjs",
    ]
    
    files_ok = True
    for file_path in critical_files:
        if os.path.exists(file_path):
            print_success(f"{file_path}: Exists")
        else:
            print_error(f"{file_path}: MISSING")
            files_ok = False
            all_checks_passed = False
    
    # 5. Summary
    print_header("Validation Summary")
    
    if all_checks_passed:
        print_success("All critical checks passed! ✓")
        print(f"\n{Colors.GREEN}{Colors.BOLD}Project is ready for deployment!{Colors.END}\n")
        return 0
    else:
        print_error("Some critical checks failed!")
        print(f"\n{Colors.RED}{Colors.BOLD}Please fix the issues above before deploying.{Colors.END}\n")
        
        print(f"{Colors.YELLOW}Next steps:{Colors.END}")
        print("1. Set missing environment variables in .env file")
        print("2. Install missing Python packages")
        print("3. Run this script again to verify")
        print()
        return 1

if __name__ == "__main__":
    sys.exit(main())
