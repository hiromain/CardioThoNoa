# Catalogue de gestes — note de dev

## Modifier le catalogue manuellement

Édite **`procedureTypes.js`**, puis pousse vers Supabase :

```bash
npm run seed:catalog
```

Le script fait un **upsert/fusion** par `id` — il ne supprime jamais les gestes
créés par les admins via l'UI (`/admin/catalogue`).

## Pré-requis (une seule fois)

Ajouter dans `.env.local` (ne pas committer, déjà gitignored) :

```
SUPABASE_URL=https://qjifvezpirabkpwzgbhd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<clé service_role dans Dashboard Supabase → Settings → API>
```

## Rôle des fichiers

| Fichier | Rôle |
|---|---|
| `procedureTypes.js` | ✏️ Source de vérité hand-éditable (camelCase). Utilisé par le store (1er boot), le mode démo, et le script de sync. |
| `seed.js` | Génère les données de démonstration (interventions, patients…). Ne pas éditer pour le catalogue. |
| `constants.js` | Constantes de l'app (spécialités, positions, profil par défaut…). |
