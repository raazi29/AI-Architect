// AI Image Generation Service using Stability AI via our FastAPI backend
// This service connects to our Next.js API routes which then communicate with
// the FastAPI backend running Stability AI's stable-diffusion-3.5-large model

export interface GenerationOptions {
  style?: 'modern' | 'traditional' | 'scandinavian' | 'industrial' | 'luxury' | 'minimalist' | 'bohemian' | 'rustic';
  roomType?: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'dining_room' | 'hallway' | 'outdoor';
  width?: number;
  height?: number;
}

export interface GenerationResult {
  imageUrl: string;
  downloadUrl: string;
  metadata: {
    prompt: string;
    style: string;
    roomType: string;
    dimensions: string;
    generatedAt: string;
    isEdit?: boolean;
  };
}

export const generateInteriorImage = async (
  prompt: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  const response = await fetch('/api/image/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      style: options.style || 'auto',
      roomType: options.roomType || 'auto',
      width: options.width || 1024,
      height: options.height || 1024
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Image generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const editInteriorImage = async (
  prompt: string,
  base64Image: string,
  mimeType: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  const response = await fetch('/api/image/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      base64Image,
      mimeType,
      style: options.style || 'auto',
      roomType: options.roomType || 'auto'
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Image editing failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const downloadImage = (imageUrl: string, filename?: string) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename || `interior-design-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getAvailableStyles = async () => {
  try {
    const response = await fetch('http://localhost:8001/interior-styles');
    if (response.ok) {
      const data = await response.json();
      return data.styles;
    }
  } catch (error) {
    console.warn('Could not fetch styles from backend, using defaults');
  }
  
  // Fallback styles if backend is not available
  return ['modern', 'traditional', 'scandinavian', 'industrial', 'luxury', 'minimalist', 'bohemian', 'rustic'];
};

export const getAvailableRoomTypes = async () => {
  try {
    const response = await fetch('http://localhost:8001/room-types');
    if (response.ok) {
      const data = await response.json();
      return data.room_types;
    }
  } catch (error) {
    console.warn('Could not fetch room types from backend, using defaults');
  }
  
  // Fallback room types if backend is not available
  return ['living_room', 'bedroom', 'kitchen', 'bathroom', 'office', 'dining_room', 'hallway', 'outdoor'];
};

// Legacy exports for backward compatibility (will be deprecated)
export const generateImageFromText = generateInteriorImage;
export const editImageWithText = (prompt: string, base64Image: string, mimeType: string) => 
  editInteriorImage(prompt, base64Image, mimeType).then(result => result.imageUrl);
