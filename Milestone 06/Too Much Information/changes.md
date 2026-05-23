# Too Much Information | Challenge #2

## Move 1 — Pre-Refactor Audit

### Signup Endpoint Issues

The `/signup` endpoint returned the full database row using `RETURNING *`.

Exposed sensitive fields:
- password_hash
- verification_token

Risk:
These fields are backend-only fields and should never be exposed to the frontend. If leaked through browser devtools, logs, or third-party monitoring tools, attackers could gain access to sensitive internal authentication data.

---

### Login Endpoint Issues

The `/login` endpoint used:

```sql
SELECT * FROM users WHERE email = $1
```

and returned the complete user object in the response.

Exposed sensitive fields:
- password_hash
- stripe_customer_id
- is_admin
- feature_flags
- subscription_plan

Risk:
The frontend received unnecessary internal metadata that could expose business logic, billing identifiers, and administrative information. The JWT payload also contained sensitive claims.

---

### Profile Endpoint Issues

The `/me` endpoint also used:

```sql
SELECT * FROM users WHERE id = $1
```

and returned the full database row.

Potentially exposed fields:
- password_hash
- verification_token
- stripe_customer_id
- internal metadata

Risk:
Sensitive backend-only data was retransmitted every time the frontend refreshed user profile information.

---

## Move 2 — JWT Claims Audit

### Original JWT Claims

```js
{
  userId: user.id,
  email: user.email,
  role: user.role,
  isAdmin: user.is_admin,
  stripeCustomerId: user.stripe_customer_id,
  subscriptionPlan: user.subscription_plan,
  featureFlags: user.feature_flags
}
```

### Problems

- `email` → unnecessary in token payload
- `isAdmin` → sensitive privilege information
- `stripeCustomerId` → financial/billing identifier
- `subscriptionPlan` → unnecessary frontend exposure
- `featureFlags` → internal backend configuration

JWT payloads are base64 encoded, not encrypted. Any user can decode the token and inspect its contents.

---

### Safe JWT Claims

```js
{
  userId: user.id,
  role: user.role
}
```

Reason:
Authentication middleware only requires the user ID and role for authorization checks.

---

## Move 3 — Response Mapper Pattern

Created reusable response mappers in:

```txt
utils/response-mappers.js
```

### toAuthUser(user)

Used for:
- signup response
- login response

Fields kept:
- id
- name
- email
- role
- createdAt

Fields removed:
- password_hash
- verification_token
- stripe_customer_id
- feature_flags
- is_admin

Reason:
Frontend does not require these fields to maintain authentication state.

---

### toProfileUser(user)

Used for:
- GET /me endpoint

Fields kept:
- id
- name
- email
- role
- createdAt
- subscriptionPlan

Fields removed:
- password_hash
- verification_token
- stripe_customer_id
- internal metadata

Reason:
The profile endpoint may include additional user context, but must still avoid exposing backend-only fields.

---

## Move 4 — Applied Mappers to All Auth Routes

Updated routes:
- /signup
- /login
- /me

Changes made:
- Removed raw database row responses
- Replaced responses with safe response mapper functions
- Reduced JWT claims to minimum required fields
- Prevented sensitive internal metadata exposure

---

## Before Refactor

### Unsafe Signup Response

```js
res.status(201).json({ user: result.rows[0] });
```

### Unsafe Login Response

```js
res.json({ token, user });
```

### Unsafe Profile Response

```js
res.json({ user: result.rows[0] });
```

---

## After Refactor

### Safe Signup Response

```js
res.status(201).json({
  user: toAuthUser(result.rows[0])
});
```

### Safe Login Response

```js
res.json({
  token,
  user: toAuthUser(user)
});
```

### Safe Profile Response

```js
res.json({
  user: toProfileUser(result.rows[0])
});
```

---

## Verification

### Signup Test
- User registration works successfully
- Password hash is stored securely in database
- Sensitive fields are not returned in API response

### Login Test
- Correct credentials return valid JWT
- Wrong credentials return authentication error
- JWT only contains:
  - userId
  - role

### Profile Test
- `/me` endpoint returns safe profile data only
- No password hashes or internal fields exposed

---

## Security Improvements Achieved

- Removed sensitive fields from all auth responses
- Prevented internal metadata leakage
- Reduced JWT attack surface
- Implemented reusable response mapper pattern
- Improved API response security
- Applied principle of least privilege to auth responses

---

## Key Engineering Lesson

Authentication security is not only about verifying credentials correctly.

It is also about controlling what data leaves the backend after authentication succeeds.

Returning raw database rows creates unnecessary exposure and increases attack surface. Response mapping ensures the frontend receives only the minimum required data.