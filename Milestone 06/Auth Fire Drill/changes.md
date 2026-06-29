# CHANGES.md

## Authentication & Authorization Audit

### F1 – Hardcoded JWT Secret & No Token Expiry

**Issue Found**

* JWT secret was hardcoded inside `server/auth/jwt.js`.
* Tokens were generated without an expiration time, making them valid indefinitely.

**Risk**

* Anyone with access to the source code could forge valid JWTs.
* Stolen tokens would remain usable forever.

**Fix Applied**

* Moved JWT secret to an environment variable (`process.env.JWT_SECRET`).
* Added `expiresIn: "1h"` while signing JWTs.
* Added validation to ensure the server fails to start if `JWT_SECRET` is missing.

---

### F2 – Role Missing from JWT Payload

**Issue Found**

* JWT payload contained only `userId`.
* User role was not included.

**Risk**

* Backend authorization middleware could not determine the user's role.
* Role-based access control could not function correctly.

**Fix Applied**

* Added `role` to the JWT payload.
* Auth middleware now attaches both `userId` and `role` to `req.user`.

---

### F3 – Frontend Trusted localStorage for Role

**Issue Found**

* User role was stored and read from `localStorage`.

**Risk**

* Any user could modify the role using browser DevTools.
* UI displayed admin/curator functionality even when the user was not authorized.

**Fix Applied**

* Removed role storage from `localStorage`.
* Stored only the JWT.
* Decoded the JWT using `jwt-decode` to derive the user's role.
* Updated UI to use the decoded role instead of trusting browser storage.

---

### F4 – Missing Authorization Checks

**Issue Found**

* Protected endpoints only verified authentication.
* No proper role-based authorization existed.

**Risk**

* Contributors could perform admin actions.
* Readers could access privileged endpoints.
* Contributors could edit fragments belonging to other users.

**Fix Applied**

* Applied reusable `roleCheck()` middleware.
* Protected routes with appropriate roles:

  * Create → Contributor, Curator, Admin
  * Edit → Contributor (own fragments only), Curator, Admin
  * Approve → Curator, Admin
  * Delete → Admin only
* Added ownership validation for contributors.

---

### F5 – CSRF & CORS Misconfiguration

**Issue Found**

* CORS allowed every origin (`*`).
* No CSRF protection existed for state-changing requests.

**Risk**

* Malicious websites could trigger authenticated requests.

**Fix Applied**

* Restricted CORS to the trusted frontend origin.
* Enabled credentials.
* Added CSRF token validation middleware for POST, PUT and DELETE requests.
* Requests without a valid `x-csrf-token` are rejected with HTTP 403.

---

### F6 – Logout Did Not Invalidate Tokens

**Issue Found**

* Logout only removed the token from browser storage.
* Server continued accepting previously issued tokens.

**Risk**

* Stolen tokens remained usable after logout.

**Fix Applied**

* Implemented an in-memory token blacklist.
* Added `/logout` endpoint to blacklist the current token.
* Updated authentication middleware to reject revoked tokens.
* Updated frontend logout flow to notify the server before clearing local storage.

---

# Result

The authentication system now provides:

* Secure JWT secret management
* Expiring JWT tokens
* Role-based authorization
* Trusted frontend role handling
* Protected critical endpoints
* CSRF protection
* Proper logout with token invalidation

The application now follows a layered security model where authentication, authorization, session management, and request validation work together to protect the access layer.
