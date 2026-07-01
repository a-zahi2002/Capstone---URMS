/**
 * booking.model.ts
 * ─────────────────────────────────────────────────────────────
 * Data-access layer for the `bookings` table in Supabase.
 *
 * Table schema (Supabase / PostgreSQL):
 *   id          uuid        PK default gen_random_uuid()
 *   resource_id uuid        NOT NULL  references resources(id)
 *   user_id     text        NOT NULL
 *   start_time  timestamptz NOT NULL
 *   end_time    timestamptz NOT NULL
 *   status      text        NOT NULL  default 'Pending'
 *   created_at  timestamptz default now()
 * ─────────────────────────────────────────────────────────────
 */
import { SupabaseClient } from '@supabase/supabase-js';
import globalSupabase from '../config/supabaseClient';

export interface Booking {
    id?: string;
    resource_id: string;
    user_id: string;
    start_time: string;
    end_time: string;
    status: string;
    created_at?: string;
}

export interface BookingFilters {
    user_id?: string;
    resource_id?: string;
    status?: string;
    from?: string;   // ISO date — bookings ending after this
    to?: string;     // ISO date — bookings starting before this
}

/**
 * Convert a partial Booking into a plain row object for insert/update.
 */
function toRow(booking: Partial<Booking>): Record<string, any> {
    const row: Record<string, any> = {};
    if (booking.resource_id !== undefined) row.resource_id = booking.resource_id;
    if (booking.user_id     !== undefined) row.user_id     = booking.user_id;
    if (booking.start_time  !== undefined) row.start_time  = booking.start_time;
    if (booking.end_time    !== undefined) row.end_time    = booking.end_time;
    if (booking.status      !== undefined) row.status      = booking.status;
    return row;
}

// ─── Model ────────────────────────────────────────────────────
export class BookingModel {

    // ── findAll (with optional filters) ─────────────────────
    static async findAll(
        filters: BookingFilters = {},
        client: SupabaseClient = globalSupabase
    ): Promise<any[]> {
        let query = client
            .from('bookings')
            .select('id, resource_id, user_id, start_time, end_time, status, created_at, resources ( id, name, type, location ), users ( id, name, email, phone )')
            .order('start_time', { ascending: false });

        if (filters.user_id)     query = query.eq('user_id', filters.user_id);
        if (filters.resource_id) query = query.eq('resource_id', filters.resource_id);
        if (filters.status)      query = query.eq('status', filters.status);
        if (filters.from)        query = query.gt('end_time', filters.from);
        if (filters.to)          query = query.lt('start_time', filters.to);

        const { data, error } = await query;

        if (error) {
            console.error('❌ Supabase query failed in BookingModel.findAll:', error.message);
            throw new Error(error.message);
        }

        return data || [];
    }

    // ── findById ────────────────────────────────────────────
    static async findById(
        id: string,
        client: SupabaseClient = globalSupabase
    ): Promise<any | null> {
        const { data, error } = await client
            .from('bookings')
            .select('id, resource_id, user_id, start_time, end_time, status, created_at, resources ( id, name, type, location ), users ( id, name, email, phone )')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('❌ Supabase query failed in BookingModel.findById:', error.message);
            throw new Error(error.message);
        }

        return data || null;
    }

    // ── create ──────────────────────────────────────────────
    static async create(
        booking: Partial<Booking>,
        client: SupabaseClient = globalSupabase
    ): Promise<any> {
        const row = toRow({
            ...booking,
            status: booking.status || 'Pending',
        });

        const { data, error } = await client
            .from('bookings')
            .insert(row)
            .select('id, resource_id, user_id, start_time, end_time, status, created_at')
            .single();

        if (error) {
            console.error('❌ Supabase insert failed in BookingModel.create:', error.message);
            if (error.code === '42501') {
                throw new Error(`Permission denied: ${error.message}`);
            }
            throw new Error(error.message);
        }

        if (!data) throw new Error('Insert returned no data');
        return data;
    }

    // ── update ──────────────────────────────────────────────
    static async update(
        id: string,
        data: Partial<Booking>,
        client: SupabaseClient = globalSupabase
    ): Promise<any | null> {
        const row = toRow(data);
        if (Object.keys(row).length === 0) return null;

        const { data: updated, error } = await client
            .from('bookings')
            .update(row)
            .eq('id', id)
            .select('id, resource_id, user_id, start_time, end_time, status, created_at')
            .maybeSingle();

        if (error) {
            console.error('❌ Supabase update failed in BookingModel.update:', error.message);
            if (error.code === '42501') throw new Error('Permission denied (RLS)');
            throw new Error(error.message);
        }

        return updated || null;
    }

    // ── delete ──────────────────────────────────────────────
    static async delete(
        id: string,
        client: SupabaseClient = globalSupabase
    ): Promise<boolean> {
        // Verify booking exists first
        const existing = await BookingModel.findById(id, client);
        if (!existing) return false;

        const { error } = await client
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase delete failed in BookingModel.delete:', error.message);
            if (error.code === '42501') throw new Error('Permission denied (RLS)');
            throw new Error(error.message);
        }

        return true;
    }

    // ── checkConflicts ──────────────────────────────────────
    /**
     * Returns true if there is at least one non-cancelled booking for the
     * given resource that overlaps [start_time, end_time).
     */
    static async checkConflicts(
        resourceId: string,
        startTime: string,
        endTime: string,
        excludeBookingId?: string,
        client: SupabaseClient = globalSupabase
    ): Promise<boolean> {
        let query = client
            .from('bookings')
            .select('id')
            .eq('resource_id', resourceId)
            .neq('status', 'Cancelled')
            .neq('status', 'Rejected')
            .lt('start_time', endTime)
            .gt('end_time', startTime)
            .limit(1);

        if (excludeBookingId) {
            query = query.neq('id', excludeBookingId);
        }

        const { data, error } = await query;
        if (error) return false;
        return (data?.length ?? 0) > 0;
    }
}
