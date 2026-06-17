// CardioThoNoa — Edge Function : création d'une session Stripe Checkout.
//
// Accepte { origin, plan } où plan ∈ 'semester' | 'annual' | 'lifetime'.
//   semester / annual → mode 'subscription' (renouvellement automatique)
//   lifetime          → mode 'payment'      (achat unique)
//
// Secrets requis (supabase secrets set …) :
//   STRIPE_SECRET_KEY, STRIPE_PRICE_SEMESTER, STRIPE_PRICE_ANNUAL,
//   STRIPE_PRICE_LIFETIME
// Injectés automatiquement : SUPABASE_URL, SUPABASE_ANON_KEY.
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

const PLAN_CONFIG: Record<string, { priceEnv: string; mode: 'payment' | 'subscription' }> = {
  semester: { priceEnv: 'STRIPE_PRICE_SEMESTER', mode: 'subscription' },
  annual:   { priceEnv: 'STRIPE_PRICE_ANNUAL',   mode: 'subscription' },
  lifetime: { priceEnv: 'STRIPE_PRICE_LIFETIME',  mode: 'payment'      },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Identité de l'appelant ─────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Non authentifié.' }, 401);

    // ── Corps de la requête ────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const origin =
      req.headers.get('origin') || body.origin || Deno.env.get('APP_URL') || '';
    if (!/^https?:\/\//.test(origin)) return json({ error: 'Origine invalide.' }, 400);

    const plan: string = body.plan ?? 'annual';
    const config = PLAN_CONFIG[plan];
    if (!config) return json({ error: 'Plan inconnu.' }, 400);

    const priceId = Deno.env.get(config.priceEnv) ?? '';
    if (!priceId) return json({ error: `Prix non configuré (${config.priceEnv}).` }, 500);

    // ── Session Checkout ───────────────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { user_id: user.id, plan },
      success_url: `${origin}/parametres?achat=succes`,
      cancel_url:  `${origin}/parametres?achat=annule`,
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
