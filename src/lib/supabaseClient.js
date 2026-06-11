// CardioThoNoa — Client Supabase (authentification + synchronisation cloud).
//
// Les identifiants proviennent des variables d'environnement Vite (préfixe
// VITE_). Voir `.env.example`. Si elles sont absentes, `isSupabaseConfigured`
// vaut false et l'écran de connexion affiche un message de configuration plutôt
// que de planter.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// On crée toujours un client (avec des valeurs factices si non configuré) pour
// éviter des imports conditionnels ; les appels sont de toute façon gardés par
// `isSupabaseConfigured` en amont.
export const supabase = createClient(
  url || 'http://localhost',
  anonKey || 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
