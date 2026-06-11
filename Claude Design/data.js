// CardioThoNoa — Mock Data & App Configuration
// Noa Martin — Interne en Chirurgie Cardio-Thoracique, CHU de Lyon

const APP_USER = {
  prenom: 'Noa',
  nom: 'Martin',
  initiales: 'NM',
  promotion: 'Promo 2024',
  hopital: 'CHU de Lyon — Hôpital Louis Pradel',
};

const SPECIALITES_CONFIG = {
  Cardiaque: {
    label: 'Cardiaque',
    color: '#C0392B',
    colorLight: '#FDECEA',
    colorMuted: 'rgba(192,57,43,0.12)',
    chirurgiens: [
      { id: 'cc1', nom: 'Pr. Dubois',   initiales: 'PD' },
      { id: 'cc2', nom: 'Dr. Mercier',  initiales: 'DM' },
      { id: 'cc3', nom: 'Dr. Fontaine', initiales: 'DF' },
    ],
    types: [
      'Chirurgie coronarienne',
      'Chirurgie valvulaire',
      "Chirurgie de l'aorte",
      'Chirurgie congénitale',
      'Transplantation cardiaque',
      'Assistance circulatoire',
    ],
    gestes: [
      { id: 'cg1',  label: 'CEC',              full: 'Circulation Extra-Corporelle' },
      { id: 'cg2',  label: 'CABG',             full: 'Pontage aorto-coronarien' },
      { id: 'cg3',  label: 'RVA',              full: 'Remplacement valvulaire aortique' },
      { id: 'cg4',  label: 'RVM',              full: 'Remplacement valvulaire mitral' },
      { id: 'cg5',  label: 'Plastie mitrale',  full: 'Plastie mitrale' },
      { id: 'cg6',  label: 'Aorte asc.',       full: 'Remplacement aorte ascendante' },
      { id: 'cg7',  label: 'Fermeture CIV',    full: 'Fermeture CIV' },
      { id: 'cg8',  label: 'Fermeture CIA',    full: 'Fermeture CIA' },
      { id: 'cg9',  label: 'ECMO',             full: 'Pose ECMO' },
      { id: 'cg10', label: 'LVAD',             full: 'Pose LVAD / BiVAD' },
    ],
  },
  Thoracique: {
    label: 'Thoracique',
    color: '#2171B5',
    colorLight: '#EBF5FB',
    colorMuted: 'rgba(33,113,181,0.12)',
    chirurgiens: [
      { id: 'tc1', nom: 'Pr. Laurent', initiales: 'PL' },
      { id: 'tc2', nom: 'Dr. Bernard', initiales: 'DB' },
      { id: 'tc3', nom: 'Dr. Petit',   initiales: 'DP' },
    ],
    types: [
      'Chirurgie pulmonaire',
      'Chirurgie pleurale',
      'Chirurgie médiastinale',
      'Chirurgie œsophagienne',
      'Chirurgie de la paroi thoracique',
      'Traumatologie thoracique',
    ],
    gestes: [
      { id: 'tg1',  label: 'Lobectomie',        full: 'Lobectomie' },
      { id: 'tg2',  label: 'Segmentectomie',     full: 'Segmentectomie' },
      { id: 'tg3',  label: 'Pneumonectomie',     full: 'Pneumonectomie' },
      { id: 'tg4',  label: 'Résection atypique', full: 'Résection atypique' },
      { id: 'tg5',  label: 'Pleurectomie',       full: 'Pleurectomie' },
      { id: 'tg6',  label: 'Décortication',      full: 'Décortication pleurale' },
      { id: 'tg7',  label: 'Thymectomie',        full: 'Thymectomie' },
      { id: 'tg8',  label: 'Œsophagectomie',     full: 'Œsophagectomie' },
      { id: 'tg9',  label: 'VATS',               full: 'Chirurgie thoracoscopique vidéo-assistée' },
      { id: 'tg10', label: 'Drain thoracique',   full: 'Pose drain thoracique' },
      { id: 'tg11', label: 'Médiastinoscopie',   full: 'Médiastinoscopie' },
    ],
  },
};

const SEMESTRES_DATA = [
  {
    id: 's3',
    label: 'S3',
    titre: 'Chirurgie Thoracique',
    service: 'Service de Chirurgie Thoracique',
    specialite: 'Thoracique',
    hopital: 'CHU de Lyon — Hôpital Louis Pradel',
    chef: 'Pr. Laurent',
    debut: '2025-11-01',
    fin: '2026-04-30',
    statut: 'en_cours',
    objectifs: { total: 30, gestes: 20 },
  },
  {
    id: 's2',
    label: 'S2',
    titre: 'Chirurgie Cardiaque',
    service: 'Service de Chirurgie Cardiaque',
    specialite: 'Cardiaque',
    hopital: 'CHU de Lyon — Hôpital Louis Pradel',
    chef: 'Pr. Dubois',
    debut: '2025-05-01',
    fin: '2025-10-31',
    statut: 'termine',
    objectifs: { total: 25, gestes: 15 },
  },
  {
    id: 's1',
    label: 'S1',
    titre: 'Chirurgie Thoracique',
    service: 'Service de Chirurgie Thoracique',
    specialite: 'Thoracique',
    hopital: 'CHU de Lyon — Hôpital Louis Pradel',
    chef: 'Pr. Laurent',
    debut: '2024-11-01',
    fin: '2025-04-30',
    statut: 'termine',
    objectifs: { total: 20, gestes: 12 },
  },
];

const INTERVENTIONS_DATA = [
  // ─── S3 Thoracique (en cours) ─────────────────────────────────────────────
  {
    id: 'i01', semestreId: 's3',
    patient: { nom: 'MARTIN', prenom: 'Jean', ddn: '1958-03-14' },
    date: '2026-06-05', specialite: 'Thoracique',
    types: ['Chirurgie pulmonaire'],
    chirurgien: { id: 'tc1', nom: 'Pr. Laurent', initiales: 'PL' },
    gestes: ['Lobectomie', 'VATS'],
    notes: 'Lobectomie inférieure droite par VATS, suites simples.',
  },
  {
    id: 'i02', semestreId: 's3',
    patient: { nom: 'DUPONT', prenom: 'Marie', ddn: '1945-07-22' },
    date: '2026-06-03', specialite: 'Thoracique',
    types: ['Chirurgie pleurale'],
    chirurgien: { id: 'tc2', nom: 'Dr. Bernard', initiales: 'DB' },
    gestes: ['Pleurectomie', 'Décortication'],
    notes: '',
  },
  {
    id: 'i03', semestreId: 's3',
    patient: { nom: 'BERNARD', prenom: 'Pierre', ddn: '1962-11-08' },
    date: '2026-05-28', specialite: 'Thoracique',
    types: ['Chirurgie médiastinale'],
    chirurgien: { id: 'tc1', nom: 'Pr. Laurent', initiales: 'PL' },
    gestes: ['Thymectomie', 'VATS'],
    notes: '',
  },
  {
    id: 'i04', semestreId: 's3',
    patient: { nom: 'LEBLANC', prenom: 'Sophie', ddn: '1970-04-01' },
    date: '2026-05-20', specialite: 'Thoracique',
    types: ['Chirurgie pulmonaire'],
    chirurgien: { id: 'tc3', nom: 'Dr. Petit', initiales: 'DP' },
    gestes: ['Segmentectomie'],
    notes: '',
  },
  {
    id: 'i05', semestreId: 's3',
    patient: { nom: 'GARCIA', prenom: 'Luis', ddn: '1955-09-15' },
    date: '2026-05-14', specialite: 'Thoracique',
    types: ['Chirurgie pulmonaire'],
    chirurgien: { id: 'tc1', nom: 'Pr. Laurent', initiales: 'PL' },
    gestes: ['Lobectomie', 'VATS'],
    notes: '',
  },
  {
    id: 'i06', semestreId: 's3',
    patient: { nom: 'MOREAU', prenom: 'Claire', ddn: '1948-12-03' },
    date: '2026-04-30', specialite: 'Thoracique',
    types: ['Chirurgie pleurale', 'Traumatologie thoracique'],
    chirurgien: { id: 'tc2', nom: 'Dr. Bernard', initiales: 'DB' },
    gestes: ['Drain thoracique'],
    notes: '',
  },
  {
    id: 'i07', semestreId: 's3',
    patient: { nom: 'LEROY', prenom: 'Thomas', ddn: '1967-06-20' },
    date: '2026-04-22', specialite: 'Thoracique',
    types: ['Chirurgie pulmonaire'],
    chirurgien: { id: 'tc1', nom: 'Pr. Laurent', initiales: 'PL' },
    gestes: ['Résection atypique', 'VATS'],
    notes: '',
  },
  {
    id: 'i08', semestreId: 's3',
    patient: { nom: 'SIMON', prenom: 'Hélène', ddn: '1953-02-28' },
    date: '2026-04-10', specialite: 'Thoracique',
    types: ['Chirurgie œsophagienne'],
    chirurgien: { id: 'tc1', nom: 'Pr. Laurent', initiales: 'PL' },
    gestes: ['Œsophagectomie'],
    notes: '',
  },
  {
    id: 'i09', semestreId: 's3',
    patient: { nom: 'RICHARD', prenom: 'Marc', ddn: '1960-08-17' },
    date: '2026-03-25', specialite: 'Thoracique',
    types: ['Chirurgie pulmonaire'],
    chirurgien: { id: 'tc3', nom: 'Dr. Petit', initiales: 'DP' },
    gestes: ['Lobectomie'],
    notes: '',
  },
  {
    id: 'i10', semestreId: 's3',
    patient: { nom: 'DAVID', prenom: 'Isabelle', ddn: '1972-05-11' },
    date: '2026-03-12', specialite: 'Thoracique',
    types: ['Chirurgie médiastinale'],
    chirurgien: { id: 'tc2', nom: 'Dr. Bernard', initiales: 'DB' },
    gestes: ['Médiastinoscopie'],
    notes: '',
  },
  {
    id: 'i11', semestreId: 's3',
    patient: { nom: 'THOMAS', prenom: 'Nicolas', ddn: '1958-01-30' },
    date: '2026-02-28', specialite: 'Thoracique',
    types: ['Chirurgie pulmonaire'],
    chirurgien: { id: 'tc1', nom: 'Pr. Laurent', initiales: 'PL' },
    gestes: ['Pneumonectomie'],
    notes: '',
  },
  {
    id: 'i12', semestreId: 's3',
    patient: { nom: 'PETIT', prenom: 'Anne', ddn: '1943-10-07' },
    date: '2026-01-15', specialite: 'Thoracique',
    types: ['Chirurgie pleurale'],
    chirurgien: { id: 'tc2', nom: 'Dr. Bernard', initiales: 'DB' },
    gestes: ['Décortication'],
    notes: '',
  },
  // ─── S2 Cardiaque (terminé) ───────────────────────────────────────────────
  {
    id: 'i13', semestreId: 's2',
    patient: { nom: 'LAMBERT', prenom: 'François', ddn: '1952-04-16' },
    date: '2025-10-20', specialite: 'Cardiaque',
    types: ['Chirurgie valvulaire'],
    chirurgien: { id: 'cc1', nom: 'Pr. Dubois', initiales: 'PD' },
    gestes: ['RVA', 'CEC'],
    notes: '',
  },
  {
    id: 'i14', semestreId: 's2',
    patient: { nom: 'ROUX', prenom: 'Sylvie', ddn: '1959-07-04' },
    date: '2025-10-08', specialite: 'Cardiaque',
    types: ['Chirurgie coronarienne'],
    chirurgien: { id: 'cc1', nom: 'Pr. Dubois', initiales: 'PD' },
    gestes: ['CABG', 'CEC'],
    notes: '',
  },
  {
    id: 'i15', semestreId: 's2',
    patient: { nom: 'VINCENT', prenom: 'Paul', ddn: '1964-03-22' },
    date: '2025-09-30', specialite: 'Cardiaque',
    types: ["Chirurgie de l'aorte"],
    chirurgien: { id: 'cc2', nom: 'Dr. Mercier', initiales: 'DM' },
    gestes: ['Aorte asc.', 'CEC'],
    notes: '',
  },
  {
    id: 'i16', semestreId: 's2',
    patient: { nom: 'BLANC', prenom: 'Christine', ddn: '1956-11-30' },
    date: '2025-09-15', specialite: 'Cardiaque',
    types: ['Chirurgie valvulaire'],
    chirurgien: { id: 'cc1', nom: 'Pr. Dubois', initiales: 'PD' },
    gestes: ['Plastie mitrale', 'CEC'],
    notes: '',
  },
  {
    id: 'i17', semestreId: 's2',
    patient: { nom: 'HENRY', prenom: 'Jacques', ddn: '1947-08-12' },
    date: '2025-09-02', specialite: 'Cardiaque',
    types: ['Chirurgie valvulaire'],
    chirurgien: { id: 'cc3', nom: 'Dr. Fontaine', initiales: 'DF' },
    gestes: ['RVM', 'CEC'],
    notes: '',
  },
  {
    id: 'i18', semestreId: 's2',
    patient: { nom: 'ROUSSEAU', prenom: 'Marcel', ddn: '1950-02-14' },
    date: '2025-08-20', specialite: 'Cardiaque',
    types: ['Chirurgie coronarienne'],
    chirurgien: { id: 'cc2', nom: 'Dr. Mercier', initiales: 'DM' },
    gestes: ['CABG', 'CEC'],
    notes: '',
  },
  {
    id: 'i19', semestreId: 's2',
    patient: { nom: 'PETIT', prenom: 'René', ddn: '1945-06-10' },
    date: '2025-08-05', specialite: 'Cardiaque',
    types: ['Transplantation cardiaque'],
    chirurgien: { id: 'cc1', nom: 'Pr. Dubois', initiales: 'PD' },
    gestes: ['CEC', 'ECMO'],
    notes: '',
  },
  {
    id: 'i20', semestreId: 's2',
    patient: { nom: 'DURAND', prenom: 'Martine', ddn: '1963-09-18' },
    date: '2025-07-18', specialite: 'Cardiaque',
    types: ['Chirurgie valvulaire'],
    chirurgien: { id: 'cc1', nom: 'Pr. Dubois', initiales: 'PD' },
    gestes: ['RVA', 'CEC'],
    notes: '',
  },
  // ─── S1 Thoracique (terminé) ──────────────────────────────────────────────
  {
    id: 'i21', semestreId: 's1',
    patient: { nom: 'NOEL', prenom: 'Pierre', ddn: '1950-12-25' },
    date: '2025-04-10', specialite: 'Thoracique',
    types: ['Chirurgie pulmonaire'],
    chirurgien: { id: 'tc1', nom: 'Pr. Laurent', initiales: 'PL' },
    gestes: ['Lobectomie', 'VATS'],
    notes: '',
  },
  {
    id: 'i22', semestreId: 's1',
    patient: { nom: 'GIRARD', prenom: 'Elise', ddn: '1968-03-05' },
    date: '2025-03-20', specialite: 'Thoracique',
    types: ['Chirurgie médiastinale'],
    chirurgien: { id: 'tc2', nom: 'Dr. Bernard', initiales: 'DB' },
    gestes: ['Thymectomie'],
    notes: '',
  },
  {
    id: 'i23', semestreId: 's1',
    patient: { nom: 'MOREL', prenom: 'Henri', ddn: '1955-07-14' },
    date: '2025-02-28', specialite: 'Thoracique',
    types: ['Chirurgie pulmonaire'],
    chirurgien: { id: 'tc3', nom: 'Dr. Petit', initiales: 'DP' },
    gestes: ['Segmentectomie', 'VATS'],
    notes: '',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInterventionsBySemestre(semestreId) {
  return INTERVENTIONS_DATA.filter(i => i.semestreId === semestreId);
}

function getSpecialiteConfig(specialite) {
  return SPECIALITES_CONFIG[specialite] || SPECIALITES_CONFIG.Thoracique;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function ageFromDDN(ddn) {
  if (!ddn) return '';
  const d = new Date(ddn);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function getSemestreProgress(semestre) {
  const interventions = getInterventionsBySemestre(semestre.id);
  const total = interventions.length;
  const gestes = interventions.reduce((acc, i) => acc + i.gestes.length, 0);
  const debut = new Date(semestre.debut);
  const fin = new Date(semestre.fin);
  const now = new Date();
  const duration = fin - debut;
  const elapsed = Math.min(now - debut, duration);
  const timeProgress = Math.max(0, Math.min(1, elapsed / duration));
  return { total, gestes, timeProgress };
}
