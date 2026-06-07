/**
 * resource.model.ts
 * ─────────────────────────────────────────────────────────────
 * Data-access layer for the `resources` table in Supabase.
 * Replaces all previous mysql2 / promisePool queries.
 *
 * Table schema (Supabase / PostgreSQL):
 *   id                  uuid  PK default gen_random_uuid()
 *   name                text  NOT NULL
 *   type                text  NOT NULL  default 'Lecture Halls'
 *   capacity            integer NOT NULL  default 0
 *   location            text    NOT NULL
 *   availability_status text    NOT NULL  default 'Available'
 *   department          text
 *   equipment           jsonb             default '[]'::jsonb
 *   created_at          timestamptz     default now()
 * ─────────────────────────────────────────────────────────────
 */
import { SupabaseClient } from '@supabase/supabase-js';
import globalSupabase from '../config/supabaseClient';

export interface Resource {
    id?: string;           // uuid in Supabase (was number in MySQL)
    name: string;
    type: string;
    capacity: number;
    location: string;
    availability_status: string;
    department?: string;   // Added for department-wise analytics
    equipment?: string[];
    created_at?: Date;
}

// ─── Fallback mock data (used when Supabase is unreachable) ───
const MOCK_RESOURCES: Resource[] = [
    { id: '1', name: 'Main Auditorium',       type: 'Lecture Halls', capacity: 500, location: 'Block A',       availability_status: 'Available',   department: 'Faculty of Computing' },
    { id: '2', name: 'Mini Auditorium',       type: 'Lecture Halls', capacity: 250, location: 'Block B',       availability_status: 'Booked',      department: 'Faculty of Business' },
    { id: '3', name: 'Z9 Hall',               type: 'Lecture Halls', capacity: 50,  location: 'Block Z',       availability_status: 'Available',   department: 'Faculty of Engineering' },
    { id: '4', name: 'Computer Lab',          type: 'Labs',          capacity: 50,  location: 'IT Building',   availability_status: 'Maintenance', department: 'Faculty of Computing' },
    { id: '5', name: 'Multimedia Projectors', type: 'Equipment',     capacity: 5,   location: 'IT Helpdesk',   availability_status: 'Available',   department: 'Faculty of Computing' },
    { id: '6', name: 'Faculty Vehicle - Van', type: 'Vehicles',      capacity: 14,  location: 'Transport Pool', availability_status: 'Booked',      department: 'Faculty of Engineering' }
];

// ─── Helpers ──────────────────────────────────────────────────
function parseEquipment(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return (raw as string).split(',').map((s: string) => s.trim());
    }
}

function toRow(resource: Partial<Resource>): Record<string, any> {
    const row: Record<string, any> = {};
    if (resource.name               !== undefined) row.name               = resource.name;
    if (resource.type               !== undefined) row.type               = resource.type;
    if (resource.capacity           !== undefined) row.capacity           = Number(resource.capacity);
    if (resource.location           !== undefined) row.location           = resource.location;
    if (resource.availability_status !== undefined) row.availability_status = resource.availability_status;
    if (resource.department          !== undefined) row.department          = resource.department;
    if (resource.equipment          !== undefined) row.equipment          = resource.equipment; // JSONB handles arrays directly
    return row;
}

// ─── Model ────────────────────────────────────────────────────
export class ResourceModel {

    // ── findAll ─────────────────────────────────────────────
    static async findAll(client: SupabaseClient = globalSupabase): Promise<Resource[]> {
        try {
            const { data, error } = await client
                .from('resources')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Supabase query failed in ResourceModel.findAll:', error.message);
                // Only use mock if it's a connection error, otherwise throw
                if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message.includes('fetch')) {
                    return MOCK_RESOURCES;
                }
                throw new Error(error.message);
            }

            return (data as any[]).map(row => ({
                ...row,
                equipment: parseEquipment(row.equipment)
            })) as Resource[];
        } catch (err: any) {
            console.warn('⚠️  Supabase unreachable or error occurred:', err.message);
            // If we already have an error from Supabase, rethrow it to avoid split-brain
            if (err.message && !err.message.includes('fetch')) {
                throw err;
            }
            return MOCK_RESOURCES;
        }
    }

    // ── findById ────────────────────────────────────────────
    static async findById(id: string | number, client: SupabaseClient = globalSupabase): Promise<Resource | null> {
        try {
            const { data, error } = await client
                .from('resources')
                .select('*')
                .eq('id', String(id))
                .maybeSingle();

            if (error) {
                console.error('❌ Supabase query failed in ResourceModel.findById:', error.message);
                throw new Error(error.message);
            }

            if (!data) return null;
            return { ...data, equipment: parseEquipment(data.equipment) } as Resource;
        } catch (err: any) {
            return MOCK_RESOURCES.find(r => r.id === String(id)) || null;
        }
    }

    // ── create ──────────────────────────────────────────────
    static async create(resource: Partial<Resource>, client: SupabaseClient = globalSupabase): Promise<string> {
        const row = toRow({
            ...resource,
            availability_status: resource.availability_status || 'Available'
        });

        const { data, error } = await client
            .from('resources')
            .insert(row)
            .select('id')
            .single();

        if (error) {
            console.error('❌ Supabase insert failed:', error.message);
            // If it's an RLS error, we MUST throw it so the user knows
            if (error.code === '42501') {
                throw new Error(`Permission denied: ${error.message}. Ensure you are using the SERVICE_ROLE_KEY or have RLS policies set.`);
            }
            
            // Fallback to mock only if unreachable
            if (error.message.includes('fetch')) {
                const newId = String(Date.now());
                MOCK_RESOURCES.unshift({
                    id: newId,
                    name: resource.name!,
                    type: resource.type!,
                    capacity: resource.capacity!,
                    location: resource.location!,
                    availability_status: resource.availability_status || 'Available',
                    equipment: resource.equipment || [],
                });
                return newId;
            }
            throw new Error(error.message);
        }

        if (!data) throw new Error('Insert returned no data');
        return (data as any).id as string;
    }

    // ── update ──────────────────────────────────────────────
    static async update(id: string | number, data: Partial<Resource>, client: SupabaseClient = globalSupabase): Promise<boolean> {
        const row = toRow(data);
        if (Object.keys(row).length === 0) return true;

        const { error } = await client
            .from('resources')
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
            .from('resources')
            .delete()
            .eq('id', String(id));

        if (error) {
            console.error('❌ Supabase delete failed:', error.message);
            if (error.code === '42501') throw new Error('Permission denied (RLS)');
            throw new Error(error.message);
        }

        return true;
    }

    // ── checkActiveBookings ─────────────────────────────────
    static async checkActiveBookings(id: string | number, client: SupabaseClient = globalSupabase): Promise<boolean> {
        try {
            const { data, error } = await client
                .from('bookings')
                .select('id')
                .eq('resource_id', String(id))
                .eq('status', 'Approved')
                .gt('end_time', new Date().toISOString())
                .limit(1);

            if (error) return false;
            return (data?.length ?? 0) > 0;
        } catch {
            return false;
        }
    }
}
