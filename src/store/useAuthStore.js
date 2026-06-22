// CardioThoNoa — Store d'authentification (Zustand).
//
// Authentification Supabase par email + mot de passe (signInWithPassword /
// signUp) ou Google (OAuth). Un lien « mot de passe oublié » permet la
// réinitialisation. Trois états :
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
  // 'idle' | 'submitting'
  flow: 'idle',
  email: '',
  error: null,
  // Méthode de connexion du compte courant : 'email' | 'google' | null.
  authProvider: null,
  // Flux « mot de passe oublié » : email de réinitialisation envoyé.
  resetSent: false,
  // L'utilisateur est arrivé via un lien de réinitialisation (évènement
  // PASSWORD_RECOVERY) → l'écran propose de choisir un nouveau mot de passe.
  recovery: false,
  // Onglet actif sur l'écran de connexion : 'login' | 'signup'.
  authView: 'login',
  configured: isSupabaseConfigured,

  // ── Rôle & centre (supervision multi-centres) ────────────────────────────
  // Chargés depuis la table `profiles` après connexion (voir refreshProfile).
  // 'intern' = usage standard ; 'admin' = super-admin global (catalogue de
  // gestes partagé, supervision des internes/centres). Voir migration 0004.
  role: 'intern',
  isAdmin: false,
  centreId: null,
  profileLoaded: false,

  // Recharge le profil (rôle + centre) depuis Supabase. Crée la ligne
  // `profiles` au premier passage (rôle 'intern' par défaut). Démo/dev → intern.
  refreshProfile: async () => {
    const user = get().user;
    if (!isSupabaseConfigured || !user || isLocalUser(user)) {
      set({ role: 'intern', isAdmin: false, centreId: null, profileLoaded: true });
      return 'intern';
    }
    const { data } = await supabase
      .from('profiles')
      .select('role, centre_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data) {
      // Première connexion : on crée la ligne profil (rôle interne par défaut).
      const storeProfile = useStore.getState().profile;
      const displayName = storeProfile
        ? [storeProfile.prenom, storeProfile.nom].filter(Boolean).join(' ').trim() || null
        : null;
      const { data: created } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, role: 'intern', display_name: displayName, email: user.email })
        .select('role, centre_id')
        .maybeSingle();
      const role = created?.role ?? 'intern';
      set({ role, isAdmin: role === 'admin', centreId: created?.centre_id ?? null, profileLoaded: true });
      return role;
    }
    const role = data.role ?? 'intern';
    set({ role, isAdmin: role === 'admin', centreId: data.centre_id ?? null, profileLoaded: true });
    return role;
  },

  // Met à jour le centre de rattachement de l'utilisateur courant (Réglages /
  // onboarding). N'affecte que sa propre ligne `profiles`.
  setCentre: async (centreId) => {
    const user = get().user;
    set({ centreId });
    if (!isSupabaseConfigured || !user || isLocalUser(user)) return;
    await supabase.from('profiles').update({ centre_id: centreId }).eq('user_id', user.id);
  },

  // ── Droit d'accès (achat unique) ──────────────────────────────────────────
  // `isPaid` est la clé du paywall : seul un compte ayant payé peut écrire des
  // données (voir le garde dans useStore.js) et synchroniser (voir syncEngine).
  // Démo et compte gratuit ont isPaid=false → lecture seule.
  isPaid: false,
  plan: null,         // 'semester' | 'annual' | 'lifetime' | null
  planEndDate: null,  // ISO string, null pour les plans à vie
  entitlementLoaded: false,
  // Modale d'upgrade globale (ouverte par le garde d'écriture).
  upgradeOpen: false,

  setAuthView: (view) => set({ authView: view, error: null, resetSent: false }),

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
      .select('is_paid, plan, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    const isPaid = !error && !!data?.is_paid;
    set({
      isPaid,
      plan: data?.plan ?? null,
      planEndDate: data?.current_period_end ?? null,
      entitlementLoaded: true,
    });
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
    supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      // Retour d'un lien « mot de passe oublié » : on reste sur l'écran de
      // connexion pour faire saisir un nouveau mot de passe (flag recovery).
      if (event === 'PASSWORD_RECOVERY') {
        set({ recovery: true, status: 'signed-out', flow: 'idle', error: null });
        return;
      }
      set({
        user,
        authProvider: user?.app_metadata?.provider ?? null,
        status: user ? 'signed-in' : 'signed-out',
        ...(user ? { flow: 'idle', error: null } : {}),
      });
    });
  },

  // ── Connexion email + mot de passe ───────────────────────────────────────────
  signIn: async (rawEmail, password) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !password) {
      set({ error: 'Email et mot de passe requis.' });
      return false;
    }
    set({ flow: 'submitting', error: null, email });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ flow: 'idle', error: traduireErreurConnexion(error) });
      return false;
    }
    // onAuthStateChange basculera le status à 'signed-in'.
    return true;
  },

  // ── Inscription email + mot de passe ─────────────────────────────────────────
  // Avec « Confirm email » désactivé côté Supabase, signUp ouvre directement une
  // session (pas d'email). Si une session n'est pas renvoyée, c'est que la
  // confirmation est encore active → on l'indique.
  signUp: async (rawEmail, password) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !password) {
      set({ error: 'Email et mot de passe requis.' });
      return false;
    }
    if (password.length < 6) {
      set({ error: 'Le mot de passe doit faire au moins 6 caractères.' });
      return false;
    }
    set({ flow: 'submitting', error: null, email });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ flow: 'idle', error: traduireErreurInscription(error) });
      return false;
    }
    if (!data.session) {
      set({
        flow: 'idle',
        error:
          "Confirmation par email requise : désactive « Confirm email » dans Supabase, ou clique le lien reçu.",
      });
      return false;
    }
    // onAuthStateChange basculera le status à 'signed-in'.
    return true;
  },

  // ── Mot de passe oublié ──────────────────────────────────────────────────────
  requestPasswordReset: async (rawEmail) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email) {
      set({ error: 'Adresse email requise.' });
      return false;
    }
    set({ flow: 'submitting', error: null });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      set({ flow: 'idle', error: 'Envoi impossible. Réessaie.' });
      return false;
    }
    set({ flow: 'idle', resetSent: true });
    return true;
  },

  // ── Définir / modifier le mot de passe ───────────────────────────────────────
  // Utilisé par les Réglages (compte connecté) ET le flux de récupération.
  updatePassword: async (password) => {
    if (!password || password.length < 6) {
      set({ error: 'Le mot de passe doit faire au moins 6 caractères.' });
      return false;
    }
    set({ flow: 'submitting', error: null });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      set({ flow: 'idle', error: 'Modification impossible. Réessaie.' });
      return false;
    }
    set({ flow: 'idle', recovery: false });
    return true;
  },

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
  startCheckout: async (plan = 'annual') => {
    const user = get().user;
    if (!isSupabaseConfigured || !user || isLocalUser(user)) {
      // Pas de compte réel (démo) : on bascule vers la création de compte.
      set({ authView: 'signup', upgradeOpen: false });
      return false;
    }
    const origin = window.location.origin;
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { origin, plan },
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
    });
    useStore.getState().resetDemo();
  },

  signOut: async () => {
    if (isSupabaseConfigured && !get().isDemo) await supabase.auth.signOut();
    set({
      status: 'signed-out',
      user: null,
      isDemo: false,
      role: 'intern',
      isAdmin: false,
      centreId: null,
      profileLoaded: false,
      isPaid: false,
      plan: null,
      planEndDate: null,
      entitlementLoaded: false,
      upgradeOpen: false,
      authProvider: null,
      recovery: false,
      resetSent: false,
      flow: 'idle',
      email: '',
      error: null,
    });
  },
}));

function traduireErreurConnexion(error) {
  const msg = error?.message || '';
  if (/invalid login|invalid credentials/i.test(msg))
    return 'Email ou mot de passe incorrect.';
  if (/email not confirmed/i.test(msg))
    return "Compte non confirmé. Vérifie l'email reçu à l'inscription.";
  if (/rate|limit|too many/i.test(msg)) return 'Trop de tentatives. Réessaie dans un instant.';
  return 'Une erreur est survenue. Réessaie.';
}

function traduireErreurInscription(error) {
  const msg = error?.message || '';
  if (/already registered|already exists|user already/i.test(msg))
    return 'Un compte existe déjà avec cette adresse. Connecte-toi.';
  if (/password/i.test(msg)) return 'Mot de passe trop faible (6 caractères minimum).';
  if (/email/i.test(msg)) return 'Adresse email invalide.';
  if (/rate|limit|too many/i.test(msg)) return 'Trop de tentatives. Réessaie dans un instant.';
  return 'Une erreur est survenue. Réessaie.';
}
