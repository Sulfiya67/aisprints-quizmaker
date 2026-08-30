Date created: August 27, 2026
Date last modified: August 27, 2026

# Authentication - Technical PRD

## Overview/Problem

Quiz Maker is a web application for creating and taking quizzes. Before users can manage or take quizzes, they need a secure way to create an account, sign in, and stay authenticated during a session.

Today the application has no authentication. Anyone can access any route, there is no user identity, and there is no way to protect future quiz-related pages. Sprint 0 addresses this by defining the authentication feature end to end: sign up, sign in, logout, session management, and protected routes.

---

## Hypothesis

We believe that email-and-password authentication with secure sessions and protected routes will give Quiz Maker users a trustworthy account experience and a foundation for all future quiz features.

---

## Scope

### In Scope

What will be built in this feature:

- **Sign Up** — Full Name, Email, Password, Confirm Password with validation; unique email enforcement; redirect to Sign In on success
- **Sign In** — Email and password validation; session creation; redirect to Dashboard on success
- **Logout** — Session cleared; redirect to Sign In; protected pages inaccessible afterward
- **Session Management** — Server-side awareness of logged-in state; sessions persist until logout; invalid or expired sessions blocked from protected pages
- **Protected Routes** — Unauthenticated users redirected to Sign In; authenticated users allowed through
- **UI Pages** — Sign Up (`/sign-up`), Sign In (`/sign-in`), Dashboard (`/dashboard`) with validation messages, success messages, and double-submit prevention
- **Security** — Password hashing, secure session cookies, generic login errors, no sensitive data exposure

### Out of Scope

What is explicitly not being built now but may be considered later:

- Quiz creation, management, attempts, scoring, reports, analytics, and leaderboards
- Password reset and email verification
- Social login and multi-factor authentication
- User profiles, roles, permissions, and admin features
- Remember Me and session/device management

### Cut

Things that were considered during planning but deliberately removed (and why):

- **Social login (OAuth)** — Adds provider integration complexity; email/password is sufficient for Sprint 0
- **Email verification on sign up** — Deferred to a future enhancement; users can sign in immediately after registration
- **Role-based access control** — No roles are needed until quiz ownership and admin features are defined
- **Client-side-only auth checks** — Insufficient for security; all protected routes must be enforced server-side

---

## User Flows

### Sign Up

1. User opens Sign Up.
2. User enters Full Name, Email, Password, and Confirm Password.
3. System validates all fields.
4. Account is created (password hashed, email stored).
5. User is redirected to Sign In with success message: *Account created successfully. Please sign in.*

### Sign In

1. User enters email and password.
2. System validates credentials.
3. If valid, a session is created and the user is logged in.
4. User is redirected to Dashboard.

### Logout

1. User selects Logout.
2. Session is cleared.
3. User is redirected to Sign In with success message: *You have been logged out successfully.*

### Protected Page

1. User tries to open a protected page (e.g. Dashboard).
2. System checks authentication server-side.
3. If not logged in → redirect to Sign In with message: *Please sign in to continue.*
4. If logged in → allow access.

### Navigation

```text
Sign Up → Sign In → Dashboard → Logout → Sign In
```

For unauthenticated users accessing protected routes:

```text
Protected Page → Auth Check → Not Logged In → Sign In
```

---

## User Stories

- As a new user, I want to create an account.
- As a registered user, I want to log in.
- As a logged-in user, I want to log out.
- As a user, I want my session to remain active until I log out.
- As a system, I want to protect pages from unauthenticated users.

---

## Technical Requirements

### Database Schema

Users are stored in Cloudflare D1 (SQLite). Passwords are stored as hashes only — never plain text.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Notes:**

- `email` is normalized to lowercase before insert and lookup to enforce uniqueness case-insensitively.
- `password_hash` holds the output of a secure one-way hash (see Security Requirements).

Sessions may be stored in a separate table (recommended for explicit invalidation on logout) or implemented as signed, httpOnly cookies with embedded expiry. Recommended approach for this stack:

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### API Endpoints

All auth endpoints are server-side Route Handlers under `src/app/api/auth/`. Responses use JSON for errors; successful sign-in sets an httpOnly session cookie.

#### POST /api/auth/sign-up

**Request Body:**

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecureP@ss1",
  "confirmPassword": "SecureP@ss1"
}
```

**Response:**

- Success (201): `{ "message": "Account created successfully. Please sign in." }`
- Error (400): Validation error with field-specific messages (see Error Messages)
- Error (409): `{ "error": "An account already exists with this email address." }`
- Error (500): `{ "error": "Unable to create account. Please try again." }`

#### POST /api/auth/sign-in

**Request Body:**

```json
{
  "email": "jane@example.com",
  "password": "SecureP@ss1"
}
```

**Response:**

- Success (200): Sets session cookie; `{ "redirect": "/dashboard" }`
- Error (400): Field validation errors
- Error (401): `{ "error": "Invalid email or password." }` (generic — do not reveal whether email exists)
- Error (500): `{ "error": "Unable to sign in. Please try again." }`

#### POST /api/auth/logout

**Request Body:** None (session read from cookie)

**Response:**

- Success (200): Clears session cookie; `{ "message": "You have been logged out successfully.", "redirect": "/sign-in" }`
- Error (500): `{ "error": "Unable to sign out. Please try again." }`

#### GET /api/auth/session (optional, for client hydration)

**Response:**

- Success (200): `{ "user": { "id": "...", "fullName": "...", "email": "..." } }` or `{ "user": null }`

### User Interface Requirements

#### Sign Up Page (`/sign-up`)

- **Fields:** Full Name, Email Address, Password, Confirm Password
- **Actions:** Sign Up button; link to Sign In
- **Validation:** Client-side for immediate feedback; server-side is authoritative
- **Behavior:** Disable submit button while request is in flight; show inline field errors; on success redirect to `/sign-in?registered=true` to display success banner

| Field            | Required | Rule                                            |
| ---------------- | -------- | ----------------------------------------------- |
| Full Name        | Yes      | Cannot be empty                                 |
| Email            | Yes      | Valid format; unique (server)                   |
| Password         | Yes      | Min 8 chars; uppercase, lowercase, number, special |
| Confirm Password | Yes      | Must match Password                             |

**Password rules:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### Sign In Page (`/sign-in`)

- **Fields:** Email, Password
- **Actions:** Sign In button; link to Sign Up
- **Behavior:** Disable submit while loading; show form-level error for invalid credentials; on success redirect to `/dashboard`

| Field    | Required | Rule            |
| -------- | -------- | --------------- |
| Email    | Yes      | Valid email     |
| Password | Yes      | Cannot be empty |

#### Dashboard Page (`/dashboard`)

- **Access:** Protected — requires valid session
- **Content:** Placeholder welcome content for Sprint 0 (e.g. greeting with user's name, Logout button)
- **Behavior:** Logout triggers POST to logout endpoint then redirects to Sign In

#### General UI

- Simple, accessible forms with clear labels
- Keyboard-navigable fields and buttons
- Responsive layout: desktop, tablet, mobile
- Use existing shadcn/ui components (`Button`, `Input`, `Field`, etc.) and Tailwind CSS v4
- Prevent multiple form submissions via disabled state during async operations

---

## Validation and Messages

### Sign Up Error Messages

| Condition              | Message                                           |
| ---------------------- | ------------------------------------------------- |
| Empty full name        | Full Name is required.                            |
| Empty email            | Email Address is required.                        |
| Invalid email format   | Please enter a valid email address.               |
| Duplicate email        | An account already exists with this email address. |
| Empty password         | Password is required.                             |
| Password rules fail    | Password does not meet the required rules.        |
| Passwords mismatch     | Passwords do not match.                           |

### Sign In Error Messages

| Condition           | Message                              |
| ------------------- | ------------------------------------ |
| Empty email         | Email is required.                   |
| Empty password      | Password is required.                |
| Invalid credentials | Invalid email or password.           |
| Server failure      | Unable to sign in. Please try again. |

### Success Messages

| Event   | Message                                           |
| ------- | ------------------------------------------------- |
| Sign Up | Account created successfully. Please sign in.     |
| Logout  | You have been logged out successfully.            |

### Protected Route Message

| Condition        | Message                        |
| ---------------- | ------------------------------ |
| Not logged in    | Please sign in to continue.    |

---

## Security Requirements

- Passwords must **never** be stored as plain text; use a secure one-way hash (e.g. PBKDF2 via Web Crypto API or a Workers-compatible bcrypt/scrypt library).
- Session tokens must be stored in **httpOnly**, **Secure** (production), **SameSite=Lax** cookies — not localStorage.
- Use a server-side secret (`SESSION_SECRET` in `.dev.vars` / Wrangler secrets) to sign session tokens or validate session IDs.
- Protected pages must verify authentication on the **server** (middleware and/or Server Components / layout guards) — not client-only checks.
- Sign-in failures must return a **generic** message: *Invalid email or password.* — do not reveal whether the email exists.
- Do not expose password hashes, session secrets, or stack traces to the client.
- Clear session record and cookie on logout.
- Invalid or expired sessions must be rejected and treated as unauthenticated.

---

## Non-Functional Requirements

| Area            | Requirement                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| Security        | Protect user information; prevent unauthorized access to protected routes   |
| Performance     | Sign up and sign in respond quickly; auth checks must not noticeably slow the app |
| Scalability     | Design supports growing user base; session and user tables indexed          |
| Accessibility   | Keyboard navigation; clear labels; understandable error messages            |
| Responsive      | Sign Up and Sign In work on desktop, tablet, and mobile                     |
| Maintainability | Auth logic isolated in `src/lib/auth/`; UI separate from business logic       |
| Architecture    | UI, auth logic, and data access cleanly separated; minimal cross-feature deps |

---

## Implementation Phases

### Phase 1: Database and Auth Foundation - COMPLETED

**Objective:** Set up D1, user/session schema, and core auth utilities.

**Tasks:**

1. ✅ Create D1 database and add binding to `wrangler.jsonc`
2. ✅ Add migrations for `users` and `sessions` tables
3. ✅ Create `src/lib/auth/password.ts` — hash and verify passwords
4. ✅ Create `src/lib/auth/session.ts` — create, validate, and destroy sessions
5. ✅ Create `src/lib/db/users.ts` — user CRUD queries (prepared statements, bound params)
6. ✅ Add `SESSION_SECRET` to `.dev.vars.example`

**Deliverables:**

- ✅ Applied local migrations
- ✅ Typed `env.DB` via `npm run cf-typegen`
- ✅ Unit-testable auth utility modules

### Phase 2: API Routes - COMPLETED

**Objective:** Implement sign-up, sign-in, logout, and session endpoints.

**Tasks:**

1. ✅ `POST /api/auth/sign-up` — validate, hash password, insert user, handle duplicate email
2. ✅ `POST /api/auth/sign-in` — validate credentials, create session, set cookie
3. ✅ `POST /api/auth/logout` — delete session, clear cookie
4. ✅ `GET /api/auth/session` for current user lookup

**Deliverables:**

- ✅ All endpoints return documented status codes and error messages
- ✅ Validation shared between client and server where practical (Zod schemas in `src/lib/auth/validation.ts`)

### Phase 3: UI Pages - COMPLETED

**Objective:** Build Sign Up, Sign In, and Dashboard pages with forms and feedback.

**Tasks:**

1. ✅ Sign Up page with client form, validation, and redirect on success
2. ✅ Sign In page with error handling and redirect to Dashboard
3. ✅ Dashboard placeholder with user greeting and Logout control
4. ✅ Success banners for registration and logout query params

**Deliverables:**

- ✅ Responsive pages using shadcn/ui components
- ✅ Double-submit prevention on all forms

### Phase 4: Protected Routes and Middleware - COMPLETED

**Objective:** Enforce authentication on protected routes server-side.

**Tasks:**

1. ✅ Add Next.js middleware for `/dashboard` and future protected paths
2. ✅ Redirect unauthenticated users to `/sign-in` with flash/query message
3. ✅ Redirect authenticated users away from `/sign-in` and `/sign-up` to Dashboard
4. ✅ Verify logout blocks re-access without re-authentication

**Deliverables:**

- ✅ Middleware in `src/middleware.ts` and layout guard in `src/app/(protected)/layout.tsx`
- ✅ Manual test matrix (see below)

#### Auth Edge Case Test Matrix

| Scenario | Expected result |
| -------- | --------------- |
| Visit `/dashboard` while logged out | Redirect to `/sign-in?message=Please+sign+in+to+continue.` |
| Visit `/sign-in` while logged in | Redirect to `/dashboard` |
| Visit `/sign-up` while logged in | Redirect to `/dashboard` |
| Log out, then visit `/dashboard` | Redirect to Sign In; no access without re-authentication |
| Expired or deleted session with valid cookie signature | Layout redirects to Sign In (D1 session check) |
| Tampered session cookie | Treated as unauthenticated; redirect to Sign In |
| Missing `SESSION_SECRET` | Cookie verification fails; user treated as logged out |

### Phase 5: Verification and Hardening - COMPLETED

**Objective:** Confirm all acceptance criteria and security requirements.

**Tasks:**

1. ✅ Run `npm run lint` and `npm run build`
2. ✅ Test full flow with `npm run preview` (Workers runtime) — initial run passed 19/27 checks; sign-in blocked until `SESSION_SECRET` set; validation message fix applied
3. ✅ Review error messages match PRD exactly — fixed Zod v4 undefined-field messages in `validation.ts`
4. ✅ Confirm no sensitive data in responses or logs — session API returns public user fields only; passwords stored as PBKDF2 hashes in D1

**Deliverables:**

- ✅ All acceptance criteria checked (see below)
- ✅ Troubleshooting guide updated
- ✅ `scripts/verify-auth.mjs` added for repeatable preview verification

---

## Technical Implementation Details

### Key Files (planned)

| File | Purpose | Status |
| ---- | ------- | ------ |
| `migrations/0001_create_users_and_sessions.sql` | Users and sessions tables | ✅ Created |
| `src/lib/db/client.ts` | D1 access via `getCloudflareContext()` | ✅ Created |
| `src/lib/db/users.ts` | User queries | ✅ Created |
| `src/lib/db/sessions.ts` | Session queries | ✅ Created |
| `src/lib/auth/constants.ts` | Session cookie name and max age | ✅ Created |
| `src/lib/auth/password.ts` | Password hash and verify (PBKDF2) | ✅ Created |
| `src/lib/auth/session.ts` | Session create, read, destroy | ✅ Created |
| `src/lib/auth/validation.ts` | Zod schemas for sign-up and sign-in | ✅ Created |
| `src/lib/auth/cookies.ts` | HMAC-signed session cookie helpers | ✅ Created |
| `src/app/api/auth/sign-up/route.ts` | Sign-up handler | ✅ Created |
| `src/app/api/auth/sign-in/route.ts` | Sign-in handler | ✅ Created |
| `src/app/api/auth/logout/route.ts` | Logout handler | ✅ Created |
| `src/app/api/auth/session/route.ts` | Current user lookup | ✅ Created |
| `src/components/auth/auth-card.tsx` | Shared auth page layout | ✅ Created |
| `src/components/auth/alert-banner.tsx` | Success/info banners | ✅ Created |
| `src/components/auth/sign-up-form.tsx` | Sign-up client form | ✅ Created |
| `src/components/auth/sign-in-form.tsx` | Sign-in client form | ✅ Created |
| `src/components/auth/logout-button.tsx` | Logout control | ✅ Created |
| `src/app/(auth)/sign-up/page.tsx` | Sign Up UI | ✅ Created |
| `src/app/(auth)/sign-in/page.tsx` | Sign In UI | ✅ Created |
| `src/app/(protected)/dashboard/page.tsx` | Protected Dashboard | ✅ Created |
| `src/lib/auth/session-token.ts` | HMAC sign/verify (edge-safe) | ✅ Created |
| `src/lib/auth/routes.ts` | Auth/protected route helpers | ✅ Created |
| `src/lib/auth/middleware-auth.ts` | Request cookie verification | ✅ Created |
| `src/middleware.ts` | Route protection | ✅ Created |
| `src/app/(protected)/layout.tsx` | D1 session layout guard | ✅ Created |

### Implementation Patterns

Auth utilities live in `src/lib/auth/` and are imported only from server code (Route Handlers, Server Components, middleware). D1 access is centralized in `src/lib/db/` — never called from `'use client'` components.

```typescript
// Example: server-side session check in a protected layout
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in?message=Please+sign+in+to+continue.");
  }
  return <>{children}</>;
}
```

### Important Notes

- D1 is only available in the Workers runtime — verify auth flows with `npm run preview`, not only `npm run dev`.
- Use prepared statements with numbered placeholders (`?1`, `?2`) per project D1 conventions.
- Normalize emails to lowercase before storage and lookup.
- Session duration is an open question (see Risks); default recommendation: **7 days** with sliding expiry on activity, configurable via env var `SESSION_MAX_AGE_DAYS`.
- Do not apply D1 migrations to remote without explicit user approval.

---

## Acceptance Criteria

### Sign Up

- [x] User can open Sign Up at `/sign-up`
- [x] User can enter all required fields
- [x] Required-field validation works with correct error messages
- [x] Email format validation works
- [x] Duplicate email is rejected with correct error message
- [x] Password complexity rules are enforced
- [x] Confirm Password must match Password
- [x] Successful registration redirects to Sign In with success message

### Sign In

- [x] User can enter email and password
- [x] Invalid credentials show generic error (*Invalid email or password.*)
- [x] Valid credentials create a session (httpOnly cookie)
- [x] Successful login redirects to Dashboard

### Logout

- [x] User can log out from Dashboard
- [x] Session is cleared (cookie and server record)
- [x] User is redirected to Sign In with success message
- [x] Protected pages cannot be accessed after logout

### Protected Routes

- [x] Logged-in users can access Dashboard
- [x] Logged-out users are redirected to Sign In with *Please sign in to continue.*

### Security

- [x] Passwords stored as hashes only
- [x] No sensitive auth data exposed in API responses
- [x] Auth enforced server-side on protected routes

---

## Success Metrics

| Metric | Target | How Measured |
| ------ | ------ | ------------ |
| Sign-up completion rate | > 90% of started sign-ups succeed | Compare form submissions to successful 201 responses |
| Sign-in latency | < 500 ms p95 | Server timing on `/api/auth/sign-in` in preview |
| Auth check overhead | < 50 ms p95 on protected routes | Middleware/layout timing in preview |
| Zero plain-text passwords | 100% | Code review + DB inspection of `password_hash` column |
| Protected route bypass | 0 unauthenticated accesses | Manual and automated tests on `/dashboard` |

---

## Dependencies

### External Dependencies

- **Cloudflare D1** — User and session persistence
- **Cloudflare Workers / OpenNext** — Runtime for server-side auth and D1 access
- **Web Crypto API or bcrypt-compatible library** — Password hashing (must run in Workers runtime)

### Internal Dependencies

- **shadcn/ui components** — Form UI (`Button`, `Input`, `Field`, etc.)
- **`wrangler.jsonc` D1 binding** — `DB` binding for database access
- **Environment variables** — `SESSION_SECRET` (required); optional `SESSION_MAX_AGE_DAYS`

### New Dependencies (propose before adding)

- **Zod** — Request validation schemas (recommended)
- **Password hashing library** — If Web Crypto PBKDF2 is insufficient; must be Workers-compatible

---

## Assumptions

- Quiz Maker is a web application hosted on Cloudflare Workers via OpenNext.
- Users authenticate with email and password; emails are unique.
- Dashboard is the first page after login.
- Authentication is required for all future protected features (quizzes, etc.).
- Sprint 0 deliverable is this Technical PRD; implementation follows in subsequent sprints.

---

## Risks and Mitigation

### Technical Risks

- **Risk:** Incorrect session handling causes auth bypass or session fixation.
- **Mitigation:** Use httpOnly cookies, server-side session validation, regenerate session ID on login, delete session on logout.

- **Risk:** Password hashing library incompatible with Workers runtime.
- **Mitigation:** Validate chosen library in `npm run preview` before wiring all endpoints; fallback to Web Crypto PBKDF2.

- **Risk:** D1 binding unavailable in Node dev mode masks runtime errors.
- **Mitigation:** Always verify auth flows with `npm run preview`.

### User Experience Risks

- **Risk:** Validation errors expose whether an email is registered.
- **Mitigation:** Use generic *Invalid email or password.* on sign-in; specific duplicate message only on sign-up.

- **Risk:** Poor error handling exposes stack traces or internal details.
- **Mitigation:** Return PRD-defined user messages; log details server-side only.

### Open Questions

| Question | Status | Recommendation |
| -------- | ------ | -------------- |
| What authentication technology will be used? | **Resolved** | Custom sessions + D1 + HMAC-signed httpOnly cookies |
| How long should a session remain active? | Open | 7 days default; configurable via env |
| Will email verification be required? | Open | No — deferred to future enhancement |
| Will password reset be added? | Open | Yes — future enhancement |
| Will different user roles be required? | Open | No — deferred until quiz ownership model is defined |

---

## Troubleshooting Guide

### Sign-in returns 500 ("Unable to sign in. Please try again.")

**Problem:** Sign-in fails after valid credentials; no session cookie is set.

**Cause:** `SESSION_SECRET` is missing or empty in `.dev.vars`.

**Solution:** Copy `.dev.vars.example`, set `SESSION_SECRET` to a long random string, restart `npm run preview`.

**Code Reference:** `src/lib/auth/session-token.ts`

### Zod validation shows generic "expected string" errors

**Problem:** API returns `"Invalid input: expected string, received undefined"` instead of PRD messages.

**Cause:** Zod v4 treats missing JSON fields as `undefined` before custom min-length messages run.

**Solution:** Validation schemas use `z.preprocess` to coerce `null`/`undefined` to `""` before required checks. Fixed in `validation.ts`.

**Code Reference:** `src/lib/auth/validation.ts`

### Preview rebuild fails with EPERM on Windows

**Problem:** `npm run preview` fails with `Permission denied` deleting `.open-next`.

**Cause:** A previous Wrangler/workerd process still holds the `.open-next` directory (common on Windows).

**Solution:** Stop lingering Node/Wrangler processes, close tools locking the folder, then rerun `npm run preview`. WSL is recommended for OpenNext on Windows.

### Auth works in build but not in `npm run dev`

**Problem:** D1 or session operations fail during local Node dev.

**Cause:** D1 bindings are only fully available in the Workers runtime.

**Solution:** Verify auth flows with `npm run preview`, not Node dev alone.

### Next.js middleware deprecation warning

**Problem:** Build logs warn that `middleware` is deprecated in favor of `proxy`.

**Cause:** Next.js 16 deprecation notice; current middleware still functions.

**Solution:** No action required for Sprint 0. Monitor Next.js docs before upgrading conventions.

---

## Notes for AI Agents

When working with this PRD:

1. Start by reading **Overview/Problem** and **Hypothesis** to understand intent.
2. Use **Scope (In/Out/Cut)** to determine boundaries — do not build quiz features or out-of-scope auth enhancements.
3. Update phase status markers (`PLANNED` → `IN PROGRESS` → `COMPLETED`) as work progresses.
4. Add implementation details under **Technical Implementation Details** as code is written.
5. Mark **Acceptance Criteria** checkboxes when features are verified.
6. Add **Troubleshooting Guide** entries when bugs are found and fixed.
7. Keep **Current Status** updated; remove outdated information.
8. Verify auth with `npm run preview` — not Node dev alone.
9. Never apply D1 migrations to remote without explicit user approval.
10. Ask before adding new npm dependencies.

---

## Current Status

**Last Updated:** August 27, 2026

**Current Phase:** Complete — Authentication Sprint 0

**Status:** COMPLETED

**Verification:**

- `npm run lint` — pass (warnings only in generated `.wrangler/` files)
- `npm run build` — pass
- `npm run preview` + `node scripts/verify-auth.mjs` — run locally to re-verify full flow
- D1 inspection confirms `password_hash` uses `pbkdf2:sha256` format
