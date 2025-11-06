// AI enhancement type definitions

/**
 * Content type for AI enhancement
 */
export type ContentType = 'note' | 'task';

/**
 * Tone style for AI enhancement
 */
export type ToneStyle = 'concise' | 'detailed' | 'professional' | 'casual';

/**
 * Request payload for AI content enhancement
 */
export interface EnhanceContentRequest {
  content: string;
  contentType: ContentType;
  tone?: ToneStyle;
}

/**
 * Response from AI content enhancement
 */
export interface EnhanceContentResponse {
  success: boolean;
  enhancedContent: string;
}
