import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Field';
import { Button } from '../ui/Button';

const empty = { firstName: '', lastName: '', dateOfBirth: '' };

export function PatientFormModal({ open, onClose, initial, onSubmit }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            firstName: initial.firstName || '',
            lastName: initial.lastName || '',
            dateOfBirth: initial.dateOfBirth || '',
          }
        : empty
    );
  }, [open, initial]);

  const valid = form.firstName.trim() && form.lastName.trim();

  function submit() {
    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dateOfBirth: form.dateOfBirth,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier le patient' : 'Nouveau patient'}
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
          <Input
            label="Prénom"
            required
            placeholder="Marie"
            maxLength={60}
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
          <Input
            label="Nom"
            required
            placeholder="DUPONT"
            maxLength={60}
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
        </div>
        <Input
          label="Date de naissance"
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
        />
      </div>
    </Modal>
  );
}
