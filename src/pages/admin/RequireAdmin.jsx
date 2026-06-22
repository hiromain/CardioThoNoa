import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// Garde de route pour l'espace d'administration. Le contrôle réel est côté
// serveur (RLS / SECURITY DEFINER, migration 0004) ; ce garde n'est qu'une
// commodité UX qui redirige un non-admin vers l'accueil. On attend le chargement
// du profil pour éviter un flash de redirection.
export function RequireAdmin({ children }) {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const profileLoaded = useAuthStore((s) => s.profileLoaded);
  if (!profileLoaded) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
