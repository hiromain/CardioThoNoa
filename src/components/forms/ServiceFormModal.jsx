import { useEffect, useState } from 'react';
import { SERVICE_TYPES } from '../../data/constants';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';

const empty = { name: '', type: 'cardiaque', city: '' };

export function ServiceFormModal({ open, onClose, initial, onSubmit }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { name: initial.name || '', type: initial.type || 'cardiaque', city: initial.city || '' } : empty);
  }, [open, initial]);

  const valid = form.name.trim() && form.type;

  function submit() {
    onSubmit({ name: form.name.trim(), type: form.type, city: form.city.trim() });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier le service' : 'Nouveau service'}
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
          label="Nom du service"
          required
          placeholder="Chirurgie Cardiaque CHU Lyon"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Select
          label="Type"
          required
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          options={SERVICE_TYPES}
        />
        <Input
          label="Ville"
          placeholder="Lyon"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
        />
      </div>
    </Modal>
  );
}
