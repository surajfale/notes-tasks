# Changelog

## [1.0.0] - 2025-01-19

### Added
- **Account Management**: Complete account deletion functionality
  - Backend endpoint: `DELETE /api/auth/account`
  - Deletes user account and all associated data (notes, tasks, lists)
  - Frontend UI in Settings screen and user menu
  - Confirmation dialog with warning message
  
- **Settings Screen**: New settings page with:
  - User profile display
  - Logout button
  - Delete account button
  - Theme customization (light/dark mode)
  - Accent color picker
  
- **Theme Customization**: 
  - Light and dark mode support
  - 10 accent color options
  - Tag color preview
  - Persistent theme preferences

- **Responsive Layout**:
  - Desktop sidebar navigation
  - Mobile bottom navigation
  - User menu accessible on all screen sizes

### Changed
- Updated Riverpod from 2.5 to 3.0 with code generation
- Removed unused `go_router` dependency (using MaterialApp routing)
- Updated all documentation to reflect current features
- Improved user menu accessibility (now visible on desktop and mobile)

### Removed
- `lib/` folder (old/unused Flutter code)
- `WARP.md` (duplicate AI guide, kept CLAUDE.md)
- `railway.json` from root (backend has its own)
- `frontend/test/widget_test.dart` (default template test)
- `go_router` dependency from pubspec.yaml

### Fixed
- User menu now visible on all screen sizes
- Delete account option accessible from multiple locations
- Theme persistence across sessions

### Documentation
- Updated README.md with current features
- Updated ARCHITECTURE.md with delete account endpoint
- Updated backend/README.md with account deletion examples
- Updated PROJECT_SUMMARY.md with current status
- Updated FRONTEND_IMPLEMENTATION.md to remove go_router
- Updated CLAUDE.md with latest patterns

## Project Status

**Backend**: ✅ Complete and production-ready
- User authentication with JWT (HS256, 7-day expiration)
- Account management (password change, deletion with data cleanup)
- Full CRUD for Lists, Notes, and Tasks
- Complete data isolation and user-scoped queries
- Rate limiting (5 req/15min auth, 100 req/15min API)
- Security headers (Helmet, CORS)
- Input validation (Joi schemas)
- Error handling and logging (Winston)
- MongoDB with Mongoose ODM
- Health check endpoint

**Frontend**: ✅ Complete and production-ready
- Authentication screens (login, register)
- Settings and account management
- Theme customization (light/dark mode, 10 accent colors)
- Notes feature (CRUD, tags, search, archive)
- Tasks feature (CRUD, due dates, priorities, completion)
- Responsive design (desktop sidebar, mobile bottom nav)
- Material Design 3 with Google Fonts
- Riverpod 3.0 state management with code generation
- Freezed models for type safety
- Dio HTTP client with JWT interceptors

**Deployment**: ✅ Ready
- Backend: Railway configuration (`railway.json`)
- Frontend: Netlify configuration (`netlify.toml`)
- Database: MongoDB Atlas (M0 free tier compatible)
- Environment variables documented
- Health checks configured

## Technical Details

### Backend Stack
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.18+
- **Database**: MongoDB with Mongoose 8.0+
- **Authentication**: jsonwebtoken + bcryptjs
- **Validation**: Joi
- **Security**: helmet, cors, express-rate-limit
- **Logging**: winston
- **Testing**: Jest + Supertest
- **Linting**: ESLint

### Frontend Stack
- **Framework**: Flutter 3.0+ (Web target)
- **State Management**: Riverpod 3.0+ with code generation
- **HTTP Client**: Dio 5.4+
- **Code Generation**: freezed 3.2+, json_serializable, riverpod_generator
- **UI**: Material Design 3, Google Fonts
- **Storage**: shared_preferences
- **Utilities**: intl, flutter_slidable

### Database Schema
- **Users**: username, email, passwordHash, displayName
- **Lists**: userId, title, color, emoji
- **Notes**: userId, listId, title, body, tags[], isArchived
- **Tasks**: userId, listId, title, description, dueAt, reminderAt, isCompleted, priority, tags[]

### Indexes
- Users: `{username: 1}`, `{email: 1}` (unique)
- Lists: `{userId: 1, updatedAt: -1}`
- Notes: `{userId: 1, listId: 1, updatedAt: -1}`, `{userId: 1, isArchived: 1}`, `{userId: 1, tags: 1}`
- Tasks: `{userId: 1, listId: 1, dueAt: 1}`, `{userId: 1, isCompleted: 1}`, `{userId: 1, priority: -1, dueAt: 1}`

## Next Steps

### Short-term Enhancements
1. Add Lists feature to frontend (backend ready)
2. Implement search functionality for notes
3. Add tag management UI
4. Enhance task filtering and sorting
5. Add loading skeletons
6. Improve error messages

### Medium-term Features
1. Offline support with IndexedDB
2. Rich text editor for notes (Markdown support)
3. Task reminders (email notifications)
4. Bulk operations (delete multiple, archive multiple)
5. Export/import functionality
6. Advanced search with filters

### Long-term Goals
1. Real-time sync with WebSockets
2. Collaboration features (shared lists)
3. Mobile apps (Flutter iOS/Android)
4. File attachments (images, PDFs)
5. Calendar view for tasks
6. Analytics and insights
7. API rate limiting per user
8. Two-factor authentication
