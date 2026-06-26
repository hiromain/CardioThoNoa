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
import { useAuthStore, isLocalUser } from '../store/useAuthStore';
import { fetchSharedCatalog } from './catalog';
import { fetchCentreSurgeons } from './adminQueries';
import { SEED_SEMESTER_IDS, SEED_SURGEON_IDS } from '../data/seed';

// Retourne l'ensemble des patientId référencés par des interventions mock
// (celles qui pointent sur un semestre ou chirurgien du jeu de données de démo).
// À appeler AVANT que le cloud ne remplace les interventions locales.
function collectSeedPatientIds(interventions) {
  const semSet = new Set(SEED_SEMESTER_IDS);
  const sgSet  = new Set(SEED_SURGEON_IDS);
  return new Set(
    interventions
      .filter((i) => semSet.has(i.semesterId) || sgSet.has(i.surgeonId))
      .map((i) => i.patientId)
  );
}

const SYNC_DEBOUNCE_MS = 4000;
const LAST_USER_KEY = 'cardiothonoa-last-user-id';
// NB : `procedureTypes` n'est plus synchronisé par-utilisateur — le catalogue de
// gestes est désormais partagé (table `procedure_types`, voir lib/catalog.js).
const SYNC_FIELDS = [
  'services', 'surgeons', 'semesters',
  'interventions', 'currentSemesterId', 'profile',
];

let debounceTimer = null;

function snapshotPayload(state, userId) {
  return {
    user_id: userId,
    services: state.services,
    surgeons: state.surgeons,
    semesters: state.semesters,
    interventions: state.interventions,
    current_semester_id: state.currentSemesterId,
    profile: state.profile,
  };
}

export async function pushSnapshot() {
  if (!isSupabaseConfigured) return;
  const auth = useAuthStore.getState();
  const user = auth.user;
  if (!user || isLocalUser(user)) return;
  // Paywall : un compte gratuit (non payé) ne synchronise jamais — son cloud
  // reste vide. Seul un compte ayant payé pousse ses données.
  if (!auth.isPaid) return;
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
  if (!user || isLocalUser(user)) return null;
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

// Utilitaire : efface les données mock et crée une ligne cloud vide propre.
// En pratique, handleSignIn() couvre déjà ce cas automatiquement au rechargement
// qui suit le retour de Stripe. Cette fonction reste disponible pour un appel
// manuel si nécessaire (ex. bouton « Repartir de zéro » dans les Réglages).
export async function completePurchase() {
  useStore.getState().clearAll();
  await pushSnapshot();
}

// Charge le catalogue de gestes partagé (table `procedure_types`) dans le store.
// En cas d'échec (hors-ligne, non configuré), on conserve le seed local.
export async function loadSharedCatalog() {
  const catalog = await fetchSharedCatalog();
  if (catalog && catalog.length) {
    useStore.getState().setCatalog(catalog);
  }
}

// Charge les chirurgiens du centre de l'interne (table `centres`) dans le store.
// En cas d'échec ou si pas de centre rattaché, la liste reste vide.
export async function loadCenterSurgeons(centreId) {
  const surgeons = await fetchCentreSurgeons(centreId);
  useStore.getState().setCenterSurgeons(surgeons);
}

async function handleSignIn(userId) {
  const auth = useAuthStore.getState();

  // Charger le profil complet (rôle/centre + droit d'accès is_paid) AVANT de
  // décider quoi charger. refreshProfile retourne isPaid. Le catalogue partagé
  // et les chirurgiens du centre sont chargés en parallèle (lecture pour tous).
  const [isPaid] = await Promise.all([
    auth.refreshProfile(),
    loadSharedCatalog(),
  ]);

  // Chirurgiens du centre : disponibles après refreshProfile (centreId connu).
  const centreId = useAuthStore.getState().centreId;
  if (centreId) loadCenterSurgeons(centreId);

  // Démo / dev : données locales déjà en place, aucune interaction cloud.
  const user = auth.user;
  if (!user || isLocalUser(user)) return;

  const lastUserId = localStorage.getItem(LAST_USER_KEY);
  if (lastUserId && lastUserId !== userId) {
    // Changement d'utilisateur : on efface les données de l'ancien compte.
    // Les patients de l'ancien utilisateur ne doivent pas fuiter.
    useStore.getState().clearAll();
  }
  localStorage.setItem(LAST_USER_KEY, userId);

  // Capturer les données locales avant toute opération cloud.
  // - savedPatients : patients locaux (RGPD, jamais dans le cloud) à préserver
  //   si réels ; on filtre les patients mock avant toute restauration.
  // - preSyncInterventions : nécessaire pour identifier les patients mock
  //   AVANT que le cloud ne remplace les interventions locales.
  const preSyncInterventions = useStore.getState().interventions;
  const savedPatients = useStore.getState().patients;

  if (!isPaid) {
    // Compte gratuit / expiré : aperçu d'exemple en lecture seule. Rien n'est
    // poussé (pushSnapshot court-circuite sur !isPaid), le cloud reste vide.
    useStore.getState().resetDemo();
    // Restaurer les patients réels (ex-compte payé rétrogradé). En mode purement
    // gratuit, addPatient est bloqué par guardWrite donc savedPatients ne contient
    // que des données mock — le filtre les écarte sans risquer de vrais patients.
    const mockIds = collectSeedPatientIds(preSyncInterventions);
    const realPatients = savedPatients.filter((p) => !mockIds.has(p.id));
    if (realPatients.length > 0) {
      useStore.setState({ patients: realPatients });
    }
    return;
  }

  // Compte payé : le cloud fait foi.
  const cloud = await pullSnapshot();
  if (cloud) {
    useStore.getState().applyCloudSnapshot(cloud);
    // patients n'est pas dans CLOUD_FIELDS → préservé par applyCloudSnapshot.
    // On ne purge pas ici : une intervention réelle peut référencer un semestre
    // seed si le formulaire a defaulté dessus, et supprimer ces patients serait
    // une perte de données. La purge du seed se fait via clearSeedData (manuel).
    useStore.getState().setSyncMeta({
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'idle',
    });
  } else {
    // Nouveau compte payé sans ligne cloud (première connexion après paiement,
    // ou ligne manquante) : on efface les données de démo et on repart de zéro.
    // On ne restaure pas savedPatients : en mode gratuit addPatient est bloqué
    // par guardWrite, donc il ne peut y avoir que des données mock à ce stade.
    useStore.getState().clearAll();
    await pushSnapshot();
  }
}

// À appeler une seule fois depuis main.jsx, APRÈS useAuthStore.getState().init()
// (init() déclenche getSession() de façon async ; ce subscribe doit être en
// place avant que la promesse ne se résolve — l'ordre synchrone garantit ça).
export function startSyncEngine() {
  useStore.subscribe((state, prev) => {
    const auth = useAuthStore.getState();
    if (auth.status !== 'signed-in') return;
    // Comptes non payés (démo, gratuit) : lecture seule, on ne planifie aucune
    // synchronisation (évite un statut « pending » qui ne se résoudrait jamais).
    if (!auth.isPaid) return;
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
