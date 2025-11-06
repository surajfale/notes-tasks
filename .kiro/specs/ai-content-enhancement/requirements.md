# Requirements Document

## Introduction

This feature adds AI-powered content enhancement capabilities to the notes and tasks creation/editing experience. Users can click a lightning button to have their draft content automatically improved by AI, making it more clear, structured, and professional while preserving the original intent.

## Glossary

- **Content Enhancement System**: The AI-powered feature that improves note and task content
- **Lightning Button**: The UI control (⚡ icon) that triggers AI content enhancement
- **Ollama Cloud API**: The cloud-based AI service providing the DeepSeek-v3.1:671b-cloud model
- **Enhancement Request**: A user-initiated action to improve content using AI
- **Original Content**: The user's draft text before AI enhancement
- **Enhanced Content**: The AI-improved version of the original content
- **Note Editor**: The UI component for creating and editing notes
- **Task Editor**: The UI component for creating and editing tasks

## Requirements

### Requirement 1

**User Story:** As a user creating or editing a note, I want to click a lightning button to have AI enhance my content, so that my notes are more clear and well-structured without manual rewriting.

#### Acceptance Criteria

1. WHEN the user opens the Note Editor, THE Content Enhancement System SHALL display a lightning button (⚡) in the editor toolbar
2. WHEN the user enters text content in the note body field, THE Content Enhancement System SHALL enable the lightning button
3. WHEN the note body field is empty, THE Content Enhancement System SHALL disable the lightning button
4. WHEN the user clicks the enabled lightning button, THE Content Enhancement System SHALL send the note content to the Ollama Cloud API with the DeepSeek-v3.1:671b-cloud model
5. WHEN the AI enhancement completes successfully, THE Content Enhancement System SHALL replace the original content with the enhanced content in the editor

### Requirement 2

**User Story:** As a user creating or editing a task, I want to click a lightning button to have AI enhance my task details, so that my tasks are more actionable and clearly defined.

#### Acceptance Criteria

1. WHEN the user opens the Task Editor, THE Content Enhancement System SHALL display a lightning button (⚡) in the editor toolbar
2. WHEN the user enters text in the task title or description fields, THE Content Enhancement System SHALL enable the lightning button
3. WHEN both task title and description fields are empty, THE Content Enhancement System SHALL disable the lightning button
4. WHEN the user clicks the enabled lightning button, THE Content Enhancement System SHALL send the task title and description to the Ollama Cloud API with the DeepSeek-v3.1:671b-cloud model
5. WHEN the AI enhancement completes successfully, THE Content Enhancement System SHALL update the task title and description fields with the enhanced content

### Requirement 3

**User Story:** As a user, I want to see visual feedback during AI content enhancement, so that I know the system is processing my request and understand when it completes.

#### Acceptance Criteria

1. WHEN the user clicks the lightning button, THE Content Enhancement System SHALL display a loading indicator on the button
2. WHILE the AI enhancement is processing, THE Content Enhancement System SHALL disable the lightning button to prevent duplicate requests
3. WHILE the AI enhancement is processing, THE Content Enhancement System SHALL disable content editing in the editor
4. WHEN the AI enhancement completes successfully, THE Content Enhancement System SHALL remove the loading indicator and re-enable the button
5. WHEN the AI enhancement completes successfully, THE Content Enhancement System SHALL re-enable content editing in the editor

### Requirement 4

**User Story:** As a user, I want to be notified if AI content enhancement fails, so that I understand what went wrong and can retry if needed.

#### Acceptance Criteria

1. IF the Ollama Cloud API returns an error response, THEN THE Content Enhancement System SHALL display an error message to the user
2. IF the network request times out after 30 seconds, THEN THE Content Enhancement System SHALL display a timeout error message
3. IF the API key is invalid or missing, THEN THE Content Enhancement System SHALL display an authentication error message
4. WHEN an error occurs, THE Content Enhancement System SHALL preserve the original content in the editor
5. WHEN an error occurs, THE Content Enhancement System SHALL re-enable the lightning button to allow retry

### Requirement 5

**User Story:** As a system administrator, I want the Ollama API key to be securely configured, so that the AI service can be accessed without exposing credentials in the codebase.

#### Acceptance Criteria

1. THE Content Enhancement System SHALL read the Ollama API key from environment variables in the backend
2. THE Content Enhancement System SHALL NOT expose the API key in frontend code or API responses
3. THE Content Enhancement System SHALL include the API key in the Authorization header when calling Ollama Cloud API
4. WHEN the API key is not configured, THE Content Enhancement System SHALL log a warning and disable the enhancement feature
5. THE Content Enhancement System SHALL validate the API key format before making API requests

### Requirement 6

**User Story:** As a user, I want AI enhancements to preserve my original intent and key information, so that the enhanced content remains accurate and relevant to my needs.

#### Acceptance Criteria

1. WHEN sending content to the AI, THE Content Enhancement System SHALL include a prompt instructing the model to preserve original intent
2. WHEN sending content to the AI, THE Content Enhancement System SHALL include a prompt instructing the model to maintain factual accuracy
3. WHEN sending note content to the AI, THE Content Enhancement System SHALL request improvements in clarity, structure, and grammar
4. WHEN sending task content to the AI, THE Content Enhancement System SHALL request improvements in actionability and specificity
5. THE Content Enhancement System SHALL limit AI responses to 2000 characters to prevent excessive content generation

### Requirement 7

**User Story:** As a user, I want the AI enhancement feature to work seamlessly with existing note and task features, so that I can use it alongside tags, lists, priorities, and other functionality.

#### Acceptance Criteria

1. WHEN AI enhances note content, THE Content Enhancement System SHALL preserve existing tags in the note
2. WHEN AI enhances note content, THE Content Enhancement System SHALL preserve the selected list assignment
3. WHEN AI enhances task content, THE Content Enhancement System SHALL preserve the task priority setting
4. WHEN AI enhances task content, THE Content Enhancement System SHALL preserve the task due date
5. WHEN AI enhances task content, THE Content Enhancement System SHALL preserve the selected list assignment
