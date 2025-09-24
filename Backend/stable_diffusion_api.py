import os
import uuid
from typing import Optional

import requests
from dotenv import load_dotenv
import time

# Load environment variables from Backend/.env explicitly
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH)

HF_API_KEY = os.getenv("HF_API_KEY")
MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"
API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"


def _auth_headers() -> dict:
    if not HF_API_KEY:
        raise RuntimeError(
            "HF_API_KEY is not set. Please add it to Backend/.env as HF_API_KEY=..."
        )
    return {"Authorization": f"Bearer {HF_API_KEY}"}


def generate_image(prompt: str) -> bytes:
    """
    Sends prompt to Hugging Face Inference API and saves the generated image.

    Returns raw image bytes. Raises an error on failure.
    """
    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty")

    headers = _auth_headers()

    # Retry/poll if model is warming up (HF may return 503/202 during spin-up)
    max_attempts = 5
    delay_seconds = 5
    last_response = None
    for attempt in range(1, max_attempts + 1):
        response = requests.post(API_URL, headers=headers, json={"inputs": prompt}, timeout=120)
        last_response = response
        if response.status_code == 200:
            break
        if response.status_code in (202, 503):
            # Try to use provided estimated time if present
            try:
                info = response.json()
                est = info.get("estimated_time")
                if isinstance(est, (int, float)) and est > 0:
                    time.sleep(min(est, 10))
                else:
                    time.sleep(delay_seconds)
            except Exception:
                time.sleep(delay_seconds)
            continue
        # Any other error, stop and handle below
        break

    if last_response is None or last_response.status_code != 200:
        # Try to extract a helpful error message
        try:
            detail = last_response.json()
        except Exception:
            detail = last_response.text
        hint = ""
        if last_response is not None and last_response.status_code in (401, 403):
            hint = " (Check HF_API_KEY is valid and that you've accepted the model license)"
        elif last_response is not None and last_response.status_code == 404:
            hint = " (Check MODEL_ID is correct)"
        elif last_response is not None and last_response.status_code in (202, 503):
            hint = " (Model is warming up on Hugging Face. Try again in a few seconds.)"
        raise RuntimeError(f"Hugging Face API Error {getattr(last_response, 'status_code', 'unknown')}: {detail}{hint}")

    return response.content
