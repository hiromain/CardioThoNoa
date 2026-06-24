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
  // Inscription terminée, en attente de clic sur le lien de confirmation email.
  signUpConfirmationPending: false,
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

  // Recharge le profil COMPLET depuis Supabase : rôle, centre ET droit d'accès
  // (is_paid / plan / fin de période). Depuis la migration 0005, tout est dans
  // la seule table `profiles` (l'ancienne table `entitlements` a fusionné ici).
  // Crée la ligne au premier passage (rôle 'intern', non payé). Démo/dev → libre.
  // Retourne `isPaid` (utilisé par le moteur de sync pour décider quoi charger).
  refreshProfile: async () => {
    const user = get().user;
    if (!isSupabaseConfigured || !user || isLocalUser(user)) {
      set({
        role: 'intern', isAdmin: false, centreId: null,
        isPaid: false, plan: null, planEndDate: null,
        profileLoaded: true, entitlementLoaded: true,
      });
      return false;
    }
    // On tente d'inclure les colonnes de paiement (présentes après la migration
    // 0005). Si elles n'existent pas encore (avant 0005), la requête échoue et on
    // retombe sur rôle/centre seuls — l'accès payant reste alors à false (sens
    // sûr : verrouillé, jamais débloqué par erreur).
    let hasPaymentCols = true;
    let { data, error } = await supabase
      .from('profiles')
      .select('role, centre_id, is_paid, plan, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      hasPaymentCols = false;
      ({ data } = await supabase
        .from('profiles')
        .select('role, centre_id')
        .eq('user_id', user.id)
        .maybeSingle());
    }
    if (!data) {
      // Première connexion : on crée la ligne profil (interne, non payé). Le rôle
      // et les colonnes de paiement sont forcés côté serveur par le trigger
      // `profiles_guard_protected` — impossible de s'auto-attribuer admin/payant.
      const storeProfile = useStore.getState().profile;
      const displayName = storeProfile
        ? [storeProfile.prenom, storeProfile.nom].filter(Boolean).join(' ').trim() || null
        : null;
      await supabase
        .from('profiles')
        .insert({ user_id: user.id, role: 'intern', display_name: displayName, email: user.email });
      data = { role: 'intern', centre_id: null, is_paid: false, plan: null, current_period_end: null };
    }
    const role = data.role ?? 'intern';
    const isPaid = hasPaymentCols ? !!data.is_paid : false;
    set({
      role,
      isAdmin: role === 'admin',
      centreId: data.centre_id ?? null,
      isPaid,
      plan: hasPaymentCols ? (data.plan ?? null) : null,
      planEndDate: hasPaymentCols ? (data.current_period_end ?? null) : null,
      profileLoaded: true,
      entitlementLoaded: true,
    });
    return isPaid;
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

  setAuthView: (view) => set({ authView: view, error: null, resetSent: false, signUpConfirmationPending: false }),

  openUpgrade: () => set({ upgradeOpen: true }),
  closeUpgrade: () => set({ upgradeOpen: false }),

  // NB : le droit d'accès (is_paid/plan) est désormais chargé par refreshProfile
  // — il n'y a plus de table `entitlements` ni de refreshEntitlement séparé.

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
    const pwError = validatePassword(password);
    if (pwError) {
      set({ error: pwError });
      return false;
    }
    set({ flow: 'submitting', error: null, email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      set({ flow: 'idle', error: traduireErreurInscription(error) });
      return false;
    }
    if (!data.session) {
      // Email de confirmation envoyé — session ouverte après clic sur le lien.
      set({ flow: 'idle', signUpConfirmationPending: true });
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
    const pwError = validatePassword(password);
    if (pwError) {
      set({ error: pwError });
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

function validatePassword(password) {
  if (!password || password.length < 10)
    return 'Le mot de passe doit faire au moins 10 caractères.';
  if (!/[a-z]/.test(password))
    return 'Le mot de passe doit contenir au moins une minuscule.';
  if (!/[A-Z]/.test(password))
    return 'Le mot de passe doit contenir au moins une majuscule.';
  if (!/\d/.test(password))
    return 'Le mot de passe doit contenir au moins un chiffre.';
  return null;
}

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
  if (/password/i.test(msg)) return 'Mot de passe trop faible (10 caractères minimum, majuscule + minuscule + chiffre).';
  if (/email/i.test(msg)) return 'Adresse email invalide.';
  if (/rate|limit|too many/i.test(msg)) return 'Trop de tentatives. Réessaie dans un instant.';
  return 'Une erreur est survenue. Réessaie.';
}
