// Bandeau « lecture seule » affiché tant que le compte ne peut pas enregistrer.
// Deux cas :
//   - démo (sans compte)   → propose de créer un compte ;
//   - gratuit (connecté)   → propose de débloquer (ouvre la modale d'achat).
import { Sparkles, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function DemoBanner({ isDemo }) {
  const setAuthView = useAuthStore((s) => s.setAuthView);
  const signOut = useAuthStore((s) => s.signOut);
  const openUpgrade = useAuthStore((s) => s.openUpgrade);

  function createAccount() {
    setAuthView('signup');
    signOut();
  }

  return (
    <div className="flex items-center gap-2.5 px-4 py-2 pt-safe bg-primary text-white">
      {isDemo ? <Sparkles size={14} className="shrink-0" /> : <Lock size={14} className="shrink-0" />}
      <span className="flex-1 text-[12px] font-medium leading-tight">
        {isDemo
          ? "Mode démo — données d'exemple, non sauvegardées"
          : 'Lecture seule — débloque pour enregistrer tes données'}
      </span>
      <button
        type="button"
        onClick={isDemo ? createAccount : openUpgrade}
        className="shrink-0 px-2.5 py-1 rounded-full bg-white/20 text-[12px] font-bold active:scale-95 transition-transform"
      >
        {isDemo ? 'Créer un compte' : 'Débloquer'}
      </button>
    </div>
  );
}
