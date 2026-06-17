-- CardioThoNoa — Gestion multi-plans (semestre / annuel / à vie).
--
-- À exécuter APRÈS 0002_entitlements.sql dans le SQL Editor Supabase.
-- Ajoute trois colonnes à `entitlements` sans toucher à la RLS existante :
--   plan                  → type de plan choisi à l'achat
--   stripe_subscription_id→ id Stripe pour les plans récurrents (NULL si à vie)
--   current_period_end    → date de fin de période (NULL si à vie)

ALTER TABLE public.entitlements
  ADD COLUMN IF NOT EXISTS plan TEXT
    CHECK (plan IN ('semester', 'annual', 'lifetime')),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
