# Projet : CardioThoNoa — Application de suivi de formation chirurgicale

## Contexte
Application web de suivi de formation pour une interne en chirurgie
thoracique et cardiovasculaire (CTCV). L'application est mono-utilisateur,
sans backend requis — toutes les données sont persistées en localStorage
avec possibilité d'export JSON.

## Stack technique
- React 18 + Vite
- Tailwind CSS v3
- React Router v6 (routing côté client)
- Zustand (state management global)
- Recharts (graphiques statistiques)
- date-fns (manipulation des dates)
- lucide-react (icônes)

---

## Modèle de données

### Service
{
  id: string,
  name: string,              // ex: "Chirurgie Cardiaque CHU Lyon"
  type: "cardiaque" | "thoracique",
  city: string,
  surgeonIds: string[]
}

### Surgeon
{
  id: string,
  firstName: string,
  lastName: string,
  serviceId: string
}

### Semester
{
  id: string,
  label: string,             // ex: "Semestre 1 - Cardiaque Lyon"
  serviceId: string,
  startDate: string,         // ISO date
  endDate: string
}

### Patient
{
  id: string,
  firstName: string,
  lastName: string,
  dateOfBirth: string        // ISO date
}

### ProcedureType
{
  id: string,
  name: string,              // ex: "Pontage coronarien", "Lobectomie"
  scope: "patient" | "intern" | "both",
  serviceType: "cardiaque" | "thoracique" | "autre"
}

### Intervention
{
  id: string,
  patientId: string,
  semesterId: string,
  surgeonId: string,
  date: string,              // ISO date
  patientProcedures: string[],  // ProcedureType ids
  internProcedures: string[],   // ProcedureType ids
  position: "1er assistant" | "2ème assistant" | "opérateur principal",
  notes: string
}

---

## Routes / Pages

/ → Dashboard (résumé du semestre courant)
/semestres → Liste des semestres
/semestres/:id → Détail d'un semestre + liste des interventions
/interventions/nouvelle → Formulaire ajout intervention
/interventions/:id → Détail / édition d'une intervention
/statistiques → Page statistiques globales
/parametres → Configuration (services, chirurgiens, gestes)

---

## Fonctionnalités détaillées

### Dashboard
- Semestre actif en cours + dates
- KPIs rapides : nb interventions ce semestre, nb patients uniques,
  répartition opérateur/assistant
- Dernières interventions (5 dernières)
- Bouton accès rapide "Nouvelle intervention"

### Semestres
- Créer/éditer/archiver un semestre
- Associer à un service existant
- Les semestres peuvent se répéter dans le même service
  (interne qui revient dans le même stage)
- Statistiques durant le semestre choisi

### Interventions
- Sélection du patient (autocomplete sur la liste existante
  ou création rapide) avec fonction de filtre avancé
- Date de l'intervention
- Sélection du chirurgien (filtré selon le service du semestre actif)
- Sélection multiple des gestes réalisés SUR LE PATIENT
  (liste filtrée par type de service)
- Sélection multiple des gestes réalisés PAR L'INTERNE
  (liste filtrée par type de service)
- Position de l'interne dans l'intervention
- Notes libres

### Statistiques
Graphiques à implémenter avec Recharts :
1. BarChart : Nombre d'interventions par mois (toutes semestres ou filtré)
2. PieChart : Répartition cardiaque vs thoracique
3. BarChart : Top 10 gestes réalisés par l'interne (cumulatif)
4. LineChart : Progression du nombre d'actes/mois au fil des semestres
5. Tableau : Matrice semestre × geste avec comptage

Filtres disponibles : par semestre, par période, par type de chirurgie

### Paramètres
Section Services : CRUD complet
Section Chirurgiens : CRUD, rattachement à un service
Section Gestes : CRUD, scope (patient/interne/les deux),
                  type de service associé
Export JSON de toutes les données
Import JSON (restauration)

---

## Contraintes UX importantes
- L'application doit être utilisable sur mobile (saisie en salle d'op)
- Les formulaires d'intervention doivent être rapides à remplir
- Pas d'authentification requise
- Toutes les listes de sélection doivent être filtrées
  selon le contexte (service actif du semestre)
- Aucune donnée ne quitte le navigateur (RGPD, données patients)

---

## Données de démonstration
Générer un jeu de données réaliste au premier lancement :
- 2 services (CHU Saint-Étienne Cardiaque, CHU Saint-Étienne Thoracique)
- 3-4 chirurgiens par service
- 2 semestres passés + 1 en cours
- 30-40 interventions réparties
- Liste de gestes typiques CTCV (pontages, remplacements valvulaires,
  lobectomies, pneumonectomies, drainage, sternotomie, etc.)