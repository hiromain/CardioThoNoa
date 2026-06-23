import { useEffect, useState } from 'react';
import { SCOPES, SERVICE_TYPES, getSpecialty } from '../../data/constants';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { ProcedureSelector } from '../ProcedureSelector';

const empty = { name: '', abbr: '', scope: 'both', serviceType: 'cardiaque', internSteps: [] };

export function ProcedureTypeFormModal({ open, onClose, initial, onSubmit, allProcedures = [] }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            name: initial.name || '',
            abbr: initial.abbr || '',
            scope: initial.scope || 'both',
            serviceType: initial.serviceType || 'cardiaque',
            internSteps: initial.internSteps || [],
          }
        : empty
    );
  }, [open, initial]);

  const valid = form.name.trim() && form.scope && form.serviceType;

  function submit() {
    onSubmit({
      name: form.name.trim(),
      abbr: form.abbr.trim() || form.name.trim(),
      scope: form.scope,
      serviceType: form.serviceType,
      internSteps: form.internSteps,
    });
    onClose();
  }

  const showInternSteps = form.scope === 'patient' || form.scope === 'both';
  const stepCandidates = allProcedures.filter(
    (p) =>
      p.id !== initial?.id &&
      (p.scope === 'intern' || p.scope === 'both') &&
      (p.serviceType === form.serviceType || p.serviceType === 'autre')
  );
  const specialty = getSpecialty(form.serviceType);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier le geste' : 'Nouveau geste'}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Annuler
          </Button>
          <Button fullWidth onClick={submit} disabled={!valid}>
            {initial ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Input
          label="Nom complet"
          required
          placeholder="Pontage aorto-coronarien"
          maxLength={120}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Abréviation"
          placeholder="CABG"
          maxLength={12}
          value={form.abbr}
          onChange={(e) => setForm((f) => ({ ...f, abbr: e.target.value }))}
        />
        <Select
          label="Type de service"
          required
          value={form.serviceType}
          onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
          options={SERVICE_TYPES}
        />
        <Select
          label="Portée"
          required
          value={form.scope}
          onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
          options={SCOPES}
        />
        {showInternSteps && (
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-2">
              Étapes réalisables par l'interne
            </label>
            <ProcedureSelector
              procedures={stepCandidates}
              selectedIds={form.internSteps}
              onChange={(ids) => setForm((f) => ({ ...f, internSteps: ids }))}
              color={specialty.color}
              light={specialty.light}
              emptyHint="Aucun sous-geste disponible pour ce service."
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
