import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowDownAZ, Repeat2, CalendarClock, Hash, ClipboardX, ExternalLink } from 'lucide-react';
import { useData } from '../store/hooks';
import { aggregatePatients, serviceForSemester } from '../lib/queries';
import { getSpecialty, EPICARD_URL } from '../data/constants';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PatientRow } from '../components/PatientRow';

const FILTERS = [
  { key: 'all', label: 'Tous', type: null, emoji: '' },
  { key: 'cardiaque', label: 'Cardiaque', type: 'cardiaque', emoji: '🫀' },
  { key: 'thoracique', label: 'Thoracique', type: 'thoracique', emoji: '🫁' },
];

const SORTS = [
  { key: 'name', label: 'Nom', icon: ArrowDownAZ },
  { key: 'recent', label: 'Récent', icon: CalendarClock },
  { key: 'count', label: 'Nb interv.', icon: Hash },
];

export default function Patients() {
  const navigate = useNavigate();
  const data = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [recurrentOnly, setRecurrentOnly] = useState(false);
  const [epicardPending, setEpicardPending] = useState(false);
  const [sort, setSort] = useState('name');

  const all = useMemo(() => aggregatePatients(data), [data]);

  const semesters = useMemo(
    () => [...data.semesters].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [data.semesters]
  );

  const counts = useMemo(
    () => ({
      all: all.length,
      cardiaque: all.filter((p) => p.specialties.includes('cardiaque')).length,
      thoracique: all.filter((p) => p.specialties.includes('thoracique')).length,
    }),
    [all]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = all.filter((p) => {
      const matchSearch =
        !q ||
        p.lastName.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q);
      const matchSpec = filter === 'all' || p.specialties.includes(filter);
      const matchSemester =
        semesterFilter === 'all' || p.interventions.some((i) => i.semesterId === semesterFilter);
      const matchRecurrent = !recurrentOnly || p.count > 1;
      const matchEpicard =
        !epicardPending || (p.specialties.includes('cardiaque') && !p.epicardDone);
      return matchSearch && matchSpec && matchSemester && matchRecurrent && matchEpicard;
    });

    list = [...list];
    if (sort === 'recent') {
      list.sort((a, b) => (b.lastDate || '').localeCompare(a.lastDate || ''));
    } else if (sort === 'count') {
      list.sort((a, b) => b.count - a.count || `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`));
    }
    return list;
  }, [all, search, filter, semesterFilter, recurrentOnly, epicardPending, sort]);

  return (
    <div>
      {/* Header */}
      <div className="glass sticky top-0 z-50 px-4 pt-safe pb-3 border-b border-line">
        <div className="flex items-center justify-between pt-2.5 mb-3">
          <div className="text-[22px] font-extrabold text-ink-1">
            Patients
            <span className="text-sm font-semibold text-ink-3 ml-2">{filtered.length}</span>
          </div>
          <a
            href={EPICARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
          >
            Epicard <ExternalLink size={13} />
          </a>
        </div>

        <div className="flex items-center gap-2.5 bg-surface-2 rounded-md px-3 py-2.5 border-[1.5px] border-line focus-within:border-primary transition-colors">
          <Search size={16} className="text-ink-3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un patient…"
            className="flex-1 bg-transparent text-sm text-ink-1 outline-none min-w-0"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-ink-3 shrink-0">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const color =
              f.type === 'cardiaque' ? '#C0392B' : f.type === 'thoracique' ? '#2171B5' : 'var(--primary)';
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-colors"
                style={{
                  borderColor: active ? color : 'var(--border)',
                  background: active ? `${color}1A` : 'transparent',
                  color: active ? color : 'var(--text-3)',
                }}
              >
                {f.emoji} {f.label}
                <span
                  className="text-[10px] font-bold rounded-pill px-1.5 py-px"
                  style={{
                    background: active ? color : 'var(--surface-2)',
                    color: active ? '#fff' : 'var(--text-3)',
                  }}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setRecurrentOnly((v) => !v)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-colors"
            style={{
              borderColor: recurrentOnly ? 'var(--primary)' : 'var(--border)',
              background: recurrentOnly ? 'rgba(30,58,95,0.1)' : 'transparent',
              color: recurrentOnly ? 'var(--primary)' : 'var(--text-3)',
            }}
          >
            <Repeat2 size={13} /> Récurrents
          </button>
          <button
            type="button"
            onClick={() => setEpicardPending((v) => !v)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-colors"
            style={{
              borderColor: epicardPending ? '#E67E22' : 'var(--border)',
              background: epicardPending ? 'rgba(230,126,34,0.1)' : 'transparent',
              color: epicardPending ? '#E67E22' : 'var(--text-3)',
            }}
          >
            <ClipboardX size={13} /> Epicard à saisir
          </button>
        </div>

        <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setSemesterFilter('all')}
            className="shrink-0 px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-colors"
            style={{
              borderColor: semesterFilter === 'all' ? 'var(--primary)' : 'var(--border)',
              background: semesterFilter === 'all' ? 'rgba(30,58,95,0.1)' : 'transparent',
              color: semesterFilter === 'all' ? 'var(--primary)' : 'var(--text-3)',
            }}
          >
            Tous semestres
          </button>
          {semesters.map((s) => {
            const svc = serviceForSemester(data, s.id);
            const cfg = getSpecialty(svc?.type);
            const active = semesterFilter === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSemesterFilter(s.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-colors"
                style={{
                  borderColor: active ? cfg.color : 'var(--border)',
                  background: active ? cfg.muted : 'transparent',
                  color: active ? cfg.color : 'var(--text-3)',
                }}
              >
                {cfg.emoji} {s.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5">
          <span className="shrink-0 flex items-center text-[11px] font-semibold text-ink-3 uppercase tracking-wide pr-1">
            Trier
          </span>
          {SORTS.map((s) => {
            const active = sort === s.key;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border-[1.5px] transition-colors"
                style={{
                  borderColor: active ? 'var(--primary)' : 'var(--border)',
                  background: active ? 'rgba(30,58,95,0.1)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text-3)',
                }}
              >
                <Icon size={13} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Aucun patient trouvé"
            subtitle={
              search ? `Aucun résultat pour « ${search} »` : 'Ajoutez des interventions pour voir vos patients.'
            }
          />
        ) : (
          <Card padding="px-4 py-0" className="anim-fade-up">
            {filtered.map((p, idx) => (
              <PatientRow
                key={p.id}
                patient={p}
                last={idx === filtered.length - 1}
                onClick={() => navigate(`/patients/${p.id}`)}
              />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
