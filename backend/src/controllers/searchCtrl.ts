import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ResourceModel } from "../models/resource.model";
import { MaintenanceTicketModel } from "../models/maintenanceTicket.model";

// Define a safe mock user list to use when Supabase is completely unreachable
const MOCK_USERS = [
    { id: 'mock-admin',       name: 'System Admin',      email: 'admin@demo.lk',       role: 'admin',       department: 'Faculty of Computing' },
    { id: 'mock-student',     name: 'John Student',      email: 'student@demo.lk',     role: 'student',     department: 'Faculty of Computing' },
    { id: 'mock-lecturer',    name: 'Dr. Smith',         email: 'lecturer@demo.lk',    role: 'lecturer',    department: 'Faculty of Applied Sciences' },
    { id: 'mock-maintenance', name: 'Mike Technician',    email: 'maintenance@demo.lk', role: 'maintenance', department: 'Faculty of Engineering' },
    { id: 'mock-student-2',   name: 'Jane Doe',          email: 'jane@demo.lk',        role: 'student',     department: 'Faculty of Applied Sciences' },
];

/**
 * GET /api/search
 * Query params:
 *   q     (string): Search term (required)
 *   type  (string): Entity type filter ('resources' | 'tickets' | 'users'). Optional.
 *   limit (number): Max results to return per category (default: 10). Optional.
 */
export const searchAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const q = (req.query.q as string || "").trim();
        const typeFilter = (req.query.type as string || "").trim().toLowerCase();
        const limit = parseInt(req.query.limit as string, 10) || 10;

        if (!q) {
            res.status(400).json({
                status: "error",
                message: "Search query 'q' is required and must not be empty"
            });
            return;
        }

        const client = req.supabase;
        const results: Record<string, any[]> = {};

        // Execute searches based on filters
        const promises: Promise<void>[] = [];

        // 1. Resources Search
        if (!typeFilter || typeFilter === "resources") {
            promises.push(
                (async () => {
                    try {
                        results.resources = await searchResources(client, q, limit);
                    } catch (err: any) {
                        console.warn("⚠️ Database search resources failed, falling back to in-memory: ", err.message);
                        results.resources = await searchResourcesFallback(client, q, limit);
                    }
                })()
            );
        }

        // 2. Maintenance Tickets Search
        if (!typeFilter || typeFilter === "tickets" || typeFilter === "maintenance") {
            promises.push(
                (async () => {
                    try {
                        results.tickets = await searchTickets(client, q, limit);
                    } catch (err: any) {
                        console.warn("⚠️ Database search tickets failed, falling back to in-memory: ", err.message);
                        results.tickets = await searchTicketsFallback(client, q, limit);
                    }
                })()
            );
        }

        // 3. Users Search
        if (!typeFilter || typeFilter === "users") {
            promises.push(
                (async () => {
                    try {
                        results.users = await searchUsers(client, q, limit);
                    } catch (err: any) {
                        console.warn("⚠️ Database search users failed, falling back to in-memory: ", err.message);
                        results.users = await searchUsersFallback(client, q, limit);
                    }
                })()
            );
        }

        await Promise.all(promises);

        res.json({
            status: "success",
            data: results
        });
    } catch (error: any) {
        console.error("Search API internal error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Search Implementations ───────────────────────────────────

async function searchResources(client: any, q: string, limit: number): Promise<any[]> {
    const { data, error } = await client
        .from("resources")
        .select("*")
        .textSearch("fts", q, { config: "english", type: "websearch" })
        .limit(limit);

    if (error) throw error;
    
    // Parse equipment JSONB to keep interface parity
    return (data || []).map((row: any) => ({
        ...row,
        equipment: Array.isArray(row.equipment) ? row.equipment : (row.equipment ? JSON.parse(row.equipment) : [])
    }));
}

async function searchResourcesFallback(client: any, q: string, limit: number): Promise<any[]> {
    const allResources = await ResourceModel.findAll(client);
    const keywords = q.toLowerCase().split(/\s+/).filter(Boolean);
    
    return allResources.filter(r => {
        const combined = `${r.name} ${r.type} ${r.location} ${r.department || ""} ${Array.isArray(r.equipment) ? r.equipment.join(" ") : ""}`.toLowerCase();
        return keywords.every(kw => combined.includes(kw));
    }).slice(0, limit);
}

async function searchTickets(client: any, q: string, limit: number): Promise<any[]> {
    const { data, error } = await client
        .from("maintenance_tickets")
        .select(`
            *,
            resources:resource_id (
                name
            )
        `)
        .textSearch("fts", q, { config: "english", type: "websearch" })
        .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any) => ({
        id:           row.id,
        resourceId:   row.resource_id,
        resourceName: row.resources?.name || 'Unknown Resource',
        title:        row.title,
        description:  row.description,
        priority:     row.priority,
        status:       row.status,
        createdBy:    row.created_by,
        assignedTo:   row.assigned_to ?? null,
        created_at:   row.created_at ? new Date(row.created_at) : undefined,
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        outcome:      row.outcome ?? null,
    }));
}

async function searchTicketsFallback(client: any, q: string, limit: number): Promise<any[]> {
    const allTickets = await MaintenanceTicketModel.findAll({}, client);
    const keywords = q.toLowerCase().split(/\s+/).filter(Boolean);

    return allTickets.filter(t => {
        const combined = `${t.title} ${t.description || ""} ${t.priority} ${t.status} ${t.outcome || ""} ${t.resourceName || ""}`.toLowerCase();
        return keywords.every(kw => combined.includes(kw));
    }).slice(0, limit);
}

async function searchUsers(client: any, q: string, limit: number): Promise<any[]> {
    const { data, error } = await client
        .from("users")
        .select("*")
        .textSearch("fts", q, { config: "english", type: "websearch" })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

async function searchUsersFallback(client: any, q: string, limit: number): Promise<any[]> {
    const { data, error } = await client.from("users").select("*");
    const keywords = q.toLowerCase().split(/\s+/).filter(Boolean);

    // If query failed (e.g. Supabase completely unreachable), query mocks
    if (error) {
        return MOCK_USERS.filter(u => {
            const combined = `${u.name} ${u.email} ${u.role} ${u.department}`.toLowerCase();
            return keywords.every(kw => combined.includes(kw));
        }).slice(0, limit);
    }

    return (data || []).filter((u: any) => {
        const combined = `${u.name} ${u.email} ${u.role} ${u.department || ""}`.toLowerCase();
        return keywords.every(kw => combined.includes(kw));
    }).slice(0, limit);
}
