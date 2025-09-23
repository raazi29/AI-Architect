import os
from groq import Groq
from typing import List, Dict, Any
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        """Initialize the ChatService with Groq client"""
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=self.groq_api_key)
        
        # Define the system prompt for the interior design AI assistant
        self.system_prompt = {
            "role": "system",
            "content": """
            You are an expert interior design AI assistant. Your role is to help users with:
            1. Room design and layout planning
            2. Color palette recommendations
            3. Furniture and decor suggestions
            4. Style identification and recommendations
            5. Space optimization tips
            6. Budget planning for design projects
            7. Analysis of design images (when provided)
            
            Always be helpful, creative, and professional. Provide specific, actionable advice.
            When appropriate, suggest following up with image analysis for more detailed recommendations.
            Keep responses concise but informative, typically 3-5 short paragraphs.
            """
        }

    def chat_with_ai(self, messages: List[Dict[str, str]]) -> str:
        """Chat with AI using Groq API"""
        try:
            # Prepare the full message history with system prompt
            full_messages = [self.system_prompt] + messages
            
            # Call the Groq API
            response = self.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=full_messages,
                temperature=0.7,
                max_completion_tokens=1024
            )
            
            # Extract the response content
            content = response.choices[0].message.content
            return content
            
        except Exception as e:
            logger.error(f"Error chatting with AI: {str(e)}")
            raise

# Create a singleton instance
chat_service = ChatService()