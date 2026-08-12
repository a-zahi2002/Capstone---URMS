# Input Validation, XSS Prevention & SQL Injection Protection — Documentation

## Overview
This document explains the **Input Validation**, **XSS (Cross-Site Scripting) Prevention**, and **SQL Injection Protection** implementation in the University Resource Management System (URMS). These three security layers work together to ensure that untrusted user input is validated, sanitised, and safely processed at every point in the stack.

## 1. Architecture Overview

The security hardening is applied at **three layers:**

1. **Express Middleware (Zod Validation):** Validates and cleans all incoming request payloads before they reach any controller logic.
2. **Supabase Data Layer (Parameterized Queries):** The Supabase JS client uses PostgREST, which automatically uses parameterized queries to prevent SQL injection.
3. **React Frontend (DOMPurify):** User-submitted rich text HTML is sanitised via DOMPurify before rendering with `dangerouslySetInnerHTML`.

### Security Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                   REQUEST VALIDATION PIPELINE                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Client (Browser)                                                    │
│    │                                                                 │
│    ├── POST /api/maintenance-tickets                                 │
│    │       Body: { title, resourceId, priority, ... }                │
│    │                                                                 │
│    ▼                                                                 │
│  Express Middleware Stack                                            │
│    │                                                                 │
│    ├── 1. verifyToken         → Authenticate user (Firebase JWT)     │
│    ├── 2. validateRequest()   → Parse body against Zod schema        │
│    │       ├── ✅ Valid        → Replace req.body with cleaned data   │
│    │       └── ❌ Invalid     → Return 400 + field-level errors      │
│    │                                                                 │
│    ▼                                                                 │
│  Controller (secureMaintenanceCtrl.ts)                               │
│    │                                                                 │
│    ├── 3. req.body is now type-safe (CreateMaintenanceTicketInput)   │
│    │                                                                 │
│    ▼                                                                 │
│  Supabase Client                                                     │
│    │                                                                 │
│    ├── 4. supabase.from('maintenance_tickets').insert({...})         │
│    │       → HTTP POST (JSON) to PostgREST                           │
│    │       → PostgREST uses parameterized query: INSERT ... ($1,$2)  │
│    │       → User input is NEVER in the SQL string                   │
│    │                                                                 │
│    ▼                                                                 │
│  PostgreSQL                                                          │
│    └── 5. Data safely inserted with bound parameters                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     XSS PREVENTION FLOW                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Database                                                            │
│    │                                                                 │
│    ├── ticket.description = "<b>Bold</b><script>alert(1)</script>"   │
│    │                                                                 │
│    ▼                                                                 │
│  SafeRichTextDisplay Component                                       │
│    │                                                                 │
│    ├── 1. Receive unsafeHtml prop                                    │
│    ├── 2. DOMPurify.sanitize(unsafeHtml, { ALLOWED_TAGS, ... })     │
│    │       → "<b>Bold</b>"  (script tag stripped)                    │
│    ├── 3. Post-process: add rel="noopener noreferrer" to <a> tags   │
│    │                                                                 │
│    ▼                                                                 │
│  React DOM                                                           │
│    └── 4. <div dangerouslySetInnerHTML={{ __html: safeHtml }} />     │
│           → Only safe formatting rendered, no XSS vectors            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Why These Protections?

| Attack Vector | Risk | Mitigation |
|---|---|---|
| **Missing Input Validation** | Malformed or malicious payloads crash controllers, corrupt data, or bypass business logic | Zod schema validation rejects invalid input at the middleware layer before any logic executes |
| **Payload Pollution** | Attacker sends extra keys like `role: "admin"` or `isVerified: true` to escalate privileges | `.strict()` on Zod schema rejects any unrecognised keys |
| **SQL Injection** | Attacker injects SQL syntax (`'; DROP TABLE --`) into input fields to manipulate database queries | Supabase/PostgREST uses parameterized queries — user input is always bound as parameters, never concatenated into SQL |
| **Cross-Site Scripting (XSS)** | Attacker injects `<script>` tags or event handlers (`onerror=alert(1)`) into stored content that executes when other users view it | DOMPurify strips all dangerous tags, attributes, and URI schemes before DOM rendering |
| **Reverse Tabnapping** | Links with `target="_blank"` allow the opened page to access `window.opener` and redirect the original page | All sanitised links enforce `rel="noopener noreferrer"` |

---

## 3. Files Created

| File | Layer | Purpose |
|---|---|---|
| `backend/src/schemas/maintenanceSchema.ts` | Backend | Zod schema defining the valid shape of a maintenance ticket creation payload |
| `backend/src/middleware/validateRequest.ts` | Backend | Reusable Express middleware factory for Zod-based request validation |
| `backend/src/controllers/secureMaintenanceCtrl.ts` | Backend | Demonstration controller showing the complete validation → Supabase insertion pipeline |
| `components/SafeRichTextDisplay.tsx` | Frontend | React component that sanitises HTML via DOMPurify before DOM injection |

---

## 4. Input Validation — Zod Schema

### Schema Definition (`backend/src/schemas/maintenanceSchema.ts`)

The schema defines the exact shape of a valid "Create Maintenance Ticket" payload:

```typescript
export const createMaintenanceTicketSchema = z
    .object({
        resourceId: z
            .string({ error: 'resourceId is required and must be a string' })
            .uuid({ message: 'resourceId must be a valid UUID' }),

        title: z
            .string({ error: 'title is required and must be a string' })
            .trim()
            .min(3, { message: 'title must be at least 3 characters' })
            .max(120, { message: 'title must be at most 120 characters' }),

        description: z
            .string({ error: 'description must be a string' })
            .trim()
            .max(2000, { message: 'description must be at most 2000 characters' })
            .default(''),

        priority: z.enum(['Low', 'Medium', 'High'], {
            error: 'priority is required and must be one of: Low, Medium, High',
        }),

        reporterEmail: z
            .string({ error: 'reporterEmail must be a string' })
            .email({ message: 'reporterEmail must be a valid email address' })
            .optional(),
    })
    .strict();
```

### Field Validation Rules

| Field | Type | Required | Constraints |
|---|---|---|---|
| `resourceId` | `string` | Yes | Must be a valid UUID format (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`) |
| `title` | `string` | Yes | Trimmed, 3–120 characters |
| `description` | `string` | No | Trimmed, max 2000 characters, defaults to `""` |
| `priority` | `enum` | Yes | Must be exactly `"Low"`, `"Medium"`, or `"High"` |
| `reporterEmail` | `string` | No | Must be a valid email format if provided |

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **`.strict()`** | Rejects unrecognised keys. Without this, an attacker could send `{ title: "...", role: "admin" }` and the extra `role` key would pass through unchecked to downstream logic |
| **`.trim()` before `.min()`** | A string of only spaces (e.g., `"   "`) is trimmed to `""` which then fails the `min(3)` check. Prevents whitespace-only submissions |
| **No type coercion** | Callers must send correctly-typed values. `"123"` is not silently coerced to `123`. This prevents subtle type confusion bugs |
| **Zod v4 `error` syntax** | This project installs Zod v4.4.3 which uses `{ error: "..." }` instead of the v3 `{ required_error: "...", invalid_type_error: "..." }` keys |
| **Exported TypeScript type** | `CreateMaintenanceTicketInput` is inferred from the schema via `z.infer<>`, so the type and validation rules can never drift apart |

---

## 5. Validation Middleware

### Middleware Factory (`backend/src/middleware/validateRequest.ts`)

```typescript
export function validateRequest(
    schema: ZodType,
    source: 'body' | 'query' | 'params' = 'body'
)
```

**Parameters:**
- `schema` — Any Zod schema (`z.object(...)`, `z.array(...)`, etc.)
- `source` — Which part of the request to validate. Defaults to `'body'`

### On Validation Failure (400 Bad Request)

```json
{
    "status": "error",
    "message": "Validation failed",
    "errors": [
        { "field": "title", "message": "title must be at least 3 characters" },
        { "field": "priority", "message": "priority is required and must be one of: Low, Medium, High" },
        { "field": "(root)", "message": "Unrecognized key: \"hackerField\"" }
    ]
}
```

**Security properties:**
- No stack traces or internal error details are exposed to the client
- Every invalid field is listed with a specific, human-readable message
- The `(root)` field name is used for schema-level errors (e.g., unrecognised keys from `.strict()`)

### On Validation Success

The middleware replaces `req[source]` (e.g., `req.body`) with the **cleaned** output from `schema.safeParse()`. This means:
- Unknown keys are already stripped (even without `.strict()`, Zod strips unknown keys by default in `.parse()`)
- Default values (e.g., `description` defaults to `""`) are applied
- Whitespace is trimmed on `.trim()` fields
- Downstream handlers receive **only** validated, type-safe data

### Usage Pattern (Route Wiring)

```typescript
import { validateRequest } from '../middleware/validateRequest';
import { createMaintenanceTicketSchema } from '../schemas/maintenanceSchema';
import { createTicketSecure } from '../controllers/secureMaintenanceCtrl';
import { verifyToken } from '../middleware/auth.middleware';

// Middleware order: auth → validation → controller
router.post(
    '/secure',
    verifyToken,
    validateRequest(createMaintenanceTicketSchema),
    createTicketSecure
);
```

### Extending to Other Routes

The middleware is fully generic — it works with any Zod schema and any request source:

```typescript
// Validate query parameters
router.get('/search', validateRequest(searchSchema, 'query'), searchHandler);

// Validate URL parameters
router.get('/:id', validateRequest(idSchema, 'params'), getByIdHandler);
```

---

## 6. SQL Injection Protection

### How Supabase Prevents SQL Injection

The Supabase JavaScript client (`@supabase/supabase-js`) does **not** construct raw SQL strings. The data flow is:

```
┌─────────────────┐      HTTP POST (JSON)      ┌────────────────┐      Parameterized SQL      ┌────────────┐
│  Supabase Client │  ─────────────────────────▶ │   PostgREST    │  ──────────────────────────▶ │ PostgreSQL │
│  (JavaScript)    │   { "title": userInput }    │ (REST → SQL)   │   INSERT ... VALUES ($1)    │  (Database) │
└─────────────────┘                              └────────────────┘                              └────────────┘
```

1. The client sends a **JSON payload** via HTTP to PostgREST (Supabase's REST API layer)
2. PostgREST translates the JSON into a **parameterized SQL query** using prepared statements
3. User input is **bound as query parameters** (`$1`, `$2`, …) — never concatenated into the SQL string
4. Characters like `'`, `"`, `--`, `;`, `DROP TABLE` are treated as **literal data values**, not SQL syntax

### Example: Safe Insert

```typescript
// This is safe — title value is NEVER in the SQL string
const { data, error } = await req.supabase
    .from('maintenance_tickets')
    .insert({
        resource_id: validatedData.resourceId,
        title:       validatedData.title,       // Even if this is "'; DROP TABLE users; --"
        description: validatedData.description,
        priority:    validatedData.priority,
        status:      'OPEN',
        created_by:  req.user.uid,
    })
    .select('id')
    .single();
```

PostgREST internally executes:
```sql
INSERT INTO maintenance_tickets (resource_id, title, description, priority, status, created_by)
VALUES ($1, $2, $3, $4, $5, $6)
-- $2 = "'; DROP TABLE users; --"  ← treated as a literal string value
```

### Defense-in-Depth

| Layer | What It Catches |
|---|---|
| **Zod Validation** | Rejects malformed input (wrong types, missing fields, extra keys) before it ever reaches the database layer |
| **PostgREST Parameterized Queries** | Even if malicious SQL syntax passes validation, it is always bound as a parameter and treated as data |
| **Supabase RLS Policies** | Row Level Security adds a third layer — even if data is inserted, RLS policies control who can read/modify it |

---

## 7. XSS Prevention

### The Problem

The URMS displays user-submitted content that may include rich text formatting (bold, italic, lists). React's default JSX rendering escapes all HTML, which strips formatting. Using `dangerouslySetInnerHTML` directly re-enables formatting but also opens the door to XSS attacks:

```typescript
// ❌ UNSAFE — script tag executes
<div dangerouslySetInnerHTML={{
    __html: '<b>Bold</b><script>document.cookie</script>'
}} />
```

### The Solution: SafeRichTextDisplay Component (`components/SafeRichTextDisplay.tsx`)

```typescript
// ✅ SAFE — script tag stripped by DOMPurify
<SafeRichTextDisplay
    unsafeHtml='<b>Bold</b><script>document.cookie</script>'
    className="prose text-sm"
/>
// Renders: <div class="prose text-sm"><b>Bold</b></div>
```

### Sanitisation Configuration

**Allowed Tags (formatting only):**

| Category | Tags |
|---|---|
| Text formatting | `b`, `i`, `em`, `strong`, `u`, `s`, `mark`, `small`, `sub`, `sup` |
| Headings | `h1`, `h2`, `h3`, `h4`, `h5`, `h6` |
| Block elements | `p`, `br`, `hr`, `blockquote`, `pre` |
| Lists | `ul`, `ol`, `li` |
| Links | `a` |
| Code | `code` |
| Tables | `table`, `thead`, `tbody`, `tr`, `th`, `td` |

**Allowed Attributes:**

| Attribute | Purpose |
|---|---|
| `href` | Link destination for `<a>` tags |
| `target` | Open links in new tab (`_blank`) |
| `rel` | Security attribute for links |

**Everything else is stripped**, including:
- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<input>` tags
- All event-handler attributes: `onclick`, `onerror`, `onload`, `onmouseover`, etc.
- `javascript:` and `data:` URI schemes in `href` attributes

### XSS Vectors Blocked

| Attack Vector | Input | Sanitised Output |
|---|---|---|
| Script injection | `<script>alert('xss')</script>` | *(removed entirely)* |
| Event handler | `<img src=x onerror=alert(1)>` | *(removed entirely — `img` not in allowlist)* |
| JavaScript URI | `<a href="javascript:alert(1)">click</a>` | `<a rel="noopener noreferrer">click</a>` |
| Iframe injection | `<iframe src="evil.com"></iframe>` | *(removed entirely)* |
| CSS injection | `<style>body{display:none}</style>` | *(removed entirely)* |
| Attribute injection | `<div onmouseover="alert(1)">hover</div>` | `hover` *(div not in allowlist, text preserved)* |

### Component Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `unsafeHtml` | `string` | Yes | — | The raw, untrusted HTML string to sanitise and render |
| `className` | `string` | No | `''` | CSS class name(s) for the wrapper element |
| `as` | `keyof JSX.IntrinsicElements` | No | `'div'` | HTML element to use as the wrapper (e.g., `'article'`, `'section'`) |

### Usage Examples

```tsx
// Basic usage — maintenance ticket description
<SafeRichTextDisplay
    unsafeHtml={ticket.description}
    className="prose text-sm text-slate-700"
/>

// Custom wrapper element
<SafeRichTextDisplay
    unsafeHtml={announcement.body}
    className="prose prose-sm max-w-none"
    as="article"
/>

// Returns null if input is empty/falsy — no empty div rendered
<SafeRichTextDisplay unsafeHtml="" />
```

---

## 8. Dependencies

| Package | Version | Location | Purpose |
|---|---|---|---|
| `zod` | 4.4.3 | `backend/package.json` | Schema-based request validation with TypeScript type inference |
| `isomorphic-dompurify` | latest | root `package.json` | HTML sanitisation compatible with both SSR (Node.js/jsdom) and CSR (browser) |
| `@types/dompurify` | latest | root `package.json` (dev) | TypeScript type declarations for DOMPurify |

---

## 9. Setup Instructions

### Step 1 — Install Backend Dependencies

```bash
cd backend
npm install
```

`zod` is already listed in `backend/package.json`.

### Step 2 — Install Frontend Dependencies

```bash
# From project root
npm install
```

`isomorphic-dompurify` and `@types/dompurify` are already listed in the root `package.json`.

### Step 3 — Restart the Development Server

```bash
npm run dev
```

### Step 4 — Verify TypeScript Compilation

```bash
cd backend
npx tsc --noEmit
# Should complete with zero errors
```

---

## 10. Security Considerations

### Validation Middleware Security
- The middleware uses `safeParse()` (not `parse()`) — validation failures are handled gracefully without throwing exceptions
- Error responses include field-level messages but no stack traces, internal paths, or system information
- The raw `req.body` is **replaced** with Zod's cleaned output — downstream handlers cannot accidentally access unvalidated data

### Strict Schema Security
- `.strict()` mode causes the schema to **reject** payloads with unrecognised keys (rather than silently stripping them). This makes attacks visible in error responses and logs
- Without `.strict()`, an attacker sending `{ title: "...", isAdmin: true }` would have `isAdmin` silently stripped but the request would succeed. With `.strict()`, the entire request is rejected

### DOMPurify Security
- DOMPurify is one of the most battle-tested HTML sanitisation libraries, used by Mozilla, Google, and thousands of production applications
- `isomorphic-dompurify` wraps DOMPurify to work in both Node.js (using jsdom) and browser environments, which is required for Next.js server-side rendering
- The component is marked `"use client"` because DOMPurify relies on DOM APIs

### Interaction with Existing Security
- **Firebase Auth:** No impact. The `verifyToken` middleware runs before `validateRequest` — authentication is verified first, then input is validated
- **RBAC:** No impact. Role-based access checks in controllers (e.g., `isStaffOrAdmin()`) continue to work identically — they receive the same `req.user` object
- **CORS:** No impact. CORS headers are set before any route middleware executes
- **Helmet / HSTS:** No impact. HTTP security headers are independent of request body validation

---

## 11. Limitations & Future Improvements

1. **Schema coverage:** Currently, only the "Create Maintenance Ticket" payload has a Zod schema. The `validateRequest` middleware is designed to be reusable — future work should add schemas for bookings, resources, user updates, and other endpoints.

2. **No rate limiting:** Input validation prevents malformed requests but does not limit the volume of valid requests. Consider adding rate limiting middleware (e.g., `express-rate-limit`) to prevent abuse.

3. **No Content-Security-Policy:** The XSS component protects against stored XSS in rich text, but a CSP header would provide broader protection against all forms of script injection. This can be added as a separate enhancement.

4. **Rich text editor integration:** The `SafeRichTextDisplay` component handles output sanitisation (displaying content). If the URMS adds a rich text editor (e.g., TipTap, Quill), input sanitisation should also be applied when saving content to the database.

---

## 12. Author & Date

- **Feature implemented:** 2026-06-19
- **Scope:** Input validation (Zod + Express middleware), SQL injection documentation (Supabase), XSS prevention (DOMPurify + React)
- **Backend:** New schema, middleware, and controller files in `backend/src/`
- **Frontend:** New `SafeRichTextDisplay` component in `components/`
- **Existing files modified:** None
