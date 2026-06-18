import { APP_VERSION } from '../data/constants';
import { downloadJSON } from './exportData';

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function buildPatientsExport(patients) {
  return {
    app: 'CardioThoNoa',
    kind: 'patients',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    patients,
  };
}

export function exportPatientsJSON(patients) {
  downloadJSON(buildPatientsExport(patients), `cardiothonoa-patients-${stamp()}.json`);
}

// ── CSV ──────────────────────────────────────────────────────────────────────

function escapeCSV(value) {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildPatientsCSV(patients) {
  const header = ['id', 'lastName', 'firstName', 'dateOfBirth'];
  const rows = patients.map((p) =>
    header.map((k) => escapeCSV(p[k])).join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

export function exportPatientsCSV(patients) {
  const csv = buildPatientsCSV(patients);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cardiothonoa-patients-${stamp()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Import ────────────────────────────────────────────────────────────────────

function validatePatient(p) {
  return p && typeof p.id === 'string' && p.id.length > 0;
}

export function parsePatientsJSON(text) {
  const json = JSON.parse(text);
  const patients = Array.isArray(json) ? json : json?.patients;
  if (!Array.isArray(patients)) throw new Error("Format invalide : aucun tableau de patients trouvé.");
  const valid = patients.filter(validatePatient);
  if (valid.length === 0 && patients.length > 0)
    throw new Error("Aucun patient valide (champ « id » manquant).");
  return valid;
}

export function parsePatientsCSV(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("Fichier CSV vide ou sans données.");

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const idIdx = headers.indexOf('id');
  if (idIdx === -1) throw new Error("Colonne « id » manquante dans le CSV.");

  const patients = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVRow(lines[i]);
    const p = {};
    headers.forEach((h, idx) => { p[h] = cols[idx] ?? ''; });
    if (validatePatient(p)) patients.push(p);
  }
  if (patients.length === 0) throw new Error("Aucun patient valide dans le fichier CSV.");
  return patients;
}

// Parsing CSV minimal (gère les guillemets).
function splitCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function patientsMergeSummary(existing, incoming) {
  const existingIds = new Set(existing.map((p) => p.id));
  const added = incoming.filter((p) => !existingIds.has(p.id)).length;
  const updated = incoming.filter((p) => existingIds.has(p.id)).length;
  return { added, updated, total: incoming.length };
}
