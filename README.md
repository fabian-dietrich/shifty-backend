# Shifty — Backend
 
REST API for [Shifty](https://shifty.fabiandietri.ch), a shift scheduling app built for small teams. Admins create and assign weekly shifts, employees view their schedule and pick up open slots.
 
**Frontend repo:** [shifty-frontend](https://github.com/fabian-dietrich/shifty-frontend)
 
## Live demo
 
[shifty.fabiandietri.ch](https://shifty.fabiandietri.ch)

All demo accounts use the password `shifty2025`.

| Account | Role |
|---|---|
| sarah@shifty-demo.com | Admin |
| tom@shifty-demo.com | Employee |

## Tech stack

Node.js, Express 5, MongoDB with Mongoose, JWT authentication, bcryptjs for password hashing.

## API overview

**Auth** (`/auth`)
- `POST /signup` — create account (auto-assigns avatar color)
- `POST /login` — returns JWT (valid 6 h)
- `GET /verify` — validate token, return user profile

**Shifts** (`/api/shifts`)
- `GET /` — list all shifts (any authenticated user)
- `GET /:id` — single shift detail
- `POST /` — create shift (admin)
- `PUT /:id` — edit shift times/day (admin)
- `DELETE /:id` — remove shift (admin)
- `PUT /:id/assign` — assign a worker (admin)
- `PUT /:id/unassign` — unassign a worker (admin)

**Users** (`/api/users`)
- `GET /` — list all users (any authenticated user)

## Two-role model

Admins manage the schedule: creating, editing, deleting, and staffing shifts. Employees see the weekly view and their own assigned shifts. Authorization is enforced server-side via middleware.

## Local setup

```
bun install
cp .env.example .env   # set MONGODB_URI and TOKEN_SECRET
bun run dev             # starts on port 5005
```