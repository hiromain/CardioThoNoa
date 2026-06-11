// CardioThoNoa — Écran de connexion (OTP par email).
//
// Deux étapes : saisie de l'email → réception d'un code à 6 chiffres → saisie
// du code. La bascule vers l'application est gérée par AuthGate via le status
// du store d'auth (onAuthStateChange).
import { useState } from 'react';
import { HeartPulse, Mail, KeyRound, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';

export default function Login() {
  const configured = useAuthStore((s) => s.configured);
  const flow = useAuthStore((s) => s.flow);
  const error = useAuthStore((s) => s.error);
  const sentEmail = useAuthStore((s) => s.email);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const resetFlow = useAuthStore((s) => s.resetFlow);
  const devSignIn = useAuthStore((s) => s.devSignIn);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const codeStep = flow === 'code-sent' || flow === 'verifying';
  const busy = flow === 'sending' || flow === 'verifying';

  async function onSubmitEmail(e) {
    e.preventDefault();
    await sendOtp(email);
  }

  async function onSubmitCode(e) {
    e.preventDefault();
    await verifyOtp(code);
  }

  function backToEmail() {
    setCode('');
    resetFlow();
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
        ) : codeStep ? (
          <Card>
            <form onSubmit={onSubmitCode} className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-[15px] font-bold text-ink-1">Vérifie ta boîte mail</div>
                <p className="text-[13px] text-ink-2 mt-1">
                  Un code à 6 chiffres a été envoyé à<br />
                  <span className="font-semibold text-ink-1">{sentEmail}</span>.
                </p>
              </div>

              <Input
                label="Code reçu"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl tracking-[0.4em] font-bold"
                autoFocus
              />

              {error && <ErrorLine message={error} />}

              <Button type="submit" fullWidth size="lg" disabled={busy || code.length < 6}>
                <KeyRound size={16} />
                {flow === 'verifying' ? 'Vérification…' : 'Se connecter'}
              </Button>

              <button
                type="button"
                onClick={backToEmail}
                className="flex items-center justify-center gap-1.5 text-[13px] text-ink-3 font-medium"
              >
                <ArrowLeft size={14} /> Changer d'adresse
              </button>
            </form>
          </Card>
        ) : (
          <Card>
            <form onSubmit={onSubmitEmail} className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-[15px] font-bold text-ink-1">Connexion</div>
                <p className="text-[13px] text-ink-2 mt-1">
                  Entre ton adresse email pour recevoir un code de connexion.
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
                {flow === 'sending' ? 'Envoi…' : 'Recevoir un code'}
              </Button>
            </form>
          </Card>
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
