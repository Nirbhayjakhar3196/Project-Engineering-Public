# Signed, Sealed, Broken | Challenge #3

## Checkpoint 1 - Token Generation Audit

### File

controllers/authController.js

### Finding

Token generation uses:

```js
const token = jwt.sign(
    { id: user._id },
    'mysecretkey'
);
```

### Issues Found

1. Payload only contains `id`.

   * Missing `email`
   * Missing `role`

2. Secret is hardcoded:

   * Uses `'mysecretkey'`
   * Should use `process.env.JWT_SECRET`

3. No expiration configured.

   * Token never expires.
   * Stolen tokens remain usable indefinitely.

### Risk

A compromised token can remain valid forever and the application lacks role information needed for authorization checks.

---

## Checkpoint 2 - Middleware Header Extraction Audit

### File

middleware/authMiddleware.js

### Finding

```js
const token = req.headers.token;
```

### Issues Found

1. Reads token from incorrect header.
2. Does not use Authorization Bearer format.
3. Missing validation when header is absent.

### Risk

Clients using standard JWT authentication will fail and token extraction becomes inconsistent across the application.

---

## Checkpoint 3 - Verification Error Handling Audit

### File

middleware/authMiddleware.js

### Finding

```js
catch(err){
    next();
}
```

### Issues Found

1. Verification errors are ignored.
2. Invalid tokens continue to protected routes.
3. Expired tokens continue to protected routes.
4. Missing tokens continue to protected routes.

### Risk

Attackers can access protected endpoints without valid authentication.

---

## Checkpoint 4 - Route Protection Coverage Audit

### File

routes/adminRoutes.js

### Unprotected Routes

GET /admin/users

DELETE /admin/users/:id

### Issue

Routes handling sensitive administrative operations do not use authentication middleware.

### Risk

Any unauthenticated user can access administrative functionality.

---

## Checkpoint 5 - Error Response Consistency Audit

### Finding

Authentication failures do not return a consistent response.

Current behavior:

* Missing token may continue to route.
* Invalid token may continue to route.
* Different routes may return different responses.

### Expected Behavior

Every authentication failure should return:

```js
res.status(401).json({
    message: "Invalid or expired token."
})
```

or

```js
res.status(401).json({
    message: "No token provided."
})
```
