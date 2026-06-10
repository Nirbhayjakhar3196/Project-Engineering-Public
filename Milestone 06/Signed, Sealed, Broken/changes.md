# Changes.md

# Vulnerability Audit

Before applying fixes, protected routes were tested without a token.

| Route | Status Code | Data Returned | Issue |
|---------|---------|---------|---------|
| GET /api/tasks | 200 | Task data | Unprotected access |
| GET /api/tasks/:id | 200 | Task data | Missing middleware |
| DELETE /api/tasks/:id | 200 | Deleted task | Missing middleware |
| GET /api/admin/users | 200 | User list | Missing middleware |
| DELETE /api/admin/users/:id | 200 | User deleted | Missing middleware |

---

# Root Cause Analysis

## Bug 1 - Broken Token Generation

File:
authController.js

Problem:

```js
jwt.sign(
    { id: user._id },
    'mysecretkey'
)
```

Issues:

- Missing email
- Missing role
- Hardcoded secret
- No expiry

Impact:

Tokens never expire and lack required claims.

---

## Bug 2 - Wrong Header Extraction

File:
authMiddleware.js

Problem:

```js
const token = req.headers.token;
```

Issue:

JWT tokens should be read from Authorization header.

Impact:

Valid bearer tokens could not be processed correctly.

---

## Bug 3 - Verification Failure Allowed Access

File:
authMiddleware.js

Problem:

```js
catch(err){
   next();
}
```

Issue:

Requests continued even after token verification failed.

Impact:

Fake or invalid tokens could access protected routes.

---

## Bug 4 - Missing Middleware

Files:

adminRoutes.js

taskRoutes.js

Problem:

Protected routes were missing authMiddleware.

Impact:

Anyone could access sensitive routes without authentication.

---

# What I Fixed

## Fix 1 - Secure Token Generation

Before:

```js
jwt.sign(
   { id: user._id },
   'mysecretkey'
)
```

After:

```js
jwt.sign(
 {
   userId: user._id,
   email: user.email,
   role: user.role
 },
 process.env.JWT_SECRET,
 { expiresIn: '7d' }
)
```

Prevents:
Expired and insecure tokens.

---

## Fix 2 - Secure Middleware

Before:

```js
const token = req.headers.token;

catch(err){
   next();
}
```

After:

```js
const authHeader = req.headers.authorization;

const token =
 authHeader &&
 authHeader.startsWith('Bearer ')
 ? authHeader.split(' ')[1]
 : null;

if(!token){
   return res.status(401).json({
      message:'No token provided.'
   });
}

try{
   const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
   );

   req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
   };

   next();
}
catch(err){
   return res.status(401).json({
      message:'Invalid or expired token'
   });
}
```

Prevents:
Fake tokens bypassing authentication.

---

## Fix 3 - Protected All Sensitive Routes

Added authMiddleware to:

```js
GET /api/tasks/:id
DELETE /api/tasks/:id
GET /api/admin/users
DELETE /api/admin/users/:id
```

Prevents:
Unauthenticated access.

---

# Verification Results

| Test | Expected | Actual | Screenshot |
|--------|--------|--------|--------|
| No token | 401 | 401 | 01-no-token.png |
| Fake token | 401 | 401 | 02-fake-token.png |
| Expired token | 401 | 401 | 03-expired-token.png |
| Valid token | 200 | 200 | 04-valid-token.png |
| Wrong role | Not Implemented | Not Implemented | 05-wrong-role.png |

---

# What Happens If This Is Not Fixed

## Bug 1

Attackers can use tokens forever because they never expire.

## Bug 2

Valid authentication headers cannot be processed correctly, causing inconsistent security behavior.

## Bug 3

Attackers can send fake or tampered tokens and still access protected resources.

## Bug 4

Sensitive user and admin data becomes publicly accessible without login.
