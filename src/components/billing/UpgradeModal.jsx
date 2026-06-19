import { Mail, Check, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const AVANTAGES = [
  'Enregistrer tes interventions et tes patients',
  'Sauvegarde cloud et synchronisation multi-appareils',
  'Statistiques et exports de ta progression',
];

export function UpgradeModal() {
  const open = useAuthStore((s) => s.upgradeOpen);
  const closeUpgrade = useAuthStore((s) => s.closeUpgrade);
  const isDemo = useAuthStore((s) => s.isDemo);
  const setAuthView = useAuthStore((s) => s.setAuthView);
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  function onCreateAccount() {
    setAuthView('signup');
    closeUpgrade();
    signOut();
  }

  function onRequestAccess() {
    const subject = encodeURIComponent("Demande d'accès CardioThoNoa");
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaiterais obtenir l'accès complet à l'application CardioThoNoa.\n\nMon adresse email : ${user?.email ?? ''}\n\nMerci !`
    );
    window.location.href = `mailto:romain.hittinger@gmail.com?subject=${subject}&body=${body}`;
  }

  return (
    <Modal
      open={open}
      onClose={closeUpgrade}
      title="Débloque l'enregistrement"
      subtitle="Accès sur demande"
      footer={
        isDemo ? (
          <Button fullWidth size="lg" onClick={onCreateAccount}>
            <Sparkles size={16} /> Créer un compte
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={onRequestAccess}>
            <Mail size={16} /> Demander l'accès
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-2 leading-relaxed">
          {isDemo
            ? "Tu explores l'application avec des données d'exemple. Crée un compte puis demande l'accès complet pour saisir tes propres données."
            : "Ton compte est en lecture seule. Contacte l'administrateur pour obtenir l'accès complet."}
        </p>
        <ul className="flex flex-col gap-2.5">
          {AVANTAGES.map((a) => (
            <li key={a} className="flex items-start gap-2.5 text-[13px] text-ink-1">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <Check size={13} className="text-success" />
              </span>
              {a}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
