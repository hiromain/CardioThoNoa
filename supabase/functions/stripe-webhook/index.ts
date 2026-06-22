// CardioThoNoa — Edge Function : webhook Stripe.
//
// Gère trois événements :
//   checkout.session.completed    → achat initial (paiement unique ou abonnement)
//   invoice.payment_succeeded     → renouvellement d'abonnement → maj period_end
//   customer.subscription.deleted → résiliation → is_paid = false
//
// Le droit d'accès (is_paid/plan/stripe_*) vit dans la table `profiles` (les
// colonnes y ont fusionné — migration 0005, l'ancienne table `entitlements`
// n'existe plus). Cette fonction utilise le service role : elle contourne la RLS
// et le trigger `profiles_guard_protected` (auth.uid() null) → seul écrivain
// légitime des colonnes de paiement.
//
// Secrets requis : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// Injectés automatiquement : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
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

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === 'invoice.payment_succeeded') {
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    }
  } catch (err) {
    console.error(`Handler ${event.type}`, err);
    return new Response('Erreur handler', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ── Achat initial ────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.user_id;
  if (!userId) return;

  const plan = session.metadata?.plan ?? 'lifetime';
  const customerId = typeof session.customer === 'string' ? session.customer : null;

  let subscriptionId: string | null = null;
  let periodEnd: string | null = null;

  if (session.mode === 'subscription' && session.subscription) {
    subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription).id;

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    periodEnd = new Date(sub.current_period_end * 1000).toISOString();
  }

  // Upsert sur profiles : sur conflit (profil déjà créé à la connexion) seules
  // les colonnes de paiement sont mises à jour ; rôle/centre/nom sont préservés.
  const { error } = await admin.from('profiles').upsert(
    {
      user_id:                userId,
      is_paid:                true,
      plan,
      purchased_at:           new Date().toISOString(),
      stripe_customer_id:     customerId,
      stripe_session_id:      session.id,
      stripe_subscription_id: subscriptionId,
      current_period_end:     periodEnd,
    },
    { onConflict: 'user_id' }
  );
  if (error) { console.error('Upsert checkout', error); throw error; }
}

// ── Renouvellement d'abonnement ──────────────────────────────────────────────

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') return;

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
  if (!customerId) return;

  const lineItem = invoice.lines?.data?.[0];
  if (!lineItem?.period?.end) return;
  const periodEnd = new Date(lineItem.period.end * 1000).toISOString();

  const { data: row } = await admin
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (!row) return;

  const { error } = await admin
    .from('profiles')
    .update({ is_paid: true, current_period_end: periodEnd })
    .eq('user_id', row.user_id);
  if (error) { console.error('Update renewal', error); throw error; }
}

// ── Résiliation d'abonnement ─────────────────────────────────────────────────

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : null;
  if (!customerId) return;

  const { data: row } = await admin
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (!row) return;

  const { error } = await admin
    .from('profiles')
    .update({ is_paid: false, stripe_subscription_id: null, current_period_end: null })
    .eq('user_id', row.user_id);
  if (error) { console.error('Update cancellation', error); throw error; }
}
