// Export / import JSON de toutes les données (sauvegarde & restauration).
import { APP_VERSION } from '../data/constants';

export function buildExport(state) {
  return {
    app: 'CardioThoNoa',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      services: state.services,
      surgeons: state.surgeons,
      semesters: state.semesters,
      patients: state.patients,
      procedureTypes: state.procedureTypes,
      interventions: state.interventions,
      currentSemesterId: state.currentSemesterId,
    },
  };
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportFilename() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
  return `cardiothonoa-${stamp}.json`;
}

export function parseImport(text) {
  const json = JSON.parse(text);
  const data = json && json.data ? json.data : json;
  const required = [
    'services',
    'surgeons',
    'semesters',
    'patients',
    'procedureTypes',
    'interventions',
  ];
  for (const key of required) {
    if (!Array.isArray(data[key])) {
      throw new Error(`Fichier invalide : champ « ${key} » manquant ou incorrect.`);
    }
  }
  return data;
}

export function importSummary(data) {
  return {
    services: data.services.length,
    surgeons: data.surgeons.length,
    semesters: data.semesters.length,
    patients: data.patients.length,
    procedureTypes: data.procedureTypes.length,
    interventions: data.interventions.length,
  };
}
