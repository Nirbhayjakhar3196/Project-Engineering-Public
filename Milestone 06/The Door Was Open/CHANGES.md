# The Door Was Open | Challenge #4

---

# 1. Route Audit

Before applying any fixes, I tested all routes without a JWT token.

| Route | Method | Expected | Actual Before Fix |
|---------|---------|----------|----------|
| /api/users/profile | GET | Protected | 200 OK |
| /api/users/profile | PUT | Protected | 200 OK |
| /api/posts/my-posts | GET | Protected | 200 OK |
| /api/posts/create | POST | Protected | 201 Created |
| /api/admin/users | GET | Protected | 200 OK |
| /api/admin/users/:id | DELETE | Protected | 200 OK |

Finding:

All private routes were accessible without authentication.

---

# 2. Root Cause Analysis

## Issue 1 - User Routes Unprotected

File:

routes/userRoutes.js

Problem:

Routes were declared as private but authenticate middleware was not applied.

Impact:

Any unauthenticated user could view and update profile information.

---

## Issue 2 - Post Routes Unprotected

File:

routes/postRoutes.js

Problem:

Routes returned private post data without JWT validation.

Impact:

Attackers could access private posts and create posts without authentication.

---

## Issue 3 - Admin Routes Unprotected

File:

routes/adminRoutes.js

Problem:

Sensitive admin endpoints had no authentication middleware.

Impact:

Any user could retrieve all users or delete users.

---

# 3. What I Fixed

## User Routes

Before

```js
router.get('/profile', getProfile)
router.put('/profile', updateProfile)