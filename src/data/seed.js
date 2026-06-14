// CardioThoNoa — Générateur de données de démonstration
// Produit un jeu réaliste dans le modèle normalisé du cahier des charges.
// Déterministe (PRNG seedé) pour un rendu stable, mais calé sur la date du
// jour afin qu'il y ait toujours un semestre réellement « en cours ».

import { uid } from '../lib/id';
import { PROCEDURE_TYPES } from './procedureTypes';

// ── PRNG déterministe (mulberry32) ────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// ── Services ──────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: 'svc-card',
    name: 'Chirurgie Cardiaque — Louis Pradel',
    type: 'cardiaque',
    city: 'Lyon',
    surgeonIds: ['sg-c1', 'sg-c2', 'sg-c3'],
  },
  {
    id: 'svc-thor',
    name: 'Chirurgie Thoracique — Louis Pradel',
    type: 'thoracique',
    city: 'Lyon',
    surgeonIds: ['sg-t1', 'sg-t2', 'sg-t3'],
  },
];

// ── Chirurgiens ───────────────────────────────────────────────────────────────
const SURGEONS = [
  { id: 'sg-c1', title: 'Pr.', firstName: 'Étienne', lastName: 'Dubois', serviceId: 'svc-card' },
  { id: 'sg-c2', title: 'Dr.', firstName: 'Claire', lastName: 'Mercier', serviceId: 'svc-card' },
  { id: 'sg-c3', title: 'Dr.', firstName: 'Hugo', lastName: 'Fontaine', serviceId: 'svc-card' },
  { id: 'sg-t1', title: 'Pr.', firstName: 'Sophie', lastName: 'Laurent', serviceId: 'svc-thor' },
  { id: 'sg-t2', title: 'Dr.', firstName: 'Marc', lastName: 'Bernard', serviceId: 'svc-thor' },
  { id: 'sg-t3', title: 'Dr.', firstName: 'Julie', lastName: 'Petit', serviceId: 'svc-thor' },
];

// ── Banque de patients (nom de famille distinct des chirurgiens) ──────────────
const PATIENT_POOL = [
  ['Jean', 'MARTIN', '1958-03-14'],
  ['Marie', 'DUPONT', '1945-07-22'],
  ['Pierre', 'LACROIX', '1962-11-08'],
  ['Sophie', 'LEBLANC', '1970-04-01'],
  ['Luis', 'GARCIA', '1955-09-15'],
  ['Claire', 'MOREAU', '1948-12-03'],
  ['Thomas', 'LEROY', '1967-06-20'],
  ['Hélène', 'SIMON', '1953-02-28'],
  ['Marc', 'RICHARD', '1960-08-17'],
  ['Isabelle', 'DAVID', '1972-05-11'],
  ['Nicolas', 'THOMAS', '1958-01-30'],
  ['Anne', 'PERRIN', '1943-10-07'],
  ['François', 'LAMBERT', '1952-04-16'],
  ['Sylvie', 'ROUX', '1959-07-04'],
  ['Paul', 'VINCENT', '1964-03-22'],
  ['Christine', 'BLANC', '1956-11-30'],
  ['Jacques', 'HENRY', '1947-08-12'],
  ['Marcel', 'ROUSSEAU', '1950-02-14'],
  ['René', 'GAUTHIER', '1945-06-10'],
  ['Martine', 'DURAND', '1963-09-18'],
  ['Henri', 'MOREL', '1955-07-14'],
  ['Élise', 'GIRARD', '1968-03-05'],
  ['Bernard', 'NOEL', '1950-12-25'],
  ['Monique', 'FAURE', '1949-05-19'],
  ['André', 'ROUSSEL', '1957-10-02'],
  ['Jacqueline', 'LEFEVRE', '1946-01-27'],
  ['Daniel', 'BLANCHARD', '1961-11-11'],
  ['Nathalie', 'GARNIER', '1974-08-30'],
  ['Robert', 'CHEVALIER', '1942-04-08'],
  ['Catherine', 'ROBIN', '1965-12-19'],
  ['Michel', 'MASSON', '1953-09-23'],
  ['Brigitte', 'DUMONT', '1959-02-06'],
  ['Gérard', 'RENARD', '1951-03-29'],
  ['Patricia', 'LEMAIRE', '1962-07-13'],
];

// Combinaisons réalistes de gestes « sur le patient » par type de service.
const COMBOS = {
  cardiaque: [
    ['pt-cabg'],
    ['pt-cabg'],
    ['pt-rva'],
    ['pt-rvm'],
    ['pt-plastie'],
    ['pt-aorte'],
    ['pt-civ'],
    ['pt-cia'],
    ['pt-ecmo'],
    ['pt-lvad'],
  ],
  thoracique: [
    ['pt-lob', 'pt-vats'],
    ['pt-lob', 'pt-vats'],
    ['pt-seg', 'pt-vats'],
    ['pt-pneumo'],
    ['pt-resec', 'pt-vats'],
    ['pt-pleur', 'pt-decort'],
    ['pt-thym', 'pt-vats'],
    ['pt-oeso'],
    ['pt-medias'],
    ['pt-drain'],
    ['pt-decort'],
  ],
};

const ACCESS = {
  cardiaque: ['pt-sterno', 'pt-canul', 'pt-fermeture'],
  thoracique: ['pt-thoraco', 'pt-drain', 'pt-fermeture'],
};

const NOTES = [
  'Suites simples.',
  'Bonne tolérance hémodynamique.',
  'Geste réalisé sous supervision rapprochée.',
  'Patient extubé en fin d’intervention.',
  'CEC sans particularité.',
  '',
  '',
  '',
  '',
];

// ── Fenêtres de semestres relatives à aujourd'hui ─────────────────────────────
function semesterWindows(today) {
  const y = today.getFullYear();
  const m = today.getMonth(); // 0–11
  let curStart;
  if (m >= 4 && m <= 9) {
    curStart = new Date(y, 4, 1); // 1er mai
  } else if (m >= 10) {
    curStart = new Date(y, 10, 1); // 1er novembre
  } else {
    curStart = new Date(y - 1, 10, 1); // 1er novembre (année précédente)
  }
  const windows = [];
  for (let back = 2; back >= 0; back--) {
    const start = new Date(curStart);
    start.setMonth(start.getMonth() - 6 * back);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 6);
    end.setDate(0); // dernier jour du mois précédent → fin du semestre
    windows.push({ start, end });
  }
  return windows; // [plus ancien, intermédiaire, courant]
}

function spreadDates(rng, start, end, count) {
  const s = start.getTime();
  const e = end.getTime();
  const out = [];
  for (let i = 0; i < count; i++) {
    const frac = (i + 0.5) / count;
    const jitter = (rng() - 0.5) * (0.8 / count);
    const f = Math.min(0.985, Math.max(0.015, frac + jitter));
    out.push(new Date(s + (e - s) * f));
  }
  return out.sort((a, b) => b - a);
}

function pickPosition(rng, seniority) {
  const r = rng();
  const opThresh = 0.15 + seniority * 0.18;
  const firstThresh = opThresh + 0.4;
  if (r < opThresh) return 'opérateur principal';
  if (r < firstThresh) return '1er assistant';
  return '2ème assistant';
}

// Intervention principale par défaut pour une combinaison de gestes « sur le
// patient » : le premier geste de la combinaison, s'il a une checklist
// `internSteps` configurée.
function mainProcedureIdFor(patientProcedures) {
  const pt = PROCEDURE_TYPES.find((p) => p.id === patientProcedures[0]);
  return pt && pt.internSteps && pt.internSteps.length > 0 ? pt.id : null;
}

function pickIntern(rng, patientProcs, position, serviceType) {
  const access = ACCESS[serviceType] || [];
  let out = [];
  if (position === 'opérateur principal') {
    out = [...patientProcs];
    if (rng() < 0.6 && access.length) out.push(pick(rng, access));
  } else if (position === '1er assistant') {
    out = patientProcs.filter(() => rng() < 0.5);
    if (out.length === 0 && patientProcs.length) out = [patientProcs[0]];
    if (rng() < 0.7 && access.length) out.push(pick(rng, access));
  } else {
    if (rng() < 0.5 && access.length) out.push(pick(rng, access));
  }
  return [...new Set(out)];
}

export function generateSeedData(now = new Date()) {
  const rng = mulberry32(0xc7d10a);
  const windows = semesterWindows(now);

  // Spécialités par semestre (alternance d'une rotation CTCV).
  const specByIndex = ['thoracique', 'cardiaque', 'thoracique'];
  const objectives = [
    { interventions: 20, gestes: 12 },
    { interventions: 25, gestes: 15 },
    { interventions: 30, gestes: 20 },
  ];
  const counts = [12, 14, 10]; // S1, S2, S3 (le courant vient de débuter)

  const semesters = windows.map((w, i) => {
    const type = specByIndex[i];
    return {
      id: `sem-s${i + 1}`,
      label: `S${i + 1}`,
      serviceId: type === 'cardiaque' ? 'svc-card' : 'svc-thor',
      startDate: iso(w.start),
      endDate: iso(w.end),
      objectives: objectives[i],
      archived: false,
    };
  });

  // Patients (créés à la demande depuis la banque, réutilisés parfois).
  const patients = [];
  const patientIdByPoolIndex = {};
  let poolCursor = 0;
  const usedBySpec = { cardiaque: [], thoracique: [] };

  function getPatient(rng2, spec) {
    // ~20 % de réutilisation d'un patient déjà opéré (même spécialité de préférence).
    if (rng2() < 0.2) {
      const sameSpec = usedBySpec[spec];
      const poolUsed = sameSpec.length && rng2() < 0.8
        ? sameSpec
        : [...usedBySpec.cardiaque, ...usedBySpec.thoracique];
      if (poolUsed.length) {
        const id = pick(rng2, poolUsed);
        if (!usedBySpec[spec].includes(id)) usedBySpec[spec].push(id);
        return id;
      }
    }
    if (poolCursor >= PATIENT_POOL.length) {
      // Sécurité : réutilise si la banque est épuisée.
      const all = [...usedBySpec.cardiaque, ...usedBySpec.thoracique];
      return all.length ? pick(rng2, all) : patients[0].id;
    }
    const [firstName, lastName, dob] = PATIENT_POOL[poolCursor];
    poolCursor += 1;
    const id = uid('pat');
    patients.push({ id, firstName, lastName, dateOfBirth: dob });
    patientIdByPoolIndex[poolCursor] = id;
    usedBySpec[spec].push(id);
    return id;
  }

  const interventions = [];
  semesters.forEach((sem, semIdx) => {
    const service = SERVICES.find((s) => s.id === sem.serviceId);
    const type = service.type;
    const end = semIdx === 2 ? minDate(new Date(sem.endDate), now) : new Date(sem.endDate);
    const dates = spreadDates(rng, new Date(sem.startDate), end, counts[semIdx]);

    dates.forEach((d, k) => {
      const patientProcedures = [...pick(rng, COMBOS[type])];
      const position = pickPosition(rng, semIdx);
      const internProcedures = pickIntern(rng, patientProcedures, position, type);
      const surgeonId = pick(rng, service.surgeonIds);
      const patientId = getPatient(rng, type);
      let notes = pick(rng, NOTES);
      // Donne une note plus parlante à la dernière intervention du semestre courant.
      if (semIdx === 2 && k === 0) {
        notes = 'Lobectomie inférieure droite par VATS — suites simples, drainage retiré à J2.';
      }
      interventions.push({
        id: uid('int'),
        patientId,
        semesterId: sem.id,
        surgeonId,
        date: iso(d),
        mainProcedureId: mainProcedureIdFor(patientProcedures),
        patientProcedures,
        internProcedures,
        position,
        notes,
      });
    });
  });

  // Tri global par date décroissante.
  interventions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    services: SERVICES.map((s) => ({ ...s })),
    surgeons: SURGEONS.map((s) => ({ ...s })),
    procedureTypes: PROCEDURE_TYPES.map((p) => ({ ...p })),
    semesters,
    patients,
    interventions,
  };
}

function minDate(a, b) {
  return a.getTime() < b.getTime() ? a : b;
}
