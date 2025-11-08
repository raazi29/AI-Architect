// Enhanced API utility functions with error handling and retry logic

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8001";

// Error types for better error handling
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface ApiError {
  type: ErrorType;
  message: string;
  status?: number;
  details?: any;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

// Exponential backoff delay calculation
function calculateDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

// Enhanced fetch with retry logic and error handling
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // If response is ok, return it
    if (response.ok) {
      return response;
    }

    // If we should retry and haven't exceeded max retries
    if (
      retryCount < RETRY_CONFIG.maxRetries &&
      RETRY_CONFIG.retryableStatusCodes.includes(response.status)
    ) {
      const delay = calculateDelay(retryCount);
      console.warn(`Request failed with status ${response.status}, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }

    // If we shouldn't retry or have exceeded max retries, throw error
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  } catch (error) {
    // Network errors are retryable
    if (retryCount < RETRY_CONFIG.maxRetries && error instanceof TypeError) {
      const delay = calculateDelay(retryCount);
      console.warn(`Network error, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    
    throw error;
  }
}

// Parse API error response
function parseApiError(error: any, status?: number): ApiError {
  if (status === 400) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      message: error.detail || 'Invalid request data',
      status,
      details: error
    };
  }
  
  if (status === 401 || status === 403) {
    return {
      type: ErrorType.PERMISSION_ERROR,
      message: 'You do not have permission to perform this action',
      status
    };
  }
  
  if (status === 404) {
    return {
      type: ErrorType.RESOURCE_NOT_FOUND,
      message: 'The requested resource was not found',
      status
    };
  }
  
  if (status === 409) {
    return {
      type: ErrorType.CONFLICT_ERROR,
      message: 'A conflict occurred with the current state',
      status
    };
  }
  
  if (status === 429) {
    return {
      type: ErrorType.RATE_LIMIT_ERROR,
      message: 'Too many requests. Please try again later.',
      status
    };
  }
  
  if (status && status >= 500) {
    return {
      type: ErrorType.SERVER_ERROR,
      message: 'Server error. Please try again later.',
      status
    };
  }
  
  if (error instanceof TypeError) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network error. Please check your connection.',
    };
  }
  
  return {
    type: ErrorType.API_ERROR,
    message: error.message || 'An unexpected error occurred',
    status,
    details: error
  };
}

/**
 * Analyze an image using the backend vision service
 * @param imageFile - The image file to analyze
 * @returns Promise with the analysis result
 */
export async function analyzeImage(imageFile: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    // Don't use fetchWithRetry for FormData uploads - it sets Content-Type header incorrectly
    // Browser automatically sets the correct multipart/form-data header with boundary
    const response = await fetch(`${API_BASE_URL}/analyze-image`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it automatically with boundary
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image analysis failed:", response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing image:", error);
    const apiError = parseApiError(error);
    throw apiError;
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

    const response = await fetchWithRetry(`${API_BASE_URL}/feed?${params.toString()}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching feed:", error);
    const apiError = parseApiError(error);
    throw apiError;
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
    const response = await fetchWithRetry(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error chatting with AI:", error);
    const apiError = parseApiError(error);
    throw apiError;
  }
}

/**
 * Generate interior design image
 * @param prompt - Design prompt
 * @param style - Design style
 * @param roomType - Room type
 * @param options - Additional options
 * @returns Promise with image data
 */
export async function generateInteriorDesign(
  prompt: string,
  style: string = "modern",
  roomType: string = "living_room",
  options: {
    width?: number;
    height?: number;
    steps?: number;
    guidance_scale?: number;
  } = {}
): Promise<Blob> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/generate-interior`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        style,
        room_type: roomType,
        width: options.width || 1024,
        height: options.height || 1024,
        steps: options.steps || 50,
        guidance_scale: options.guidance_scale || 9.0,
      }),
    });

    return await response.blob();
  } catch (error) {
    console.error("Error generating interior design:", error);
    const apiError = parseApiError(error);
    throw apiError;
  }
}

/**
 * Get AI design recommendations
 * @param request - Design request parameters
 * @returns Promise with recommendations
 */
export async function getAIDesignRecommendations(request: {
  type: 'materials' | 'budget' | 'colors' | 'layout';
  room_type: string;
  style: string;
  additional_params?: any;
}): Promise<any> {
  try {
    const endpoint = `/ai-design/${request.type}`;
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_type: request.room_type,
        style: request.style,
        ...request.additional_params,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error getting AI design recommendations:", error);
    const apiError = parseApiError(error);
    throw apiError;
  }
}