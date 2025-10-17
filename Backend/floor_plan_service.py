import requests
import os
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_TOKEN = os.environ.get("HUGGING_FACE_API_TOKEN")

# Debug: Print token status (without revealing the actual token)
logger.info(f"HUGGING_FACE_API_TOKEN loaded: {'Yes' if API_TOKEN else 'No'}")
if API_TOKEN:
    logger.info(f"Token length: {len(API_TOKEN)} characters")
    logger.info(f"Token starts with: {API_TOKEN[:10]}...")

MODELS = {
    "default": "naver/sdxl-floorplan",
    "maria26": "maria26/Floor_Plan_LoRA",
    "envy": "e-n-v-y/envy-floorplans-xl-01",
    "lora4iabd": "Lora-4-IABD-2/floor_plans_a_v1.safetensors",
    # Alternative working models
    "stability": "stabilityai/stable-diffusion-xl-base-1.0",
    "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
    "floorplan-sdxl": "johndpope/Floorplan-SDXL-v1",
    "floorplan-lora": "h94/IP-Adapter-FaceID/ip-adapter-faceid_sdxl_lora"
}

def generate_floor_plan(prompt: str, model_name: str = "default"):
    if not API_TOKEN:
        logger.error("HUGGING_FACE_API_TOKEN environment variable not set")
        logger.error("Please check that:")
        logger.error("1. The .env file exists in the backend directory")
        logger.error("2. HUGGING_FACE_API_TOKEN is set in the .env file")
        logger.error("3. The server was restarted after adding the token")
        raise ValueError("HUGGING_FACE_API_TOKEN environment variable not set")

    # Get model URL - try multiple models in order of preference
    model_path = MODELS.get(model_name, MODELS["default"])

    # If the requested model is not available, try alternatives
    if model_name not in ["default", "stability", "sdxl"]:
        logger.info(f"Requested model {model_name} may not be available, trying alternatives...")

    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    payload = {"inputs": prompt}

    # List of models to try in order
    models_to_try = [
        MODELS.get("stability", "stabilityai/stable-diffusion-xl-base-1.0"),  # Most reliable
        MODELS.get("default", "naver/sdxl-floorplan"),
        MODELS.get("floorplan-sdxl", "johndpope/Floorplan-SDXL-v1"),
        MODELS.get("maria26", "maria26/Floor_Plan_LoRA"),
        "runwayml/stable-diffusion-v1-5",  # Fallback
        "CompVis/stable-diffusion-v1-4",   # Last resort
    ]

    last_error = None

    for attempt_model in models_to_try:
        try:
            api_url = f"https://api-inference.huggingface.co/models/{attempt_model}"
            logger.info(f"Trying model: {attempt_model}")

            # Enhanced architectural floor plan prompts
            test_payload = payload.copy()
            if "floorplan" in attempt_model.lower() or "maria26" in attempt_model:
                test_payload["inputs"] = f"Professional architectural floor plan: {prompt}, technical drawing, architectural standards, accurate dimensions, proper scale, clear room labels, door and window symbols, furniture layout, traffic flow, building code compliance"
            elif "stable-diffusion" in attempt_model:
                test_payload["inputs"] = f"Professional architectural floor plan diagram: {prompt}, clean architectural lines, black and white technical drawing, accurate room proportions, proper door and window placement, furniture symbols, dimension lines, architectural annotations, professional CAD style, building standards compliance"
            
            # Add enhanced parameters for better quality
            test_payload["parameters"] = {
                "num_inference_steps": 50,
                "guidance_scale": 9.0,
                "width": 1024,
                "height": 1024,
                "negative_prompt": "blurry, low quality, distorted, wrong proportions, unrealistic dimensions, poor architectural standards, messy lines, unprofessional, cartoon style, colored, decorative elements, furniture details, textures, shadows, 3D perspective, perspective view, isometric view"
            }

            response = requests.post(api_url, headers=headers, json=test_payload, timeout=60)
            logger.info(f"Model {attempt_model}: HTTP {response.status_code}")

            if response.status_code == 200:
                logger.info(f"✅ Success with model: {attempt_model}")
                return response.content
            elif response.status_code == 503:
                logger.info(f"⏳ Model {attempt_model} is loading, trying next...")
                continue
            elif response.status_code == 404:
                logger.info(f"❌ Model {attempt_model} not found, trying next...")
                continue
            else:
                error_content = response.text[:200]
                logger.info(f"❌ Model {attempt_model} returned {response.status_code}: {error_content}")
                continue

        except requests.exceptions.Timeout:
            logger.info(f"⏰ Model {attempt_model} timed out, trying next...")
            continue
        except Exception as e:
            logger.info(f"❌ Error with model {attempt_model}: {str(e)[:100]}")
            last_error = e
            continue

    # If all models failed, raise the last error
    error_msg = f"All models failed. Last error: {last_error}" if last_error else "All available models returned errors or timeouts"
    logger.error(error_msg)
    raise Exception(f"Floor plan generation failed: {error_msg}")
