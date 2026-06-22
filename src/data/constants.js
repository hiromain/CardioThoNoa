// CardioThoNoa — Constantes de l'application
// Persona, configuration des spécialités, positions opératoires.

export const APP_USER = {
  prenom: 'Noa',
  nom: 'Martin',
  initiales: 'NM',
  promotion: 'Promo 2024',
  hopital: 'CHU de Lyon — Hôpital Louis Pradel',
};

export const APP_VERSION = '1.0.0';
export const STORAGE_KEY = 'cardiothonoa-v1';

// Rôles de compte (cf. table Supabase `profiles`).
//   - 'intern' : utilisateur standard (interne en formation), usage par défaut.
//   - 'admin'  : super-admin global (gère le catalogue de gestes partagé,
//                supervise les internes et les centres). Voir supabase/migrations/
//                0004_roles_centres_catalog.sql.
export const ROLES = { INTERN: 'intern', ADMIN: 'admin' };

// Portail de saisie EpiCard (registre national de chirurgie cardiaque).
export const EPICARD_URL =
  'https://fsm.tentelemed.com/Ctms-fsm/portal/login?2&page_target=com.tentelemed.portal.pages.JumpBoardPage';

// Configuration visuelle par type de service / spécialité.
export const SPECIALTIES = {
  cardiaque: {
    key: 'cardiaque',
    label: 'Cardiaque',
    color: '#C0392B',
    light: '#FDECEA',
    muted: 'rgba(192,57,43,0.12)',
    emoji: '🫀',
  },
  thoracique: {
    key: 'thoracique',
    label: 'Thoracique',
    color: '#2171B5',
    light: '#EBF5FB',
    muted: 'rgba(33,113,181,0.12)',
    emoji: '🫁',
  },
  congenitale: {
    key: 'congenitale',
    label: 'Congénitale',
    color: '#1B8A6B',
    light: '#E8F8F4',
    muted: 'rgba(27,138,107,0.12)',
    emoji: '👶',
  },
  autre: {
    key: 'autre',
    label: 'Autre',
    color: '#6C3483',
    light: '#F4ECF7',
    muted: 'rgba(108,52,131,0.12)',
    emoji: '⚕️',
  },
};

export function getSpecialty(type) {
  return SPECIALTIES[type] || SPECIALTIES.autre;
}

// Positions de l'interne dans l'intervention (cf. cahier des charges).
export const POSITIONS = ['opérateur principal', '1er assistant', '2ème assistant'];

export function getPositionStyle(position) {
  switch (position) {
    case 'opérateur principal':
      return { color: '#27AE60', bg: 'rgba(39,174,96,0.12)', short: 'Opérateur' };
    case '1er assistant':
      return { color: '#1E3A5F', bg: 'rgba(30,58,95,0.10)', short: '1er assist.' };
    case '2ème assistant':
      return { color: '#5B6880', bg: 'rgba(91,104,128,0.12)', short: '2e assist.' };
    default:
      return { color: '#5B6880', bg: 'var(--surface-2)', short: position };
  }
}

// Portées possibles d'un type de geste.
export const SCOPES = [
  { value: 'patient', label: 'Sur le patient' },
  { value: 'intern', label: "Par l'interne" },
  { value: 'both', label: 'Les deux' },
];

export const SERVICE_TYPES = [
  { value: 'cardiaque', label: 'Cardiaque' },
  { value: 'thoracique', label: 'Thoracique' },
  { value: 'congenitale', label: 'Cardiaque Congénitale' },
  { value: 'autre', label: 'Autre' },
];
