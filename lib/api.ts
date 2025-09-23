// API utility functions for the application

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001";

/**
 * Analyze an image using the backend vision service
 * @param imageFile - The image file to analyze
 * @returns Promise with the analysis result
 */
export async function analyzeImage(imageFile: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch(`${API_BASE_URL}/analyze-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to analyze image");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

/**
 * Get design feed data
 * @param query - Search query
 * @param style - Design style filter
 * @param page - Page number
 * @param perPage - Items per page
 * @returns Promise with feed data
 */
export async function getFeed(query: string = "", style: string | null = null, page: number = 1, perPage: number = 20): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (style) params.append("style", style);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    const response = await fetch(`${API_BASE_URL}/feed?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch feed data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching feed:", error);
    throw error;
  }
}

/**
 * Get trending designs
 * @param style - Design style filter
* @param page - Page number
 * @param perPage - Items per page
 * @returns Promise with trending data
 */
export async function getTrending(style: string | null = null, page: number = 1, perPage: number = 20): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (style) params.append("style", style);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    const response = await fetch(`${API_BASE_URL}/trending?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch trending data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching trending:", error);
    throw error;
  }
}

/**
 * Chat with AI assistant
 * @param messages - Array of message objects with role and content
 * @returns Promise with AI response
 */
export async function chatWithAI(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages), // Send the messages array directly
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to chat with AI");
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error chatting with AI:", error);
    throw error;
  }
}