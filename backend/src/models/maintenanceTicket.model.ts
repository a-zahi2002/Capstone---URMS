/**
 * maintenanceTicket.model.ts
 * ─────────────────────────────────────────────────────────────
 * Data-access layer for the `maintenance_tickets` table.
 * Replaces all previous mysql2 / promisePool queries with
 * Supabase client calls.
 *
 * Table schema (Supabase / PostgreSQL):
 *   id           uuid  PK default gen_random_uuid()
 *   resource_id  uuid  FK → resources(id) ON DELETE CASCADE
 *   title        text  NOT NULL
 *   description  text
 *   priority     text  check in ('Low','Medium','High')  default 'Low'
 *   status       text  check in ('OPEN','IN_PROGRESS','COMPLETED') default 'OPEN'
 *   created_by   text  NOT NULL    (Firebase UID of reporter)
 *   assigned_to  text              (Firebase UID of technician)
 *   created_at   timestamptz       default now()
 *   completed_at timestamptz
 *   outcome      text  check in ('Fixed','Faulty','Decommissioned')
 * ─────────────────────────────────────────────────────────────
 * NOTE: Column names use snake_case in PostgreSQL. The model
 * maps them to/from the camelCase interface used throughout
 * the rest of the backend to preserve the existing API contract.
 * ─────────────────────────────────────────────────────────────
 */
import { SupabaseClient } from '@supabase/supabase-js';
import globalSupabase from '../config/supabaseClient';

export interface MaintenanceTicket {
    id?: string;           // uuid (was number)
    resourceId: string;    // maps to resource_id column
    resourceName?: string; // joined from resources table
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
    createdBy: string;     // maps to created_by column
    assignedTo?: string | null;
    created_at?: Date;
    completed_at?: Date | null;
    outcome?: 'Fixed' | 'Faulty' | 'Decommissioned' | null;
}

// ─── Fallback mock data ───────────────────────────────────────
const MOCK_TICKETS: MaintenanceTicket[] = [
    { id: '1', resourceId: '1', title: 'Projector Issue',  description: 'Screen flickering',  priority: 'High',   status: 'OPEN',        createdBy: 'dev-user' },
    { id: '2', resourceId: '2', title: 'AC Maintenance',   description: 'Blowing warm air',    priority: 'Medium', status: 'IN_PROGRESS', createdBy: 'staff-1', assignedTo: 'tech-1' },
    { id: '3', resourceId: '3', title: 'Bulb Replacement', description: 'Burnt out after power surge', priority: 'Low', status: 'COMPLETED', createdBy: 'admin', assignedTo: 'tech-1', completed_at: new Date(), outcome: 'Fixed' }
];

// ─── Column mapping helpers ───────────────────────────────────
/** Convert a DB row (snake_case) → MaintenanceTicket (camelCase) */
function fromRow(row: any): MaintenanceTicket {
    return {
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
    };
}

/** Build a DB payload (snake_case) from a partial MaintenanceTicket */
function toRow(ticket: Partial<MaintenanceTicket>): Record<string, any> {
    const row: Record<string, any> = {};
    if (ticket.resourceId   !== undefined) row.resource_id   = String(ticket.resourceId);
    if (ticket.title        !== undefined) row.title         = ticket.title;
    if (ticket.description  !== undefined) row.description   = ticket.description;
    if (ticket.priority     !== undefined) row.priority      = ticket.priority;
    if (ticket.status       !== undefined) row.status        = ticket.status;
    if (ticket.createdBy    !== undefined) row.created_by    = ticket.createdBy;
    if (ticket.assignedTo   !== undefined) row.assigned_to   = ticket.assignedTo;
    if (ticket.completed_at !== undefined) row.completed_at  = ticket.completed_at;
    if (ticket.outcome      !== undefined) row.outcome       = ticket.outcome;
    return row;
}

// ─── Model ────────────────────────────────────────────────────
export class MaintenanceTicketModel {

    // ── findAll ─────────────────────────────────────────────
    static async findAll(filters: any = {}, client: SupabaseClient = globalSupabase): Promise<MaintenanceTicket[]> {
        try {
            let query = client.from('maintenance_tickets').select(`
                *,
                resources:resource_id (
                    name
                )
            `);

            if (filters.status)     query = query.eq('status',      filters.status) as any;
            if (filters.priority)   query = query.eq('priority',    filters.priority) as any;
            if (filters.resourceId) query = query.eq('resource_id', String(filters.resourceId)) as any;
            if (filters.createdBy)  query = query.eq('created_by',  filters.createdBy) as any;
            if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo) as any;

            query = query.order('created_at', { ascending: false }) as any;

            const { data, error } = await query;

            if (error) {
                console.error('❌ Supabase query failed in MaintenanceTicketModel.findAll:', error.message);
                if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message.includes('fetch')) {
                    return MOCK_TICKETS;
                }
                throw new Error(error.message);
            }

            return (data as any[]).map(fromRow);
        } catch (err: any) {
            console.warn('⚠️  DB connection failed or table missing:', err.message);
            if (err.message && !err.message.includes('fetch')) {
                throw err;
            }
            let results = [...MOCK_TICKETS];
            if (filters.status)     results = results.filter(t => t.status     === filters.status);
            if (filters.priority)   results = results.filter(t => t.priority   === filters.priority);
            if (filters.resourceId) results = results.filter(t => t.resourceId == filters.resourceId);
            if (filters.createdBy)  results = results.filter(t => t.createdBy  === filters.createdBy);
            if (filters.assignedTo) results = results.filter(t => t.assignedTo === filters.assignedTo);
            return results;
        }
    }

    // ── findById ────────────────────────────────────────────
    static async findById(id: string | number, client: SupabaseClient = globalSupabase): Promise<MaintenanceTicket | null> {
        try {
            const { data, error } = await client
                .from('maintenance_tickets')
                .select(`
                    *,
                    resources:resource_id (
                        name
                    )
                `)
                .eq('id', String(id))
                .maybeSingle();

            if (error) {
                console.error('❌ Supabase query failed in MaintenanceTicketModel.findById:', error.message);
                throw new Error(error.message);
            }

            if (!data) return null;
            return fromRow(data);
        } catch (err: any) {
            return MOCK_TICKETS.find(t => t.id === String(id)) || null;
        }
    }

    // ── create ──────────────────────────────────────────────
    static async create(ticket: Partial<MaintenanceTicket>, client: SupabaseClient = globalSupabase): Promise<string> {
        const row = toRow({
            ...ticket,
            status:   'OPEN',
            priority: ticket.priority || 'Low'
        });

        const { data, error } = await client
            .from('maintenance_tickets')
            .insert(row)
            .select('id')
            .single();

        if (error) {
            console.error('❌ Supabase insert failed:', error.message);
            if (error.code === '42501') {
                throw new Error(`Permission denied (RLS) on maintenance_tickets.`);
            }
            
            if (error.message.includes('fetch')) {
                const newId = String(Date.now());
                MOCK_TICKETS.unshift({
                    id:          newId,
                    resourceId:  String(ticket.resourceId!),
                    title:       ticket.title!,
                    description: ticket.description!,
                    priority:    (ticket.priority as 'Low' | 'Medium' | 'High') || 'Low',
                    status:      'OPEN',
                    createdBy:   ticket.createdBy!,
                    created_at:  new Date(),
                    completed_at: null,
                    outcome:      null
                });
                return newId;
            }
            throw new Error(error.message);
        }

        if (!data) throw new Error('Insert returned no data');
        return (data as any).id as string;
    }

    // ── update ──────────────────────────────────────────────
    static async update(id: string | number, data: Partial<MaintenanceTicket>, client: SupabaseClient = globalSupabase): Promise<boolean> {
        const row = toRow(data);
        if (Object.keys(row).length === 0) return true;

        const { error } = await client
            .from('maintenance_tickets')
            .update(row)
            .eq('id', String(id));

        if (error) {
            console.error('❌ Supabase update failed:', error.message);
            if (error.code === '42501') throw new Error('Permission denied (RLS)');
            throw new Error(error.message);
        }

        return true;
    }

    // ── delete ──────────────────────────────────────────────
    static async delete(id: string | number, client: SupabaseClient = globalSupabase): Promise<boolean> {
        const { error } = await client
            .from('maintenance_tickets')
            .delete()
            .eq('id', String(id));

        if (error) {
            console.error('❌ Supabase delete failed:', error.message);
            if (error.code === '42501') throw new Error('Permission denied (RLS)');
            throw new Error(error.message);
        }

        return true;
    }
}
