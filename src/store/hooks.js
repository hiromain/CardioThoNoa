// Hooks d'accès au store : tranche « données » mémoïsée + raccourcis.
import { shallow } from 'zustand/shallow';
import { useStore } from './useStore';

// Renvoie uniquement les collections de données (forme attendue par lib/queries).
export function useData() {
  return useStore(
    (s) => ({
      services: s.services,
      surgeons: s.surgeons,
      semesters: s.semesters,
      patients: s.patients,
      procedureTypes: s.procedureTypes,
      interventions: s.interventions,
      currentSemesterId: s.currentSemesterId,
      profile: s.profile,
    }),
    shallow
  );
}

export function useCurrentSemester() {
  return useStore((s) => s.semesters.find((x) => x.id === s.currentSemesterId) || null);
}
