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
import { useStore } from './useStore';

// Identifiants de sessions locales (sans compte Supabase) : connexion dev et
// mode démo. Exclues de la synchronisation cloud (voir lib/syncEngine.js).
const LOCAL_USER_IDS = new Set(['dev-local', 'demo-local']);
export function isLocalUser(user) {
  return !!user && LOCAL_USER_IDS.has(user.id);
}

export const useAuthStore = create((set, get) => ({
  status: isSupabaseConfigured ? 'loading' : 'signed-out',
  user: null,
  isDemo: false,
  // 'idle' | 'sending' | 'code-sent' | 'verifying'
  flow: 'idle',
  email: '',
  error: null,
  // Adresse saisie en mode « Se connecter » sans compte associé.
  noAccount: false,
  // Onglet actif sur l'écran de connexion : 'login' | 'signup'.
  authView: 'login',
  configured: isSupabaseConfigured,

  // ── Droit d'accès (achat unique) ──────────────────────────────────────────
  // `isPaid` est la clé du paywall : seul un compte ayant payé peut écrire des
  // données (voir le garde dans useStore.js) et synchroniser (voir syncEngine).
  // Démo et compte gratuit ont isPaid=false → lecture seule.
  isPaid: false,
  entitlementLoaded: false,
  // Modale d'upgrade globale (ouverte par le garde d'écriture).
  upgradeOpen: false,

  setAuthView: (view) => set({ authView: view, error: null, noAccount: false }),

  openUpgrade: () => set({ upgradeOpen: true }),
  closeUpgrade: () => set({ upgradeOpen: false }),

  // Recharge le droit d'accès depuis Supabase (table `entitlements`). Appelée
  // après connexion et au retour d'un achat. Sans ligne → non payé.
  refreshEntitlement: async () => {
    const user = get().user;
    if (!isSupabaseConfigured || !user || isLocalUser(user)) {
      set({ isPaid: false, entitlementLoaded: true });
      return false;
    }
    const { data, error } = await supabase
      .from('entitlements')
      .select('is_paid')
      .eq('user_id', user.id)
      .maybeSingle();
    const isPaid = !error && !!data?.is_paid;
    set({ isPaid, entitlementLoaded: true });
    return isPaid;
  },

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
  // `allowSignup` correspond à l'onglet actif : « Créer un compte » autorise la
  // création d'un nouvel utilisateur, « Se connecter » exige un compte existant.
  sendOtp: async (rawEmail, { allowSignup = true } = {}) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email) {
      set({ error: 'Adresse email requise.' });
      return false;
    }
    set({ flow: 'sending', error: null, noAccount: false, email });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: allowSignup },
    });
    if (error) {
      if (!allowSignup && estCompteInconnu(error)) {
        set({ flow: 'idle', noAccount: true });
      } else {
        set({ flow: 'idle', error: traduireErreurEmail(error) });
      }
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
  resetFlow: () => set({ flow: 'idle', error: null, noAccount: false }),

  // ── Connexion Google (OAuth) ────────────────────────────────────────────────
  // Redirige vers Google ; au retour, supabase-js échange le code (PKCE) et
  // onAuthStateChange bascule le status à 'signed-in'. Nécessite l'activation du
  // provider Google côté dashboard Supabase.
  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      set({ error: 'Configuration Supabase manquante.' });
      return false;
    }
    set({ error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      set({ error: 'Connexion Google indisponible. Réessaie.' });
      return false;
    }
    return true;
  },

  // ── Achat (Stripe Checkout) ──────────────────────────────────────────────────
  // Demande une session Checkout à la fonction Edge puis redirige vers Stripe.
  startCheckout: async () => {
    const user = get().user;
    if (!isSupabaseConfigured || !user || isLocalUser(user)) {
      // Pas de compte réel (démo) : on bascule vers la création de compte.
      set({ authView: 'signup', upgradeOpen: false });
      return false;
    }
    const origin = window.location.origin;
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { origin },
    });
    if (error || !data?.url) {
      set({ error: 'Paiement indisponible pour le moment. Réessaie.' });
      return false;
    }
    window.location.href = data.url;
    return true;
  },

  // ── Connexion dev (sans Supabase, sans email) ───────────────────────────────
  // Disponible uniquement en mode développement (npm run dev), pour éviter de
  // repasser par le flow OTP à chaque rechargement. Utilise un faux user dont
  // l'id est exclu de la sync cloud (voir lib/syncEngine.js).
  devSignIn: () => {
    set({
      status: 'signed-in',
      user: { id: 'dev-local', email: 'dev@local' },
      // Accès complet en dev pour pouvoir tester l'écriture sans paiement.
      isPaid: true,
      entitlementLoaded: true,
      flow: 'idle',
      error: null,
    });
  },

  // ── Mode démo (sans compte) ──────────────────────────────────────────────────
  // Permet de découvrir l'application avec le jeu de données d'exemple, sans
  // créer de compte. Données 100 % locales, jamais synchronisées.
  enterDemo: () => {
    set({
      status: 'signed-in',
      user: { id: 'demo-local', email: null },
      isDemo: true,
      flow: 'idle',
      error: null,
      noAccount: false,
    });
    useStore.getState().resetDemo();
  },

  signOut: async () => {
    if (isSupabaseConfigured && !get().isDemo) await supabase.auth.signOut();
    set({
      status: 'signed-out',
      user: null,
      isDemo: false,
      isPaid: false,
      entitlementLoaded: false,
      upgradeOpen: false,
      flow: 'idle',
      email: '',
      error: null,
      noAccount: false,
    });
  },
}));

// GoTrue ne renvoie pas de code stable pour « email sans compte » avec
// shouldCreateUser=false : on reconnaît les messages usuels (variables selon
// les versions de Supabase Auth).
function estCompteInconnu(error) {
  const msg = error?.message || '';
  return /not allowed|not found|no user|disabled/i.test(msg);
}

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
