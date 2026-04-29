# Routes Documentation

This directory contains all the route definitions for the Express Student Management API.

## Authentication Routes (`authRoutes.js`)

Public endpoints for user registration and authentication. These routes do not require authentication middleware since users need to register and login before accessing protected endpoints.

### Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid email format
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

#### POST /api/auth/login

Login with existing user credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid email or password
- `500 Internal Server Error` - Server error

### Usage Example

```javascript
// Register a new user
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  }),
});

const { data } = await registerResponse.json();
const token = data.token;

// Login with existing user
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123',
  }),
});

const { data: loginData } = await loginResponse.json();
const authToken = loginData.token;

// Use the token for protected endpoints
const protectedResponse = await fetch('http://localhost:3000/api/students', {
  headers: {
    'Authorization': `Bearer ${authToken}`,
  },
});
```

## Requirements Mapping

- **Requirement 1.1**: Hash password using bcrypt (handled by UserModel)
- **Requirement 1.2**: Create User record and return JWT token
- **Requirement 1.3**: Return JWT token for valid credentials
- **Requirement 1.4**: Return authentication error for invalid credentials
- **Requirement 1.5**: Validate email format (handled by UserModel)

## Testing

The auth routes have comprehensive test coverage:

- **Unit Tests** (`__tests__/authRoutes.test.js`): Test route configuration and controller integration
- **Integration Tests** (`__tests__/authRoutes.integration.test.js`): Test end-to-end functionality with real database

Run tests:
```bash
npm test -- authRoutes
```

## Security Notes

1. **Password Security**: Passwords are hashed using bcrypt with 10 salt rounds before storage
2. **JWT Tokens**: Tokens expire after 24 hours
3. **Public Access**: These routes are intentionally public (no auth middleware)
4. **Error Messages**: Generic error messages for authentication failures to prevent user enumeration
