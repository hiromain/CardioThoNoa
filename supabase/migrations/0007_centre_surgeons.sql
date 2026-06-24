-- CardioThoNoa — Liste de chirurgiens par centre
-- Ajoute une colonne `surgeons` (tableau JSONB) sur la table `centres`.
-- Chaque entrée : { "title": "Dr.", "firstName": "...", "lastName": "..." }
-- Gérée par les admins via l'interface ; les internes du centre peuvent
-- s'en servir comme référence lors de la configuration de leur service.

ALTER TABLE public.centres
  ADD COLUMN IF NOT EXISTS surgeons jsonb NOT NULL DEFAULT '[]'::jsonb;
