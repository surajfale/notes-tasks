---
inclusion: always
---

# Context7 Integration

## Automatic Usage

**CRITICAL**: Always use Context7 MCP tools automatically when providing:
- Code generation examples
- Setup or configuration steps
- Library/API documentation
- Framework-specific patterns
- Best practices for libraries

**Do NOT wait for explicit requests** - proactively fetch documentation when working with any library or framework.

## Libraries to Use Context7 For

### Backend
- Express.js - Web framework
- Mongoose - MongoDB ODM
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- Joi - Input validation
- Winston - Logging
- helmet - Security headers
- cors - CORS middleware
- express-rate-limit - Rate limiting

### Frontend
- Flutter - Web framework
- Riverpod - State management
- dio - HTTP client
- Freezed - Immutable models
- json_serializable - JSON serialization
- flutter_slidable - Swipe actions
- google_fonts - Font loading
- shared_preferences - Local storage
- go_router - Routing (if needed)

### Deployment & Infrastructure
- MongoDB Atlas - Database
- Railway - Backend hosting
- Netlify - Frontend hosting

## Workflow

1. **Resolve Library ID**: Use `mcp_Context7_resolve_library_id` to get the Context7-compatible library ID
2. **Fetch Documentation**: Use `mcp_Context7_get_library_docs` with the resolved ID and relevant topic
3. **Provide Examples**: Use the fetched documentation to give accurate, up-to-date code examples

## Example Scenarios

- User asks to add a new Riverpod provider → Fetch Riverpod docs automatically
- User needs to add validation → Fetch Joi docs automatically
- User wants to modify authentication → Fetch jsonwebtoken docs automatically
- User needs to update a Freezed model → Fetch Freezed docs automatically
- User asks about MongoDB queries → Fetch Mongoose docs automatically

This ensures all guidance is based on current, official documentation rather than potentially outdated information.
