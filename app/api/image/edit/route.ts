import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, base64Image, mimeType, style = 'auto', roomType = 'auto' } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For now, we'll treat image editing as a new generation with the prompt
    // In the future, this could be enhanced with actual image-to-image capabilities
    const enhancedPrompt = base64Image 
      ? `Based on the uploaded image, ${prompt}` 
      : prompt;
    
    // Make request to our FastAPI backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    
    const response = await fetch(`${backendUrl}/generate-interior`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        style,
        room_type: roomType,
        width: 1024,
        height: 1024,
        steps: 50,
        guidance_scale: 7.5
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return new Response(JSON.stringify({ error: `Backend error: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the image data from backend
    const imageBuffer = await response.arrayBuffer();
    
    // Convert to base64 for frontend display
    const base64GeneratedImage = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64GeneratedImage}`;
    
    return new Response(JSON.stringify({ 
      imageUrl,
      downloadUrl: imageUrl,
      metadata: {
        prompt: enhancedPrompt,
        style,
        roomType,
        dimensions: '1024x1024',
        generatedAt: new Date().toISOString(),
        isEdit: true
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Image editing error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Make sure the FastAPI backend is running on port 8001'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}