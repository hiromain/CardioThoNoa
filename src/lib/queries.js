// Fonctions pures de résolution / jointure sur l'état du store.
import { getSpecialty } from '../data/constants';

export const byId = (arr, id) => (arr || []).find((x) => x.id === id) || null;

// ── Libellés ──────────────────────────────────────────────────────────────────
export function surgeonName(sg, withTitle = true) {
  if (!sg) return '—';
  const t = withTitle && sg.title ? `${sg.title} ` : '';
  return `${t}${sg.lastName}`;
}
export function surgeonFullName(sg) {
  if (!sg) return '—';
  const t = sg.title ? `${sg.title} ` : '';
  return `${t}${sg.firstName} ${sg.lastName}`.trim();
}
export function surgeonInitials(sg) {
  if (!sg) return '–';
  return `${(sg.firstName || ' ')[0]}${(sg.lastName || ' ')[0]}`.toUpperCase();
}
export function patientName(p) {
  return p ? `${p.firstName} ${p.lastName}` : '—';
}
export function patientInitials(p) {
  return p ? `${(p.firstName || ' ')[0]}${(p.lastName || ' ')[0]}`.toUpperCase() : '–';
}
export function procLabel(pt) {
  return pt ? pt.abbr || pt.name : '—';
}

// ── Relations ─────────────────────────────────────────────────────────────────
export function serviceForSemester(state, semesterId) {
  const sem = byId(state.semesters, semesterId);
  return sem ? byId(state.services, sem.serviceId) : null;
}
export function specialtyForSemester(state, semesterId) {
  const svc = serviceForSemester(state, semesterId);
  return getSpecialty(svc?.type);
}
export function surgeonsForService(state, serviceId) {
  return state.surgeons.filter((s) => s.serviceId === serviceId);
}
export function surgeonsForSemester(state, semesterId) {
  const sem = byId(state.semesters, semesterId);
  if (!sem) return [];
  const personal = surgeonsForService(state, sem.serviceId);
  const center = state.centerSurgeons ?? [];
  // Exclure les chirurgiens du centre dont le nom est déjà dans la liste perso.
  const personalNames = new Set(personal.map((s) => s.lastName?.toLowerCase()));
  const freshCenter = center.filter((s) => !personalNames.has(s.lastName?.toLowerCase()));
  return [...personal, ...freshCenter];
}
// Gestes disponibles pour un type de service, filtrés par portée.
// scope: 'patient' | 'intern' | undefined (tous). 'autre' est toujours inclus.
export function proceduresForType(state, serviceType, scope) {
  return state.procedureTypes.filter((p) => {
    const typeOk = p.serviceType === serviceType || p.serviceType === 'autre';
    const scopeOk = !scope || p.scope === scope || p.scope === 'both';
    return typeOk && scopeOk;
  });
}
// Sous-gestes suggérés à l'interne en fonction des gestes patient sélectionnés.
// Agrège les internSteps de chaque geste patient et déduplique.
export function internStepsForPatientProcedures(state, patientProcedureIds) {
  if (!patientProcedureIds?.length) return [];
  const seen = new Set();
  const steps = [];
  for (const pid of patientProcedureIds) {
    const proc = byId(state.procedureTypes, pid);
    if (!proc?.internSteps) continue;
    for (const sid of proc.internSteps) {
      if (!seen.has(sid)) {
        seen.add(sid);
        const s = byId(state.procedureTypes, sid);
        if (s) steps.push(s);
      }
    }
  }
  return steps;
}

export function interventionsForSemester(state, semesterId) {
  return state.interventions
    .filter((i) => i.semesterId === semesterId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Semestre dont la startDate précède immédiatement celle du semestre donné.
// Renvoie null si aucun semestre antérieur.
export function previousSemester(state, semesterId) {
  const current = byId(state.semesters, semesterId);
  if (!current) return null;
  const earlier = state.semesters
    .filter((s) => s.id !== semesterId && s.startDate < current.startDate)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  return earlier[0] || null;
}

// Jointure complète d'une intervention (patient, chirurgien, semestre, gestes…).
export function resolveIntervention(state, intervention) {
  if (!intervention) return null;
  const patient = byId(state.patients, intervention.patientId);
  const surgeon =
    byId(state.surgeons, intervention.surgeonId) ||
    byId(state.centerSurgeons ?? [], intervention.surgeonId);
  const semester = byId(state.semesters, intervention.semesterId);
  const service = semester ? byId(state.services, semester.serviceId) : null;
  const specialty = getSpecialty(service?.type);
  const resolveProcs = (ids) =>
    (ids || []).map((id) => byId(state.procedureTypes, id)).filter(Boolean);
  return {
    ...intervention,
    patient,
    surgeon,
    semester,
    service,
    specialty,
    patientProcs: resolveProcs(intervention.patientProcedures),
    internProcs: resolveProcs(intervention.internProcedures),
  };
}

// ── Agrégation patients ───────────────────────────────────────────────────────
export function aggregatePatients(state) {
  return state.patients
    .map((p) => {
      const ints = state.interventions
        .filter((i) => i.patientId === p.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      const specialties = new Set();
      ints.forEach((i) => {
        const svc = serviceForSemester(state, i.semesterId);
        if (svc) specialties.add(svc.type);
      });
      return {
        ...p,
        interventions: ints,
        count: ints.length,
        specialties: [...specialties],
        lastDate: ints[0]?.date || null,
      };
    })
    .sort((a, b) =>
      `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
    );
}

// ── Comptage des références (suppression sûre) ────────────────────────────────
export function semesterInterventionCount(state, id) {
  return state.interventions.filter((i) => i.semesterId === id).length;
}
export function surgeonInterventionCount(state, id) {
  return state.interventions.filter((i) => i.surgeonId === id).length;
}
export function patientInterventionCount(state, id) {
  return state.interventions.filter((i) => i.patientId === id).length;
}
export function procedureUsageCount(state, id) {
  return state.interventions.filter(
    (i) =>
      (i.patientProcedures || []).includes(id) ||
      (i.internProcedures || []).includes(id)
  ).length;
}
export function serviceUsage(state, id) {
  return {
    surgeons: state.surgeons.filter((s) => s.serviceId === id).length,
    semesters: state.semesters.filter((s) => s.serviceId === id).length,
  };
}
