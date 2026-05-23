# Too Much Information | Challenge #2

## Move 1 — Pre-Refactor Audit

### Signup Endpoint Issues

The `/signup` endpoint returns the full database row using `RETURNING *`.

Exposed sensitive fields:
- password_hash
- verification_token

Risk:
These fields are backend-only fields and should never be exposed to the frontend. If leaked through browser devtools, logs, or error tracking tools, attackers can gain sensitive internal information.

---

### Login Endpoint Issues

The `/login` endpoint uses:

```sql
SELECT * FROM users WHERE email = $1

---

# 🧠 WHAT YOU LEARNED HERE

You just did:
- security audit
- response audit
- JWT audit
- API exposure analysis

THIS is real backend engineering.

---

# ✅ NEXT 3 STEPS (NEXT MESSAGE)

Next we will:
1. Create `response-mappers.js`
2. Clean signup response
3. Clean login response + JWT

Then after that:
- clean `/me`
- test APIs
- PR
- deployment
- final Changes.md section

Now first complete:
✅ create Changes.md  
✅ paste audit content  
Then send:
> done

Then we move like real backend engineers 🚀