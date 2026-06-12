# Paywall « achat unique » + Google OAuth — guide de configuration

Ce document décrit les étapes **hors code** pour activer le paiement (Stripe) et
la connexion Google. Le code est déjà en place ; ces étapes branchent les
services externes.

## Modèle

- N'importe qui peut **créer un compte** (OTP email ou Google).
- Un compte **gratuit est en lecture seule** : il explore l'app avec des données
  d'exemple mais ne peut rien enregistrer.
- Un **achat unique** (à vie) débloque l'enregistrement et la synchronisation.
- La source de vérité du droit d'accès est la table Supabase `entitlements`
  (colonne `is_paid`), écrite **uniquement** par le webhook Stripe.

---

## 1. Base de données Supabase

Exécuter, dans le SQL Editor du projet, la migration :

```
supabase/migrations/0002_entitlements.sql
```

(après `0001_app_data.sql`). Elle crée la table `entitlements` + la RLS
« lecture de sa propre ligne ».

---

## 2. Stripe

1. Créer un **produit** + un **prix** de type *one-time* (mode **Test** d'abord).
   Noter le `price_id` (commence par `price_…`).
2. Récupérer la **clé secrète** test (`sk_test_…`) dans Developers → API keys.

---

## 3. Edge Functions Supabase

Deux fonctions sont fournies dans `supabase/functions/` :

- `create-checkout-session` — crée la session Stripe Checkout (appelée par l'app).
- `stripe-webhook` — reçoit la confirmation de paiement et bascule `is_paid`.

Déploiement (CLI Supabase) :

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

> `supabase/config.toml` désactive déjà la vérification JWT pour `stripe-webhook`
> (Stripe n'envoie pas de JWT Supabase ; la signature Stripe fait foi).

Définir les secrets (jamais exposés au client) :

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_PRICE_ID=price_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx   # voir étape 4
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont
> injectés automatiquement par la plateforme — ne pas les redéfinir.

---

## 4. Webhook Stripe

Dans Stripe → Developers → Webhooks → *Add endpoint* :

- URL : `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Événement : `checkout.session.completed`
- Copier le **Signing secret** (`whsec_…`) dans le secret
  `STRIPE_WEBHOOK_SECRET` (étape 3).

Test en local :

```bash
supabase functions serve
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
# carte de test : 4242 4242 4242 4242
```

---

## 4 bis. Méthodes de connexion (email+mot de passe & Google)

La connexion se fait désormais par **email + mot de passe** ou **Google** —
l'OTP par code email a été retiré.

Côté Supabase → Authentication :

- **Providers → Email** : activé, et **désactiver « Confirm email »** pour une
  inscription instantanée sans email (choix validé). Si tu le laisses activé,
  l'app affichera un message demandant de confirmer par email.
- **Mot de passe oublié** : utilise le template d'email « Reset Password » par
  défaut ; le lien renvoie vers l'app (`redirectTo = origin`) qui détecte
  l'évènement `PASSWORD_RECOVERY` et propose un nouveau mot de passe.
- Les Réglages de l'app permettent de **changer le mot de passe** (comptes email)
  et affichent la **méthode de connexion** (Google ou email).

> Compte créé avant ce changement (via l'ancien OTP) : il n'a pas de mot de
> passe → utiliser « Mot de passe oublié » pour en définir un.

## 5. Google OAuth

1. Supabase → Authentication → Providers → **Google** : activer.
2. Google Cloud Console → créer des identifiants OAuth (type *Web application*) :
   - **Authorized redirect URI** :
     `https://<project-ref>.supabase.co/auth/v1/callback`
3. Renseigner *Client ID* / *Client Secret* dans Supabase.
4. Supabase → Authentication → URL Configuration : ajouter le **Site URL** et les
   **Redirect URLs** (localhost en dev + URL Vercel en prod).

> Le client est déjà en flux **PKCE** avec `detectSessionInUrl: true` : le retour
> de redirection Google établit la session automatiquement. L'OTP email continue
> de fonctionner en parallèle.

---

## 6. Bascule en production

- Refaire les étapes Stripe (produit/prix/clé/webhook) en **mode Live**.
- Mettre à jour les secrets Supabase avec les clés `sk_live_…` / `whsec_…` live.
- Vérifier les Redirect URLs avec l'URL de production (Vercel).

---

## Rappel RGPD

Le paywall ne change **rien** au traitement des données patient : elles restent
strictement locales (jamais dans `SYNC_FIELDS` / `snapshotPayload`). Le compte
gratuit est simplement empêché d'écrire ; aucune donnée personnelle n'est
envoyée sur le réseau.
