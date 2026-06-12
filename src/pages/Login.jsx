// CardioThoNoa — Écran de connexion (email + mot de passe, ou Google).
//
// Deux onglets : « Se connecter » (compte existant) et « Créer un compte ».
// Saisie email + mot de passe → connexion immédiate (pas de code email).
// Un lien « Mot de passe oublié » envoie un email de réinitialisation ; le
// retour sur ce lien (évènement PASSWORD_RECOVERY) affiche un formulaire de
// nouveau mot de passe (flag `recovery`). La bascule vers l'application est
// gérée par App via le status du store d'auth (onAuthStateChange).
//
// Un mode démo (sans compte, données d'exemple, 100 % local) est accessible
// depuis cet écran via enterDemo().
import { useState } from 'react';
import { HeartPulse, Mail, Lock, KeyRound, ArrowLeft, ArrowRight, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { SegmentedControl } from '../components/ui/SegmentedControl';

export default function Login() {
  const configured = useAuthStore((s) => s.configured);
  const flow = useAuthStore((s) => s.flow);
  const error = useAuthStore((s) => s.error);
  const authView = useAuthStore((s) => s.authView);
  const recovery = useAuthStore((s) => s.recovery);
  const resetSent = useAuthStore((s) => s.resetSent);
  const setAuthView = useAuthStore((s) => s.setAuthView);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const devSignIn = useAuthStore((s) => s.devSignIn);
  const enterDemo = useAuthStore((s) => s.enterDemo);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const isSignup = authView === 'signup';
  const busy = flow === 'submitting';

  async function onSubmitAuth(e) {
    e.preventDefault();
    if (isSignup) await signUp(email, password);
    else await signIn(email, password);
  }

  async function onSubmitForgot(e) {
    e.preventDefault();
    await requestPasswordReset(email);
  }

  async function onSubmitRecovery(e) {
    e.preventDefault();
    await updatePassword(newPassword);
  }

  return (
    <div className="min-h-screen bg-bg flex justify-center">
      <div className="relative w-full max-w-app min-h-screen flex flex-col justify-center px-6 py-10">
        {/* En-tête / logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-sm">
            <HeartPulse size={32} className="text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-1">CardioThoNoa</h1>
          <p className="text-[13px] text-ink-3 mt-1">Suivi de formation chirurgicale CTCV</p>
        </div>

        {!configured ? (
          <Card>
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <AlertTriangle size={28} className="text-warning" />
              <div className="text-[15px] font-bold text-ink-1">Configuration requise</div>
              <p className="text-[13px] text-ink-2 leading-relaxed">
                Les variables <code className="text-ink-1">VITE_SUPABASE_URL</code> et{' '}
                <code className="text-ink-1">VITE_SUPABASE_ANON_KEY</code> ne sont pas définies.
                Copie <code className="text-ink-1">.env.example</code> en{' '}
                <code className="text-ink-1">.env.local</code>, renseigne-les puis relance{' '}
                <code className="text-ink-1">npm run dev</code>.
              </p>
            </div>
          </Card>
        ) : recovery ? (
          // ── Nouveau mot de passe (retour de « mot de passe oublié ») ──────────
          <Card>
            <form onSubmit={onSubmitRecovery} className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-[15px] font-bold text-ink-1">Nouveau mot de passe</div>
                <p className="text-[13px] text-ink-2 mt-1">
                  Choisis un nouveau mot de passe pour ton compte.
                </p>
              </div>
              <Input
                label="Nouveau mot de passe"
                type="password"
                autoComplete="new-password"
                placeholder="6 caractères minimum"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
              {error && <ErrorLine message={error} />}
              <Button type="submit" fullWidth size="lg" disabled={busy || newPassword.length < 6}>
                <KeyRound size={16} />
                {busy ? 'Enregistrement…' : 'Définir le mot de passe'}
              </Button>
            </form>
          </Card>
        ) : showForgot ? (
          // ── Mot de passe oublié ──────────────────────────────────────────────
          <Card>
            {resetSent ? (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <CheckCircle2 size={28} className="text-success" />
                <div className="text-[15px] font-bold text-ink-1">Email envoyé</div>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  Si un compte existe pour <span className="font-semibold text-ink-1">{email}</span>,
                  un lien de réinitialisation vient d'être envoyé. Ouvre-le pour choisir un
                  nouveau mot de passe.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex items-center justify-center gap-1.5 text-[13px] text-ink-3 font-medium mt-1"
                >
                  <ArrowLeft size={14} /> Retour à la connexion
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmitForgot} className="flex flex-col gap-4">
                <div className="text-center">
                  <div className="text-[15px] font-bold text-ink-1">Mot de passe oublié</div>
                  <p className="text-[13px] text-ink-2 mt-1">
                    Saisis ton adresse email pour recevoir un lien de réinitialisation.
                  </p>
                </div>
                <Input
                  label="Adresse email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="noa@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                {error && <ErrorLine message={error} />}
                <Button type="submit" fullWidth size="lg" disabled={busy || !email.trim()}>
                  <Mail size={16} />
                  {busy ? 'Envoi…' : 'Envoyer le lien'}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex items-center justify-center gap-1.5 text-[13px] text-ink-3 font-medium"
                >
                  <ArrowLeft size={14} /> Retour à la connexion
                </button>
              </form>
            )}
          </Card>
        ) : (
          // ── Connexion / inscription (email + mot de passe) ────────────────────
          <Card>
            <div className="flex flex-col gap-4">
              <SegmentedControl
                options={[
                  { value: 'login', label: 'Se connecter' },
                  { value: 'signup', label: 'Créer un compte' },
                ]}
                value={authView}
                onChange={setAuthView}
              />

              <form onSubmit={onSubmitAuth} className="flex flex-col gap-4">
                <div className="text-center">
                  <div className="text-[15px] font-bold text-ink-1">
                    {isSignup ? 'Crée ton compte' : 'Connexion'}
                  </div>
                  <p className="text-[13px] text-ink-2 mt-1">
                    {isSignup
                      ? 'Choisis un email et un mot de passe pour accéder à l’application.'
                      : 'Entre ton email et ton mot de passe.'}
                  </p>
                </div>

                <Input
                  label="Adresse email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="noa@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />

                <Input
                  label="Mot de passe"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? '6 caractères minimum' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="self-end -mt-1 text-[12px] text-primary font-semibold"
                  >
                    Mot de passe oublié ?
                  </button>
                )}

                {error && <ErrorLine message={error} />}

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={busy || !email.trim() || !password}
                >
                  <Lock size={16} />
                  {busy ? 'Connexion…' : isSignup ? 'Créer mon compte' : 'Se connecter'}
                </Button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-[11px] text-ink-3 uppercase tracking-wide">ou</span>
                <div className="h-px flex-1 bg-line" />
              </div>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="lg"
                onClick={signInWithGoogle}
                disabled={busy}
              >
                <GoogleIcon /> Continuer avec Google
              </Button>
            </div>
          </Card>
        )}

        {/* Mode démo (sans compte) — masqué pendant le flux de récupération */}
        {!recovery && (
          <button
            type="button"
            onClick={enterDemo}
            className="mt-4 flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-line text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-ink-1">Découvrir sans compte</div>
              <div className="text-xs text-ink-3">Explorer l'application avec des données d'exemple</div>
            </div>
            <ArrowRight size={16} className="text-ink-3 shrink-0" />
          </button>
        )}

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={devSignIn}
            className="mt-4 text-[12px] font-semibold text-ink-3 underline underline-offset-2 text-center"
          >
            Connexion dev (sans email)
          </button>
        )}

        <p className="text-[11px] text-ink-3 text-center mt-6 leading-relaxed">
          Les données patient ne quittent jamais cet appareil.<br />
          Seules les statistiques de formation sont synchronisées.
        </p>
      </div>
    </div>
  );
}

function ErrorLine({ message }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-cardiac bg-cardiac/10 rounded-md px-3 py-2">
      <AlertTriangle size={15} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// Logo Google (lucide-react n'inclut pas les logos de marque).
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.2 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.3 0-1.3-.1-2.7-.4-4z" />
    </svg>
  );
}
