# Notes & Tasks Backend API

Production-ready Node.js REST API for the Notes & Tasks web application.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **User Management**: Registration, login, password change, account deletion
- **AI Content Enhancement**: Intelligent content improvement with customizable tone styles
- **Email Notifications**: Automated task reminders with Resend integration
- **CRUD Operations**: Full CRUD for lists, notes, and tasks
- **Data Isolation**: All user data is completely isolated and scoped
- **Security**: Rate limiting, CORS, Helmet, input validation
- **Error Handling**: Comprehensive error handling with detailed responses
- **Logging**: Winston logging with different levels
- **Database**: MongoDB with Mongoose ODM

## Prerequisites

- Node.js 18+ LTS
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notestasksdb?retryWrites=true&w=majority
JWT_SECRET=your-generated-secret-key
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
OLLAMA_API_KEY=your_ollama_api_key_here
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### AI Enhancement Configuration (Optional)

The application includes AI-powered content enhancement using Ollama Cloud's DeepSeek-v3.1:671b-cloud model. To enable this feature:

1. Sign up for an Ollama Cloud account at https://ollama.cloud
2. Generate an API key from your account dashboard
3. Add the API key to your `.env` file:
   ```env
   OLLAMA_API_KEY=your_actual_api_key_here
   ```

If the `OLLAMA_API_KEY` is not configured, the AI enhancement feature will be disabled, and the API will return an error when users attempt to use it. All other features will continue to work normally.

### 3. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### 4. Verify Installation

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-17T03:00:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/password` | Change password | Yes |
| DELETE | `/api/auth/account` | Delete account and all data | Yes |

### Lists

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/lists` | Get all user's lists | Yes |
| POST | `/api/lists` | Create new list | Yes |
| GET | `/api/lists/:id` | Get specific list | Yes |
| PUT | `/api/lists/:id` | Update list | Yes |
| DELETE | `/api/lists/:id` | Delete list | Yes |

### Notes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notes` | Get all user's notes | Yes |
| POST | `/api/notes` | Create new note | Yes |
| GET | `/api/notes/:id` | Get specific note | Yes |
| PUT | `/api/notes/:id` | Update note | Yes |
| DELETE | `/api/notes/:id` | Delete note | Yes |
| PUT | `/api/notes/:id/archive` | Toggle archive status | Yes |

Query parameters for GET `/api/notes`:
- `listId` - Filter by list ID
- `isArchived` - Filter by archived status (true/false)
- `tags` - Filter by tags (comma-separated)
- `search` - Search in title and body

### Tasks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks` | Get all user's tasks | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| GET | `/api/tasks/:id` | Get specific task | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |
| PUT | `/api/tasks/:id/complete` | Toggle completion | Yes |

Query parameters for GET `/api/tasks`:
- `listId` - Filter by list ID
- `isCompleted` - Filter by completion status (true/false)
- `priority` - Filter by priority (1=high, 2=normal, 3=low)

### AI Enhancement

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/ai/enhance` | Enhance note or task content with AI | Yes |

**Request Body:**
```json
{
  "content": "string (required) - The content to enhance",
  "contentType": "note|task (required) - Type of content",
  "tone": "concise|detailed|professional|casual (optional, default: casual)"
}
```

**Response:**
```json
{
  "success": true,
  "enhancedContent": "string - The AI-enhanced content"
}
```

**Error Responses:**
- `400` - Validation error (empty content, invalid type)
- `401` - Authentication required
- `429` - Rate limit exceeded
- `503` - AI service not configured or unavailable
- `504` - Request timeout (30 seconds)

### Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications/preferences` | Get user notification preferences | Yes |
| PUT | `/api/notifications/preferences` | Update notification preferences | Yes |
| GET | `/api/tasks/link/:token` | Handle email deep link | No |

**Get Preferences Response:**
```json
{
  "emailNotificationsEnabled": true,
  "notificationDays": ["1_day_before", "same_day"],
  "timezone": "America/New_York"
}
```

**Update Preferences Request:**
```json
{
  "emailNotificationsEnabled": true,
  "notificationDays": ["1_day_before", "same_day", "2_days_before"],
  "timezone": "America/New_York"
}
```

**Note**: See [Email Notifications Documentation](../docs/EMAIL_NOTIFICATIONS.md) for setup and configuration.

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/notifications/stats` | Get notification statistics | Yes (Admin) |
| GET | `/api/admin/notifications/health` | Get email service health | Yes (Admin) |
| POST | `/api/admin/notifications/circuit-breaker/reset` | Reset circuit breaker | Yes (Admin) |

## API Usage Examples

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "displayName": "John Doe"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "createdAt": "2025-10-17T03:00:00.000Z"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePass123"
  }'
```

### Create List

```bash
curl -X POST http://localhost:3000/api/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Work Tasks",
    "color": "#FF5722",
    "emoji": "💼"
  }'
```

### Create Note

```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Meeting Notes",
    "body": "Discussed project timeline and deliverables",
    "tags": ["work", "meeting"],
    "listId": "507f1f77bcf86cd799439011"
  }'
```

### Create Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete project proposal",
    "description": "Finish and submit the Q4 proposal",
    "dueAt": "2025-10-25T17:00:00Z",
    "priority": 3,
    "listId": "507f1f77bcf86cd799439011"
  }'
```

### Enhance Content with AI

```bash
curl -X POST http://localhost:3000/api/ai/enhance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "meeting notes - discussed new features and timeline",
    "contentType": "note"
  }'
```

Response:
```json
{
  "success": true,
  "enhancedContent": "Meeting Notes\n\nDiscussed the following topics:\n- New feature requirements and specifications\n- Project timeline and key milestones\n- Resource allocation and team responsibilities"
}
```

### Delete Account

```bash
curl -X DELETE http://localhost:3000/api/auth/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "message": "Account and all associated data deleted successfully"
}
```

**Note**: This permanently deletes the user account and all associated lists, notes, and tasks. This action cannot be undone.

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific field error"
      }
    ]
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Missing or invalid token
- `INVALID_CREDENTIALS` - Wrong username/password
- `DUPLICATE_ERROR` - Resource already exists
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AI_SERVICE_ERROR` - AI enhancement service error
- `SERVER_ERROR` - Internal server error

### AI Enhancement Errors

The AI enhancement endpoint may return specific errors:

- **Service Not Configured** (500):
  ```json
  {
    "error": {
      "code": "AI_SERVICE_ERROR",
      "message": "AI enhancement service is not configured"
    }
  }
  ```

- **Timeout** (504):
  ```json
  {
    "error": {
      "code": "AI_SERVICE_ERROR",
      "message": "AI enhancement request timed out"
    }
  }
  ```

- **Invalid API Key** (401):
  ```json
  {
    "error": {
      "code": "AI_SERVICE_ERROR",
      "message": "Invalid API key"
    }
  }
  ```

- **Rate Limit** (429):
  ```json
  {
    "error": {
      "code": "AI_SERVICE_ERROR",
      "message": "Rate limit exceeded, please try again later"
    }
  }
  ```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── listsController.js   # Lists CRUD
│   │   ├── notesController.js   # Notes CRUD
│   │   ├── tasksController.js   # Tasks CRUD
│   │   └── aiController.js      # AI enhancement logic
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── validation.js        # Input validation (Joi)
│   │   └── errorHandler.js      # Error handling
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── List.js              # List schema
│   │   ├── Note.js              # Note schema
│   │   └── Task.js              # Task schema
│   ├── routes/
│   │   ├── authRoutes.js        # Auth routes
│   │   ├── listsRoutes.js       # Lists routes
│   │   ├── notesRoutes.js       # Notes routes
│   │   ├── tasksRoutes.js       # Tasks routes
│   │   └── aiRoutes.js          # AI enhancement routes
│   ├── services/
│   │   └── ollamaService.js     # Ollama Cloud API integration
│   ├── utils/
│   │   └── logger.js            # Winston logger
│   └── server.js                # Express app entry
├── .env.example                 # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Security Considerations

- **JWT Tokens**: 7-day expiration by default
- **Password Hashing**: bcrypt with 10 rounds
- **Rate Limiting**: 5 requests/15min for auth, 100 requests/15min for API
- **CORS**: Configured for specific origins
- **Helmet**: Security headers enabled
- **Input Validation**: All inputs validated with Joi schemas
- **User Isolation**: All queries scoped to authenticated user

## Testing

Run tests:
```bash
npm test
```

Test specific controller:
```bash
npm test -- authController
```

With coverage:
```bash
npm test -- --coverage
```

## Deployment

### Environment Variables for Production

Ensure these are set in production:

```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_production_secret
PORT=3000
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
OLLAMA_API_KEY=your_production_ollama_api_key
```

**Note**: The `OLLAMA_API_KEY` is optional. If not provided, the AI enhancement feature will be disabled, but all other features will work normally.

### Deploy to Railway

1. Install Railway CLI: `npm install -g railway`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables: `railway variables`
5. Deploy: `railway up`

### Deploy to Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables in dashboard

### Deploy to Fly.io

1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Login: `flyctl auth login`
3. Launch: `flyctl launch`
4. Set secrets: `flyctl secrets set JWT_SECRET=xxx MONGODB_URI=xxx`
5. Deploy: `flyctl deploy`

## Troubleshooting

### MongoDB Connection Issues

Check:
- MongoDB URI is correct
- IP whitelist includes your server IP (or 0.0.0.0/0 for testing)
- Database user has correct permissions
- Special characters in password are URL-encoded

### JWT Token Issues

- Verify `JWT_SECRET` is set
- Check token expiration time
- Ensure `Authorization: Bearer <token>` header format

### Rate Limiting

If hitting rate limits during development:
- Increase `RATE_LIMIT_MAX_REQUESTS` in `.env`
- Or disable in `server.js` for local dev

## Documentation

For detailed information about specific features:

- **[Email Notifications](../docs/EMAIL_NOTIFICATIONS.md)** - Email notification system setup, configuration, and troubleshooting
- **[Architecture](../docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[Deployment](../docs/DEPLOYMENT.md)** - Production deployment guide
- **[MongoDB Setup](../docs/MONGODB_SETUP.md)** - Database configuration

## License

MIT
