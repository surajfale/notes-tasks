const axios = require('axios');
const logger = require('../utils/logger');

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'https://ollama.com/api/chat';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:120b';
const TIMEOUT = 30000; // 30 seconds

/**
 * Get tone-specific instructions
 * @param {string} tone - The tone style ('concise', 'detailed', 'professional', 'casual')
 * @returns {string} Tone-specific instructions
 */
function getToneInstructions(tone) {
  const tones = {
    concise: 'Keep it brief and to the point. Remove fluff. Focus on essential information only.',
    detailed: 'Provide comprehensive information with context, examples, and helpful details. Be thorough.',
    professional: 'Use formal, business-appropriate language. Be polished and authoritative.',
    casual: 'Use friendly, conversational language. Be approachable and add personality or wit.'
  };
  
  return tones[tone] || tones.casual;
}

/**
 * Build AI prompt based on content type and tone
 * @param {string} content - The content to enhance
 * @param {string} contentType - Type of content ('note' or 'task')
 * @param {string} tone - The tone style ('concise', 'detailed', 'professional', 'casual')
 * @returns {string} The formatted prompt
 */
function buildPrompt(content, contentType, tone = 'casual') {
  const toneInstruction = getToneInstructions(tone);
  if (contentType === 'note') {
    return `You are a smart content assistant helping me enhance my personal note. Write in first person as if I wrote it myself.

Tone: ${toneInstruction}

CRITICAL REQUIREMENTS:
- Maximum 2000 characters in the output
- Apply proper markdown formatting (headers, lists, bold, italic, tables)
- Fix grammar and improve clarity
- Add helpful context or insights where relevant
- Organize information logically with clear structure
- Make it actionable and valuable
- Write in FIRST PERSON (I, my, me) - this is MY note
- Keep it concise to stay under 2000 characters

Original note:
${content}

Enhanced note (in first person, max 2000 characters):`;
  } else if (contentType === 'task') {
    return `You are a smart productivity assistant helping me enhance my personal task. Write in first person as if I wrote it myself.

Tone: ${toneInstruction}

CRITICAL REQUIREMENTS:
- Output MUST be a checklist format ONLY using markdown checkboxes: - [ ] item
- Each checklist item MUST be 255 characters or less
- Break down the task into clear, actionable checklist items
- You can use headers (##) to organize sections, but ALL action items MUST be checkboxes
- Write in FIRST PERSON (I, my, me) - this is MY task
- Maximum 20 checklist items
- Be specific and actionable

Example format:
## Main Goal
- [ ] First actionable step (under 255 chars)
- [ ] Second actionable step (under 255 chars)

## Additional Steps
- [ ] Another specific action (under 255 chars)

Original task:
${content}

Enhanced task checklist (in first person):`;
  }
  
  throw new Error('Invalid content type');
}

/**
 * Enhance content using Ollama Cloud API
 * @param {string} content - The content to enhance
 * @param {string} contentType - Type of content ('note' or 'task')
 * @param {string} tone - The tone style ('concise', 'detailed', 'professional', 'casual')
 * @returns {Promise<string>} The enhanced content
 */
async function enhanceContent(content, contentType, tone = 'casual') {
  // Check if API key is configured
  if (!OLLAMA_API_KEY) {
    logger.warn('Ollama API key not configured');
    throw new Error('AI enhancement service is not configured');
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    throw new Error('Content cannot be empty');
  }
  
  // Build the prompt with tone
  const prompt = buildPrompt(content, contentType, tone);
  
  try {
    // Make API request to Ollama Cloud
    const response = await axios.post(
      OLLAMA_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a smart assistant helping users enhance their personal notes and tasks. ALWAYS write in FIRST PERSON (I, my, me) as if the user wrote it themselves. Never use third person (the user, they, their). Be clear, useful, and engaging. Be concise but add value. A touch of wit is welcome.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false,
        options: {
          temperature: 0.7,  // Balanced - creative but focused
          top_p: 0.9         // Allow diverse, interesting responses
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${OLLAMA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: TIMEOUT
      }
    );
    
    // Log the response structure for debugging
    // logger.debug('Ollama API response:', JSON.stringify(response.data));
    
    // Extract enhanced content from Ollama's response format
    if (!response.data || !response.data.message || !response.data.message.content) {
      logger.error('Unexpected API response structure:', response.data);
      throw new Error('Invalid response from AI service');
    }
    
    let enhancedContent = response.data.message.content.trim();
    
    if (!enhancedContent) {
      throw new Error('AI returned empty response');
    }
    
    // Enforce character limits based on content type
    if (contentType === 'note' && enhancedContent.length > 2000) {
      logger.warn(`AI generated note exceeds 2000 chars (${enhancedContent.length}), truncating`);
      enhancedContent = enhancedContent.substring(0, 2000);
    }
    
    return enhancedContent;
  } catch (error) {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      logger.error('Ollama API request timed out');
      throw new Error('AI enhancement request timed out');
    }
    
    // Handle HTTP errors
    if (error.response) {
      const status = error.response.status;
      logger.error(`Ollama API HTTP error ${status}:`, error.response.data);
      
      if (status === 401) {
        logger.error('Invalid Ollama API key');
        throw new Error('Invalid API key');
      } else if (status === 404) {
        logger.error('Ollama API endpoint or model not found');
        throw new Error('AI service configuration error');
      } else if (status === 429) {
        logger.warn('Ollama API rate limit exceeded');
        throw new Error('Rate limit exceeded, please try again later');
      } else if (status >= 500) {
        logger.error(`Ollama API server error: ${status}`);
        throw new Error('AI service is temporarily unavailable');
      }
    }
    
    // Log full error details for debugging
    logger.error('Ollama API error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    throw new Error('Failed to enhance content');
  }
}

module.exports = {
  enhanceContent,
  buildPrompt // Export for testing
};
