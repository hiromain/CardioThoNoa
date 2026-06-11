// Export Excel (.xlsx) — classeur multi-feuilles avec mise en forme, pensé
// pour être lisible directement (chefs de service, co-internes, etc.) sans
// connaissance technique. Utilise xlsx-js-style (fonctionne dans le
// navigateur, sans polyfill Node).
import * as XLSX from 'xlsx-js-style';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APP_USER, APP_VERSION, getSpecialty, SCOPES, getPositionStyle } from '../data/constants';
import {
  surgeonFullName,
  patientName,
  procLabel,
  resolveIntervention,
  interventionsForSemester,
  aggregatePatients,
  serviceForSemester,
  surgeonInterventionCount,
} from './queries';
import { ageFromDOB, semesterStatus, STATUS_LABELS } from './dates';

// ── Couleurs / styles communs ───────────────────────────────────────────────
const PRIMARY = '1E3A5F';
const WHITE = 'FFFFFF';
const INK_2 = '5B6880';
const ZEBRA = 'F4F6F9';
const BANNER_BG = 'E2E8F2';

const hex = (c) => (c || '').replace('#', '').toUpperCase();

const headerCellStyle = {
  font: { bold: true, color: { rgb: WHITE }, sz: 11 },
  fill: { fgColor: { rgb: PRIMARY } },
  alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
};

const sectionBannerStyle = {
  font: { bold: true, sz: 12, color: { rgb: PRIMARY } },
  fill: { fgColor: { rgb: BANNER_BG } },
  alignment: { vertical: 'center' },
};

const zebraStyle = { fill: { fgColor: { rgb: ZEBRA } } };

const labelStyle = { font: { bold: true, color: { rgb: INK_2 }, sz: 10 } };

const titleStyle = { font: { bold: true, sz: 16, color: { rgb: PRIMARY } } };
const subtitleStyle = { font: { italic: true, sz: 11, color: { rgb: INK_2 } } };

function specialtyCellStyle(cfg) {
  return {
    font: { bold: true, color: { rgb: hex(cfg.color) } },
    fill: { fgColor: { rgb: hex(cfg.light) } },
    alignment: { horizontal: 'center' },
  };
}

function positionCellStyle(position) {
  const st = getPositionStyle(position);
  return { font: { bold: true, color: { rgb: hex(st.color) } } };
}

const scopeLabel = (v) => SCOPES.find((s) => s.value === v)?.label || v;
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function fmtDateFR(iso) {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return iso;
  }
}

// ── Builder pour feuilles « libres » (résumé) ───────────────────────────────
function createSheetBuilder() {
  const rows = [];
  const cellStyles = [];
  const merges = [];

  function push(rowArr) {
    rows.push(rowArr);
    return rows.length - 1;
  }
  function styleCell(r, c, style) {
    cellStyles.push({ r, c, style });
  }
  function styleRow(r, style, colCount) {
    for (let c = 0; c < colCount; c++) styleCell(r, c, style);
  }
  function merge(r1, c1, r2, c2) {
    merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
  }
  function build(colWidths) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    cellStyles.forEach(({ r, c, style }) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = { ...(ws[addr].s || {}), ...style };
    });
    if (merges.length) ws['!merges'] = merges;
    if (colWidths) ws['!cols'] = colWidths.map((wch) => ({ wch }));
    return ws;
  }
  return { push, styleCell, styleRow, merge, build };
}

// ── Builder pour feuilles tabulaires ────────────────────────────────────────
// rows: [{ values: [...], styles?: { [colIndex]: cellStyle } }]
function buildTableSheet(headers, rows, { colWidths } = {}) {
  const aoa = [headers, ...rows.map((r) => r.values)];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  headers.forEach((_, c) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    ws[addr].s = headerCellStyle;
  });

  rows.forEach((row, i) => {
    const r = i + 1;
    const zebra = i % 2 === 1;
    headers.forEach((_, c) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      const extra = row.styles?.[c];
      if (zebra || extra) {
        ws[addr].s = { ...(zebra ? zebraStyle : {}), ...(ws[addr].s || {}), ...(extra || {}) };
      }
    });
  });

  if (colWidths) ws['!cols'] = colWidths.map((wch) => ({ wch }));
  ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}1` };
  return ws;
}

// ── Feuille 1 : Résumé ───────────────────────────────────────────────────────
function buildSummarySheet(data) {
  const b = createSheetBuilder();

  b.push(['CardioThoNoa — Export des données']);
  b.styleCell(0, 0, titleStyle);
  b.merge(0, 0, 0, 6);

  b.push(['Carnet de stage — Chirurgie cardio-thoracique']);
  b.styleCell(1, 0, subtitleStyle);
  b.merge(1, 0, 1, 6);

  b.push([]);

  const infoRows = [
    ['Interne', `${APP_USER.prenom} ${APP_USER.nom}`],
    ['Promotion', APP_USER.promotion],
    ['Hôpital', APP_USER.hopital],
    ['Export généré le', format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })],
    ['Version application', APP_VERSION],
  ];
  infoRows.forEach(([label, value]) => {
    const r = b.push([label, value]);
    b.styleCell(r, 0, labelStyle);
  });

  b.push([]);

  // Vue d'ensemble
  let r = b.push(["Vue d'ensemble"]);
  b.styleRow(r, sectionBannerStyle, 7);
  b.merge(r, 0, r, 6);

  const overviewHeaders = [
    'Semestres',
    'Services',
    'Chirurgiens',
    'Patients',
    'Types de gestes',
    'Interventions',
    'Gestes réalisés (interne)',
  ];
  r = b.push(overviewHeaders);
  b.styleRow(r, headerCellStyle, overviewHeaders.length);

  const totalGestes = data.interventions.reduce((a, i) => a + (i.internProcedures || []).length, 0);
  r = b.push([
    data.semesters.length,
    data.services.length,
    data.surgeons.length,
    data.patients.length,
    data.procedureTypes.length,
    data.interventions.length,
    totalGestes,
  ]);
  b.styleRow(r, { alignment: { horizontal: 'center' }, font: { bold: true, sz: 12, color: { rgb: PRIMARY } } }, overviewHeaders.length);

  b.push([]);

  // Détail par semestre
  r = b.push(['Détail par semestre']);
  b.styleRow(r, sectionBannerStyle, 11);
  b.merge(r, 0, r, 10);

  const semHeaders = [
    'Semestre',
    'Service',
    'Spécialité',
    'Début',
    'Fin',
    'Statut',
    'Interventions',
    'Objectif interv.',
    '% objectif',
    'Gestes (interne)',
    'Objectif gestes',
  ];
  r = b.push(semHeaders);
  b.styleRow(r, headerCellStyle, semHeaders.length);

  const sortedSemesters = [...data.semesters].sort((a, c) => a.startDate.localeCompare(c.startDate));
  sortedSemesters.forEach((sem, idx) => {
    const ints = interventionsForSemester(data, sem.id);
    const gestes = ints.reduce((a, i) => a + (i.internProcedures || []).length, 0);
    const service = serviceForSemester(data, sem.id);
    const cfg = getSpecialty(service?.type);
    const obj = sem.objectives || {};
    const pctVal = obj.interventions ? ints.length / obj.interventions : 0;
    const rIdx = b.push([
      sem.label,
      service?.name || '—',
      cfg.label,
      fmtDateFR(sem.startDate),
      fmtDateFR(sem.endDate),
      STATUS_LABELS[semesterStatus(sem)],
      ints.length,
      obj.interventions ?? '—',
      pctVal,
      gestes,
      obj.gestes ?? '—',
    ]);
    if (idx % 2 === 1) b.styleRow(rIdx, zebraStyle, semHeaders.length);
    b.styleCell(rIdx, 2, specialtyCellStyle(cfg));
    b.styleCell(rIdx, 8, { numFmt: '0%', alignment: { horizontal: 'center' } });
  });

  return b.build([22, 30, 12, 12, 12, 14, 13, 13, 11, 15, 13]);
}

// ── Feuille 2 : Interventions ───────────────────────────────────────────────
function buildInterventionsSheet(data) {
  const headers = [
    'Date',
    'Semestre',
    'Spécialité',
    'Patient',
    'Date de naissance',
    'Âge',
    'Chirurgien',
    'Position',
    'Gestes sur le patient',
    'Gestes réalisés (interne)',
    'Notes',
  ];

  const sorted = [...data.interventions].sort((a, b) => a.date.localeCompare(b.date));
  const rows = sorted.map((raw) => {
    const item = resolveIntervention(data, raw);
    const cfg = item.specialty;
    return {
      values: [
        fmtDateFR(item.date),
        item.semester?.label || '—',
        cfg.label,
        patientName(item.patient),
        fmtDateFR(item.patient?.dateOfBirth),
        ageFromDOB(item.patient?.dateOfBirth) ?? '—',
        surgeonFullName(item.surgeon),
        capitalize(item.position),
        item.patientProcs.map(procLabel).join(', ') || '—',
        item.internProcs.map(procLabel).join(', ') || '—',
        item.notes || '',
      ],
      styles: {
        2: specialtyCellStyle(cfg),
        7: positionCellStyle(item.position),
        10: { alignment: { wrapText: true, vertical: 'top' } },
      },
    };
  });

  return buildTableSheet(headers, rows, {
    colWidths: [11, 9, 12, 22, 14, 6, 22, 16, 32, 32, 42],
  });
}

// ── Feuille 3 : Patients ─────────────────────────────────────────────────────
function buildPatientsSheet(data) {
  const headers = ['Nom', 'Prénom', 'Date de naissance', 'Âge', 'Spécialités suivies', 'Nb interventions', 'Dernière intervention'];

  const rows = aggregatePatients(data).map((p) => ({
    values: [
      p.lastName,
      p.firstName,
      fmtDateFR(p.dateOfBirth),
      ageFromDOB(p.dateOfBirth) ?? '—',
      p.specialties.map((t) => getSpecialty(t).label).join(', ') || '—',
      p.count,
      fmtDateFR(p.lastDate) || '—',
    ],
    styles: {
      5: { alignment: { horizontal: 'center' }, font: { bold: true, color: { rgb: PRIMARY } } },
    },
  }));

  return buildTableSheet(headers, rows, {
    colWidths: [18, 16, 15, 6, 24, 14, 18],
  });
}

// ── Feuille 4 : Semestres ────────────────────────────────────────────────────
function buildSemestersSheet(data) {
  const headers = [
    'Semestre',
    'Service',
    'Spécialité',
    'Début',
    'Fin',
    'Statut',
    'Interventions',
    'Objectif interv.',
    '% objectif interv.',
    'Gestes (interne)',
    'Objectif gestes',
    '% objectif gestes',
  ];

  const sorted = [...data.semesters].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const rows = sorted.map((sem) => {
    const ints = interventionsForSemester(data, sem.id);
    const gestes = ints.reduce((a, i) => a + (i.internProcedures || []).length, 0);
    const service = serviceForSemester(data, sem.id);
    const cfg = getSpecialty(service?.type);
    const obj = sem.objectives || {};
    const pctInt = obj.interventions ? ints.length / obj.interventions : 0;
    const pctGestes = obj.gestes ? gestes / obj.gestes : 0;
    return {
      values: [
        sem.label,
        service?.name || '—',
        cfg.label,
        fmtDateFR(sem.startDate),
        fmtDateFR(sem.endDate),
        STATUS_LABELS[semesterStatus(sem)],
        ints.length,
        obj.interventions ?? '—',
        pctInt,
        gestes,
        obj.gestes ?? '—',
        pctGestes,
      ],
      styles: {
        2: specialtyCellStyle(cfg),
        8: { numFmt: '0%', alignment: { horizontal: 'center' } },
        11: { numFmt: '0%', alignment: { horizontal: 'center' } },
      },
    };
  });

  return buildTableSheet(headers, rows, {
    colWidths: [12, 30, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13],
  });
}

// ── Feuille 5 : Chirurgiens ──────────────────────────────────────────────────
function buildSurgeonsSheet(data) {
  const headers = ['Nom', 'Prénom', 'Titre', 'Service', 'Spécialité', 'Nb interventions (sur la période)'];

  const sorted = [...data.surgeons].sort((a, b) =>
    `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
  );

  const rows = sorted.map((sg) => {
    const service = data.services.find((s) => s.id === sg.serviceId);
    const cfg = getSpecialty(service?.type);
    return {
      values: [
        sg.lastName,
        sg.firstName,
        sg.title || '—',
        service?.name || '—',
        cfg.label,
        surgeonInterventionCount(data, sg.id),
      ],
      styles: {
        4: specialtyCellStyle(cfg),
        5: { alignment: { horizontal: 'center' }, font: { bold: true, color: { rgb: PRIMARY } } },
      },
    };
  });

  return buildTableSheet(headers, rows, {
    colWidths: [16, 14, 8, 30, 12, 16],
  });
}

// ── Feuille 6 : Gestes ────────────────────────────────────────────────────────
const SERVICE_TYPE_ORDER = ['cardiaque', 'thoracique', 'autre'];

function buildProceduresSheet(data) {
  const headers = ['Geste', 'Abréviation', 'Spécialité', 'Portée', 'Réalisations (interne)', 'Utilisations (sur patient)'];

  const sorted = [...data.procedureTypes].sort((a, b) => {
    const oa = SERVICE_TYPE_ORDER.indexOf(a.serviceType);
    const ob = SERVICE_TYPE_ORDER.indexOf(b.serviceType);
    if (oa !== ob) return oa - ob;
    return (a.name || '').localeCompare(b.name || '');
  });

  const rows = sorted.map((pt) => {
    const cfg = getSpecialty(pt.serviceType);
    const internCount = data.interventions.filter((i) => (i.internProcedures || []).includes(pt.id)).length;
    const patientCount = data.interventions.filter((i) => (i.patientProcedures || []).includes(pt.id)).length;
    return {
      values: [pt.name, pt.abbr || '—', cfg.label, scopeLabel(pt.scope), internCount, patientCount],
      styles: {
        2: specialtyCellStyle(cfg),
        4: { alignment: { horizontal: 'center' }, font: { bold: true, color: { rgb: PRIMARY } } },
        5: { alignment: { horizontal: 'center' } },
      },
    };
  });

  return buildTableSheet(headers, rows, {
    colWidths: [34, 16, 12, 16, 16, 18],
  });
}

// ── API publique ──────────────────────────────────────────────────────────────
export function buildExcelWorkbook(data) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSummarySheet(data), 'Résumé');
  XLSX.utils.book_append_sheet(wb, buildInterventionsSheet(data), 'Interventions');
  XLSX.utils.book_append_sheet(wb, buildPatientsSheet(data), 'Patients');
  XLSX.utils.book_append_sheet(wb, buildSemestersSheet(data), 'Semestres');
  XLSX.utils.book_append_sheet(wb, buildSurgeonsSheet(data), 'Chirurgiens');
  XLSX.utils.book_append_sheet(wb, buildProceduresSheet(data), 'Gestes');
  return wb;
}

export function downloadWorkbook(wb, filename) {
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportExcelFilename() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes()
  )}`;
  return `cardiothonoa-${stamp}.xlsx`;
}

export function exportExcel(data) {
  downloadWorkbook(buildExcelWorkbook(data), exportExcelFilename());
}
