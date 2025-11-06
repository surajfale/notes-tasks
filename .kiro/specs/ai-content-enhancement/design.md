# Design Document

## Overview

The AI Content Enhancement feature integrates Ollama Cloud's DeepSeek-v3.1:671b-cloud model into the notes and tasks editing experience. Users can click a lightning button (⚡) to have their draft content automatically improved by AI, making it more clear, structured, and professional while preserving the original intent.

This feature consists of:
- **Backend API endpoint** that proxies requests to Ollama Cloud API
- **Frontend UI components** (lightning button) in note and task editors
- **AI service layer** that handles prompt engineering and API communication
- **Error handling** for network failures, timeouts, and API errors

## Architecture

### High-Level Flow

```
User clicks ⚡ button
    ↓
Frontend sends content to backend /api/ai/enhance endpoint
    ↓
Backend validates request and calls Ollama Cloud API
    ↓
Ollama Cloud processes content with DeepSeek-v3.1:671b-cloud
    ↓
Backend returns enhanced content to frontend
    ↓
Frontend updates editor with enhanced content
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                            │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Note Editor     │         │  Task Editor     │     │
│  │  - Lightning btn │         │  - Lightning btn │     │
│  │  - Loading state │         │  - Loading state │     │
│  └────────┬─────────┘         └────────┬─────────┘     │
│           │                             │                │
│           └──────────┬──────────────────┘                │
│                      │                                   │
│           ┌──────────▼──────────┐                       │
│           │  AI Repository      │                       │
│           │  - enhanceContent() │                       │
│           └──────────┬──────────┘                       │
└──────────────────────┼──────────────────────────────────┘
                       │ HTTP POST /api/ai/enhance
                       │
┌──────────────────────▼──────────────────────────────────┐
│                      Backend                             │
│           ┌──────────────────────┐                      │
│           │  AI Routes           │                      │
│           │  POST /api/ai/enhance│                      │
│           └──────────┬───────────┘                      │
│                      │                                   │
│           ┌──────────▼───────────┐                      │
│           │  AI Controller       │                      │
│           │  - enhanceContent()  │                      │
│           └──────────┬───────────┘                      │
│                      │                                   │
│           ┌──────────▼───────────┐                      │
│           │  Ollama Service      │                      │
│           │  - callAPI()         │                      │
│           │  - buildPrompt()     │                      │
│           └──────────┬───────────┘                      │
└──────────────────────┼──────────────────────────────────┘
                       │ HTTPS POST
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Ollama Cloud API                            │
│         DeepSeek-v3.1:671b-cloud Model                  │
└──────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. AI Routes (`backend/src/routes/aiRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateEnhanceRequest } = require('../middleware/validation');
const { enhanceContent } = require('../controllers/aiController');

// POST /api/ai/enhance - Enhance note or task content
router.post('/enhance', protect, validateEnhanceRequest, enhanceContent);

module.exports = router;
```

#### 2. AI Controller (`backend/src/controllers/aiController.js`)

```javascript
const ollamaService = require('../services/ollamaService');
const logger = require('../utils/logger');

/**
 * Enhance content using AI
 * @route POST /api/ai/enhance
 * @access Private
 */
const enhanceContent = async (req, res, next) => {
  try {
    const { content, contentType } = req.body;
    
    // Call Ollama service
    const enhancedContent = await ollamaService.enhanceContent(content, contentType);
    
    res.json({
      success: true,
      enhancedContent
    });
  } catch (error) {
    logger.error('AI enhancement error:', error);
    next(error);
  }
};

module.exports = { enhanceContent };
```

#### 3. Ollama Service (`backend/src/services/ollamaService.js`)

```javascript
const axios = require('axios');
const logger = require('../utils/logger');

const OLLAMA_API_URL = 'https://api.ollama.cloud/v1/chat/completions';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const MODEL = 'deepseek-v3.1:671b-cloud';
const TIMEOUT = 30000; // 30 seconds
const MAX_TOKENS = 2000;

/**
 * Build AI prompt based on content type
 */
function buildPrompt(content, contentType) {
  const baseInstructions = `You are a helpful assistant that improves written content while preserving the original intent and factual accuracy.`;
  
  if (contentType === 'note') {
    return `${baseInstructions}

Improve the following note content by:
- Enhancing clarity and readability
- Improving structure and organization
- Fixing grammar and spelling errors
- Making it more concise where appropriate
- Preserving all factual information and key details

Original note:
${content}

Return ONLY the improved note content, without any explanations or meta-commentary.`;
  } else if (contentType === 'task') {
    return `${baseInstructions}

Improve the following task description by:
- Making it more actionable and specific
- Clarifying the objective
- Improving structure and readability
- Fixing grammar and spelling errors
- Preserving all important details

Original task:
${content}

Return ONLY the improved task description, without any explanations or meta-commentary.`;
  }
  
  throw new Error('Invalid content type');
}

/**
 * Enhance content using Ollama Cloud API
 */
async function enhanceContent(content, contentType) {
  if (!OLLAMA_API_KEY) {
    logger.warn('Ollama API key not configured');
    throw new Error('AI enhancement service is not configured');
  }
  
  if (!content || content.trim().length === 0) {
    throw new Error('Content cannot be empty');
  }
  
  const prompt = buildPrompt(content, contentType);
  
  try {
    const response = await axios.post(
      OLLAMA_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OLLAMA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: TIMEOUT
      }
    );
    
    const enhancedContent = response.data.choices[0].message.content.trim();
    
    if (!enhancedContent) {
      throw new Error('AI returned empty response');
    }
    
    return enhancedContent;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('AI enhancement request timed out');
    }
    
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('Invalid API key');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded, please try again later');
      } else if (status >= 500) {
        throw new Error('AI service is temporarily unavailable');
      }
    }
    
    logger.error('Ollama API error:', error);
    throw new Error('Failed to enhance content');
  }
}

module.exports = { enhanceContent };
```

#### 4. Validation Middleware (`backend/src/middleware/validation.js`)

Add validation schema for AI enhancement:

```javascript
const validateEnhanceRequest = (req, res, next) => {
  const schema = Joi.object({
    content: Joi.string().required().min(1).max(10000),
    contentType: Joi.string().valid('note', 'task').required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }
  
  next();
};
```

### Frontend Components

#### 1. AI Repository (`frontend/src/lib/repositories/ai.repository.ts`)

```typescript
import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS } from '$lib/api/endpoints';

export interface EnhanceContentRequest {
  content: string;
  contentType: 'note' | 'task';
}

export interface EnhanceContentResponse {
  success: boolean;
  enhancedContent: string;
}

export const aiRepository = {
  /**
   * Enhance content using AI
   * @param request - Content and type to enhance
   * @returns Promise resolving to enhanced content
   */
  async enhanceContent(request: EnhanceContentRequest): Promise<string> {
    const response = await apiClient.post<EnhanceContentResponse>(
      API_ENDPOINTS.AI.ENHANCE,
      request
    );
    return response.enhancedContent;
  }
};
```

#### 2. API Endpoints (`frontend/src/lib/api/endpoints.ts`)

Add AI endpoints:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  AI: {
    ENHANCE: '/ai/enhance'
  }
};
```

#### 3. Lightning Button Component (`frontend/src/lib/components/ui/LightningButton.svelte`)

```svelte
<script lang="ts">
  export let onClick: () => void;
  export let disabled: boolean = false;
  export let loading: boolean = false;
  
  function handleClick() {
    if (!disabled && !loading) {
      onClick();
    }
  }
</script>

<button
  class="lightning-button"
  class:disabled
  class:loading
  on:click={handleClick}
  disabled={disabled || loading}
  title="Enhance with AI"
  aria-label="Enhance content with AI"
>
  {#if loading}
    <span class="spinner" aria-hidden="true">⚡</span>
  {:else}
    <span aria-hidden="true">⚡</span>
  {/if}
</button>

<style>
  .lightning-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background-color: var(--accent-color, #6366f1);
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 1.25rem;
    transition: all 0.2s;
  }
  
  .lightning-button:hover:not(.disabled):not(.loading) {
    background-color: var(--accent-color-dark, #4f46e5);
    transform: scale(1.05);
  }
  
  .lightning-button:active:not(.disabled):not(.loading) {
    transform: scale(0.95);
  }
  
  .lightning-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .lightning-button.loading {
    cursor: wait;
  }
  
  .spinner {
    animation: pulse 1s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
```

#### 4. Note Editor Enhancement (`frontend/src/routes/notes/[id]/+page.svelte` and `frontend/src/routes/notes/new/+page.svelte`)

Add lightning button to note editor toolbar:

```svelte
<script lang="ts">
  import LightningButton from '$lib/components/ui/LightningButton.svelte';
  import { aiRepository } from '$lib/repositories/ai.repository';
  
  let enhancing = false;
  let enhanceError = '';
  
  async function handleEnhance() {
    if (!note.body || note.body.trim().length === 0) {
      return;
    }
    
    enhancing = true;
    enhanceError = '';
    
    try {
      const enhancedContent = await aiRepository.enhanceContent({
        content: note.body,
        contentType: 'note'
      });
      
      note.body = enhancedContent;
    } catch (error) {
      enhanceError = error.message || 'Failed to enhance content';
    } finally {
      enhancing = false;
    }
  }
</script>

<!-- In the editor toolbar -->
<div class="editor-toolbar">
  <!-- ... existing toolbar buttons ... -->
  
  <LightningButton
    onClick={handleEnhance}
    disabled={!note.body || note.body.trim().length === 0}
    loading={enhancing}
  />
</div>

{#if enhanceError}
  <div class="error-message">
    {enhanceError}
  </div>
{/if}
```

#### 5. Task Editor Enhancement (`frontend/src/routes/tasks/[id]/+page.svelte` and `frontend/src/routes/tasks/new/+page.svelte`)

Add lightning button to task editor:

```svelte
<script lang="ts">
  import LightningButton from '$lib/components/ui/LightningButton.svelte';
  import { aiRepository } from '$lib/repositories/ai.repository';
  
  let enhancing = false;
  let enhanceError = '';
  
  async function handleEnhance() {
    const content = `Title: ${task.title}\n\nDescription: ${task.description || ''}`;
    
    if (content.trim().length === 0) {
      return;
    }
    
    enhancing = true;
    enhanceError = '';
    
    try {
      const enhancedContent = await aiRepository.enhanceContent({
        content,
        contentType: 'task'
      });
      
      // Parse enhanced content back into title and description
      const lines = enhancedContent.split('\n');
      const titleMatch = lines[0].match(/^Title:\s*(.+)$/);
      if (titleMatch) {
        task.title = titleMatch[1];
      }
      
      const descIndex = lines.findIndex(line => line.startsWith('Description:'));
      if (descIndex !== -1) {
        task.description = lines.slice(descIndex + 1).join('\n').trim();
      }
    } catch (error) {
      enhanceError = error.message || 'Failed to enhance content';
    } finally {
      enhancing = false;
    }
  }
</script>

<!-- In the editor toolbar -->
<div class="editor-toolbar">
  <!-- ... existing toolbar buttons ... -->
  
  <LightningButton
    onClick={handleEnhance}
    disabled={!task.title || task.title.trim().length === 0}
    loading={enhancing}
  />
</div>

{#if enhanceError}
  <div class="error-message">
    {enhanceError}
  </div>
{/if}
```

## Data Models

### Request/Response Models

#### Enhance Content Request
```typescript
{
  content: string;      // The content to enhance (1-10000 chars)
  contentType: 'note' | 'task';  // Type of content
}
```

#### Enhance Content Response
```typescript
{
  success: boolean;
  enhancedContent: string;  // The AI-enhanced content
}
```

#### Error Response
```typescript
{
  error: {
    code: string;       // Error code (e.g., 'VALIDATION_ERROR', 'AI_SERVICE_ERROR')
    message: string;    // Human-readable error message
  }
}
```

## Error Handling

### Backend Error Scenarios

1. **Missing API Key**
   - Status: 500
   - Message: "AI enhancement service is not configured"
   - Action: Log warning, return error to client

2. **Empty Content**
   - Status: 400
   - Message: "Content cannot be empty"
   - Action: Validate before API call

3. **Timeout (30s)**
   - Status: 504
   - Message: "AI enhancement request timed out"
   - Action: Return timeout error to client

4. **Invalid API Key**
   - Status: 401
   - Message: "Invalid API key"
   - Action: Return authentication error

5. **Rate Limit Exceeded**
   - Status: 429
   - Message: "Rate limit exceeded, please try again later"
   - Action: Return rate limit error

6. **Ollama Service Error (5xx)**
   - Status: 503
   - Message: "AI service is temporarily unavailable"
   - Action: Return service unavailable error

### Frontend Error Handling

1. **Network Error**
   - Display: "Network error. Please check your connection."
   - Action: Show error message, keep original content

2. **Timeout**
   - Display: "Request timed out. Please try again."
   - Action: Show error message, re-enable button

3. **Authentication Error**
   - Display: "AI service authentication failed. Please contact support."
   - Action: Show error message, log error

4. **Rate Limit**
   - Display: "Too many requests. Please wait a moment and try again."
   - Action: Show error message, disable button for 5 seconds

5. **Service Unavailable**
   - Display: "AI service is temporarily unavailable. Please try again later."
   - Action: Show error message, keep original content

## Testing Strategy

### Backend Tests

1. **Unit Tests** (`backend/src/services/ollamaService.test.js`)
   - Test prompt building for notes and tasks
   - Test API call with mocked axios
   - Test error handling for various scenarios
   - Test timeout handling
   - Test response parsing

2. **Integration Tests** (`backend/src/routes/aiRoutes.test.js`)
   - Test POST /api/ai/enhance with valid request
   - Test authentication requirement
   - Test validation errors
   - Test error responses

### Frontend Tests

1. **Component Tests**
   - Test LightningButton rendering
   - Test button disabled states
   - Test loading state animation
   - Test click handler

2. **Integration Tests**
   - Test AI enhancement in note editor
   - Test AI enhancement in task editor
   - Test error message display
   - Test content preservation on error

### Manual Testing Checklist

- [ ] Lightning button appears in note editor
- [ ] Lightning button appears in task editor
- [ ] Button is disabled when content is empty
- [ ] Button shows loading state during API call
- [ ] Content is replaced with enhanced version on success
- [ ] Error message displays on failure
- [ ] Original content is preserved on error
- [ ] Button re-enables after error
- [ ] Tags/lists/priorities are preserved after enhancement
- [ ] Works with both new and existing notes/tasks

## Security Considerations

1. **API Key Protection**
   - Store API key in environment variables only
   - Never expose in frontend code or responses
   - Use backend proxy to hide API key

2. **Authentication**
   - Require JWT authentication for AI endpoint
   - Validate user session before processing

3. **Rate Limiting**
   - Apply rate limiting to AI endpoint (e.g., 10 requests per minute per user)
   - Prevent abuse and excessive API costs

4. **Input Validation**
   - Validate content length (1-10000 chars)
   - Validate content type (note/task only)
   - Sanitize input to prevent injection attacks

5. **Content Filtering**
   - Consider implementing content moderation
   - Log suspicious requests for review

## Performance Considerations

1. **Timeout Management**
   - Set 30-second timeout for API calls
   - Show timeout error to user
   - Allow retry after timeout

2. **Loading States**
   - Disable editor during enhancement
   - Show clear loading indicator
   - Prevent duplicate requests

3. **Caching**
   - Consider caching enhanced content (optional future enhancement)
   - Cache key: hash of original content + content type

4. **Cost Management**
   - Monitor API usage and costs
   - Implement per-user rate limits
   - Consider daily/monthly quotas

## Environment Configuration

### Backend Environment Variables

Add to `backend/.env`:
```
OLLAMA_API_KEY=your_ollama_api_key_here
```

Add to `backend/.env.example`:
```
# Ollama Cloud API Configuration
OLLAMA_API_KEY=your_ollama_api_key_here
```

## Deployment Considerations

1. **Railway Deployment**
   - Add OLLAMA_API_KEY to Railway environment variables
   - Ensure axios is installed (add to package.json if needed)
   - Test API endpoint after deployment

2. **Netlify Deployment**
   - No changes needed for frontend deployment
   - Frontend calls backend API endpoint

3. **Monitoring**
   - Log all AI enhancement requests
   - Monitor API response times
   - Track error rates
   - Monitor API costs

## Future Enhancements

1. **Undo/Redo**
   - Allow users to revert to original content
   - Show diff between original and enhanced

2. **Multiple Suggestions**
   - Generate multiple enhancement options
   - Let user choose preferred version

3. **Custom Prompts**
   - Allow users to specify enhancement style
   - Add presets (formal, casual, concise, detailed)

4. **Batch Enhancement**
   - Enhance multiple notes/tasks at once
   - Show progress indicator

5. **Smart Suggestions**
   - Suggest when content could benefit from enhancement
   - Auto-enhance on save (optional setting)
