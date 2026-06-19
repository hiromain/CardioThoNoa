// CardioThoNoa — Catalogue de référence des types de gestes (ProcedureType).
// Données de référence (pas des données utilisateur) : utilisées à la fois
// pour générer le jeu de démonstration (seed.js) et pour initialiser le
// catalogue de gestes d'un compte payé fraîchement créé (useStore.js).

// ── Sous-gestes « tronc commun » et blocs réutilisables (cardiaque) ───────────
// Sternotomie, abord fémoral, canulation/décanulation, fermeture, et le geste
// générique « Tout » (l'interne a réalisé l'intervention principale en
// totalité) — proposés par défaut pour la plupart des interventions cardiaques.
const CARDIAC_COMMON_STEPS = ['pt-sterno', 'pt-abord-scarpa', 'pt-canul', 'pt-decanul', 'pt-fermeture', 'pt-tout'];
// Temps valvulaire aortique : résection + remplacement + fermeture de l'aortotomie.
const RVA_BLOCK = ['pt-resection-valve', 'pt-remplacement-valve', 'pt-fermeture-aortotomie'];
// Temps valvulaire mitral : atriotomie + résection + remplacement + fermeture de l'atriotomie.
const RVM_BLOCK = ['pt-atriotomie', 'pt-resection-valve', 'pt-remplacement-valve', 'pt-fermeture-atriotomie'];

// ── Types de gestes (ProcedureType) ───────────────────────────────────────────
// scope: 'patient' | 'intern' | 'both' — serviceType: 'cardiaque' | 'thoracique' | 'autre'
// internSteps: sous-gestes proposés par défaut à l'interne quand ce geste est
// choisi comme « intervention principale » (uniquement pour scope patient/both).
export const PROCEDURE_TYPES = [
  // Cardiaque — interventions principales
  { id: 'pt-cabg', name: 'Pontage aorto-coronarien', abbr: 'CABG', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, 'pt-prelev-saphene', 'pt-prelev-mammaire'] },
  { id: 'pt-rva', name: 'Remplacement valvulaire aortique', abbr: 'RVA', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, ...RVA_BLOCK] },
  { id: 'pt-rvm', name: 'Remplacement valvulaire mitral', abbr: 'RVM', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, ...RVM_BLOCK] },
  { id: 'pt-plastie', name: 'Plastie mitrale', abbr: 'Plastie M.', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, ...RVM_BLOCK, 'pt-reparation-mitrale'] },
  { id: 'pt-plastie-tricuspide', name: 'Plastie tricuspide', abbr: 'Plastie T.', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, 'pt-reparation-tricuspide', 'pt-fermeture-atrium-droit'] },
  { id: 'pt-aorte', name: 'Remplacement aorte ascendante', abbr: 'Aorte asc.', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, 'pt-anastomose-aortique'] },
  { id: 'pt-bentall', name: 'Intervention de Bentall', abbr: 'Bentall', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, 'pt-prepa-culot-aortique', 'pt-reimplant-coronaires', ...RVA_BLOCK, 'pt-anastomose-aortique'] },
  { id: 'pt-tirone-david', name: 'Intervention de Tirone David', abbr: 'Tirone David', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, 'pt-reimplant-coronaires', 'pt-anastomose-aortique'] },
  { id: 'pt-ross', name: 'Intervention de Ross', abbr: 'Ross', scope: 'both', serviceType: 'cardiaque', internSteps: ['pt-abord-scarpa'] },
  { id: 'pt-dissection-aortique', name: 'Dissection aortique (Type A)', abbr: 'Dissection aortique', scope: 'both', serviceType: 'cardiaque', internSteps: ['pt-abord-scarpa', 'pt-reparation-femorale'] },
  { id: 'pt-civ', name: 'Fermeture CIV', abbr: 'CIV', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS] },
  { id: 'pt-cia', name: 'Fermeture CIA', abbr: 'CIA', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS] },
  { id: 'pt-ecmo', name: 'Pose ECMO', abbr: 'ECMO', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS] },
  { id: 'pt-ablation-ecmo', name: "Ablation de l'ECMO", abbr: 'Ablation ECMO', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS] },
  { id: 'pt-lvad', name: 'Pose LVAD / BiVAD', abbr: 'LVAD', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS] },
  { id: 'pt-greffe-cardiaque', name: 'Transplantation cardiaque', abbr: 'Greffe cardiaque', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS, 'pt-prelev-cardiaque'] },
  { id: 'pt-reprise-sternale', name: 'Reprise chirurgicale (resternotomie)', abbr: 'Reprise sternale', scope: 'both', serviceType: 'cardiaque', internSteps: ['pt-sterno', 'pt-abord-scarpa', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-drain-pericarde', name: 'Drainage péricardique', abbr: 'Drain péricarde', scope: 'both', serviceType: 'cardiaque', internSteps: [...CARDIAC_COMMON_STEPS] },

  // Cardiaque — sous-gestes réalisables par l'interne
  { id: 'pt-abord-scarpa', name: 'Abord fémoral (Scarpa)', abbr: 'Abord Scarpa', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-decanul', name: 'Décanulation / sevrage de CEC', abbr: 'Décanulation', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-prelev-saphene', name: 'Prélèvement de la veine saphène', abbr: 'Prélèv. saphène', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-prelev-mammaire', name: "Prélèvement de l'artère mammaire interne", abbr: 'Prélèv. AMI', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-resection-valve', name: 'Résection valvulaire', abbr: 'Résection valve', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-remplacement-valve', name: 'Remplacement valvulaire (implantation prothèse)', abbr: 'Remplacement valve', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-fermeture-aortotomie', name: "Fermeture de l'aortotomie", abbr: 'Fermeture aortotomie', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-atriotomie', name: 'Atriotomie', abbr: 'Atriotomie', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-fermeture-atriotomie', name: "Fermeture de l'atriotomie", abbr: 'Fermeture atriotomie', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-reparation-mitrale', name: 'Réparation valvulaire mitrale (plastie)', abbr: 'Plastie mitrale', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-reparation-tricuspide', name: 'Réparation valvulaire tricuspide (plastie)', abbr: 'Plastie tricuspide', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-fermeture-atrium-droit', name: "Fermeture de l'atriotomie droite", abbr: 'Fermeture AD', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-anastomose-aortique', name: 'Anastomose aortique (greffon / tube)', abbr: 'Anastomose aortique', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-prepa-culot-aortique', name: 'Préparation du culot aortique', abbr: 'Culot aortique', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-reimplant-coronaires', name: 'Réimplantation des coronaires', abbr: 'Réimplant. coronaires', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-reparation-femorale', name: "Réparation de l'artère fémorale", abbr: 'Réparation fémorale', scope: 'intern', serviceType: 'cardiaque' },
  { id: 'pt-prelev-cardiaque', name: 'Prélèvement du greffon cardiaque', abbr: 'Prélèv. cardiaque', scope: 'intern', serviceType: 'cardiaque' },

  // Thoracique — interventions principales
  { id: 'pt-lob', name: 'Lobectomie', abbr: 'Lobectomie', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-thoraco', 'pt-trocarts', 'pt-explo-pleurale', 'pt-dissection-hile', 'pt-agraf-vasc', 'pt-agraf-bronch', 'pt-curage', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-seg', name: 'Segmentectomie', abbr: 'Segmentectomie', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-thoraco', 'pt-trocarts', 'pt-explo-pleurale', 'pt-dissection-hile', 'pt-agraf-vasc', 'pt-agraf-bronch', 'pt-curage', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-pneumo', name: 'Pneumonectomie', abbr: 'Pneumonectomie', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-thoraco', 'pt-explo-pleurale', 'pt-dissection-hile', 'pt-agraf-vasc', 'pt-agraf-bronch', 'pt-curage', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-resec', name: 'Résection atypique', abbr: 'Résection at.', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-thoraco', 'pt-trocarts', 'pt-explo-pleurale', 'pt-agraf-parenchyme', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-pleur', name: 'Pleurectomie', abbr: 'Pleurectomie', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-thoraco', 'pt-trocarts', 'pt-explo-pleurale', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-decort', name: 'Décortication pleurale', abbr: 'Décortication', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-thoraco', 'pt-explo-pleurale', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-thym', name: 'Thymectomie', abbr: 'Thymectomie', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-sterno', 'pt-trocarts', 'pt-explo-pleurale', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-oeso', name: 'Œsophagectomie', abbr: 'Œsophagectomie', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-thoraco', 'pt-trocarts', 'pt-dissection-hile', 'pt-curage', 'pt-tube-gastrique', 'pt-anastomose-oeso', 'pt-abord-cervical', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-vats', name: 'Chirurgie thoracoscopique vidéo-assistée', abbr: 'VATS', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-trocarts', 'pt-explo-pleurale', 'pt-drain', 'pt-fermeture', 'pt-tout'] },
  { id: 'pt-drain', name: 'Pose de drain thoracique', abbr: 'Drain', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-tout'] },
  { id: 'pt-medias', name: 'Médiastinoscopie', abbr: 'Médiastinoscopie', scope: 'both', serviceType: 'thoracique', internSteps: ['pt-abord-cervical', 'pt-biopsie-gg', 'pt-fermeture', 'pt-tout'] },

  // Thoracique — sous-gestes réalisables par l'interne
  { id: 'pt-trocarts', name: 'Mise en place des trocarts (VATS)', abbr: 'Trocarts', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-explo-pleurale', name: 'Exploration pleurale', abbr: 'Explo. pleurale', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-dissection-hile', name: 'Dissection hilaire (artère, veines, bronche)', abbr: 'Dissection hile', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-agraf-vasc', name: 'Section / agrafage vasculaire (artère ou veines pulmonaires)', abbr: 'Agrafage vasc.', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-agraf-bronch', name: 'Section / agrafage bronchique', abbr: 'Agrafage bronch.', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-agraf-parenchyme', name: 'Agrafage parenchymateux (résection cunéiforme)', abbr: 'Agrafage parench.', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-curage', name: 'Curage ganglionnaire médiastinal', abbr: 'Curage gg', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-tube-gastrique', name: 'Confection du tube gastrique', abbr: 'Tube gastrique', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-anastomose-oeso', name: 'Anastomose œso-gastrique', abbr: 'Anastomose', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-abord-cervical', name: 'Abord cervical (cervicotomie)', abbr: 'Abord cervical', scope: 'intern', serviceType: 'thoracique' },
  { id: 'pt-biopsie-gg', name: 'Biopsie ganglionnaire', abbr: 'Biopsie gg', scope: 'intern', serviceType: 'thoracique' },

  // Congénitale — interventions principales
  // Sous-gestes tronc commun : sternotomie + CEC (sans abord fémoral adulte)
  // La coarctation, le BT shunt et le banding ne nécessitent pas de CEC.
  { id: 'pt-cong-fallot', name: 'Correction tétralogie de Fallot', abbr: 'Fallot', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-sterno', 'pt-canul', 'pt-cong-decanul', 'pt-fermeture', 'pt-tout', 'pt-cong-resec-infund', 'pt-cong-patch-civ', 'pt-cong-recon-vd'] },
  { id: 'pt-cong-civ', name: 'Fermeture CIV (congénitale)', abbr: 'CIV cong.', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-sterno', 'pt-canul', 'pt-cong-decanul', 'pt-fermeture', 'pt-tout', 'pt-cong-patch-civ'] },
  { id: 'pt-cong-cia', name: 'Fermeture CIA (congénitale)', abbr: 'CIA cong.', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-sterno', 'pt-canul', 'pt-cong-decanul', 'pt-fermeture', 'pt-tout', 'pt-cong-patch-cia'] },
  { id: 'pt-cong-switch', name: 'Switch artériel (transposition des grands vaisseaux)', abbr: 'Switch artériel', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-sterno', 'pt-canul', 'pt-cong-decanul', 'pt-fermeture', 'pt-tout', 'pt-cong-reimplant-cor', 'pt-cong-anastomose-ao', 'pt-cong-anastomose-pulm'] },
  { id: 'pt-cong-cav', name: 'Correction canal atrio-ventriculaire (CAV)', abbr: 'CAV', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-sterno', 'pt-canul', 'pt-cong-decanul', 'pt-fermeture', 'pt-tout', 'pt-cong-patch-civ', 'pt-cong-patch-cia', 'pt-cong-recon-valves-av'] },
  { id: 'pt-cong-coarct', name: "Correction de coarctation de l'aorte", abbr: 'Coarctation', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-thoraco', 'pt-fermeture', 'pt-tout', 'pt-cong-resec-coarct', 'pt-cong-anastomose-ao'] },
  { id: 'pt-cong-fontan', name: 'Opération de Fontan (anastomose cavo-pulmonaire totale)', abbr: 'Fontan', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-sterno', 'pt-canul', 'pt-cong-decanul', 'pt-fermeture', 'pt-tout', 'pt-cong-anastomose-cavo-pulm'] },
  { id: 'pt-cong-norwood', name: 'Opération de Norwood (hypoplasie du ventricule gauche)', abbr: 'Norwood', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-sterno', 'pt-canul', 'pt-cong-decanul', 'pt-fermeture', 'pt-tout', 'pt-cong-neo-aorte', 'pt-cong-shunt-pall'] },
  { id: 'pt-cong-blalock', name: 'Shunt de Blalock-Taussig modifié', abbr: 'BT Shunt', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-thoraco', 'pt-fermeture', 'pt-tout', 'pt-cong-shunt-pall'] },
  { id: 'pt-cong-banding', name: "Cerclage de l'artère pulmonaire (banding)", abbr: 'Banding AP', scope: 'both', serviceType: 'congenitale', internSteps: ['pt-sterno', 'pt-fermeture', 'pt-tout', 'pt-cong-cerclage-ap'] },

  // Congénitale — sous-gestes réalisables par l'interne
  { id: 'pt-cong-decanul', name: 'Décanulation / sevrage de CEC', abbr: 'Décanulation', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-resec-infund', name: 'Résection infundibulaire', abbr: 'Résection infund.', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-patch-civ', name: 'Fermeture de la CIV par patch', abbr: 'Patch CIV', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-patch-cia', name: 'Fermeture de la CIA par patch ou suture directe', abbr: 'Patch CIA', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-recon-vd', name: "Reconstruction de la voie d'éjection du ventricule droit (RVOT)", abbr: 'Recon. RVOT', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-anastomose-pulm', name: 'Anastomose pulmonaire', abbr: 'Anastomose pulm.', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-anastomose-ao', name: 'Anastomose aortique (congénitale)', abbr: 'Anastomose ao.', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-reimplant-cor', name: 'Réimplantation des artères coronaires', abbr: 'Réimplant. coronaires', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-anastomose-cavo-pulm', name: 'Anastomose cavo-pulmonaire totale (TCPC)', abbr: 'TCPC', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-neo-aorte', name: 'Construction de la néo-aorte', abbr: 'Néo-aorte', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-shunt-pall', name: 'Anastomose palliative / shunt systémico-pulmonaire', abbr: 'Shunt palliatif', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-cerclage-ap', name: "Cerclage de l'artère pulmonaire", abbr: 'Cerclage AP', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-resec-coarct', name: 'Résection de la coarctation', abbr: 'Résection coarct.', scope: 'intern', serviceType: 'congenitale' },
  { id: 'pt-cong-recon-valves-av', name: 'Reconstruction des valves atrio-ventriculaires', abbr: 'Recon. valves AV', scope: 'intern', serviceType: 'congenitale' },

  // Gestes d'abord / fermeture (souvent réalisés par l'interne)
  { id: 'pt-sterno', name: 'Sternotomie', abbr: 'Sternotomie', scope: 'both', serviceType: 'autre' },
  { id: 'pt-thoraco', name: 'Thoracotomie', abbr: 'Thoracotomie', scope: 'both', serviceType: 'autre' },
  { id: 'pt-canul', name: 'Canulation', abbr: 'Canulation', scope: 'both', serviceType: 'autre' },
  { id: 'pt-fermeture', name: 'Fermeture pariétale', abbr: 'Fermeture', scope: 'intern', serviceType: 'autre' },

  // Geste transversal : l'interne a réalisé l'intervention principale en totalité.
  { id: 'pt-tout', name: "Intervention principale réalisée en totalité par l'interne", abbr: 'Tout', scope: 'intern', serviceType: 'autre' },
];
