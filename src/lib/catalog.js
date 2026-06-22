// CardioThoNoa — Catalogue de gestes PARTAGÉ (table Supabase `procedure_types`).
//
// Depuis la migration 0004, le catalogue de gestes n'est plus copié par
// utilisateur dans `app_data` : c'est une liste de référence unique, lue par
// tous les comptes et éditée uniquement par les admins. Ce module fait le pont
// entre la table cloud (snake_case) et la forme attendue par l'app (camelCase,
// identique à src/data/procedureTypes.js).
import { supabase, isSupabaseConfigured } from './supabaseClient';

// DB (snake_case) → app (camelCase, forme de PROCEDURE_TYPES).
export function rowToProcedureType(row) {
  return {
    id: row.id,
    name: row.name,
    abbr: row.abbr ?? undefined,
    scope: row.scope,
    serviceType: row.service_type,
    ...(Array.isArray(row.intern_steps) && row.intern_steps.length
      ? { internSteps: row.intern_steps }
      : {}),
    archived: !!row.archived,
    sortOrder: row.sort_order ?? 0,
  };
}

// app (camelCase) → DB (snake_case) pour les upserts admin.
export function procedureTypeToRow(pt) {
  return {
    id: pt.id,
    name: pt.name,
    abbr: pt.abbr ?? null,
    scope: pt.scope,
    service_type: pt.serviceType,
    intern_steps: pt.internSteps ?? [],
    is_step: pt.scope === 'intern',
    archived: !!pt.archived,
    ...(pt.sortOrder != null ? { sort_order: pt.sortOrder } : {}),
  };
}

// Charge le catalogue partagé (gestes non archivés), trié. Retourne null si
// Supabase n'est pas configuré ou en cas d'erreur (l'appelant garde son seed).
export async function fetchSharedCatalog({ includeArchived = false } = {}) {
  if (!isSupabaseConfigured) return null;
  let query = supabase.from('procedure_types').select('*').order('sort_order', { ascending: true });
  if (!includeArchived) query = query.eq('archived', false);
  const { data, error } = await query;
  if (error || !data) return null;
  return data.map(rowToProcedureType);
}
