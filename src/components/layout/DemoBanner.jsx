// Bandeau affiché en mode démo (session sans compte, données d'exemple).
// Rappelle que les modifications ne sont pas sauvegardées et propose de créer
// un compte pour les conserver.
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function DemoBanner() {
  const setAuthView = useAuthStore((s) => s.setAuthView);
  const signOut = useAuthStore((s) => s.signOut);

  function createAccount() {
    setAuthView('signup');
    signOut();
  }

  return (
    <div className="flex items-center gap-2.5 px-4 py-2 pt-safe bg-primary text-white">
      <Sparkles size={14} className="shrink-0" />
      <span className="flex-1 text-[12px] font-medium leading-tight">
        Mode démo — données d'exemple, non sauvegardées
      </span>
      <button
        type="button"
        onClick={createAccount}
        className="shrink-0 px-2.5 py-1 rounded-full bg-white/20 text-[12px] font-bold active:scale-95 transition-transform"
      >
        Créer un compte
      </button>
    </div>
  );
}
