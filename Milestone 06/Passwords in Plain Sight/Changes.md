# What I Found

After running the application and creating a test user, I checked the MongoDB database and found that the password was being stored in plain text.

Example:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

This falls under the category of **Plain Text Password Storage**, which is the most dangerous form of password handling because anyone with database access can directly read user passwords.

---

# Root Cause

The issue existed in the signup controller. The application was directly storing `req.body.password` into the database without hashing or transforming it.

Unsafe code:

```js
const user = await User.create({
  email,
  password
})
```

There was also no hashing middleware or pre-save hook inside the User model. Because of this, passwords were saved exactly as users typed them.

Additionally, the login route used direct string comparison:

```js
if (user.password !== password)
```

This only works when passwords are stored in readable form, which confirms the authentication system was insecure.

---

# Why This Is Dangerous

Storing passwords in plain text is extremely dangerous because if the database is leaked or accessed by an attacker, every user's password becomes immediately visible.

Attackers can:
- Log into user accounts directly
- Perform credential stuffing attacks on Gmail, GitHub, banking apps, and other services
- Steal personal information
- Compromise multiple accounts if users reuse passwords

Even developers or administrators with database access could read user passwords, which violates basic security principles.

---

# What I Fixed

## Fix 1 — Hash Password Before Storage

I installed `bcryptjs` and hashed passwords before saving them to the database.

Before:

```js
const user = await User.create({
  email,
  password
})
```

After:

```js
const hashedPassword = await bcrypt.hash(password, 10)

const user = await User.create({
  email,
  password: hashedPassword
})
```

---

## Fix 2 — Secure Password Comparison During Login

I replaced the direct password comparison with `bcrypt.compare()`.

Before:

```js
if (user.password !== password)
```

After:

```js
const isMatch = await bcrypt.compare(password, user.password)

if (!isMatch) {
  return res.status(401).json({
    message: "Invalid Credentials"
  })
}
```

---

# Verification

After applying the fixes:

- New users now have passwords stored as bcrypt hashes
- Database passwords now start with `$2b$10$`
- Login works correctly with valid credentials
- Invalid passwords return `401 Unauthorized`
- Plain text passwords are no longer visible in the database

Example of secure password storage:

```text
$2b$10$J8f7xk29sKJHsjdhKJHsdkjhsd
```

Screenshots:
- ![alt text](image.png)
- ![alt text](image-1.png)