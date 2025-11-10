# BrandOps Authentication System - Testing Guide

## Overview
The BrandOps application now has a complete authentication system with JWT tokens, password hashing, and email notifications.

## Features Implemented

### Backend (API Routes)
- **POST /api/auth/register** - Register new user with email/password
- **POST /api/auth/login** - Login with credentials, returns JWT token
- **POST /api/auth/forgot-password** - Request password reset email
- **POST /api/auth/reset-password** - Reset password using token from email
- **GET /api/auth/me** - Get current authenticated user
- **POST /api/auth/logout** - Clear authentication cookie
- **POST /api/users** - Admin: Create new user (with optional password)

### Frontend Pages
- **/login** - Login form with email/password
- **/register** - User registration form
- **/forgot-password** - Request password reset
- **/reset-password?token=xxx** - Reset password with token
- **/users** - User management with "Create User" button

### Security Features
- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiry
- httpOnly cookies for secure token storage
- Password reset tokens with 1-hour expiry
- Email verification for password resets

### Email Notifications
- Welcome email for new users
- Password reset instructions
- Password change confirmation
- Invitation emails for admin-created users

## Testing Flows

### 1. User Registration Flow
1. Navigate to http://localhost:3001/register
2. Fill in: Name, Email, Password, Confirm Password
3. Click "Register"
4. Should show success message and redirect to /login after 2 seconds
5. Check email inbox for welcome message

### 2. Login Flow
1. Navigate to http://localhost:3001/login
2. Enter registered email and password
3. Click "Sign in"
4. Should redirect to /dashboard
5. JWT token stored in localStorage and httpOnly cookie

### 3. Forgot Password Flow
1. Navigate to http://localhost:3001/forgot-password
2. Enter registered email address
3. Click "Send reset instructions"
4. Should show success message
5. Check email inbox for reset link
6. Click link in email (format: http://localhost:3001/reset-password?token=xxx)
7. Enter new password and confirm
8. Click "Reset password"
9. Should redirect to /login after 3 seconds
10. Check email for password change confirmation

### 4. Admin Create User Flow
1. Login as admin
2. Navigate to http://localhost:3001/users
3. Click "Create User" button
4. Fill in: Name, Email, Role
5. Optionally enter password (or leave empty for auto-generated)
6. Click "Create User"
7. New user appears in table
8. User receives invitation email with credentials

## Configuration

### Environment Variables (.env)
```
DATABASE_URL="postgresql://postgres:Aa135792468@82.29.170.137:5432/brandops"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
userEmail="support@mangesystem.com"
passEmail="your-email-password"
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_SECURE="true"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### Database Schema
```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      String   @default("user")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  batches               Batch[]
  expenses              Expense[]
  tasks                 Task[]
  passwordResetTokens   PasswordResetToken[]
}

model PasswordResetToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Endpoints Reference

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "user" }
}
```

### Forgot Password
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Reset Password
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "newPassword123"
}
```

### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <jwt-token>
# OR uses httpOnly cookie automatically
```

### Create User (Admin)
```bash
POST /api/users
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "manager",
  "password": "optional-password"
}
```

## Testing Checklist

- [ ] Register new user via /register page
- [ ] Verify welcome email received
- [ ] Login with new credentials
- [ ] Verify redirect to dashboard
- [ ] Check JWT token in localStorage and cookie
- [ ] Test forgot password flow
- [ ] Verify reset email received
- [ ] Click reset link and change password
- [ ] Verify password change confirmation email
- [ ] Login with new password
- [ ] Test admin create user with custom password
- [ ] Test admin create user with auto-generated password
- [ ] Verify invitation email received
- [ ] Test /api/auth/me endpoint
- [ ] Test logout functionality

## Known Issues
- TypeScript error for globals.css import (doesn't affect functionality)
- No authentication middleware yet (all routes publicly accessible)

## Next Steps
1. Add authentication middleware to protect routes
2. Add role-based access control (RBAC)
3. Add session management (refresh tokens)
4. Add email verification on registration
5. Add "Remember Me" functionality
6. Add password strength requirements
7. Add rate limiting for login attempts
