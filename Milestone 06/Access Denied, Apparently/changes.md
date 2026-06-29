# Changes.md

# Challenge 8 – Access Denied, Apparently

## Objective

Investigate and fix broken authorization flows in the Event Manager application.

The application authenticated users correctly using JWT but failed to verify whether authenticated users were actually authorized to access or modify specific resources.

---

# Issues Observed Before Fix

## CP1 – Unauthorized Event Discovery

### Observation

The endpoint:

```
GET /api/events
```

returned every event stored in the application regardless of who requested it.

A logged-in user could see private events that they neither created nor were invited to.

### Risk

* Private event information became visible to every authenticated user.
* Users could enumerate all events in the system.
* Invitation lists became meaningless.

### Fix

Filtered events so that users only receive:

* Events they created.
* Events where their email exists inside `invitedEmails`.

---

## CP2 – Private Event Detail Disclosure

### Observation

The endpoint:

```
GET /api/events/:id
```

returned complete event information without checking permissions.

Knowing an event ID was enough to retrieve:

* Title
* Description
* Date
* Guest list
* RSVP information

### Risk

Any authenticated user could access private event details simply by guessing event IDs.

### Fix

Added an authorization check before returning event data.

Only:

* Event creator
* Invited users

can access event details.

Otherwise the server responds with:

```
403 Forbidden
```

---

## CP3 – RSVP Authorization Missing

### Observation

Any authenticated user could RSVP to any event.

The backend never verified whether the user had actually been invited.

### Risk

Private events effectively became public.

Unauthorized users could join invitation-only events.

### Fix

Added an invitation validation:

```
event.invitedEmails.includes(req.user.email)
```

Only invited users are allowed to RSVP.

Unauthorized users receive:

```
403 Forbidden
```

---

## CP4 – Missing Ownership Validation

### Observation

Any authenticated user could delete any event.

Ownership was never checked before deletion.

### Risk

Users could permanently delete events created by other users.

This is a severe Broken Access Control vulnerability.

### Fix

Before deleting the event, verify:

```
event.creatorId === req.user.id
```

Only the creator can delete the event.

All other users receive:

```
403 Forbidden
```

---

## CP5 – Misleading Frontend UI

### Observation

The frontend displayed:

* RSVP button
* Delete button

to every authenticated user regardless of permissions.

Although backend authorization is the real protection, the UI falsely suggested that these actions were allowed.

### Risk

* Confusing user experience.
* Encourages unauthorized actions.
* Does not accurately reflect user permissions.

### Fix

Implemented conditional rendering.

RSVP button:

```
event.isInvited
```

Delete button:

```
event.isCreator
```

The UI now displays only actions the current user is permitted to perform.

---

# Final Result

After implementing all fixes:

* Users can only view events they own or are invited to.
* Unauthorized users cannot access private event details.
* Only invited users can RSVP.
* Only event creators can delete events.
* Frontend accurately reflects user permissions.
* Backend independently validates every protected action, preventing API abuse even if the frontend is modified.

---

# Security Concepts Learned

* Authentication identifies the user.
* Authorization determines what the user is allowed to do.
* Frontend checks improve user experience.
* Backend checks enforce security.
* Every protected resource must validate permissions before returning data or performing destructive actions.
