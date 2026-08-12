/**
 * savedSearch.model.ts
 * ─────────────────────────────────────────────────────────────
 * Data-access layer for the `saved_searches` table in Supabase.
 * ─────────────────────────────────────────────────────────────
 */
import { SupabaseClient } from '@supabase/supabase-js';
import globalSupabase from '../config/supabaseClient';

export interface SavedSearch {
  id?: string;
  user_id: string;
  name: string;
  search_parameters: Record<string, any>;
  created_at?: string;
}

export class SavedSearchModel {
  /**
   * Fetch all saved searches for a specific user.
   */
  static async findAll(
    userId: string,
    client: SupabaseClient = globalSupabase
  ): Promise<SavedSearch[]> {
    const { data, error } = await client
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase query failed in SavedSearchModel.findAll:', error.message);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Fetch a specific saved search by ID.
   */
  static async findById(
    id: string,
    client: SupabaseClient = globalSupabase
  ): Promise<SavedSearch | null> {
    const { data, error } = await client
      .from('saved_searches')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase query failed in SavedSearchModel.findById:', error.message);
      throw new Error(error.message);
    }

    return data || null;
  }

  /**
   * Create a new saved search.
   */
  static async create(
    search: Partial<SavedSearch>,
    client: SupabaseClient = globalSupabase
  ): Promise<SavedSearch> {
    const { data, error } = await client
      .from('saved_searches')
      .insert({
        user_id: search.user_id,
        name: search.name,
        search_parameters: search.search_parameters
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Supabase insert failed in SavedSearchModel.create:', error.message);
      throw new Error(error.message);
    }

    if (!data) throw new Error('Insert returned no data');
    return data;
  }

  /**
   * Rename a saved search.
   */
  static async update(
    id: string,
    name: string,
    client: SupabaseClient = globalSupabase
  ): Promise<SavedSearch | null> {
    const { data, error } = await client
      .from('saved_searches')
      .update({ name })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase update failed in SavedSearchModel.update:', error.message);
      throw new Error(error.message);
    }

    return data || null;
  }

  /**
   * Delete a saved search.
   */
  static async delete(
    id: string,
    client: SupabaseClient = globalSupabase
  ): Promise<boolean> {
    const { error } = await client
      .from('saved_searches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase delete failed in SavedSearchModel.delete:', error.message);
      throw new Error(error.message);
    }

    return true;
  }
}
