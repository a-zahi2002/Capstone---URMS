/**
 * validateRequest.ts
 * ─────────────────────────────────────────────────────────────
 * Reusable Express middleware factory for Zod-based request
 * validation.
 *
 * Usage in a route:
 *   import { validateRequest } from '../middleware/validateRequest';
 *   import { createMaintenanceTicketSchema } from '../schemas/maintenanceSchema';
 *
 *   router.post(
 *       '/',
 *       verifyToken,
 *       validateRequest(createMaintenanceTicketSchema),   // ← validates req.body
 *       createTicketSecure
 *   );
 *
 * On success  → replaces req[source] with the cleaned output
 *               (unknown keys stripped, defaults applied) and
 *               calls next().
 * On failure  → responds with 400 and a structured JSON error
 *               listing every invalid field.
 * ─────────────────────────────────────────────────────────────
 */
import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

/**
 * Creates an Express middleware that validates a request
 * property (`body`, `query`, or `params`) against the given
 * Zod schema.
 *
 * @param schema  — Any Zod schema (z.object, z.array, etc.)
 * @param source  — Which part of the request to validate.
 *                  Defaults to 'body'.
 *
 * @returns Express middleware function
 *
 * @example
 * // Validate request body
 * router.post('/tickets', validateRequest(ticketSchema), handler);
 *
 * // Validate query parameters
 * router.get('/search', validateRequest(searchSchema, 'query'), handler);
 */
export function validateRequest(
    schema: ZodType,
    source: 'body' | 'query' | 'params' = 'body'
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            // Extract user-friendly error details from ZodError
            const fieldErrors = formatZodError(result.error);

            res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: fieldErrors,
            });
            return;
        }

        // Replace the raw input with the validated & cleaned output.
        // This ensures downstream handlers only see data that passed
        // schema validation (with defaults applied, unknowns stripped).
        (req as any)[source] = result.data;

        next();
    };
}

// ─── Helper ────────────────────────────────────────────────────

/**
 * Transforms a ZodError into a flat array of field-level messages.
 *
 * Example output:
 * [
 *   { field: "title",    message: "title must be at least 3 characters" },
 *   { field: "priority", message: "priority is required" }
 * ]
 *
 * This structure is easy for frontend forms to map directly to
 * inline validation messages per field.
 */
function formatZodError(error: ZodError): { field: string; message: string }[] {
    return error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
    }));
}
