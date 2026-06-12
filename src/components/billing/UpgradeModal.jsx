// Modale d'upgrade (paywall). Ouverte globalement par le garde d'écriture
// (useStore → guardWrite) dès qu'un compte non payé tente d'enregistrer une
// donnée. Contenu adaptatif :
//   - démo (sans compte réel)  → invite à créer un compte ;
//   - gratuit connecté         → bouton d'achat (Stripe Checkout).
import { useState } from 'react';
import { Lock, Check, Sparkles } from 'lucide-react';
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
  const startCheckout = useAuthStore((s) => s.startCheckout);
  const setAuthView = useAuthStore((s) => s.setAuthView);
  const signOut = useAuthStore((s) => s.signOut);
  const [busy, setBusy] = useState(false);

  async function onBuy() {
    setBusy(true);
    // En démo, startCheckout bascule vers la création de compte (pas de
    // paiement possible sans compte réel).
    const ok = await startCheckout();
    if (!ok && isDemo) {
      closeUpgrade();
      signOut();
    }
    setBusy(false);
  }

  function onCreateAccount() {
    setAuthView('signup');
    closeUpgrade();
    signOut();
  }

  return (
    <Modal
      open={open}
      onClose={closeUpgrade}
      title="Débloque l'enregistrement"
      subtitle="Paiement unique, accès à vie"
      footer={
        isDemo ? (
          <Button fullWidth size="lg" onClick={onCreateAccount}>
            <Sparkles size={16} /> Créer un compte
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={onBuy} disabled={busy}>
            <Lock size={16} /> {busy ? 'Redirection…' : 'Acheter'}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-2 leading-relaxed">
          {isDemo
            ? "Tu explores l'application avec des données d'exemple. Crée un compte puis débloque l'enregistrement pour saisir tes propres données."
            : "Ton compte est en lecture seule. Effectue l'achat unique pour enregistrer et synchroniser tes propres données."}
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
