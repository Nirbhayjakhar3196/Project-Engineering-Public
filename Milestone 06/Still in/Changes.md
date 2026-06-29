# Changes.md

# Challenge #7 - Still In?

## Overview

This project intentionally contained multiple authentication and session management bugs related to expired JWT tokens. Before making any code changes, I ran the application, logged in with a test account, waited for the JWT to expire (60 seconds), and observed the behavior.

---

# Issues Observed Before Fixing

## 1. Expired Token Handling

### Observation

After the JWT expired, protected API requests failed, but the backend did not clearly communicate that the session had expired.

The frontend continued showing the dashboard even though the user was no longer authenticated.

### Why this is a problem

The frontend cannot distinguish between:

- Session expired
- Invalid token
- Server crash

Without a proper authentication response, the application keeps behaving as if the user is still logged in.

---

## 2. Duplicate Voting Bug

### Observation

A single user could vote multiple times.

### Root Cause

The application stored user IDs inside the `votedUserIds` array:

```js
votedUserIds.push(userId);
```

but checked against:

```js
req.user.email
```

Since a numeric/string user ID will never equal an email address, the duplicate vote check always failed.

### Impact

One user could cast unlimited votes, making the poll results inaccurate.

---

## 3. No Global Authentication Handling

### Observation

The frontend Axios client had only a request interceptor.

There was no response interceptor to handle authentication failures globally.

### Result

When the backend returned **401 Unauthorized**, every component had to handle the error individually.

Expired sessions never triggered an automatic logout or redirect.

---

## 4. Polling Continued After Session Expired

### Observation

The dashboard polls the backend every 10 seconds.

Even after the JWT expired, polling continued indefinitely.

### Why this happens

The Dashboard component was never unmounted because the frontend ignored the authentication failure.

Since React never unmounted the component, the cleanup function never executed.

As a result:

- polling continued
- unnecessary requests were sent
- the user still appeared logged in

This created "zombie requests".

---

# Fixes Applied

## Fix 1 - Authentication Middleware

Updated the authentication middleware to return proper authentication responses.

Instead of treating expired JWTs like generic failures, the middleware now returns:

- **401 Unauthorized** for expired tokens
- **401 Unauthorized** for invalid tokens

This allows the frontend to correctly recognize that the session has ended.

---

## Fix 2 - Duplicate Vote Prevention

Updated the duplicate vote check to compare the same data type.

Old logic:

```js
req.user.email
```

New logic:

```js
votedUserIds.includes(userId)
```

Now each authenticated user can vote only once.

---

## Fix 3 - Axios Response Interceptor

Added a global Axios response interceptor.

Whenever the backend returns:

```
401 Unauthorized
```

the frontend now:

- removes the JWT
- clears stored authentication data
- redirects the user to the login page

This prevents stale authenticated sessions.

---

## Fix 4 - Proper Session Cleanup

The Dashboard component already contained a cleanup function:

```js
return () => clearInterval(intervalRef.current);
```

Previously this cleanup never executed because the dashboard remained mounted.

After implementing the global 401 interceptor:

```
401 Response
      ↓
Logout
      ↓
Redirect
      ↓
Dashboard Unmounts
      ↓
React Cleanup Runs
      ↓
clearInterval()
```

Polling now stops automatically when the session ends.

---

# Result After Fix

After applying all fixes:

- Expired tokens correctly return **401 Unauthorized**
- Duplicate voting is prevented
- Expired sessions automatically log the user out
- Polling stops immediately after logout
- No zombie API requests continue running
- The UI correctly reflects the authentication state

---

# Engineering Learnings

This challenge reinforced that authentication is not only about logging users in.

A complete authentication system must correctly handle session expiration by following the Detect → Block → Reflect lifecycle:

1. Detect expired credentials on the backend.
2. Block further authenticated requests.
3. Reflect the session end by clearing state, stopping background work, and redirecting the user.

A system is considered reliable only when it behaves correctly during failure scenarios, not just during successful authentication.