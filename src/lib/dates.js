// Helpers de dates basés sur date-fns + locale FR.
import { format, parseISO, differenceInYears, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

function toDate(value) {
  if (!value) return null;
  return value instanceof Date ? value : parseISO(value);
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'dd MMM yyyy', { locale: fr });
}

export function formatDateShort(value) {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'dd MMM', { locale: fr });
}

export function formatDateLong(value) {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'EEEE dd MMMM yyyy', { locale: fr });
}

export function formatDateTimeLong(value) {
  const d = toDate(value) || new Date();
  return format(d, "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatMonthYear(value) {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'MMM yy', { locale: fr });
}

export function monthKey(value) {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'yyyy-MM');
}

export function ageFromDOB(value) {
  const d = toDate(value);
  if (!d) return null;
  const years = differenceInYears(new Date(), d);
  return Number.isFinite(years) && years >= 0 ? years : null;
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

// Statut d'un semestre déduit de ses dates (sauf s'il est archivé).
export function semesterStatus(semester, now = new Date()) {
  if (semester?.archived) return 'archive';
  const start = toDate(semester.startDate);
  const end = toDate(semester.endDate);
  if (!start || !end) return 'termine';
  if (now < start) return 'a_venir';
  if (isWithinInterval(now, { start, end })) return 'en_cours';
  return 'termine';
}

export const STATUS_LABELS = {
  en_cours: 'En cours',
  termine: 'Terminé',
  a_venir: 'À venir',
  archive: 'Archivé',
};

// Fraction écoulée du semestre (0–1).
export function semesterTimeProgress(semester, now = new Date()) {
  const start = toDate(semester.startDate);
  const end = toDate(semester.endDate);
  if (!start || !end || end <= start) return 0;
  const elapsed = Math.min(now - start, end - start);
  return Math.max(0, Math.min(1, elapsed / (end - start)));
}
