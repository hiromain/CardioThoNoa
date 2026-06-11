// Agrégations statistiques (alimentent les graphiques Recharts).
import { monthKey, formatMonthYear } from './dates';
import { getSpecialty } from '../data/constants';
import { byId, serviceForSemester } from './queries';

// KPIs synthétiques pour une liste d'interventions.
export function kpis(interventions) {
  const patients = new Set(interventions.map((i) => i.patientId));
  const surgeons = new Set(interventions.map((i) => i.surgeonId));
  const internGestes = interventions.reduce(
    (a, i) => a + (i.internProcedures || []).length,
    0
  );
  const patientGestes = interventions.reduce(
    (a, i) => a + (i.patientProcedures || []).length,
    0
  );
  const positions = {};
  interventions.forEach((i) => {
    positions[i.position] = (positions[i.position] || 0) + 1;
  });
  return {
    total: interventions.length,
    patients: patients.size,
    surgeons: surgeons.size,
    internGestes,
    patientGestes,
    positions,
  };
}

// 1. Interventions par mois.
export function interventionsPerMonth(interventions) {
  const map = new Map();
  interventions.forEach((i) => {
    const k = monthKey(i.date);
    if (!map.has(k)) map.set(k, { key: k, label: formatMonthYear(i.date), count: 0 });
    map.get(k).count += 1;
  });
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

// 2. Répartition cardiaque / thoracique.
export function specialtySplit(state, interventions) {
  const counts = { cardiaque: 0, thoracique: 0 };
  interventions.forEach((i) => {
    const svc = serviceForSemester(state, i.semesterId);
    if (svc && counts[svc.type] !== undefined) counts[svc.type] += 1;
  });
  return [
    {
      type: 'thoracique',
      label: 'Thoracique',
      value: counts.thoracique,
      color: getSpecialty('thoracique').color,
    },
    {
      type: 'cardiaque',
      label: 'Cardiaque',
      value: counts.cardiaque,
      color: getSpecialty('cardiaque').color,
    },
  ];
}

// 3. Top N gestes réalisés par l'interne.
export function topInternProcedures(state, interventions, n = 10) {
  const map = new Map();
  interventions.forEach((i) =>
    (i.internProcedures || []).forEach((id) => map.set(id, (map.get(id) || 0) + 1))
  );
  const rows = [...map.entries()].map(([id, count]) => {
    const pt = byId(state.procedureTypes, id);
    return {
      id,
      label: pt ? pt.abbr || pt.name : id,
      fullName: pt?.name || id,
      count,
      serviceType: pt?.serviceType,
      color: getSpecialty(pt?.serviceType).color,
    };
  });
  return rows.sort((a, b) => b.count - a.count).slice(0, n);
}

// 4. Gestes réalisés par l'interne, par mois (progression).
export function internProceduresPerMonth(interventions) {
  const map = new Map();
  interventions.forEach((i) => {
    const k = monthKey(i.date);
    const c = (i.internProcedures || []).length;
    if (!map.has(k)) map.set(k, { key: k, label: formatMonthYear(i.date), count: 0 });
    map.get(k).count += c;
  });
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

// 5. Matrice semestre × geste (interne).
export function semesterProcedureMatrix(state, interventions, semesters) {
  const gesteIds = new Set();
  interventions.forEach((i) =>
    (i.internProcedures || []).forEach((id) => gesteIds.add(id))
  );
  const gestes = [...gesteIds]
    .map((id) => {
      const pt = byId(state.procedureTypes, id);
      return {
        id,
        label: pt ? pt.abbr || pt.name : id,
        color: getSpecialty(pt?.serviceType).color,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const counts = {};
  semesters.forEach((sem) => {
    counts[sem.id] = {};
  });
  interventions.forEach((i) => {
    if (!counts[i.semesterId]) counts[i.semesterId] = {};
    (i.internProcedures || []).forEach((id) => {
      counts[i.semesterId][id] = (counts[i.semesterId][id] || 0) + 1;
    });
  });
  return { gestes, counts };
}
