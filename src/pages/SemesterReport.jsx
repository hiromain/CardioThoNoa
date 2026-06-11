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
import { kpis, topInternProcedures } from '../lib/stats';
import { formatDate, formatDateTimeLong, ageFromDOB, semesterStatus, STATUS_LABELS } from '../lib/dates';
import { APP_USER, POSITIONS, getPositionStyle } from '../data/constants';
import { Button } from '../components/ui/Button';
import './SemesterReport.css';

export default function SemesterReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const sem = byId(data.semesters, id);

  const view = useMemo(() => {
    if (!sem) return null;
    const raw = interventionsForSemester(data, sem.id);
    const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
    return {
      ints: sorted.map((i) => resolveIntervention(data, i)),
      stats: kpis(raw),
      top: topInternProcedures(data, raw, 8),
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
        <header className="report-header">
          <div>
            <div className="report-app-name">CardioThoNoa</div>
            <h1 className="report-title">Synthèse de stage — {sem.label}</h1>
            <div className="report-subtitle">
              {cfg.emoji} {cfg.label} · {service?.name}
              {service?.city ? ` · ${service.city}` : ''}
            </div>
          </div>
          <div className="report-intern">
            <strong>{APP_USER.prenom} {APP_USER.nom}</strong>
            <div>{APP_USER.promotion}</div>
            <div>{APP_USER.hopital}</div>
          </div>
        </header>

        <div className="report-meta-row">
          <span>Période : {formatDate(sem.startDate)} → {formatDate(sem.endDate)}</span>
          <span>Statut : {STATUS_LABELS[status]}</span>
          <span>Document généré le {formatDateTimeLong(new Date())}</span>
        </div>

        {/* KPIs */}
        <section className="report-section">
          <div className="report-section-title">Indicateurs clés</div>
          <div className="report-kpi-grid">
            <Kpi
              value={view.ints.length}
              label="Interventions"
              sub={`Objectif : ${obj.interventions || '—'}`}
              color={cfg.color}
            />
            <Kpi
              value={view.stats.internGestes}
              label="Gestes réalisés"
              sub={`Objectif : ${obj.gestes || '—'}`}
            />
            <Kpi
              value={`${pctInt}%`}
              label="Objectif interventions"
              color={pctInt >= 80 ? '#27AE60' : pctInt >= 50 ? '#E67E22' : undefined}
            />
            <Kpi value={view.stats.patients} label="Patients suivis" />
          </div>
          <div className="flex flex-col gap-2.5 mt-3">
            <ProgressRow label="Interventions" value={view.ints.length} max={obj.interventions} color={cfg.color} />
            <ProgressRow
              label="Gestes réalisés"
              value={view.stats.internGestes}
              max={obj.gestes}
              color="var(--r-text-1)"
            />
          </div>
        </section>

        {/* Répartition par position */}
        <section className="report-section">
          <div className="report-section-title">Répartition par position</div>
          {POSITIONS.map((p) => {
            const st = getPositionStyle(p);
            const count = view.stats.positions[p] || 0;
            const pct = view.stats.total ? Math.round((count / view.stats.total) * 100) : 0;
            return (
              <div key={p} className="report-bar-row">
                <span style={{ width: 130, textTransform: 'capitalize' }}>{p}</span>
                <div className="report-bar-track">
                  <span className="report-bar-fill" style={{ width: `${pct}%`, background: st.color }} />
                </div>
                <span style={{ width: 70, textAlign: 'right', fontWeight: 700, color: st.color }}>
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </section>

        {/* Top gestes */}
        {view.top.length > 0 && (
          <section className="report-section">
            <div className="report-section-title">Gestes les plus réalisés par l'interne</div>
            {view.top.map((g) => {
              const max = view.top[0].count || 1;
              const pct = Math.round((g.count / max) * 100);
              return (
                <div key={g.id} className="report-bar-row">
                  <span style={{ width: 170 }}>{g.label}</span>
                  <div className="report-bar-track">
                    <span className="report-bar-fill" style={{ width: `${pct}%`, background: g.color }} />
                  </div>
                  <span style={{ width: 40, textAlign: 'right', fontWeight: 700, color: g.color }}>
                    {g.count}×
                  </span>
                </div>
              );
            })}
          </section>
        )}

        {/* Journal des interventions */}
        <section className="report-section report-section--table">
          <div className="report-section-title">Journal des interventions ({view.ints.length})</div>
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
                        <span style={{ color: pos.color, fontWeight: 700 }}>{pos.short}</span>
                      </td>
                      <td>{it.patientProcs.map(procLabel).join(', ') || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{it.internProcs.map(procLabel).join(', ') || '—'}</td>
                      <td>{it.notes || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <footer className="report-footer">
          Document généré automatiquement par CardioThoNoa le {formatDateTimeLong(new Date())}.
          <br />
          Données personnelles conservées localement (RGPD) — usage strictement interne, non destiné à la diffusion.
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
    <div>
      <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--r-text-2)', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>
          {value}/{max || '—'}
        </span>
      </div>
      <div className="report-progress">
        <span style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
