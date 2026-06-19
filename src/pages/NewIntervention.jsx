import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Stethoscope, GraduationCap } from 'lucide-react';
import { useData } from '../store/hooks';
import { useStore } from '../store/useStore';
import { POSITIONS, getPositionStyle, getSpecialty } from '../data/constants';
import {
  byId,
  surgeonsForSemester,
  proceduresForType,
  serviceForSemester,
  surgeonName,
  internStepsForPatientProcedures,
} from '../lib/queries';
import { todayISO } from '../lib/dates';
import { TopBar } from '../components/layout/TopBar';
import { FormSection } from '../components/Section';
import { Input, Select, TextArea } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { PatientPicker } from '../components/PatientPicker';
import { ProcedureSelector } from '../components/ProcedureSelector';
import { SpecBadge } from '../components/SpecBadge';

function activeSemesters(data) {
  return [...data.semesters]
    .filter((s) => !s.archived)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export default function NewIntervention() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const addIntervention = useStore((s) => s.addIntervention);
  const updateIntervention = useStore((s) => s.updateIntervention);
  const addPatient = useStore((s) => s.addPatient);
  const addProcedureType = useStore((s) => s.addProcedureType);

  const editing = byId(data.interventions, id);
  const semesters = activeSemesters(data);

  const [form, setForm] = useState(() => {
    if (editing) {
      return {
        semesterId: editing.semesterId,
        patientId: editing.patientId,
        date: editing.date,
        surgeonId: editing.surgeonId,
        patientProcedures: editing.patientProcedures || [],
        internProcedures: editing.internProcedures || [],
        position: editing.position || POSITIONS[0],
        notes: editing.notes || '',
      };
    }
    const semId = data.currentSemesterId && semesters.some((s) => s.id === data.currentSemesterId)
      ? data.currentSemesterId
      : semesters[0]?.id || '';
    return {
      semesterId: semId,
      patientId: null,
      date: todayISO(),
      surgeonId: '',
      patientProcedures: [],
      internProcedures: [],
      position: POSITIONS[0],
      notes: '',
    };
  });
  const [saved, setSaved] = useState(false);
  const [showAllIntern, setShowAllIntern] = useState(false);

  const service = form.semesterId ? serviceForSemester(data, form.semesterId) : null;
  const cfg = getSpecialty(service?.type);
  const surgeons = useMemo(
    () => (form.semesterId ? surgeonsForSemester(data, form.semesterId) : []),
    [data, form.semesterId]
  );
  const patientProcs = useMemo(
    () => (service ? proceduresForType(data, service.type, 'patient') : []),
    [data, service]
  );
  const internProcs = useMemo(
    () => (service ? proceduresForType(data, service.type, 'intern') : []),
    [data, service]
  );
  const suggestedInternSteps = useMemo(
    () => internStepsForPatientProcedures(data, form.patientProcedures),
    [data, form.patientProcedures]
  );
  const hasSuggestions = suggestedInternSteps.length > 0;
  const internProcsToShow = hasSuggestions && !showAllIntern ? suggestedInternSteps : internProcs;
  const hasExtraSteps = hasSuggestions && internProcs.length > suggestedInternSteps.length;

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function changeSemester(semId) {
    setForm((f) => ({
      ...f,
      semesterId: semId,
      surgeonId: '',
      patientProcedures: [],
      internProcedures: [],
    }));
    setShowAllIntern(false);
  }

  function changePatientProcedures(ids) {
    // Quand les gestes patient changent, les suggestions d'interne changent aussi :
    // on réinitialise la sélection interne pour éviter des gestes orphelins.
    setForm((f) => ({ ...f, patientProcedures: ids, internProcedures: [] }));
    setShowAllIntern(false);
  }

  function addProcedureOfScope(scope) {
    return (rawName) => {
      const name = rawName.trim();
      if (!name || !service) return null;
      return addProcedureType({
        name,
        abbr: name,
        scope,
        serviceType: service.type,
        internSteps: [],
      });
    };
  }

  const valid = form.semesterId && form.patientId && form.surgeonId && form.date;

  function handleSave() {
    const payload = {
      semesterId: form.semesterId,
      patientId: form.patientId,
      date: form.date,
      surgeonId: form.surgeonId,
      patientProcedures: form.patientProcedures,
      internProcedures: form.internProcedures,
      position: form.position,
      notes: form.notes.trim(),
    };
    let targetId = id;
    if (editing) {
      updateIntervention(id, payload);
    } else {
      targetId = addIntervention(payload);
    }
    setSaved(true);
    setTimeout(() => navigate(`/interventions/${targetId}`, { replace: true }), 1000);
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-8">
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center anim-scale-in">
          <Check size={32} className="text-success" strokeWidth={2.4} />
        </div>
        <div className="text-lg font-bold text-ink-1">
          Intervention {editing ? 'modifiée' : 'enregistrée'}
        </div>
        <div className="text-sm text-ink-2">Un instant…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title={editing ? "Modifier l'intervention" : 'Nouvelle intervention'}
        onBack={() => navigate(-1)}
        action={service ? <SpecBadge type={service.type} /> : null}
      />

      <div className="flex-1 px-4 py-5">
        <FormSection title="Contexte">
          <Input
            label="Date de l'intervention"
            type="date"
            required
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
          />
          <Select
            label="Chirurgien"
            required
            placeholder={surgeons.length ? 'Choisir un chirurgien' : 'Aucun chirurgien dans ce service'}
            value={form.surgeonId}
            onChange={(e) => set('surgeonId', e.target.value)}
            options={surgeons.map((s) => ({ value: s.id, label: surgeonName(s) }))}
          />
        </FormSection>

        <FormSection title="Patient">
          <PatientPicker
            patients={data.patients}
            value={form.patientId}
            onSelect={(pid) => set('patientId', pid)}
            onCreate={(p) => addPatient(p)}
          />
        </FormSection>

        <FormSection
          title="Gestes sur le patient"
          icon={<Stethoscope size={13} className="text-ink-3" />}
          subtitle="Ce qui a été fait au patient durant l'intervention, quel qu'en soit l'auteur."
        >
          <ProcedureSelector
            procedures={patientProcs}
            selectedIds={form.patientProcedures}
            onChange={changePatientProcedures}
            variant="neutral"
            onAddProcedure={service ? addProcedureOfScope('patient') : undefined}
          />
        </FormSection>

        <div
          className="mb-6 rounded-md border-[1.5px] p-3.5"
          style={{ borderColor: cfg.color, background: cfg.muted }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <GraduationCap size={15} style={{ color: cfg.color }} />
              <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: cfg.color }}>
                Gestes réalisés par l'interne
              </div>
            </div>
            {form.internProcedures.length > 0 && (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-pill"
                style={{ color: cfg.color, background: 'var(--surface)' }}
              >
                {form.internProcedures.length}
              </span>
            )}
          </div>
          <div className="text-[12px] mb-2.5" style={{ color: cfg.color, opacity: 0.8 }}>
            Ce que vous avez personnellement réalisé — compte pour votre carnet de formation.
          </div>
          {internProcsToShow.length === 0 && !hasExtraSteps && (
            <div className="text-[12px] mb-2.5" style={{ color: cfg.color, opacity: 0.7 }}>
              {hasSuggestions
                ? 'Aucun sous-geste sélectionné.'
                : 'Sélectionnez des gestes sur le patient pour afficher la checklist, ou affichez tous les gestes ci-dessous.'}
            </div>
          )}
          <ProcedureSelector
            procedures={internProcsToShow}
            selectedIds={form.internProcedures}
            onChange={(ids) => set('internProcedures', ids)}
            color={cfg.color}
            light="var(--surface)"
            variant="accent"
            onAddProcedure={
              service
                ? (rawName) => {
                    const newId = addProcedureOfScope('intern')(rawName);
                    if (newId) setShowAllIntern(true);
                    return newId;
                  }
                : undefined
            }
          />
          {(hasExtraSteps || (!hasSuggestions && internProcs.length > 0)) && (
            <button
              type="button"
              onClick={() => setShowAllIntern((v) => !v)}
              className="mt-2.5 text-[12px] font-bold underline underline-offset-2"
              style={{ color: cfg.color }}
            >
              {showAllIntern ? '− Réduire' : '+ Afficher tous les gestes'}
            </button>
          )}
        </div>

        <FormSection title="Position de l'interne">
          <div className="flex flex-col gap-2">
            {POSITIONS.map((p) => {
              const st = getPositionStyle(p);
              const active = form.position === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('position', p)}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-md border-[1.5px] transition-colors text-left"
                  style={{
                    borderColor: active ? st.color : 'var(--border)',
                    background: active ? st.bg : 'var(--surface)',
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: active ? st.color : 'var(--border)', background: active ? st.color : 'transparent' }}
                  >
                    {active && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  <span
                    className="text-sm font-medium capitalize"
                    style={{ color: active ? st.color : 'var(--text-1)' }}
                  >
                    {p}
                  </span>
                </button>
              );
            })}
          </div>
        </FormSection>

        <FormSection title="Notes">
          <TextArea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Remarques, contexte clinique…"
            rows={3}
          />
        </FormSection>

        <FormSection title="Semestre">
          {semesters.length > 1 ? (
            <Select
              required
              value={form.semesterId}
              onChange={(e) => changeSemester(e.target.value)}
              options={semesters.map((s) => {
                const svc = serviceForSemester(data, s.id);
                return { value: s.id, label: `${s.label} — ${getSpecialty(svc?.type).label}` };
              })}
            />
          ) : (
            <div className="text-[13px] text-ink-2">
              <span className="font-semibold text-ink-1">{byId(data.semesters, form.semesterId)?.label}</span>
            </div>
          )}
        </FormSection>
      </div>

      <div className="sticky bottom-0 glass border-t border-line px-4 py-3 pb-safe">
        <Button fullWidth size="lg" onClick={handleSave} disabled={!valid}>
          <Check size={18} /> {editing ? 'Enregistrer les modifications' : "Enregistrer l'intervention"}
        </Button>
      </div>
    </div>
  );
}
