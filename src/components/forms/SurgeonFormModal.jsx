import { useEffect, useState } from 'react';
import { useData } from '../../store/hooks';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';

const empty = { title: 'Dr.', firstName: '', lastName: '', serviceId: '' };

export function SurgeonFormModal({ open, onClose, initial, onSubmit }) {
  const { services } = useData();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            title: initial.title || 'Dr.',
            firstName: initial.firstName || '',
            lastName: initial.lastName || '',
            serviceId: initial.serviceId || '',
          }
        : { ...empty, serviceId: services[0]?.id || '' }
    );
  }, [open, initial, services]);

  const valid = form.lastName.trim() && form.serviceId;

  function submit() {
    onSubmit({
      title: form.title,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      serviceId: form.serviceId,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier le chirurgien' : 'Nouveau chirurgien'}
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
        <div className="flex gap-2.5">
          <div className="w-24">
            <Select
              label="Titre"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              options={['Pr.', 'Dr.', '']}
            />
          </div>
          <Input
            label="Prénom"
            placeholder="Claire"
            maxLength={60}
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
        </div>
        <Input
          label="Nom"
          required
          placeholder="Mercier"
          maxLength={60}
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
        />
        <Select
          label="Service"
          required
          placeholder="Choisir un service"
          value={form.serviceId}
          onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
          options={services.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>
    </Modal>
  );
}
