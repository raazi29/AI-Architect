from fastapi import APIRouter, HTTPException, UploadFile, File
import shutil
import os
import uuid
from database import calculate_image_hash, get_cached_vision_analysis, cache_vision_analysis, save_chat_history, get_chat_history, save_chat_session, get_chat_sessions
from vision_service import vision_service
from chat_service import chat_service
from typing import List, Dict, Any

# Create router for vision-related endpoints
vision_router = APIRouter()

@vision_router.post("/chat")
async def chat_with_ai(messages: List[Dict[str, str]]):
    """Chat with AI assistant using Groq API"""
    try:
        response = chat_service.chat_with_ai(messages)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

@vision_router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze an uploaded image using LLaMA 3.1 Vision"""
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = "./uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate a unique filename to avoid conflicts
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_location = os.path.join(upload_dir, unique_filename)
        
        # Save the uploaded file
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        # Calculate image hash for caching
        image_hash = calculate_image_hash(file_location)
        
        # Check if we have a cached analysis
        cached_result = await get_cached_vision_analysis(image_hash)
        if cached_result:
            # Clean up the uploaded file
            os.remove(file_location)
            return {"analysis": cached_result, "cached": True}
        
        # Perform vision analysis
        analysis_result = vision_service.analyze_image_with_fallback(file_location)
        
        # Cache the result
        await cache_vision_analysis(image_hash, analysis_result)
        
        # Clean up the uploaded file
        os.remove(file_location)
        
        return {"analysis": analysis_result, "cached": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@vision_router.post("/save-chat")
async def save_chat(data: Dict[str, Any]):
    """Save chat session and history"""
    try:
        session_id = data.get("session_id")
        title = data.get("title", f"Chat {session_id}")
        messages = data.get("messages", [])
        
        # Save session
        await save_chat_session(session_id, title)
        
        # Save history
        if messages:
            await save_chat_history(session_id, messages)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save chat: {str(e)}")

@vision_router.get("/chat-history/{session_id}")
async def load_chat_history(session_id: str):
    """Load chat history for a session"""
    try:
        messages = await get_chat_history(session_id)
        if messages is None:
            raise HTTPException(status_code=404, detail="Chat history not found")
        return {"messages": messages}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load chat history: {str(e)}")

@vision_router.get("/chat-sessions")
async def list_chat_sessions():
    """List recent chat sessions"""
    try:
        sessions = await get_chat_sessions()
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list chat sessions: {str(e)}")