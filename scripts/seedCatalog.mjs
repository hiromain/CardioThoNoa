// CardioThoNoa — Synchronisation du catalogue de gestes vers Supabase.
//
// Source de vérité : src/data/procedureTypes.js (hand-éditable).
// Ce script pousse ce tableau dans la table partagée `procedure_types` en
// UPSERT (fusion par `id`) : il met à jour/ajoute les gestes du fichier mais ne
// supprime JAMAIS les gestes créés par les admins via l'UI (/admin/catalogue).
//
// Lancer : npm run seed:catalog
// Pré-requis dans .env.local (jamais committé, jamais préfixé VITE_) :
//   SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...   (clé secrète, bypasse la RLS)
import { createClient } from '@supabase/supabase-js';
import { PROCEDURE_TYPES } from '../src/data/procedureTypes.js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    '✗ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local.'
  );
  process.exit(1);
}

// app (camelCase) → DB (snake_case). Copie locale de procedureTypeToRow
// (src/lib/catalog.js) pour éviter d'importer le client Supabase navigateur,
// qui dépend de import.meta.env (indisponible sous Node).
function procedureTypeToRow(pt, sortOrder) {
  return {
    id: pt.id,
    name: pt.name,
    abbr: pt.abbr ?? null,
    scope: pt.scope,
    service_type: pt.serviceType,
    intern_steps: pt.internSteps ?? [],
    is_step: pt.scope === 'intern',
    archived: !!pt.archived,
    sort_order: sortOrder,
  };
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rows = PROCEDURE_TYPES.map((pt, i) => procedureTypeToRow(pt, i));

const { error } = await supabase
  .from('procedure_types')
  .upsert(rows, { onConflict: 'id' });

if (error) {
  console.error('✗ Échec de la synchronisation :', error.message);
  process.exit(1);
}

console.log(`✓ ${rows.length} gestes synchronisés (upsert) dans procedure_types.`);
console.log('  Les gestes créés par les admins absents du fichier sont préservés.');
