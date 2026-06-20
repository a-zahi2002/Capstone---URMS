/**
 * maintenanceSchema.ts
 * ─────────────────────────────────────────────────────────────
 * Zod validation schema for the "Create Maintenance Ticket"
 * request payload.
 *
 * Key security features:
 *   • `.strict()` — rejects any keys not defined in the schema,
 *     preventing payload pollution / mass-assignment attacks.
 *   • Type coercion is intentionally NOT used so that callers
 *     must send correctly-typed values (no silent "123" → 123).
 *   • `.trim()` on string fields strips leading/trailing
 *     whitespace before length checks run.
 *
 * NOTE: This project uses Zod v4, which uses `error` / `message`
 *       for custom error strings (not the v3 `required_error` /
 *       `invalid_type_error` keys).
 * ─────────────────────────────────────────────────────────────
 */
import { z } from 'zod';

/**
 * Schema for creating a new maintenance ticket.
 *
 * Expected payload:
 * {
 *   resourceId:    string  (UUID)           — required
 *   title:         string  (3–120 chars)    — required
 *   description:   string  (≤ 2000 chars)   — optional, defaults to ""
 *   priority:      "Low" | "Medium" | "High" — required
 *   reporterEmail: string  (valid email)    — optional
 * }
 */
export const createMaintenanceTicketSchema = z
    .object({
        /** UUID of the resource this ticket targets. */
        resourceId: z
            .string({ error: 'resourceId is required and must be a string' })
            .uuid({ message: 'resourceId must be a valid UUID' }),

        /** Short summary of the issue (3–120 characters). */
        title: z
            .string({ error: 'title is required and must be a string' })
            .trim()
            .min(3, { message: 'title must be at least 3 characters' })
            .max(120, { message: 'title must be at most 120 characters' }),

        /** Detailed description of the issue. Optional, defaults to "". */
        description: z
            .string({ error: 'description must be a string' })
            .trim()
            .max(2000, { message: 'description must be at most 2000 characters' })
            .default(''),

        /** Ticket priority level. Must be one of the allowed enum values. */
        priority: z.enum(['Low', 'Medium', 'High'], {
            error: 'priority is required and must be one of: Low, Medium, High',
        }),

        /** Optional contact email of the reporter. Validated for format. */
        reporterEmail: z
            .string({ error: 'reporterEmail must be a string' })
            .email({ message: 'reporterEmail must be a valid email address' })
            .optional(),
    })
    .strict(); // ← Rejects any unknown keys not in the schema above

/**
 * Inferred TypeScript type from the schema.
 * Use this instead of manually writing an interface so that
 * the schema and the type can never drift apart.
 */
export type CreateMaintenanceTicketInput = z.infer<typeof createMaintenanceTicketSchema>;
