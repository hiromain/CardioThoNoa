import { useEffect, useState } from 'react';
import { useData } from '../../store/hooks';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { Input, Select, TextArea } from '../ui/Field';
import { Button } from '../ui/Button';

const NEW_SERVICE = '__new__';

const empty = {
  label: '',
  serviceId: '',
  newServiceName: '',
  newServiceType: 'cardiaque',
  newServiceCity: '',
  startDate: '',
  endDate: '',
  objInterventions: 30,
  objGestes: 20,
  supervisor: '',
  notes: '',
};

export function SemesterFormModal({ open, onClose, initial, onSubmit }) {
  const { services } = useData();
  const addService = useStore((s) => s.addService);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...empty,
        label: initial.label || '',
        serviceId: initial.serviceId || '',
        startDate: initial.startDate || '',
        endDate: initial.endDate || '',
        objInterventions: initial.objectives?.interventions ?? 30,
        objGestes: initial.objectives?.gestes ?? 20,
        supervisor: initial.supervisor || '',
        notes: initial.notes || '',
      });
    } else {
      setForm({ ...empty, serviceId: services[0]?.id || '' });
    }
  }, [open, initial, services]);

  const usingNewService = form.serviceId === NEW_SERVICE;

  const valid =
    form.label.trim() &&
    form.startDate &&
    form.endDate &&
    (usingNewService ? form.newServiceName.trim() : form.serviceId);

  function submit() {
    let serviceId = form.serviceId;
    if (usingNewService) {
      serviceId = addService({
        name: form.newServiceName.trim(),
        type: form.newServiceType,
        city: form.newServiceCity.trim(),
      });
    }
    onSubmit({
      label: form.label.trim(),
      serviceId,
      startDate: form.startDate,
      endDate: form.endDate,
      objectives: {
        interventions: Number(form.objInterventions) || 0,
        gestes: Number(form.objGestes) || 0,
      },
      supervisor: form.supervisor.trim(),
      notes: form.notes.trim(),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier le semestre' : 'Nouveau semestre'}
      footer={<>
        <Button variant="secondary" fullWidth onClick={onClose}>Annuler</Button>
        <Button fullWidth onClick={submit} disabled={!valid}>{initial ? 'Enregistrer' : 'Créer'}</Button>
      </>}>
      <div className="flex flex-col gap-3.5">
        <Input label="Intitulé" required placeholder="S4" value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />

        <Select label="Service" required placeholder="Choisir un service" value={form.serviceId}
          onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
          options={[
            ...services.map((s) => ({ value: s.id, label: s.name })),
            { value: NEW_SERVICE, label: '+ Nouveau service…' },
          ]} />

        {usingNewService && (
          <div className="flex flex-col gap-3.5 p-3 rounded-md border-[1.5px] border-dashed border-line bg-surface-2">
            <Input label="Nom du nouveau service" required placeholder="Chirurgie Cardiaque CHU Lyon"
              value={form.newServiceName}
              onChange={(e) => setForm((f) => ({ ...f, newServiceName: e.target.value }))} />
            <Select label="Type de service" required value={form.newServiceType}
              onChange={(e) => setForm((f) => ({ ...f, newServiceType: e.target.value }))}
              options={[
                { value: 'cardiaque', label: 'Chirurgie cardiaque' },
                { value: 'thoracique', label: 'Chirurgie thoracique' },
              ]} />
            <Input label="Ville" placeholder="Lyon" value={form.newServiceCity}
              onChange={(e) => setForm((f) => ({ ...f, newServiceCity: e.target.value }))} />
          </div>
        )}

        <div className="flex gap-2.5">
          <Input label="Début" type="date" required value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          <Input label="Fin" type="date" required value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
        </div>

        <div className="flex gap-2.5">
          <Input label="Objectif interventions" type="number" min="0" value={form.objInterventions}
            onChange={(e) => setForm((f) => ({ ...f, objInterventions: e.target.value }))} />
          <Input label="Objectif gestes" type="number" min="0" value={form.objGestes}
            onChange={(e) => setForm((f) => ({ ...f, objGestes: e.target.value }))} />
        </div>

        <Input label="Référent / chef de service" placeholder="Pr. Dupont" value={form.supervisor}
          onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))} />

        <TextArea label="Notes / objectifs du semestre" rows={2}
          placeholder="Objectifs personnels, particularités du stage…"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </div>
    </Modal>
  );
}
