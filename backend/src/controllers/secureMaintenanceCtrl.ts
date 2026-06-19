/**
 * secureMaintenanceCtrl.ts
 * ─────────────────────────────────────────────────────────────
 * Demonstration controller showing the full security pipeline:
 *
 *   1. Zod validation middleware (runs before this controller)
 *      strips unknown keys and enforces types/formats.
 *
 *   2. Supabase JS client handles SQL injection prevention
 *      automatically (see detailed note below).
 *
 *   3. This controller only receives pre-validated, type-safe
 *      data — no manual parsing or escaping needed.
 *
 * ─── SQL INJECTION PROTECTION — HOW SUPABASE KEEPS US SAFE ──
 *
 * The Supabase JavaScript client (@supabase/supabase-js) does
 * NOT construct raw SQL strings. Instead, it communicates with
 * the database through PostgREST, a RESTful API layer that
 * sits between the client and PostgreSQL.
 *
 * When we call:
 *   supabase.from('maintenance_tickets').insert({ title: userInput })
 *
 * The client sends an HTTP POST with a JSON body to PostgREST.
 * PostgREST then uses **parameterized queries** (prepared
 * statements) to insert the data into PostgreSQL:
 *
 *   INSERT INTO maintenance_tickets (title) VALUES ($1)
 *   -- $1 is bound to userInput as a parameter, NOT concatenated
 *
 * This means:
 *   • User input is NEVER interpolated into SQL strings.
 *   • Characters like ', ", --, ;, DROP TABLE, etc. are treated
 *     as literal data values, not SQL syntax.
 *   • There is NO need for manual escaping, sanitisation, or
 *     building parameterised queries ourselves.
 *
 * Combined with Zod validation (which runs first and ensures
 * only expected fields with correct types reach this point),
 * the attack surface for SQL injection is effectively zero.
 * ─────────────────────────────────────────────────────────────
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateMaintenanceTicketInput } from '../schemas/maintenanceSchema';

/**
 * POST /api/maintenance-tickets/secure
 *
 * Creates a new maintenance ticket using pre-validated data.
 * This handler is designed to be used AFTER the validateRequest
 * middleware has already parsed and cleaned req.body.
 *
 * Route wiring example (in a routes file):
 *
 *   import { validateRequest } from '../middleware/validateRequest';
 *   import { createMaintenanceTicketSchema } from '../schemas/maintenanceSchema';
 *   import { createTicketSecure } from '../controllers/secureMaintenanceCtrl';
 *
 *   router.post(
 *       '/secure',
 *       verifyToken,
 *       validateRequest(createMaintenanceTicketSchema),
 *       createTicketSecure
 *   );
 */
export const createTicketSecure = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        // ── 1. Authentication check ──────────────────────────
        if (!req.user || !req.user.uid) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized: User identity missing from request',
            });
            return;
        }

        // ── 2. Extract validated payload ─────────────────────
        // At this point, req.body has already been parsed and
        // cleaned by the validateRequest middleware. The type
        // assertion is safe because the middleware guarantees
        // conformance to the Zod schema.
        const validatedData = req.body as CreateMaintenanceTicketInput;

        // ── 3. Insert via Supabase (SQL-injection-safe) ──────
        // The Supabase client sends this as a JSON payload to
        // PostgREST, which uses parameterized queries internally.
        // User-supplied values (title, description, etc.) are
        // NEVER concatenated into SQL — they are always bound
        // as query parameters ($1, $2, …).
        const { data, error } = await req.supabase
            .from('maintenance_tickets')
            .insert({
                resource_id: validatedData.resourceId,
                title:       validatedData.title,
                description: validatedData.description,
                priority:    validatedData.priority,
                status:      'OPEN',
                created_by:  req.user.uid,
            })
            .select('id')
            .single();

        if (error) {
            console.error('❌ Supabase insert failed in secureMaintenanceCtrl:', error.message);

            // Surface RLS permission errors clearly
            if (error.code === '42501') {
                res.status(403).json({
                    status: 'error',
                    message: 'Permission denied: Row Level Security policy blocked this insert',
                });
                return;
            }

            res.status(500).json({
                status: 'error',
                message: 'Failed to create maintenance ticket',
            });
            return;
        }

        // ── 4. Success response ──────────────────────────────
        res.status(201).json({
            status: 'success',
            message: 'Maintenance ticket created successfully',
            ticketId: data.id,
        });
    } catch (error) {
        console.error('❌ Unexpected error in createTicketSecure:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};
