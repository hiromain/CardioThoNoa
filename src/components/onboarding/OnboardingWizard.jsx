// CardioThoNoa — Assistant de configuration post-achat.
// S'ouvre une seule fois pour un compte payé fraîchement créé (aucun service
// configuré) afin de collecter le strict nécessaire pour démarrer : profil,
// CHU/service, semestre en cours, chirurgiens. Tout reste modifiable ensuite
// depuis Réglages.
import { useEffect, useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SERVICE_TYPES } from '../../data/constants';
import { listCentres } from '../../lib/adminQueries';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

const TOTAL_STEPS = 5;
const STEP_TITLES = [
  'Bienvenue 👋',
  'Ton CHU / service',
  'Ton semestre en cours',
  'Chirurgiens du service',
  'Tout est prêt !',
];

function initialsFrom(prenom, nom) {
  return `${prenom.trim()[0] || ''}${nom.trim()[0] || ''}`.toUpperCase();
}

function emptySurgeon() {
  return { title: 'Dr.', firstName: '', lastName: '' };
}

function RecapItem({ text }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] text-ink-1">
      <span className="mt-0.5 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
        <Check size={13} className="text-success" />
      </span>
      {text}
    </li>
  );
}

export function OnboardingWizard() {
  const isPaid = useAuthStore((s) => s.isPaid);
  const entitlementLoaded = useAuthStore((s) => s.entitlementLoaded);
  const isDemo = useAuthStore((s) => s.isDemo);
  const services = useStore((s) => s.services);
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const addService = useStore((s) => s.addService);
  const addSemester = useStore((s) => s.addSemester);
  const setCurrentSemester = useStore((s) => s.setCurrentSemester);
  const addSurgeon = useStore((s) => s.addSurgeon);
  const setCentre = useAuthStore((s) => s.setCentre);

  // Centres disponibles (rattachement facultatif pour la supervision admin).
  const [centres, setCentres] = useState([]);
  const [centreChoice, setCentreChoice] = useState('');
  useEffect(() => {
    listCentres().then(setCentres);
  }, []);

  // Déclenchement : compte payé, pas en démo, jamais configuré, pas ignoré.
  // Verrouillé dans `open` une fois vrai pour ne pas se refermer dès que
  // l'étape 2 crée le premier service (services.length passe à 1).
  const shouldTrigger =
    isPaid && entitlementLoaded && !isDemo &&
    services.length === 0 && !profile?.onboardingDismissed;

  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (shouldTrigger) setOpen(true);
  }, [shouldTrigger]);

  const [step, setStep] = useState(1);

  // Étape 1 — Profil
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [promotion, setPromotion] = useState('');

  // Étape 2 — CHU / Service
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState('cardiaque');
  const [serviceCity, setServiceCity] = useState('');
  const [serviceId, setServiceId] = useState(null);

  // Étape 3 — Semestre en cours
  const [semLabel, setSemLabel] = useState('');
  const [semStart, setSemStart] = useState('');
  const [semEnd, setSemEnd] = useState('');
  const [objInterventions, setObjInterventions] = useState(30);
  const [objGestes, setObjGestes] = useState(20);
  const [semesterId, setSemesterId] = useState(null);

  // Étape 4 — Chirurgiens
  const [surgeonRows, setSurgeonRows] = useState([emptySurgeon()]);
  const [surgeonsCommitted, setSurgeonsCommitted] = useState(false);

  if (!open) return null;

  function closeAndDismiss() {
    updateProfile({ onboardingDismissed: true });
    setOpen(false);
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function goNext() {
    if (step === 1) {
      updateProfile({
        prenom: prenom.trim(),
        nom: nom.trim(),
        initiales: initialsFrom(prenom, nom) || profile.initiales,
        promotion: promotion.trim(),
      });
    } else if (step === 2) {
      let id = serviceId;
      if (!id) {
        id = addService({ name: serviceName.trim(), type: serviceType, city: serviceCity.trim() });
        setServiceId(id);
      }
      updateProfile({ hopital: serviceName.trim() });
      if (centreChoice) setCentre(centreChoice);
    } else if (step === 3) {
      let id = semesterId;
      if (!id) {
        id = addSemester({
          label: semLabel.trim(),
          serviceId,
          startDate: semStart,
          endDate: semEnd,
          objectives: {
            interventions: Number(objInterventions) || 0,
            gestes: Number(objGestes) || 0,
          },
        });
        setSemesterId(id);
        setCurrentSemester(id);
      }
    } else if (step === 4) {
      if (!surgeonsCommitted) {
        surgeonRows.forEach((row) => {
          if (row.lastName.trim()) {
            addSurgeon({
              title: row.title,
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              serviceId,
            });
          }
        });
        setSurgeonsCommitted(true);
      }
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function updateSurgeonRow(idx, patch) {
    setSurgeonRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function addSurgeonRow() {
    setSurgeonRows((rows) => [...rows, emptySurgeon()]);
  }
  function removeSurgeonRow(idx) {
    setSurgeonRows((rows) => rows.filter((_, i) => i !== idx));
  }

  const valid = (() => {
    switch (step) {
      case 1:
        return !!(prenom.trim() && nom.trim());
      case 2:
        return !!serviceName.trim();
      case 3:
        return !!(semLabel.trim() && semStart && semEnd);
      default:
        return true;
    }
  })();

  const namedSurgeons = surgeonRows.filter((r) => r.lastName.trim()).length;

  return (
    <Modal
      open={open}
      onClose={closeAndDismiss}
      title={STEP_TITLES[step - 1]}
      subtitle={`Étape ${step} / ${TOTAL_STEPS}`}
      footer={
        step < TOTAL_STEPS ? (
          <>
            <Button variant="ghost" onClick={closeAndDismiss} className="mr-auto">
              Plus tard
            </Button>
            {step > 1 && (
              <Button variant="secondary" onClick={goBack}>
                Précédent
              </Button>
            )}
            <Button onClick={goNext} disabled={!valid}>
              Suivant
            </Button>
          </>
        ) : (
          <Button fullWidth onClick={() => setOpen(false)}>
            Commencer
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <ProgressBar value={step} max={TOTAL_STEPS} showValue={false} />

        {step === 1 && (
          <div className="flex flex-col gap-3.5">
            <p className="text-sm text-ink-2 leading-relaxed">
              Ton compte est prêt ! Configurons ensemble les quelques infos
              indispensables pour commencer à enregistrer tes interventions.
              Tout reste modifiable plus tard dans Réglages.
            </p>
            <div className="flex gap-2.5">
              <Input
                label="Prénom"
                required
                placeholder="Noa"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
              <Input
                label="Nom"
                required
                placeholder="Martin"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
            <Input
              label="Promotion"
              placeholder="Promo 2024"
              value={promotion}
              onChange={(e) => setPromotion(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3.5">
            <p className="text-sm text-ink-2 leading-relaxed">
              Indique le service / CHU dans lequel tu es actuellement en
              stage.
            </p>
            <Input
              label="Nom du service / CHU"
              required
              placeholder="Chirurgie Cardiaque — CHU de Lyon"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
            <Select
              label="Type"
              required
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              options={SERVICE_TYPES}
            />
            <Input
              label="Ville"
              placeholder="Lyon"
              value={serviceCity}
              onChange={(e) => setServiceCity(e.target.value)}
            />
            {centres.length > 0 && (
              <Select
                label="Centre (supervision)"
                placeholder="Aucun"
                value={centreChoice}
                onChange={(e) => setCentreChoice(e.target.value)}
                options={centres.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3.5">
            <p className="text-sm text-ink-2 leading-relaxed">
              Renseigne ton semestre actuel pour commencer à suivre ta
              progression dès maintenant.
            </p>
            <Input
              label="Intitulé"
              required
              placeholder="S4"
              value={semLabel}
              onChange={(e) => setSemLabel(e.target.value)}
            />
            <div className="flex gap-2.5">
              <Input
                label="Début"
                type="date"
                required
                value={semStart}
                onChange={(e) => setSemStart(e.target.value)}
              />
              <Input
                label="Fin"
                type="date"
                required
                value={semEnd}
                onChange={(e) => setSemEnd(e.target.value)}
              />
            </div>
            <div className="flex gap-2.5">
              <Input
                label="Objectif interventions"
                type="number"
                min="0"
                value={objInterventions}
                onChange={(e) => setObjInterventions(e.target.value)}
              />
              <Input
                label="Objectif gestes"
                type="number"
                min="0"
                value={objGestes}
                onChange={(e) => setObjGestes(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3.5">
            <p className="text-sm text-ink-2 leading-relaxed">
              Ajoute les chirurgiens de ton service (facultatif — tu peux
              continuer sans en ajouter et compléter plus tard dans
              Réglages).
            </p>
            {surgeonRows.map((row, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 p-3 rounded-md border-[1.5px] border-line bg-surface-2 relative"
              >
                {surgeonRows.length > 1 && (
                  <button
                    onClick={() => removeSurgeonRow(i)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface flex items-center justify-center text-ink-2"
                    aria-label="Supprimer ce chirurgien"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="flex gap-2 pr-8">
                  <div className="w-24">
                    <Select
                      label="Titre"
                      value={row.title}
                      onChange={(e) => updateSurgeonRow(i, { title: e.target.value })}
                      options={['Pr.', 'Dr.', '']}
                    />
                  </div>
                  <Input
                    label="Prénom"
                    placeholder="Claire"
                    value={row.firstName}
                    onChange={(e) => updateSurgeonRow(i, { firstName: e.target.value })}
                  />
                </div>
                <Input
                  label="Nom"
                  placeholder="Mercier"
                  value={row.lastName}
                  onChange={(e) => updateSurgeonRow(i, { lastName: e.target.value })}
                />
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={addSurgeonRow}>
              <Plus size={15} /> Ajouter un chirurgien
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-2 leading-relaxed">
              Configuration terminée ! Tu peux dès maintenant créer ta
              première intervention. Tout ce qui suit reste modifiable dans
              Réglages.
            </p>
            <ul className="flex flex-col gap-2.5">
              <RecapItem text={`Profil : ${prenom} ${nom}`} />
              <RecapItem text={`Service : ${serviceName}`} />
              <RecapItem text={`Semestre en cours : ${semLabel}`} />
              <RecapItem
                text={
                  namedSurgeons > 0
                    ? `${namedSurgeons} chirurgien${namedSurgeons > 1 ? 's' : ''} ajouté${namedSurgeons > 1 ? 's' : ''}`
                    : 'Aucun chirurgien ajouté pour l’instant'
                }
              />
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
