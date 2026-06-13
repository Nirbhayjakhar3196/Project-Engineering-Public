# Manager Only, Obviously | Challenge #5

## Role Gap Audit

Before implementing role-based access control, I logged in using the regular user account (`user@expenseapp.io`) and tested all sensitive endpoints.

### Findings

| Method | Endpoint                  | Result Before Fix                                         |
| ------ | ------------------------- | --------------------------------------------------------- |
| GET    | /api/expenses             | Regular user could view all expenses                      |
| PUT    | /api/expenses/:id/approve | Regular user could approve expenses                       |
| PUT    | /api/expenses/:id/reject  | Regular user could reject expenses                        |
| DELETE | /api/expenses/:id         | Regular user could delete expenses                        |
| GET    | /api/users                | Regular user could view all users                         |
| PUT    | /api/users/:id/role       | Regular user could change user roles                      |
| PUT    | /api/expenses/:id         | Regular user could edit expenses belonging to other users |

### Security Impact

The application enforced authentication but did not enforce authorization. Any authenticated user could perform administrative and managerial actions, resulting in broken access control.

---

# Root Cause Analysis

## Gap 1 — Missing Role Information in JWT

### Location

`controllers/authController.js`

### Problem

JWT tokens contained only:

```javascript
{
  userId,
  email
}
```

The user's role was not included in the token payload.

### Impact

Role-based authorization could not be reliably enforced using JWT data.

---

## Gap 2 — No Role Middleware

### Location

`middleware/`

### Problem

No reusable role-checking middleware existed.

### Impact

Routes only checked whether a user was authenticated and never checked whether the user was authorized.

---

## Gap 3 — Sensitive Routes Not Protected

### Locations

* routes/expenseRoutes.js
* routes/userRoutes.js

### Problem

Sensitive endpoints used only:

```javascript
protect
```

without any role validation.

### Impact

Any authenticated user could approve expenses, delete expenses, view all users, and modify user roles.

---

## Gap 4 — Missing Ownership Validation

### Location

`controllers/expenseController.js`

### Problem

Expense updates were performed without verifying ownership.

### Impact

A user could modify expenses submitted by another user.

---

# Access Model

| Action            | Endpoint                      | Allowed Roles        |
| ----------------- | ----------------------------- | -------------------- |
| Submit Expense    | POST /api/expenses            | user, manager, admin |
| View Own Expenses | GET /api/expenses/mine        | user, manager, admin |
| View All Expenses | GET /api/expenses             | manager, admin       |
| Approve Expense   | PUT /api/expenses/:id/approve | manager, admin       |
| Reject Expense    | PUT /api/expenses/:id/reject  | manager, admin       |
| Delete Expense    | DELETE /api/expenses/:id      | admin                |
| View All Users    | GET /api/users                | admin                |
| Change User Role  | PUT /api/users/:id/role       | admin                |
| View Own Profile  | GET /api/users/me             | user, manager, admin |

Ownership Rule:

* Users may edit only their own expenses.
* Managers may approve/reject expenses.
* Admins have full access to administrative operations.

---

# What I Fixed

## Fix 1 — Added Role To JWT Payload

### Before

```javascript
jwt.sign(
  {
    userId: user._id,
    email: user.email
  },
  process.env.JWT_SECRET
);
```

### After

```javascript
jwt.sign(
  {
    userId: user._id,
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET
);
```

---

## Fix 2 — Created Role Middleware

### File Added

`middleware/roleMiddleware.js`

### Purpose

Reusable middleware for enforcing role-based access control.

Example:

```javascript
requireRole("manager", "admin")
```

---

## Fix 3 — Protected Expense Routes

### Before

```javascript
router.get("/", protect, getAllExpenses);
router.put("/:id/approve", protect, approveExpense);
router.put("/:id/reject", protect, rejectExpense);
router.delete("/:id", protect, deleteExpense);
```

### After

```javascript
router.get(
  "/",
  protect,
  requireRole("manager", "admin"),
  getAllExpenses
);

router.put(
  "/:id/approve",
  protect,
  requireRole("manager", "admin"),
  approveExpense
);

router.put(
  "/:id/reject",
  protect,
  requireRole("manager", "admin"),
  rejectExpense
);

router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  deleteExpense
);
```

---

## Fix 4 — Protected User Routes

### Before

```javascript
router.get("/", protect, getAllUsers);

router.put("/:id/role", protect, updateUserRole);
```

### After

```javascript
router.get(
  "/",
  protect,
  requireRole("admin"),
  getAllUsers
);

router.put(
  "/:id/role",
  protect,
  requireRole("admin"),
  updateUserRole
);
```

---

## Fix 5 — Added Ownership Validation

### Before

Any authenticated user could update any expense.

### After

The system verifies:

* Expense exists
* User owns the expense OR
* User has manager/admin privileges

Unauthorized modifications return:

```http
403 Forbidden
```

---

# Verification Results

| Scenario                          | Role Used | Expected Status | Actual Status | Screenshot             |
| --------------------------------- | --------- | --------------- | ------------- | ---------------------- |
| User approves expense             | User      | 403             | 403           | 01-user-approve.png    |
| User deletes expense              | User      | 403             | 403           | 02-user-delete.png     |
| User changes role                 | User      | 403             | 403           | 03-user-role.png       |
| User edits another user's expense | User      | 403             | 403           | 04-user-edit-other.png |
| Manager approves expense          | Manager   | 200             | 200           | 05-manager-approve.png |
| Manager changes user role         | Manager   | 403             | 403           | 06-manager-role.png    |
| Admin deletes expense             | Admin     | 200             | 200           | 07-admin-delete.png    |
| Admin changes user role           | Admin     | 200             | 200           | 08-admin-role.png      |

## Conclusion

Role-Based Access Control (RBAC) and ownership validation were successfully implemented across all sensitive endpoints. The application now distinguishes between authentication and authorization, ensuring that users can only perform actions permitted by their role and ownership privileges.
