// AI repository for content enhancement

import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS } from '$lib/api/endpoints';
import { ApiError } from '$lib/types/error';
import type {
  EnhanceContentRequest,
  EnhanceContentResponse,
  ContentType,
  ToneStyle
} from '$lib/types/ai';

/**
 * AI repository for handling AI-related API calls
 */
export const aiRepository = {
  /**
   * Enhance content using AI
   * @param content - The content to enhance
   * @param contentType - Type of content ('note' or 'task')
   * @param tone - Tone style ('concise', 'detailed', 'professional', 'casual')
   * @returns Promise resolving to enhanced content string
   * @throws ApiError with specific error codes for different failure scenarios
   */
  async enhanceContent(content: string, contentType: ContentType, tone: ToneStyle = 'casual'): Promise<string> {
    // Validate input
    if (!content || content.trim().length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Content cannot be empty');
    }

    if (contentType !== 'note' && contentType !== 'task') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid content type');
    }

    try {
      const request: EnhanceContentRequest = {
        content: content.trim(),
        contentType,
        tone
      };

      const response = await apiClient.post<EnhanceContentResponse>(
        API_ENDPOINTS.AI.ENHANCE,
        request
      );

      if (!response.enhancedContent) {
        throw new ApiError(500, 'AI_SERVICE_ERROR', 'AI returned empty response');
      }

      return response.enhancedContent;
    } catch (error) {
      // Re-throw ApiError instances with enhanced error messages
      if (error instanceof ApiError) {
        // Provide user-friendly messages for specific error scenarios
        if (error.status === 401) {
          throw new ApiError(
            401,
            'UNAUTHORIZED',
            'Authentication required. Please log in again.'
          );
        }
        
        if (error.status === 429) {
          throw new ApiError(
            429,
            'RATE_LIMIT_ERROR',
            'Too many requests. Please wait a moment and try again.'
          );
        }
        
        if (error.status === 503 || error.status >= 500) {
          throw new ApiError(
            error.status,
            'AI_SERVICE_ERROR',
            'AI service is temporarily unavailable. Please try again later.'
          );
        }
        
        if (error.status === 504) {
          throw new ApiError(
            504,
            'TIMEOUT_ERROR',
            'Request timed out. Please try again.'
          );
        }
        
        if (error.isNetworkError()) {
          throw new ApiError(
            0,
            'NETWORK_ERROR',
            'Network error. Please check your connection.'
          );
        }
        
        // Re-throw other ApiErrors as-is
        throw error;
      }
      
      // Handle unexpected errors
      throw new ApiError(
        500,
        'UNKNOWN_ERROR',
        'An unexpected error occurred while enhancing content'
      );
    }
  }
};
