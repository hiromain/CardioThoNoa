// CardioThoNoa — Accès données pour l'interface d'administration.
//
// slugify : convertit un nom de ville/centre en segment d'URL lisible.
export function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

//
// Toutes ces requêtes sont protégées côté serveur par la RLS / les fonctions
// SECURITY DEFINER de la migration 0004 : un non-admin obtient une liste vide ou
// une erreur. Le gating côté client (isAdmin) n'est qu'une commodité UX.
//
// RGPD : on ne lit JAMAIS de données patient (la colonne n'existe pas dans
// `app_data`). Les admins ne voient que les statistiques de formation.
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { rowToProcedureType, procedureTypeToRow } from './catalog';

// ── Internes (supervision) ───────────────────────────────────────────────────

// Liste agrégée des comptes (RPC admin_list_interns). Retourne [] hors-config.
export async function listInterns() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('admin_list_interns');
  if (error || !data) return [];
  return data;
}

// Snapshot complet (stats de formation) d'un interne donné — autorisé par la
// policy SELECT admin sur app_data. Forme alignée sur le store local.
export async function getInternData(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('app_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    services: data.services ?? [],
    surgeons: data.surgeons ?? [],
    semesters: data.semesters ?? [],
    interventions: data.interventions ?? [],
    currentSemesterId: data.current_semester_id ?? null,
    profile: data.profile ?? null,
    patients: [], // jamais synchronisées (RGPD) — vide côté admin.
    procedureTypes: [], // injecté depuis le catalogue partagé par l'appelant.
  };
}

// ── Centres ──────────────────────────────────────────────────────────────────

export async function listCentres() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('centres').select('*').order('name');
  if (error || !data) return [];
  return data;
}

export async function createCentre({ name, city }) {
  const { data, error } = await supabase
    .from('centres')
    .insert({ name, city: city || null })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCentre(id, patch) {
  const { error } = await supabase.from('centres').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCentre(id) {
  const { error } = await supabase.from('centres').delete().eq('id', id);
  if (error) throw error;
}

// ── Gestion des comptes (rôle / centre) ──────────────────────────────────────

export async function setRole(userId, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('user_id', userId);
  if (error) throw error;
}

export async function assignCentre(userId, centreId) {
  const { error } = await supabase
    .from('profiles')
    .update({ centre_id: centreId })
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Catalogue de gestes partagé (édition admin) ──────────────────────────────

// Liste complète (archivés inclus) pour la gestion admin.
export async function listCatalog() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('procedure_types')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data.map(rowToProcedureType);
}

// Crée/modifie un geste du catalogue partagé. `pt` est en forme app (camelCase).
export async function upsertCatalogType(pt) {
  const { error } = await supabase.from('procedure_types').upsert(procedureTypeToRow(pt));
  if (error) throw error;
}

export async function deleteCatalogType(id) {
  const { error } = await supabase.from('procedure_types').delete().eq('id', id);
  if (error) throw error;
}
