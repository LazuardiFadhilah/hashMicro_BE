# Authentication Middleware

## Overview

The `authMiddleware` provides JWT-based authentication for protecting Express routes. It verifies JWT tokens from the Authorization header and attaches decoded user data to the request object.

## Features

- ✅ Extracts JWT tokens from Authorization header (Bearer format)
- ✅ Verifies token signature using JWT_SECRET
- ✅ Attaches decoded user data to `req.user`
- ✅ Returns 401 for missing, invalid, or expired tokens
- ✅ Comprehensive error handling with descriptive messages
- ✅ 95% test coverage with unit and integration tests

## Usage

### Basic Usage

```javascript
const express = require('express');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Public route (no authentication required)
app.post('/api/auth/login', loginController);

// Protected route (authentication required)
app.get('/api/students', authMiddleware, getStudentsController);
app.post('/api/students', authMiddleware, createStudentController);
```

### Accessing User Data

Once authenticated, the decoded JWT payload is available in `req.user`:

```javascript
const getProfile = (req, res) => {
  // Access authenticated user data
  const userId = req.user.userId;
  const email = req.user.email;
  
  res.json({
    success: true,
    data: {
      userId,
      email,
    },
  });
};

app.get('/api/profile', authMiddleware, getProfile);
```

### Protecting Multiple Routes

Apply the middleware to an entire router:

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Apply middleware to all routes in this router
router.use(authMiddleware);

router.get('/students', getStudentsController);
router.post('/students', createStudentController);
router.put('/students/:id', updateStudentController);
router.delete('/students/:id', deleteStudentController);

module.exports = router;
```

## Request Format

Clients must include the JWT token in the Authorization header using Bearer format:

```
Authorization: Bearer <jwt_token>
```

### Example Request

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:3000/api/students
```

### Example with Fetch API

```javascript
fetch('http://localhost:3000/api/students', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
  .then(response => response.json())
  .then(data => console.log(data));
```

## Response Format

### Success (200)

When authentication succeeds, the middleware calls `next()` and the route handler processes the request normally.

### Error Responses (401)

All authentication failures return a 401 status with a standardized error format:

```json
{
  "success": false,
  "message": "Error description"
}
```

#### Error Messages

| Scenario | Message |
|----------|---------|
| No Authorization header | `Access denied. No token provided.` |
| Empty token after Bearer | `Access denied. No token provided.` |
| Invalid token format (not Bearer) | `Access denied. Invalid token format.` |
| Invalid token signature | `Access denied. Invalid token.` |
| Expired token | `Access denied. Token expired.` |
| Other authentication errors | `Access denied. Authentication failed.` |

## Environment Variables

The middleware requires the following environment variable:

```env
JWT_SECRET=your-jwt-secret-key-here
```

⚠️ **Security Note**: Use a strong, randomly generated secret key in production (minimum 32 characters).

## Token Generation

Tokens should be generated during login/registration using the same JWT_SECRET:

```javascript
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h', // Token expires in 24 hours
  });
};
```

## Testing

The middleware includes comprehensive test coverage:

- **Unit Tests**: Test individual middleware behavior with mocked requests
- **Integration Tests**: Test middleware in real Express app context

Run tests:

```bash
npm test -- middleware
```

## Requirements Validation

This middleware satisfies the following requirements:

- **Requirement 2.1**: Returns 401 for requests without JWT token
- **Requirement 2.2**: Returns 401 for requests with invalid JWT token
- **Requirement 2.3**: Allows requests with valid JWT token to proceed
- **Requirement 2.4**: Extracts JWT token from Authorization header in Bearer format

## Security Considerations

1. **Token Verification**: All tokens are verified using `jwt.verify()` with the JWT_SECRET
2. **Error Handling**: Specific error messages for different failure scenarios
3. **No Token Exposure**: Error messages don't expose token details
4. **Case Sensitivity**: Bearer keyword must be capitalized exactly
5. **Format Validation**: Strict validation of Authorization header format

## Implementation Details

### Token Extraction

```javascript
// Extract from "Authorization: Bearer <token>"
const authHeader = req.headers.authorization;
const token = authHeader.substring(7); // Remove "Bearer " prefix
```

### Token Verification

```javascript
// Verify token and decode payload
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // Attach to request
```

### Error Handling

The middleware catches and handles specific JWT errors:

- `JsonWebTokenError`: Invalid token signature or malformed token
- `TokenExpiredError`: Token has expired
- Other errors: Generic authentication failure

## Examples

### Complete Authentication Flow

```javascript
// 1. User logs in and receives token
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}

// 2. Client stores token and uses it for protected requests
GET /api/students
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true,
  "data": {
    "students": [ ... ]
  }
}
```

## Troubleshooting

### Common Issues

1. **"Access denied. No token provided."**
   - Ensure Authorization header is included
   - Check that header value is not empty

2. **"Access denied. Invalid token format."**
   - Ensure header starts with "Bearer " (with capital B and space)
   - Check for typos in "Bearer" keyword

3. **"Access denied. Invalid token."**
   - Verify JWT_SECRET matches between token generation and verification
   - Check that token hasn't been tampered with
   - Ensure token is properly formatted (3 parts separated by dots)

4. **"Access denied. Token expired."**
   - Token has exceeded its expiration time
   - User needs to log in again to get a new token

## Related Files

- `authMiddleware.js` - Main middleware implementation
- `__tests__/authMiddleware.test.js` - Unit tests
- `__tests__/authMiddleware.integration.test.js` - Integration tests
- `../controllers/authController.js` - Token generation during login/registration
