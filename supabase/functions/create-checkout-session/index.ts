// CardioThoNoa — Edge Function : création d'une session Stripe Checkout.
//
// Appelée depuis l'app (utilisateur connecté) via supabase.functions.invoke.
// Le JWT de l'utilisateur est transmis automatiquement dans l'en-tête
// Authorization → on en déduit son id (client_reference_id) pour relier le
// paiement au compte côté webhook.
//
// Achat UNIQUE : mode 'payment' (pas 'subscription').
//
// Secrets requis (supabase secrets set …) :
//   STRIPE_SECRET_KEY, STRIPE_PRICE_ID
// Injectés automatiquement par la plateforme : SUPABASE_URL, SUPABASE_ANON_KEY.
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Identité de l'appelant à partir de son JWT ──────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Non authentifié.' }, 401);
    }

    // ── Origine de retour (success/cancel) ──────────────────────────────────
    // On privilégie l'en-tête Origin (positionné par le navigateur, fiable).
    const body = await req.json().catch(() => ({}));
    const origin =
      req.headers.get('origin') || body.origin || Deno.env.get('APP_URL') || '';
    if (!/^https?:\/\//.test(origin)) {
      return json({ error: 'Origine invalide.' }, 400);
    }

    // ── Session Checkout (achat unique) ─────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: Deno.env.get('STRIPE_PRICE_ID') ?? '', quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { user_id: user.id },
      success_url: `${origin}/parametres?achat=succes`,
      cancel_url: `${origin}/parametres?achat=annule`,
    });

    return json({ url: session.url }, 200);
  } catch (err) {
    console.error('create-checkout-session', err);
    return json({ error: 'Erreur création de session.' }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
