import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Field';
import { Button } from '../ui/Button';

const empty = { prenom: '', nom: '', initiales: '', promotion: '', hopital: '' };

function initialsFrom(prenom, nom) {
  return `${prenom.trim()[0] || ''}${nom.trim()[0] || ''}`.toUpperCase();
}

export function ProfileFormModal({ open, onClose }) {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) setForm({ ...empty, ...profile });
  }, [open, profile]);

  const valid = form.prenom.trim() && form.nom.trim();

  function submit() {
    updateProfile({
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      initiales: form.initiales.trim().toUpperCase().slice(0, 3) || initialsFrom(form.prenom, form.nom),
      promotion: form.promotion.trim(),
      hopital: form.hopital.trim(),
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier le profil"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>Annuler</Button>
          <Button fullWidth onClick={submit} disabled={!valid}>Enregistrer</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex gap-2.5">
          <Input
            label="Prénom"
            required
            value={form.prenom}
            onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
          />
          <Input
            label="Nom"
            required
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
          />
        </div>
        <Input
          label="Initiales (avatar)"
          placeholder={initialsFrom(form.prenom, form.nom) || 'NM'}
          maxLength={3}
          value={form.initiales}
          onChange={(e) => setForm((f) => ({ ...f, initiales: e.target.value.toUpperCase() }))}
        />
        <Input
          label="Promotion"
          placeholder="Promo 2024"
          value={form.promotion}
          onChange={(e) => setForm((f) => ({ ...f, promotion: e.target.value }))}
        />
        <Input
          label="Hôpital / service"
          placeholder="CHU de Lyon — Hôpital Louis Pradel"
          value={form.hopital}
          onChange={(e) => setForm((f) => ({ ...f, hopital: e.target.value }))}
        />
      </div>
    </Modal>
  );
}
