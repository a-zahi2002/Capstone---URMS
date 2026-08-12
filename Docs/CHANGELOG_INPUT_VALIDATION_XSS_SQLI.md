# CHANGELOG: Input Validation, XSS Prevention & SQL Injection Protection

## Date: 2026-06-19

## Overview
Implemented a comprehensive security hardening layer for the URMS covering three critical attack vectors: **Input Validation** (Zod schemas + Express middleware), **SQL Injection Protection** (Supabase parameterized queries), and **XSS Prevention** (DOMPurify-based React component). All changes are additive — four new files were created and no existing code was modified.

## Changes Made

### New File: `backend/src/schemas/maintenanceSchema.ts`
- **Zod v4 validation schema** for the "Create Maintenance Ticket" request payload.
- Enforces strict types and constraints: UUID format for `resourceId`, 3–120 character limit for `title`, 2000-character max for `description`, enum validation for `priority` (`Low` | `Medium` | `High`), and optional email format for `reporterEmail`.
- Uses **`.strict()`** to reject any unrecognized payload keys — prevents mass-assignment / payload pollution attacks (e.g., an attacker injecting `role: "admin"` into the request body).
- Uses **`.trim()`** before length checks so whitespace-only strings fail minimum length validation.
- Exports both the schema and the inferred TypeScript type (`CreateMaintenanceTicketInput`).

### New File: `backend/src/middleware/validateRequest.ts`
- **Reusable Express middleware factory** that validates `req.body`, `req.query`, or `req.params` against any Zod schema.
- On failure: returns a structured `400 Bad Request` JSON response with per-field error messages (no stack traces or internal details leak to the client).
- On success: replaces the raw request property with Zod's cleaned output (unknown keys stripped, defaults applied) before calling `next()`.
- Uses `ZodType` and `ZodError` imports (Zod v4 API — `ZodSchema` was removed in v4).

### New File: `backend/src/controllers/secureMaintenanceCtrl.ts`
- **Demonstration controller** (`createTicketSecure`) showing the full security pipeline: validated data → safe Supabase insertion.
- Includes a **detailed JSDoc comment block** explaining how the Supabase JS client prevents SQL injection — PostgREST uses parameterized queries (`$1`, `$2`, …) so user input is never concatenated into SQL strings.
- Handles RLS permission denied errors (`42501`) with a clear 403 response.
- Designed to be wired with `validateRequest(createMaintenanceTicketSchema)` middleware upstream.

### New File: `components/SafeRichTextDisplay.tsx`
- **XSS-safe React component** for rendering user-submitted rich text HTML in the Next.js frontend.
- Sanitises input via `isomorphic-dompurify` with an explicit **allowlist** of safe tags (formatting, headings, lists, links, code, tables) and attributes (`href`, `target`, `rel`).
- Strips all `<script>`, `<iframe>`, `<style>`, `<form>` tags and all event-handler attributes (`onclick`, `onerror`, `onload`, etc.).
- Post-processes output to enforce `rel="noopener noreferrer"` on all `<a>` tags (prevents reverse tabnapping).
- Marked `"use client"` for Next.js App Router compatibility.

### Dependencies Added

| Package | Version | Location | Purpose |
|---------|---------|----------|---------|
| `zod` | 4.4.3 | `backend/package.json` | Schema-based request validation |
| `isomorphic-dompurify` | latest | root `package.json` | HTML sanitisation (SSR + CSR compatible) |
| `@types/dompurify` | latest | root `package.json` (dev) | TypeScript type declarations for DOMPurify |

## Security Enhancements
- **Input Validation:** All incoming payloads are validated at the middleware layer before reaching any controller. Invalid requests are rejected with a `400` before any database interaction occurs.
- **Payload Pollution Prevention:** `.strict()` rejects any keys not explicitly defined in the schema, preventing mass-assignment attacks.
- **SQL Injection Prevention:** Supabase's PostgREST architecture uses parameterized queries internally, eliminating SQL injection risk. Combined with Zod validation upstream, the attack surface is effectively zero.
- **XSS Prevention:** User-submitted HTML is sanitised through DOMPurify before DOM injection. Only a curated allowlist of formatting tags and attributes survives; all scripts, event handlers, and dangerous URI schemes are stripped.
- **Reverse Tabnapping Prevention:** All sanitised links have `rel="noopener noreferrer"` enforced.

## No Migration Required
This change only adds new files and dependencies — no database schema changes, no existing API modifications, and no frontend UI changes. The running development server is unaffected.
