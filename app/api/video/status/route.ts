import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const operationId = searchParams.get('operationId');
    
    if (!operationId) {
      return new Response(JSON.stringify({ error: 'Operation ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For video status checking, we'll simulate the process
    // In a real implementation, you would check the actual status of the video generation operation
    
    // Simulate progress for demonstration purposes
    // After 3 checks, we'll mark it as done
    const checkCount = (globalThis as any).videoCheckCount || 0;
    (globalThis as any).videoCheckCount = checkCount + 1;
    
    let response;
    if (checkCount >= 3) {
      // Reset the counter for next time
      (globalThis as any).videoCheckCount = 0;
      
      // In a real implementation, you would return the actual video URL
      // For now, we'll return a placeholder image URL since we don't have a valid video file
      const videoUrl = '/placeholder.jpg';
      response = { done: true, videoUrl };
    } else {
      response = { done: false };
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Video status check error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}