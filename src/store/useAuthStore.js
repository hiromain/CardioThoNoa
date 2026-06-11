// CardioThoNoa — Store d'authentification (Zustand).
//
// Authentification par code OTP envoyé par email (Supabase Auth, magic-link en
// mode « code »). Trois états :
//   - 'loading'    : on attend la résolution de getSession() au démarrage
//   - 'signed-out' : aucune session valide → écran de connexion
//   - 'signed-in'  : session active, user disponible
//
// IMPORTANT : `init()` doit être appelé une seule fois au démarrage (main.jsx),
// et le moteur de sync (startSyncEngine) doit être branché AVANT que la promesse
// de getSession() ne se résolve. Voir lib/syncEngine.js.
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const useAuthStore = create((set, get) => ({
  status: isSupabaseConfigured ? 'loading' : 'signed-out',
  user: null,
  // 'idle' | 'sending' | 'code-sent' | 'verifying'
  flow: 'idle',
  email: '',
  error: null,
  configured: isSupabaseConfigured,

  // ── Démarrage ───────────────────────────────────────────────────────────────
  init: () => {
    if (!isSupabaseConfigured) {
      set({ status: 'signed-out' });
      return;
    }

    // Source de vérité : les évènements d'auth Supabase (INITIAL_SESSION,
    // SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED…). onAuthStateChange émet
    // INITIAL_SESSION au branchement, ce qui couvre aussi la restauration de
    // session au rechargement.
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({
        user,
        status: user ? 'signed-in' : 'signed-out',
        ...(user ? { flow: 'idle', error: null } : {}),
      });
    });
  },

  // ── Étape 1 : envoi du code OTP ──────────────────────────────────────────────
  sendOtp: async (rawEmail) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email) {
      set({ error: 'Adresse email requise.' });
      return false;
    }
    set({ flow: 'sending', error: null, email });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      set({ flow: 'idle', error: traduireErreurEmail(error) });
      return false;
    }
    set({ flow: 'code-sent' });
    return true;
  },

  // ── Étape 2 : vérification du code ───────────────────────────────────────────
  verifyOtp: async (rawToken) => {
    const token = rawToken.trim();
    const email = get().email;
    if (!token) {
      set({ error: 'Code requis.' });
      return false;
    }
    set({ flow: 'verifying', error: null });
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) {
      set({ flow: 'code-sent', error: traduireErreurCode(error) });
      return false;
    }
    // onAuthStateChange basculera le status à 'signed-in'.
    return true;
  },

  // Revenir à la saisie de l'email (depuis l'écran « code »).
  resetFlow: () => set({ flow: 'idle', error: null }),

  // ── Connexion dev (sans Supabase, sans email) ───────────────────────────────
  // Disponible uniquement en mode développement (npm run dev), pour éviter de
  // repasser par le flow OTP à chaque rechargement. Utilise un faux user dont
  // l'id est exclu de la sync cloud (voir lib/syncEngine.js).
  devSignIn: () => {
    set({
      status: 'signed-in',
      user: { id: 'dev-local', email: 'dev@local' },
      flow: 'idle',
      error: null,
    });
  },

  signOut: async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    set({ status: 'signed-out', user: null, flow: 'idle', email: '', error: null });
  },
}));

function traduireErreurEmail(error) {
  const msg = error?.message || '';
  if (/rate|limit|too many/i.test(msg)) return 'Trop de tentatives. Réessaie dans un instant.';
  if (/email/i.test(msg)) return 'Adresse email invalide.';
  return 'Une erreur est survenue. Réessaie.';
}

function traduireErreurCode(error) {
  const msg = error?.message || '';
  if (/invalid|expired|token/i.test(msg)) return 'Code invalide ou expiré.';
  if (/rate|limit|too many/i.test(msg)) return 'Trop de tentatives. Réessaie dans un instant.';
  return 'Une erreur est survenue. Réessaie.';
}
