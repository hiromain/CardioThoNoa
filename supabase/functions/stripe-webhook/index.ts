// CardioThoNoa — Edge Function : webhook Stripe.
//
// Appelée par Stripe (pas par un utilisateur) → verify_jwt = false dans
// config.toml. L'authenticité est garantie par la signature Stripe.
//
// Sur `checkout.session.completed` (achat unique réussi), on bascule
// entitlements.is_paid = true pour l'utilisateur (client_reference_id), via le
// service role (qui contourne la RLS — seul autorisé à écrire cette table).
//
// Secrets requis (supabase secrets set …) :
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// Injectés automatiquement : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
// Vérification de signature compatible Deno (WebCrypto asynchrone).
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Signature manquante', { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error('Signature invalide', err);
    return new Response('Signature invalide', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.user_id;
    if (userId) {
      const { error } = await admin.from('entitlements').upsert({
        user_id: userId,
        is_paid: true,
        purchased_at: new Date().toISOString(),
        stripe_customer_id:
          typeof session.customer === 'string' ? session.customer : null,
        stripe_session_id: session.id,
      });
      if (error) {
        console.error('Upsert entitlement', error);
        return new Response('Erreur base', { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
