/**
 * supabaseService.ts
 * ─────────────────────────────────────────────────────────────
 * Centralised helper wrapper around the Supabase client.
 * All direct DB calls in models / controllers should ideally
 * route through these helpers so that:
 *   • Error handling is consistent across the codebase
 *   • Logging can be toggled from a single place
 *   • Mocking / testing is straightforward
 * ─────────────────────────────────────────────────────────────
 */
import supabase from '../config/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

// ─── Generic result type ──────────────────────────────────────
export interface DbResult<T> {
    data: T | null;
    error: PostgrestError | null;
}

// ─── SELECT ───────────────────────────────────────────────────
/**
 * Fetch all rows from a table with optional column selection.
 */
export async function dbSelect<T>(
    table: string,
    columns = '*',
    filters?: Record<string, any>,
    orderBy?: { column: string; ascending?: boolean }
): Promise<DbResult<T[]>> {
    let query = supabase.from(table).select(columns);

    if (filters) {
        for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value) as any;
        }
    }

    if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false }) as any;
    }

    const { data, error } = await query;
    return { data: data as T[] | null, error };
}

// ─── SELECT ONE ───────────────────────────────────────────────
/**
 * Fetch a single row by its id column.
 */
export async function dbSelectOne<T>(
    table: string,
    id: string | number,
    idColumn = 'id',
    columns = '*'
): Promise<DbResult<T>> {
    const { data, error } = await supabase
        .from(table)
        .select(columns)
        .eq(idColumn, id)
        .maybeSingle();
    return { data: data as T | null, error };
}

// ─── INSERT ───────────────────────────────────────────────────
/**
 * Insert one or more rows and return the inserted row(s).
 */
export async function dbInsert<T>(
    table: string,
    payload: Record<string, any> | Record<string, any>[]
): Promise<DbResult<T>> {
    const { data, error } = await supabase
        .from(table)
        .insert(payload as any)
        .select()
        .single();
    return { data: data as T | null, error };
}

// ─── INSERT MANY ──────────────────────────────────────────────
/**
 * Bulk-insert rows and return inserted count.
 */
export async function dbInsertMany<T>(
    table: string,
    payload: Record<string, any>[]
): Promise<DbResult<T[]>> {
    const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select();
    return { data: data as T[] | null, error };
}

// ─── UPDATE ───────────────────────────────────────────────────
/**
 * Update rows matching an id and return updated row count.
 */
export async function dbUpdate<T>(
    table: string,
    id: string | number,
    payload: Record<string, any>,
    idColumn = 'id'
): Promise<DbResult<T>> {
    const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq(idColumn, id)
        .select()
        .maybeSingle();
    return { data: data as T | null, error };
}

// ─── DELETE ───────────────────────────────────────────────────
/**
 * Hard-delete a row by id.
 */
export async function dbDelete(
    table: string,
    id: string | number,
    idColumn = 'id'
): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase
        .from(table)
        .delete()
        .eq(idColumn, id);
    return { error };
}

export default supabase;
