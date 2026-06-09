# Changes.md

## 1. Vulnerability Audit

### Before Fixes

| Route                   | Status Without Token | Data Returned         |
| ----------------------- | -------------------- | --------------------- |
| GET /admin/users        | 200 OK               | User list returned    |
| DELETE /admin/users/:id | 200 OK               | User deletion allowed |
| GET /tasks/:id          | 200 OK               | Task data returned    |
| DELETE /tasks/:id       | 200 OK               | Task deletion allowed |

### Finding

Sensitive routes were accessible without authentication because authentication middleware was missing or bypassed.

---

# 2. Root Cause Analysis

## Bug 1 - Broken Token Generation

### File

controllers/authController.js

### Problem

```js
jwt.sign(
    { id: user._id },
    'mysecretkey'
)
```

### Issues

* Missing email
* Missing role
* Hardcoded secret
* No expiry

### Risk

Tokens never expire and lack important identity information.

---

## Bug 2 - Wrong Header Extraction

### File

middleware/authMiddleware.js

### Problem

```js
const token = req.headers.token;
```

### Issues

JWT tokens are normally sent inside:

```http
Authorization: Bearer TOKEN
```

Middleware could not properly read tokens.

### Risk

Authentication becomes unreliable.

---

## Bug 3 - Verification Failure Allowed Access

### File

middleware/authMiddleware.js

### Problem

```js
catch(err){
   next();
}
```

### Issues

Invalid tokens still reached protected routes.

### Risk

Attackers could access protected APIs using fake tokens.

---

## Bug 4 - Missing Route Protection

### File

routes/adminRoutes.js

routes/taskRoutes.js

### Problem Routes

```js
GET /admin/users
DELETE /admin/users/:id
GET /tasks/:id
DELETE /tasks/:id
```

### Risk

Unauthenticated users could access sensitive information.

---

# 3. What I Fixed

## Fix 1 - Token Generation

### Before

```js
jwt.sign(
   { id: user._id },
   'mysecretkey'
)
```

### After

```js
jwt.sign(
{
    userId: user._id,
    email: user.email,
    role: user.role
},
process.env.JWT_SECRET,
{
    expiresIn: '7d'
}
)
```

### Prevents

* Infinite lifetime tokens
* Missing user identity data
* Hardcoded secret exposure

---

## Fix 2 - Middleware

### Before

```js
const token = req.headers.token;

catch(err){
   next();
}
```

### After

```js
const authHeader = req.headers.authorization;

const token =
authHeader &&
authHeader.startsWith('Bearer')
? authHeader.split(' ')[1]
: null;

if(!token){
    return res.status(401).json({
        message: "No token provided."
    });
}

try{
    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    req.user = decoded;
    next();
}
catch(err){
    return res.status(401).json({
        message: "Invalid or expired token."
    });
}
```

### Prevents

* Fake token access
* Expired token access
* Missing token access

---

## Fix 3 - Route Protection

### Added authMiddleware

```js
GET /admin/users
DELETE /admin/users/:id
GET /tasks/:id
DELETE /tasks/:id
```

### Prevents

Unauthorized access to sensitive resources.

---

# 4. Verification Results

| Scenario                      | Expected                   | Actual |
| ----------------------------- | -------------------------- | ------ |
| No Token                      | 401                        | 401    |
| Fake Token                    | 401                        | 401    |
| Expired Token                 | 401                        | 401    |
| Valid Token                   | 200                        | 200    |
| Non Admin User on Admin Route | 403 (if role check exists) | 403    |

### Screenshots

01-no-token.png

02-fake-token.png

03-expired-token.png

04-valid-token.png

05-wrong-role.png

---

# 5. What Happens If This Is Not Fixed

## Bug 1

Tokens never expire and may be reused indefinitely if stolen.

## Bug 2

Authentication middleware may fail to read valid tokens correctly, creating inconsistent access control.

## Bug 3

Attackers can send invalid or fake JWT tokens and still gain access to protected routes.

## Bug 4

Sensitive routes become publicly accessible without authentication, exposing data and allowing unauthorized actions.
