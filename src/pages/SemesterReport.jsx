import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useData } from '../store/hooks';
import {
  byId,
  specialtyForSemester,
  serviceForSemester,
  interventionsForSemester,
  resolveIntervention,
  procLabel,
  patientName,
  surgeonFullName,
} from '../lib/queries';
import {
  kpis,
  topInternProcedures,
  topPatientProcedures,
  topSurgeons,
} from '../lib/stats';
import { formatDate, formatDateTimeLong, ageFromDOB, semesterStatus, STATUS_LABELS } from '../lib/dates';
import { POSITIONS, getPositionStyle } from '../data/constants';
import { Button } from '../components/ui/Button';
import './SemesterReport.css';

export default function SemesterReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const sem = byId(data.semesters, id);
  const profile = data.profile || {};

  const view = useMemo(() => {
    if (!sem) return null;
    const raw = interventionsForSemester(data, sem.id);
    const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
    return {
      ints: sorted.map((i) => resolveIntervention(data, i)),
      stats: kpis(raw),
      top: topInternProcedures(data, raw, 8),
      casemix: topPatientProcedures(data, raw, 8),
      chirurgiens: topSurgeons(data, raw, 6),
    };
  }, [data, sem]);

  if (!sem || !view) {
    return (
      <div className="report-shell min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center flex flex-col items-center gap-4">
          <p className="text-[15px] text-ink-2">Ce semestre n'existe plus.</p>
          <Button variant="primary" onClick={() => navigate('/semestres')}>
            <ArrowLeft size={15} /> Retour aux semestres
          </Button>
        </div>
      </div>
    );
  }

  const cfg = specialtyForSemester(data, sem.id);
  const service = serviceForSemester(data, sem.id);
  const obj = sem.objectives || { interventions: 0, gestes: 0 };
  const pctInt = obj.interventions
    ? Math.min(100, Math.round((view.ints.length / obj.interventions) * 100))
    : 0;
  const status = semesterStatus(sem);

  return (
    <div className="report-shell min-h-screen bg-bg">
      {/* Barre d'actions — masquée à l'impression */}
      <div className="no-print glass sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-line pt-safe">
        <Button variant="secondary" size="sm" onClick={() => navigate(`/semestres/${sem.id}`)}>
          <ArrowLeft size={15} /> Retour
        </Button>
        <div className="text-[13px] font-bold text-ink-1">Synthèse de semestre</div>
        <Button variant="primary" size="sm" onClick={() => window.print()}>
          <Printer size={15} /> Imprimer / PDF
        </Button>
      </div>

      <div className="report-paper" style={{ '--r-accent': cfg.color }}>

        {/* Bandeau couleur spécialité */}
        <div className="report-accent-band" />

        {/* En-tête */}
        <header className="report-header">
          <div className="report-header-left">
            <div className="report-app-name">CardioThoNoa — Carnet de stage</div>
            <h1 className="report-title">{sem.label}</h1>
            <div className="report-subtitle">
              {cfg.emoji} {cfg.label}
              {service?.name ? ` · ${service.name}` : ''}
              {service?.city ? ` · ${service.city}` : ''}
            </div>
            <div className="report-period">
              {formatDate(sem.startDate)} — {formatDate(sem.endDate)}
              <span className="report-status-badge">{STATUS_LABELS[status]}</span>
            </div>
          </div>
          <div className="report-header-right">
            <div className="report-intern-avatar">{profile.initiales || '?'}</div>
            <div className="report-intern-info">
              <strong>{profile.prenom} {profile.nom}</strong>
              <span>{profile.promotion}</span>
              <span>{profile.hopital}</span>
            </div>
          </div>
        </header>

        <div className="report-generated">
          Document généré le {formatDateTimeLong(new Date())}
        </div>

        {/* KPIs */}
        <section className="report-section">
          <div className="report-section-title">Indicateurs clés</div>
          <div className="report-kpi-grid">
            <Kpi
              value={view.ints.length}
              label="Interventions"
              sub={obj.interventions ? `Objectif : ${obj.interventions}` : undefined}
              color={cfg.color}
            />
            <Kpi
              value={view.stats.internGestes}
              label="Gestes réalisés"
              sub={obj.gestes ? `Objectif : ${obj.gestes}` : undefined}
            />
            <Kpi
              value={`${pctInt} %`}
              label="Objectif interventions"
              color={pctInt >= 80 ? '#27AE60' : pctInt >= 50 ? '#E67E22' : '#C0392B'}
            />
            <Kpi value={view.stats.patients} label="Patients distincts" />
          </div>
          {(obj.interventions > 0 || obj.gestes > 0) && (
            <div className="report-progress-list">
              {obj.interventions > 0 && (
                <ProgressRow label="Interventions" value={view.ints.length} max={obj.interventions} color={cfg.color} />
              )}
              {obj.gestes > 0 && (
                <ProgressRow label="Gestes réalisés" value={view.stats.internGestes} max={obj.gestes} color="#1E3A5F" />
              )}
            </div>
          )}
        </section>

        {/* Deux colonnes : position + top gestes interne */}
        <div className="report-two-col">
          {/* Répartition par position */}
          <section className="report-section">
            <div className="report-section-title">Autonomie — position opératoire</div>
            {POSITIONS.map((p) => {
              const st = getPositionStyle(p);
              const count = view.stats.positions[p] || 0;
              const pct = view.stats.total ? Math.round((count / view.stats.total) * 100) : 0;
              return (
                <div key={p} className="report-bar-row">
                  <span className="report-bar-label">{st.short}</span>
                  <div className="report-bar-track">
                    <span className="report-bar-fill" style={{ width: `${pct}%`, background: st.color }} />
                  </div>
                  <span className="report-bar-value" style={{ color: st.color }}>
                    {count} <small>({pct} %)</small>
                  </span>
                </div>
              );
            })}
          </section>

          {/* Top gestes interne */}
          {view.top.length > 0 && (
            <section className="report-section">
              <div className="report-section-title">Top gestes réalisés par l'interne</div>
              {view.top.map((g) => {
                const max = view.top[0].count || 1;
                const pct = Math.round((g.count / max) * 100);
                return (
                  <div key={g.id} className="report-bar-row">
                    <span className="report-bar-label report-bar-label--wide" title={g.fullName}>{g.label}</span>
                    <div className="report-bar-track">
                      <span className="report-bar-fill" style={{ width: `${pct}%`, background: g.color }} />
                    </div>
                    <span className="report-bar-value" style={{ color: g.color }}>{g.count}×</span>
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {/* Deux colonnes : case-mix patient + chirurgiens */}
        <div className="report-two-col">
          {/* Case-mix patient */}
          {view.casemix.length > 0 && (
            <section className="report-section">
              <div className="report-section-title">Case-mix — Gestes sur le patient</div>
              {view.casemix.map((g) => {
                const max = view.casemix[0].count || 1;
                const pct = Math.round((g.count / max) * 100);
                return (
                  <div key={g.id} className="report-bar-row">
                    <span className="report-bar-label report-bar-label--wide" title={g.fullName}>{g.label}</span>
                    <div className="report-bar-track">
                      <span className="report-bar-fill" style={{ width: `${pct}%`, background: g.color }} />
                    </div>
                    <span className="report-bar-value" style={{ color: g.color }}>{g.count}×</span>
                  </div>
                );
              })}
            </section>
          )}

          {/* Chirurgiens encadreurs */}
          {view.chirurgiens.length > 0 && (
            <section className="report-section">
              <div className="report-section-title">Chirurgiens encadreurs</div>
              {view.chirurgiens.map((sg) => {
                const max = view.chirurgiens[0].count || 1;
                const pct = Math.round((sg.count / max) * 100);
                return (
                  <div key={sg.id} className="report-bar-row">
                    <span className="report-bar-label report-bar-label--wide">{sg.label}</span>
                    <div className="report-bar-track">
                      <span className="report-bar-fill" style={{ width: `${pct}%`, background: sg.color || cfg.color }} />
                    </div>
                    <span className="report-bar-value" style={{ color: sg.color || cfg.color }}>{sg.count}</span>
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {/* Journal des interventions */}
        <section className="report-section report-section--table">
          <div className="report-section-title">
            Journal des interventions ({view.ints.length})
          </div>
          {view.ints.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--r-text-3)' }}>
              Aucune intervention enregistrée pour ce semestre.
            </p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Âge</th>
                  <th>Chirurgien</th>
                  <th>Position</th>
                  <th>Gestes — patient</th>
                  <th>Gestes — interne</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {view.ints.map((it) => {
                  const age = ageFromDOB(it.patient?.dateOfBirth);
                  const pos = getPositionStyle(it.position);
                  return (
                    <tr key={it.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(it.date)}</td>
                      <td>{patientName(it.patient)}</td>
                      <td>{age != null ? age : '—'}</td>
                      <td>{surgeonFullName(it.surgeon)}</td>
                      <td>
                        <span className="report-pos-badge" style={{ color: pos.color, borderColor: pos.color }}>
                          {pos.short}
                        </span>
                      </td>
                      <td>{it.patientProcs.map(procLabel).join(', ') || '—'}</td>
                      <td className="report-td-bold">{it.internProcs.map(procLabel).join(', ') || '—'}</td>
                      <td className="report-td-notes">{it.notes || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <footer className="report-footer">
          <span>CardioThoNoa — {profile.prenom} {profile.nom}</span>
          <span>Données personnelles conservées localement · usage strictement interne (RGPD)</span>
          <span>Généré le {formatDateTimeLong(new Date())}</span>
        </footer>
      </div>
    </div>
  );
}

function Kpi({ value, label, sub, color }) {
  return (
    <div className="report-kpi">
      <div className="report-kpi-value" style={{ color: color || 'var(--r-text-1)' }}>
        {value}
      </div>
      <div className="report-kpi-label">{label}</div>
      {sub && <div className="report-kpi-sub">{sub}</div>}
    </div>
  );
}

function ProgressRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="report-progress-row">
      <div className="report-progress-header">
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}/{max}</span>
      </div>
      <div className="report-progress">
        <span style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
