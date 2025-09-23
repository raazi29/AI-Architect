// This service will make requests to our own Next.js API routes
// instead of calling the Gemini API directly from the client

export const generateImageFromText = async (prompt: string): Promise<string> => {
  const response = await fetch('/api/image/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.imageUrl;
};

export const editImageWithText = async (prompt: string, base64Image: string, mimeType: string): Promise<string> => {
  const response = await fetch('/api/image/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, base64Image, mimeType }),
  });

  if (!response.ok) {
    throw new Error(`Image editing failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.imageUrl;
};

export const startVideoGeneration = async (prompt: string, base64Image?: string, mimeType?: string) => {
  const response = await fetch('/api/video/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, base64Image, mimeType }),
  });

  if (!response.ok) {
    throw new Error(`Video generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.operationId;
};

export const checkVideoOperationStatus = async (operationId: string) => {
  const response = await fetch(`/api/video/status?operationId=${operationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Video status check failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};