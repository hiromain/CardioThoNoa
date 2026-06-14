// CardioThoNoa — Store global (Zustand) avec persistance localStorage.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateSeedData } from '../data/seed';
import { PROCEDURE_TYPES } from '../data/procedureTypes';
import { STORAGE_KEY, APP_USER } from '../data/constants';
import { semesterStatus } from '../lib/dates';
import { uid } from '../lib/id';
import { useAuthStore } from './useAuthStore';

// Paywall (achat unique) : enveloppe une action d'écriture utilisateur. Si le
// compte n'a pas payé (démo, gratuit), l'action ne mute RIEN et ouvre la modale
// d'upgrade. Garantit qu'aucune donnée ne persiste tant que non payé.
// NB : useAuthStore est accédé via getState() (au moment de l'appel, jamais au
// chargement du module) → le cycle d'import ESM useStore↔useAuthStore est sûr.
function guardWrite(fn) {
  return (...args) => {
    const auth = useAuthStore.getState();
    if (!auth.isPaid) {
      auth.openUpgrade();
      return null;
    }
    return fn(...args);
  };
}

function pickCurrentSemester(semesters) {
  const current = semesters.find((s) => semesterStatus(s) === 'en_cours');
  if (current) return current.id;
  const active = semesters.filter((s) => !s.archived);
  return (active[active.length - 1] || semesters[semesters.length - 1] || {}).id ?? null;
}

function freshData() {
  const seed = generateSeedData();
  return { ...seed, currentSemesterId: pickCurrentSemester(seed.semesters) };
}

// Profil par défaut (synchronisé dans le cloud, contrairement aux patients).
function defaultProfile() {
  return { ...APP_USER };
}

// Champs de l'état synchronisés depuis le cloud. NB : `patients` est volontairement
// absent — les données patient restent strictement locales (RGPD).
const CLOUD_FIELDS = [
  'services',
  'surgeons',
  'semesters',
  'procedureTypes',
  'interventions',
  'currentSemesterId',
  'profile',
];

function emptyData() {
  return {
    services: [],
    surgeons: [],
    semesters: [],
    patients: [],
    procedureTypes: PROCEDURE_TYPES.map((p) => ({ ...p })),
    interventions: [],
    currentSemesterId: null,
  };
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...freshData(),
      profile: defaultProfile(),
      theme: 'light',
      blocMode: false,

      // ── Synchronisation cloud (méta transitoire, pilotée par syncEngine) ──
      // 'idle' | 'pending' | 'syncing' | 'error'
      syncStatus: 'idle',
      lastSyncedAt: null,

      // ── Préférences ───────────────────────────────────────────────────────
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setBlocMode: (on) =>
        set((s) => ({ blocMode: on, theme: on ? 'dark' : s.theme })),
      setCurrentSemester: (id) => set({ currentSemesterId: id }),
      updateProfile: guardWrite((patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } }))),

      // ── Services ──────────────────────────────────────────────────────────
      addService: guardWrite((data) => {
        const id = uid('svc');
        set((s) => ({ services: [...s.services, { id, surgeonIds: [], ...data }] }));
        return id;
      }),
      updateService: guardWrite((id, patch) =>
        set((s) => ({
          services: s.services.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }))),
      deleteService: guardWrite((id) =>
        set((s) => ({
          services: s.services.filter((x) => x.id !== id),
        }))),

      // ── Chirurgiens ───────────────────────────────────────────────────────
      addSurgeon: guardWrite((data) => {
        const id = uid('sg');
        set((s) => ({
          surgeons: [...s.surgeons, { id, ...data }],
          services: s.services.map((svc) =>
            svc.id === data.serviceId
              ? { ...svc, surgeonIds: [...(svc.surgeonIds || []), id] }
              : svc
          ),
        }));
        return id;
      }),
      updateSurgeon: guardWrite((id, patch) =>
        set((s) => {
          const prev = s.surgeons.find((x) => x.id === id);
          const surgeons = s.surgeons.map((x) => (x.id === id ? { ...x, ...patch } : x));
          let services = s.services;
          if (patch.serviceId && prev && patch.serviceId !== prev.serviceId) {
            services = s.services.map((svc) => {
              if (svc.id === prev.serviceId)
                return { ...svc, surgeonIds: (svc.surgeonIds || []).filter((sid) => sid !== id) };
              if (svc.id === patch.serviceId)
                return { ...svc, surgeonIds: [...(svc.surgeonIds || []), id] };
              return svc;
            });
          }
          return { surgeons, services };
        })),
      deleteSurgeon: guardWrite((id) =>
        set((s) => ({
          surgeons: s.surgeons.filter((x) => x.id !== id),
          services: s.services.map((svc) => ({
            ...svc,
            surgeonIds: (svc.surgeonIds || []).filter((sid) => sid !== id),
          })),
        }))),

      // ── Semestres ─────────────────────────────────────────────────────────
      addSemester: guardWrite((data) => {
        const id = uid('sem');
        set((s) => ({ semesters: [...s.semesters, { id, archived: false, ...data }] }));
        return id;
      }),
      updateSemester: guardWrite((id, patch) =>
        set((s) => ({
          semesters: s.semesters.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }))),
      toggleArchiveSemester: guardWrite((id) =>
        set((s) => ({
          semesters: s.semesters.map((x) =>
            x.id === id ? { ...x, archived: !x.archived } : x
          ),
        }))),
      deleteSemester: guardWrite((id) =>
        set((s) => ({
          semesters: s.semesters.filter((x) => x.id !== id),
          currentSemesterId:
            s.currentSemesterId === id
              ? pickCurrentSemester(s.semesters.filter((x) => x.id !== id))
              : s.currentSemesterId,
        }))),

      // ── Patients ──────────────────────────────────────────────────────────
      addPatient: guardWrite((data) => {
        const id = uid('pat');
        set((s) => ({ patients: [...s.patients, { id, ...data }] }));
        return id;
      }),
      updatePatient: guardWrite((id, patch) =>
        set((s) => ({
          patients: s.patients.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }))),
      deletePatient: guardWrite((id) =>
        set((s) => ({ patients: s.patients.filter((x) => x.id !== id) }))),

      // ── Types de gestes ───────────────────────────────────────────────────
      addProcedureType: guardWrite((data) => {
        const id = uid('pt');
        set((s) => ({ procedureTypes: [...s.procedureTypes, { id, ...data }] }));
        return id;
      }),
      updateProcedureType: guardWrite((id, patch) =>
        set((s) => ({
          procedureTypes: s.procedureTypes.map((x) =>
            x.id === id ? { ...x, ...patch } : x
          ),
        }))),
      deleteProcedureType: guardWrite((id) =>
        set((s) => ({
          procedureTypes: s.procedureTypes.filter((x) => x.id !== id),
        }))),

      // ── Interventions ─────────────────────────────────────────────────────
      addIntervention: guardWrite((data) => {
        const id = uid('int');
        set((s) => ({
          interventions: [{ id, ...data }, ...s.interventions].sort((a, b) =>
            b.date.localeCompare(a.date)
          ),
        }));
        return id;
      }),
      updateIntervention: guardWrite((id, patch) =>
        set((s) => ({
          interventions: s.interventions
            .map((x) => (x.id === id ? { ...x, ...patch } : x))
            .sort((a, b) => b.date.localeCompare(a.date)),
        }))),
      deleteIntervention: guardWrite((id) =>
        set((s) => ({ interventions: s.interventions.filter((x) => x.id !== id) }))),

      // ── Gestion des données ───────────────────────────────────────────────
      replaceAll: guardWrite((payload) =>
        set((s) => {
          const next = {
            services: payload.services ?? [],
            surgeons: payload.surgeons ?? [],
            semesters: payload.semesters ?? [],
            patients: payload.patients ?? [],
            procedureTypes: payload.procedureTypes ?? [],
            interventions: payload.interventions ?? [],
          };
          return {
            ...next,
            currentSemesterId:
              payload.currentSemesterId &&
              next.semesters.some((x) => x.id === payload.currentSemesterId)
                ? payload.currentSemesterId
                : pickCurrentSemester(next.semesters),
          };
        })),
      resetDemo: () => set(freshData()),
      clearAll: () => set(emptyData()),

      // ── Synchronisation cloud ─────────────────────────────────────────────
      // Méta de sync (statut, horodatage) poussée par le moteur de sync.
      setSyncMeta: (patch) => set(patch),
      // Applique un instantané venu du cloud. N'écrase que les champs cloud :
      // les patients locaux sont préservés (jamais synchronisés — RGPD).
      applyCloudSnapshot: (cloud) =>
        set((s) => {
          const next = {};
          for (const k of CLOUD_FIELDS) {
            if (cloud[k] != null) next[k] = cloud[k];
          }
          // Garantir un currentSemesterId cohérent avec les semestres reçus.
          const semesters = next.semesters ?? s.semesters;
          if (
            !next.currentSemesterId ||
            !semesters.some((x) => x.id === next.currentSemesterId)
          ) {
            next.currentSemesterId = pickCurrentSemester(semesters);
          }
          if (!next.profile) next.profile = s.profile ?? defaultProfile();
          return next;
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => ({
        services: s.services,
        surgeons: s.surgeons,
        semesters: s.semesters,
        patients: s.patients,
        procedureTypes: s.procedureTypes,
        interventions: s.interventions,
        currentSemesterId: s.currentSemesterId,
        profile: s.profile,
        lastSyncedAt: s.lastSyncedAt,
        theme: s.theme,
        blocMode: s.blocMode,
      }),
    }
  )
);
