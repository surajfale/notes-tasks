---
inclusion: always
---

# Product Overview

A production-ready web application for managing notes and tasks with offline capabilities.

## Core Features

- **User Authentication**: JWT-based authentication with secure account management
- **Account Management**: Password change and account deletion with complete data cleanup
- **Lists**: Organize notes and tasks into colored, emoji-tagged lists
- **Notes**: Rich text notes with tags, search, and archive functionality
- **Tasks**: Task management with due dates, priorities, and completion tracking
- **Theme Customization**: Light/dark mode with customizable accent colors
- **Responsive Design**: Works seamlessly on desktop and mobile browsers
- **Material Design 3**: Modern, accessible UI following Material Design guidelines

## User Data Model

All data is strictly isolated per user:
- **User**: Authentication credentials, display name
- **List**: Colored containers for organizing notes/tasks
- **Note**: Title, body, tags, archive status, optional list assignment
- **Task**: Title, description, due date, priority (1-3), completion status, optional list assignment

## Security & Privacy

- Complete user data isolation - users can only access their own data
- Secure password storage with bcrypt hashing
- JWT token-based authentication with 7-day expiration
- Account deletion permanently removes all user data (lists, notes, tasks)
- Rate limiting to prevent abuse
