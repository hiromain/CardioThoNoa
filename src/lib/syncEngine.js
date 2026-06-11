// CardioThoNoa — Moteur de synchronisation cloud (Supabase).
//
// Modèle « instantané » : tout l'état synchronisable est poussé en un seul
// upsert (une ligne par utilisateur dans la table `app_data`). Les écritures
// sont regroupées (debounce) pour limiter les appels réseau.
//
// RGPD : les données patient ne figurent PAS dans le payload — elles restent
// strictement locales. Voir `snapshotPayload` ci-dessous (pas de `patients`).
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';

const SYNC_DEBOUNCE_MS = 4000;
const LAST_USER_KEY = 'cardiothonoa-last-user-id';
const SYNC_FIELDS = [
  'services', 'surgeons', 'semesters', 'procedureTypes',
  'interventions', 'currentSemesterId', 'profile',
];

let debounceTimer = null;

function snapshotPayload(state, userId) {
  return {
    user_id: userId,
    services: state.services,
    surgeons: state.surgeons,
    semesters: state.semesters,
    procedure_types: state.procedureTypes,
    interventions: state.interventions,
    current_semester_id: state.currentSemesterId,
    profile: state.profile,
  };
}

export async function pushSnapshot() {
  if (!isSupabaseConfigured) return;
  const user = useAuthStore.getState().user;
  if (!user || user.id === 'dev-local') return;
  useStore.getState().setSyncMeta({ syncStatus: 'syncing' });
  const { error } = await supabase
    .from('app_data')
    .upsert(snapshotPayload(useStore.getState(), user.id));
  useStore.getState().setSyncMeta(
    error
      ? { syncStatus: 'error' }
      : { syncStatus: 'idle', lastSyncedAt: new Date().toISOString() }
  );
}

export async function pullSnapshot() {
  if (!isSupabaseConfigured) return null;
  const user = useAuthStore.getState().user;
  if (!user || user.id === 'dev-local') return null;
  const { data, error } = await supabase
    .from('app_data')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    services: data.services,
    surgeons: data.surgeons,
    semesters: data.semesters,
    procedureTypes: data.procedure_types,
    interventions: data.interventions,
    currentSemesterId: data.current_semester_id,
    profile: data.profile,
  };
}

function scheduleDebouncedPush() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    pushSnapshot();
  }, SYNC_DEBOUNCE_MS);
}

export async function triggerManualSync() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  await pushSnapshot();
}

async function handleSignIn(userId) {
  const lastUserId = localStorage.getItem(LAST_USER_KEY);
  if (lastUserId && lastUserId !== userId) {
    useStore.getState().clearAll();
  }
  localStorage.setItem(LAST_USER_KEY, userId);

  const cloud = await pullSnapshot();
  if (cloud) {
    useStore.getState().applyCloudSnapshot(cloud);
    useStore.getState().setSyncMeta({
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'idle',
    });
  } else {
    // Nouveau compte sans ligne cloud : on pousse l'état local pour créer la ligne.
    await pushSnapshot();
  }
}

// À appeler une seule fois depuis main.jsx, APRÈS useAuthStore.getState().init()
// (init() déclenche getSession() de façon async ; ce subscribe doit être en
// place avant que la promesse ne se résolve — l'ordre synchrone garantit ça).
export function startSyncEngine() {
  useStore.subscribe((state, prev) => {
    if (useAuthStore.getState().status !== 'signed-in') return;
    const changed = SYNC_FIELDS.some((k) => state[k] !== prev[k]);
    if (changed) {
      useStore.getState().setSyncMeta({ syncStatus: 'pending' });
      scheduleDebouncedPush();
    }
  });

  useAuthStore.subscribe((state, prev) => {
    if (state.status === 'signed-in' && state.user && prev.user?.id !== state.user.id) {
      handleSignIn(state.user.id);
    }
  });
}
