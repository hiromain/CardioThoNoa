-- CardioThoNoa — Centres de chirurgie cardio-thoracique et congénitale en France
-- ==============================================================================
-- À exécuter dans le SQL Editor Supabase.
-- Source de référence : SFCTCV (sfctcv.org), annuaire AJCTCV.
-- Les centres peuvent être modifiés depuis l'interface /admin/comptes.
-- Idempotent : on conflict do nothing.

insert into public.centres (name, city) values

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÎLE-DE-FRANCE
  -- ══════════════════════════════════════════════════════════════════════════

  -- Public
  ('AP-HP — Hôpital Bichat (Cardiaque)', 'Paris'),
  ('AP-HP — Hôpital Pitié-Salpêtrière (Cardiaque & Thoracique)', 'Paris'),
  ('AP-HP — Hôpital Lariboisière (Thoracique)', 'Paris'),
  ('AP-HP — Hôpital Tenon (Thoracique)', 'Paris'),
  ('AP-HP — Hôpital Européen Georges-Pompidou — HEGP (Cardiaque)', 'Paris'),
  ('AP-HP — Hôpital Henri-Mondor (Cardiaque & Thoracique)', 'Créteil'),
  ('AP-HP — Hôpital Ambroise-Paré (Thoracique)', 'Boulogne-Billancourt'),
  ('AP-HP — Hôpital Necker – Enfants malades (Congénital)', 'Paris'),
  ('Institut Cardio-Vasculaire Paris Sud — Hôpital Marie Lannelongue (Cardiaque & Congénital)', 'Le Plessis-Robinson'),
  -- Privé
  ('Hôpital Foch (Cardiaque & Thoracique)', 'Suresnes'),
  ('Institut Mutualiste Montsouris — IMM (Cardiaque & Thoracique)', 'Paris'),
  ('Institut Hospitalier Jacques Cartier (Cardiaque)', 'Massy'),

  -- ══════════════════════════════════════════════════════════════════════════
  -- HAUTS-DE-FRANCE / NORMANDIE
  -- ══════════════════════════════════════════════════════════════════════════

  ('CHRU de Lille — Hôpital Cardiologique (Cardiaque, Thoracique & Congénital)', 'Lille'),
  ('CHU de Rouen — Hôpital Charles-Nicolle (Cardiaque & Thoracique)', 'Rouen'),
  ('CHU de Caen — CHU Côte de Nacre (Cardiaque & Thoracique)', 'Caen'),
  ('CHU d''Amiens — Hôpital Sud (Cardiaque & Thoracique)', 'Amiens'),

  -- ══════════════════════════════════════════════════════════════════════════
  -- GRAND EST
  -- ══════════════════════════════════════════════════════════════════════════

  ('CHU de Strasbourg — Nouvel Hôpital Civil — NHC (Cardiaque & Thoracique)', 'Strasbourg'),
  ('CHRU de Nancy — Hôpital Brabois (Cardiaque & Thoracique)', 'Vandœuvre-lès-Nancy'),
  ('CHU de Reims — Hôpital Robert-Debré (Cardiaque & Thoracique)', 'Reims'),
  ('CHU de Besançon — Hôpital Jean-Minjoz (Cardiaque & Thoracique)', 'Besançon'),

  -- ══════════════════════════════════════════════════════════════════════════
  -- BOURGOGNE-FRANCHE-COMTÉ / CENTRE-VAL DE LOIRE
  -- ══════════════════════════════════════════════════════════════════════════

  ('CHU de Dijon — Hôpital François-Mitterrand (Cardiaque & Thoracique)', 'Dijon'),
  ('CHRU de Tours — Hôpital Trousseau (Cardiaque & Thoracique)', 'Tours'),
  ('CHU de Clermont-Ferrand — CHU Estaing (Cardiaque & Thoracique)', 'Clermont-Ferrand'),

  -- ══════════════════════════════════════════════════════════════════════════
  -- NOUVELLE-AQUITAINE / OCCITANIE
  -- ══════════════════════════════════════════════════════════════════════════

  -- Public
  ('CHU de Bordeaux — Hôpital Haut-Lévêque (Cardiaque, Thoracique & Congénital)', 'Pessac'),
  ('CHU de Toulouse — Hôpital Rangueil (Cardiaque & Congénital)', 'Toulouse'),
  ('CHU de Toulouse — Hôpital Larrey (Thoracique)', 'Toulouse'),
  ('CHU de Montpellier — Hôpital Arnaud-de-Villeneuve (Cardiaque & Thoracique)', 'Montpellier'),
  ('CHU de Limoges — CHU Dupuytren (Thoracique)', 'Limoges'),
  ('CHU de Poitiers (Thoracique)', 'Poitiers'),
  -- Privé
  ('Clinique Pasteur (Cardiaque & Thoracique)', 'Toulouse'),
  ('Clinique Saint-Augustin (Cardiaque)', 'Bordeaux'),

  -- ══════════════════════════════════════════════════════════════════════════
  -- AUVERGNE-RHÔNE-ALPES
  -- ══════════════════════════════════════════════════════════════════════════

  ('HCL — Hôpital Louis-Pradel (Cardiaque & Congénital)', 'Bron'),
  ('HCL — Hôpital de la Croix-Rousse (Thoracique)', 'Lyon'),
  ('CHU Grenoble Alpes — Hôpital Michalon (Cardiaque & Thoracique)', 'Grenoble'),

  -- ══════════════════════════════════════════════════════════════════════════
  -- PROVENCE-ALPES-CÔTE D'AZUR
  -- ══════════════════════════════════════════════════════════════════════════

  ('AP-HM — Hôpital de la Timone (Cardiaque, Thoracique & Congénital)', 'Marseille'),
  ('CHU de Nice — Hôpital Pasteur (Cardiaque & Thoracique)', 'Nice'),

  -- ══════════════════════════════════════════════════════════════════════════
  -- BRETAGNE / PAYS DE LA LOIRE / CENTRE-OUEST
  -- ══════════════════════════════════════════════════════════════════════════

  ('CHRU de Rennes — Hôpital Pontchaillou (Cardiaque, Thoracique & Congénital)', 'Rennes'),
  ('CHU de Nantes — Institut du Thorax (Cardiaque, Thoracique & Congénital)', 'Nantes'),
  ('CHRU de Brest — Hôpital de la Cavale-Blanche (Cardiaque & Thoracique)', 'Brest'),
  ('CHU d''Angers — Hôpital Larrey (Cardiaque & Thoracique)', 'Angers')

on conflict do nothing;
