import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, style = 'auto', roomType = 'auto', width = 1024, height = 1024 } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Make request to our FastAPI backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001';
    
    const response = await fetch(`${backendUrl}/generate-interior`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style,
        room_type: roomType,
        width,
        height,
        steps: 50,
        guidance_scale: 7.5
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      // Provide user-friendly error messages
      let userMessage = `Backend error: ${response.status}`;
      if (response.status === 503) {
        userMessage = "AI image generation services are currently overloaded due to high demand. Please try again in a few minutes.";
      } else if (response.status === 429) {
        userMessage = "Rate limit reached. Please wait a moment before generating another image.";
      } else if (response.status === 500) {
        userMessage = "AI service temporarily unavailable. This often happens when free AI services are overloaded. Please try again later.";
      }
      
      return new Response(JSON.stringify({ 
        error: userMessage,
        technical_details: errorText,
        status: response.status 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the image data from backend
    const imageBuffer = await response.arrayBuffer();
    
    // Convert to base64 for frontend display
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    return new Response(JSON.stringify({ 
      imageUrl,
      downloadUrl: imageUrl, // Same as imageUrl for download
      metadata: {
        prompt,
        style,
        roomType,
        dimensions: `${width}x${height}`,
        generatedAt: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Image generation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Make sure the FastAPI backend is running on port 8001'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}